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
  const {
    isAuthenticated: superTokensAuth,
    checkSession,
  } = useSuperTokens();

  const getAuthHeader = async (_scope?: string): Promise<string> => {
    if (inFlight) return inFlight;

    const signOptions = ["nosana-auth", { includeTime: false }] as const;

    inFlight = (async () => {
      // Decide the auth path from a *settled* session state. Relying on the
      // reactive flag alone can race (e.g. right after navigation, when the
      // flag is transiently false but loading is already false): a credit/
      // email user would then fall through to the wallet signer path and throw
      // "Signer or key is required for this operation." If the flag isn't
      // already true, actively re-verify the session before falling back.
      let isSuperTokensAuthed = superTokensAuth.value;
      if (!isSuperTokensAuthed) {
        isSuperTokensAuthed = await checkSession(false);
      }

      if (isSuperTokensAuthed) {
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
