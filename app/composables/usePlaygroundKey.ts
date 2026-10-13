import { computed, ref, watch, type Ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { useApiKeys, type ApiKey } from "~/composables/useApiKeys";

let customKey: Ref<string> | null = null;

/**
 * The API key the playground calls the inference gateway with. The gateway shares the
 * dashboard's auth service, but it authenticates a Bearer key rather than the session
 * cookie, so the browser sends one of the user's own keys. The choice is shared with
 * the code sample under the chat, and remembered.
 */
export const usePlaygroundKey = () => {
  const { apiKeys, loadingKeys, refreshKeys } = useApiKeys();
  const selectedKeyId = useLocalStorage("playground-key-id", "");

  const activeKeys = computed(() =>
    apiKeys.value.keys.filter((key: ApiKey) => key.status === "active"),
  );
  const selectedKey = computed(
    () =>
      activeKeys.value.find((key: ApiKey) => key.id === selectedKeyId.value) ??
      null,
  );
  // A pasted key wins over the account's own, so a gateway in another environment
  // can be tried without switching the dashboard over to it. It is a secret, so it
  // stays in memory rather than in storage.
  const custom = (customKey ??= ref(""));
  const apiKey = computed(
    () => custom.value.trim() || selectedKey.value?.key || "",
  );

  // A key that is gone or disabled gives way to the first one still active.
  watch(
    activeKeys,
    (keys) => {
      if (!selectedKey.value) selectedKeyId.value = keys[0]?.id ?? "";
    },
    { immediate: true },
  );

  return {
    apiKey,
    customKey: custom,
    activeKeys,
    selectedKey,
    selectedKeyId,
    loadingKeys,
    refreshKeys,
  };
};
