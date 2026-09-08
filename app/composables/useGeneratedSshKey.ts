import { ref } from "vue";
import { generateSshKeyPair, type SshKeyPair } from "@nosana/kit";

/**
 * An Ed25519 key pair generated in the browser. The private key exists only in
 * this state, so forms track whether it has been downloaded before they let the
 * public key be used.
 */
export function useGeneratedSshKey() {
  const keyPair = ref<SshKeyPair | null>(null);
  const isGenerating = ref(false);
  const error = ref("");
  const privateKeyDownloaded = ref(false);
  let attempts = 0;

  const generate = async (): Promise<SshKeyPair | null> => {
    const attempt = ++attempts;
    isGenerating.value = true;
    error.value = "";
    keyPair.value = null;
    privateKeyDownloaded.value = false;
    try {
      const pair = await generateSshKeyPair({ comment: "nosana-dashboard" });
      if (attempt !== attempts) return null;
      keyPair.value = pair;
      return pair;
    } catch (cause) {
      if (attempt === attempts) {
        error.value =
          cause instanceof Error
            ? cause.message
            : "Could not generate an SSH key. Use an existing public key instead.";
      }
      return null;
    } finally {
      if (attempt === attempts) isGenerating.value = false;
    }
  };

  const markDownloaded = () => {
    privateKeyDownloaded.value = true;
  };

  const discard = () => {
    attempts++;
    keyPair.value = null;
    error.value = "";
    isGenerating.value = false;
    privateKeyDownloaded.value = false;
  };

  return {
    keyPair,
    isGenerating,
    error,
    privateKeyDownloaded,
    generate,
    markDownloaded,
    discard,
  };
}
