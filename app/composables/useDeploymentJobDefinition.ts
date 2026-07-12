import type { Deployment, JobDefinition } from "@nosana/kit";
import type { DeploymentRevisionItem } from "@nosana/api";
import { useToast } from "vue-toastification";

export interface DeploymentJobDefinitionDeps {
  deployment: Ref<Deployment | null>;
  deploymentRevisions: Ref<DeploymentRevisionItem[]>;
  actionLoading: Ref<boolean>;
  loadDeployment: (silent?: boolean) => Promise<void>;
}

export function useDeploymentJobDefinition(deps: DeploymentJobDefinitionDeps) {
  const toast = useToast();
  const { getIpfs } = useIpfs();

  const jobDefinitionModel = ref<JobDefinition | null>(null);
  const loadingJobDefinition = ref(false);
  const originalDefinition = ref<JobDefinition | null>(null);

  // Editor refs and validation
  const currentJobDefEditor = ref<{ hasErrors: boolean } | null>(null);
  const revisionJobDefEditor = ref<{ hasErrors: boolean } | null>(null);
  const { canSave: canSaveCurrent } =
    useJsonEditorValidation(currentJobDefEditor);
  const { canSave: canSaveRevision } =
    useJsonEditorValidation(revisionJobDefEditor);

  const loadJobDefinition = async () => {
    if (
      Array.isArray(deps.deploymentRevisions.value) &&
      deps.deploymentRevisions.value.length > 0
    ) {
      const activeRevision =
        deps.deploymentRevisions.value.find(
          (r) => r.revision === deps.deployment.value?.active_revision,
        ) ||
        deps.deploymentRevisions.value[
          deps.deploymentRevisions.value.length - 1
        ];

      if (activeRevision?.job_definition) {
        jobDefinitionModel.value = activeRevision.job_definition;
        originalDefinition.value = JSON.parse(
          JSON.stringify(activeRevision.job_definition),
        );
        return;
      }
    }

    const ipfsHash = (
      deps.deployment.value as unknown as {
        ipfs_definition_hash?: string;
      } | null
    )?.ipfs_definition_hash;
    if (!ipfsHash) {
      jobDefinitionModel.value = null;
      return;
    }

    try {
      loadingJobDefinition.value = true;
      const definition = await getIpfs(ipfsHash);
      jobDefinitionModel.value = definition as JobDefinition;
      originalDefinition.value = JSON.parse(
        JSON.stringify(definition),
      ) as JobDefinition;
    } catch (err: any) {
      console.error("Error loading job definition:", err);
      jobDefinitionModel.value = null;
    } finally {
      loadingJobDefinition.value = false;
    }
  };

  const hasDefinitionChanged = computed(() => {
    if (!originalDefinition.value) return false;
    try {
      const original = JSON.stringify(originalDefinition.value);
      const current = JSON.stringify(jobDefinitionModel.value);
      return original !== current;
    } catch (err) {
      return true;
    }
  });

  const resetDefinition = () => {
    if (originalDefinition.value) {
      jobDefinitionModel.value = JSON.parse(
        JSON.stringify(originalDefinition.value),
      );
    }
  };

  const makeRevision = async () => {
    if (!deps.deployment.value || !hasDefinitionChanged.value) return;

    if (
      !canSaveCurrent(
        "Cannot create revision: Please fix the errors in the job definition",
      )
    ) {
      return;
    }

    try {
      deps.actionLoading.value = true;
      await deps.deployment.value.createRevision(jobDefinitionModel.value!);
      toast.success("Revision created successfully!");
      await deps.loadDeployment();
      originalDefinition.value = JSON.parse(
        JSON.stringify(jobDefinitionModel.value),
      );
    } catch (err: any) {
      console.error("Error creating revision:", err);
      toast.error(`Failed to create revision: ${err.message}`);
    } finally {
      deps.actionLoading.value = false;
    }
  };

  return {
    jobDefinitionModel,
    loadingJobDefinition,
    originalDefinition,
    currentJobDefEditor,
    revisionJobDefEditor,
    canSaveCurrent,
    canSaveRevision,
    loadJobDefinition,
    hasDefinitionChanged,
    resetDefinition,
    makeRevision,
  };
}
