import { useSuperTokens } from "~/composables/useSuperTokens";
import { useWallet } from "@nosana/solana-vue";
import { useKit } from "~/composables/useKit";

// Module-scoped so all useDeploymentAuth() consumers share one in-flight sign.
// Persistence/caching is handled by the kit's authorization store (cookie-backed
// in useKit.ts). This only exists to collapse concurrent calls — without it,
// N replica streams opening at once each call generate() before the cookie is
// written, producing N wallet popups.
let inFlight: Promise<string> | null = null;

/**
 * Composable for getting authentication headers in deployment contexts.
 * Handles both credit and wallet users. Concurrent callers share a single
 * sign operation so opening multiple streams in parallel doesn't multiply
 * wallet sign popups.
 */
export function useDeploymentAuth() {
  const { nosana } = useKit();
  const { connected } = useWallet();
  const { isAuthenticated: superTokensAuth } = useSuperTokens();

  const getAuthHeader = async (): Promise<string> => {
    if (inFlight) return inFlight;

    const signOptions = ["nosana-auth", { includeTime: false }] as const;

    inFlight = (async () => {
      if (superTokensAuth.value) {
        const message = await nosana.value.api.auth.signMessage(...signOptions);
        return `${signOptions[0]}:${message}`;
      }
      if (!connected.value) {
        throw new Error("No authentication available - wallet not connected");
      }
      return await nosana.value.authorization.generate(...signOptions);
    })();

    try {
      return await inFlight;
    } catch {
      throw new Error("Failed to get auth header from Nosana API");
    } finally {
      inFlight = null;
    }
  };

  return {
    getAuthHeader,
  };
}
