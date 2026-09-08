import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import type { DeploymentSsh } from "@nosana/api";
import {
  MAX_SSH_PUBLIC_KEYS,
  getSshKeyIdentity,
  parseSshPublicKeys,
} from "@nosana/kit";
import { useToast } from "vue-toastification";
import { useLatestRequest } from "./useLatestRequest";
import { getDeployment } from "~/utils/kitJobAccess";
import {
  failedSshJobs,
  saveDeploymentSshKeys,
  type DeploymentSshKeysProgress,
} from "~/utils/deploymentSshKeys";

// The keys last seen per deployment. A view that opens again shows them at
// once and refreshes behind the scenes instead of flashing a loading state.
const cachedKeys = new Map<string, string[]>();

const sameKeys = (a: string[], b: string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

/**
 * The SSH public keys of one deployment: the saved set, a local draft that
 * can be edited, and the save that reconciles the two. Keys are independent
 * of the operation selected for terminal access.
 */
export function useDeploymentSshKeys(
  deploymentId: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const { nosana } = useKit();
  const toast = useToast();
  const loads = useLatestRequest();
  const saves = useLatestRequest();

  // Saved on the deployment manager
  const sshPublicKeys = ref<string[]>([]);
  const loading = ref(false);
  const error = ref("");
  let sshApi: DeploymentSsh | null = null;

  // Edited locally until saved. A key is identified by its type and material,
  // so a comment-only difference is neither a change nor a duplicate.
  const draftKeys = ref<string[]>([]);
  const savedIds = computed(
    () => new Set(sshPublicKeys.value.map(getSshKeyIdentity)),
  );
  const isSaved = (key: string) => savedIds.value.has(getSshKeyIdentity(key));
  const hasChanges = computed(
    () =>
      draftKeys.value.length !== sshPublicKeys.value.length ||
      draftKeys.value.some((key) => !isSaved(key)),
  );

  // Saving
  const saving = ref(false);
  const saveError = ref("");
  const lastResult = ref<DeploymentSshKeysProgress | null>(null);
  const failedJobs = computed(() => failedSshJobs(lastResult.value));

  /** Record the saved set; watchers only run when the keys actually differ. */
  const setSavedKeys = (keys: string[]) => {
    cachedKeys.set(toValue(deploymentId), [...keys]);
    if (!sameKeys(sshPublicKeys.value, keys)) sshPublicKeys.value = [...keys];
  };

  const getSshApi = async () => {
    if (!sshApi) {
      const deployment = await getDeployment(
        nosana.value.api,
        toValue(deploymentId),
      );
      sshApi = deployment.ssh;
    }
    return sshApi;
  };

  const reload = async () => {
    const request = loads.begin();
    if (!loads.isCurrent(request) || !toValue(enabled)) return;
    // Only block the view while there is nothing to show yet.
    loading.value = !cachedKeys.has(toValue(deploymentId));
    error.value = "";
    try {
      const ssh = await getSshApi();
      if (!loads.isCurrent(request)) return;
      const keys = await ssh.keys();
      if (!loads.isCurrent(request)) return;
      setSavedKeys(keys);
    } catch (cause) {
      if (loads.isCurrent(request)) {
        error.value =
          cause instanceof Error
            ? cause.message
            : "Could not load deployment SSH keys.";
      }
    } finally {
      if (loads.isCurrent(request)) loading.value = false;
    }
  };

  /** Validate pasted keys and append them to the draft. Returns the problem to show, or "" once added. */
  const addKeys = (input: string): string => {
    const { keys, errors } = parseSshPublicKeys(input);
    if (errors.length) return errors.map((issue) => issue.message).join(" ");
    if (!keys.length) return "Paste a public key to add it.";

    // parseSshPublicKeys() already collapsed duplicates within the input.
    const drafted = new Set(draftKeys.value.map(getSshKeyIdentity));
    const fresh = keys.filter((key) => !drafted.has(getSshKeyIdentity(key)));
    if (!fresh.length) return "These keys are already in the list.";
    if (draftKeys.value.length + fresh.length > MAX_SSH_PUBLIC_KEYS) {
      return `You can add up to ${MAX_SSH_PUBLIC_KEYS} public keys. Remove a key first.`;
    }

    draftKeys.value = [...draftKeys.value, ...fresh];
    saveError.value = "";
    void save();
    return "";
  };

  const removeKey = (index: number) => {
    draftKeys.value = draftKeys.value.filter((_, i) => i !== index);
    saveError.value = "";
    void save();
  };

  // An edit made while a save is in flight is written once that one lands.
  let resave = false;

  const save = async () => {
    if (saving.value) {
      resave = true;
      return;
    }
    if (loading.value || error.value || !hasChanges.value || !toValue(enabled)) {
      return;
    }
    const request = saves.begin();
    const isCurrent = () => saves.isCurrent(request) && toValue(enabled);
    saving.value = true;
    saveError.value = "";
    lastResult.value = null;

    try {
      const ssh = await getSshApi();
      if (!isCurrent()) return;
      const result = await saveDeploymentSshKeys(
        ssh,
        sshPublicKeys.value,
        [...draftKeys.value],
        (progress) => {
          if (isCurrent()) lastResult.value = progress;
        },
      );
      if (!isCurrent()) return;
      setSavedKeys(result.public_keys);
      lastResult.value = result;

      const failed = failedSshJobs(result);
      if (failed.length) {
        toast.warning(
          `SSH keys saved, but ${failed.length} running job${failed.length === 1 ? "" : "s"} could not be updated`,
        );
      } else {
        toast.success("SSH keys updated");
      }
    } catch (cause) {
      if (!isCurrent()) return;
      // Add and remove are separate requests. Reload the saved state after a
      // partial failure so a retry computes its changes against what the
      // server holds.
      await reload();
      if (!isCurrent()) return;
      saveError.value =
        (cause instanceof Error
          ? cause.message
          : "Could not update deployment SSH keys.") +
        " Some changes may have been saved. Review the saved keys before retrying.";
      toast.error(saveError.value);
    } finally {
      if (isCurrent()) {
        saving.value = false;
        if (resave) {
          resave = false;
          void save();
        }
      }
    }
  };

  watch(sshPublicKeys, (keys) => {
    draftKeys.value = [...keys];
  });

  watch(
    [
      () => toValue(deploymentId),
      () => toValue(enabled),
      () => nosana.value.api,
    ],
    () => {
      loads.cancel();
      saves.cancel();
      resave = false;
      sshApi = null;
      // Start from the last known keys, if any, while the refresh runs.
      const known = cachedKeys.get(toValue(deploymentId)) ?? [];
      sshPublicKeys.value = [...known];
      draftKeys.value = [...known];
      error.value = "";
      loading.value = false;
      saving.value = false;
      saveError.value = "";
      lastResult.value = null;
      void reload();
    },
    { immediate: true, flush: "sync" },
  );

  return {
    sshPublicKeys,
    loading,
    error,
    reload,
    draftKeys,
    addKeys,
    removeKey,
    saving,
    saveError,
    failedJobs,
  };
}
