import {
  createNosanaAuthorization,
  walletToAuthorizationSigner,
} from "@nosana/kit";
import { useSuperTokens } from "~/composables/useSuperTokens";
import { useWallet } from "@nosana/solana-vue";
import { useKit } from "~/composables/useKit";

// Module-scoped so all useDeploymentAuth() consumers share one in-flight sign.
// Persistence/caching is handled by the kit's authorization store (cookie-backed
// in useKit.ts). This only exists to collapse concurrent calls — without it,
// N replica streams opening at once each call generate() before the cookie is
// written, producing N wallet popups.
let inFlight: Promise<string> | null = null;

// Job-scoped headers (message = job address, used by the CVM log API) can't go
// through the kit's authorization store: it keys cookies by wallet address
// only, so a job header would collide with the cached "nosana-auth" one.
// Cache them here instead. Wallet headers embed a timestamp the server rejects
// after 300s, so expire the cache comfortably before that.
const JOB_HEADER_TTL_MS = 4 * 60 * 1000;
const jobHeaderCache = new Map<string, { header: string; expiresAt: number }>();
const jobHeaderInFlight = new Map<string, Promise<string>>();

/**
 * Composable for getting authentication headers in deployment contexts.
 * Handles both credit and wallet users. Concurrent callers share a single
 * sign operation so opening multiple streams in parallel doesn't multiply
 * wallet sign popups.
 */
export function useDeploymentAuth() {
  const { nosana, wallet } = useKit();
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

  /**
   * Auth header scoped to a single job: the signed message is the job address
   * itself. This is what the CVM's log/API endpoints validate (against the
   * job's project key), unlike getAuthHeader's fixed "nosana-auth" message.
   */
  const getJobAuthHeader = async (jobAddress: string): Promise<string> => {
    const cached = jobHeaderCache.get(jobAddress);
    if (cached && cached.expiresAt > Date.now()) return cached.header;

    const existing = jobHeaderInFlight.get(jobAddress);
    if (existing) return existing;

    const promise = (async () => {
      let isSuperTokensAuthed = superTokensAuth.value;
      if (!isSuperTokensAuthed) {
        isSuperTokensAuthed = await checkSession(false);
      }

      if (isSuperTokensAuthed) {
        // The backend signs on the credits account's behalf; no timestamp
        // segment is added on this path.
        const signature = await nosana.value.api.auth.signMessage(jobAddress);
        return `${jobAddress}:${signature}`;
      }
      if (!connected.value || !wallet.value) {
        throw new Error("No authentication available - wallet not connected");
      }
      return await createNosanaAuthorization(
        walletToAuthorizationSigner(wallet.value),
      ).generate(jobAddress, { includeTime: true });
    })();

    jobHeaderInFlight.set(jobAddress, promise);
    try {
      const header = await promise;
      jobHeaderCache.set(jobAddress, {
        header,
        expiresAt: Date.now() + JOB_HEADER_TTL_MS,
      });
      return header;
    } catch {
      throw new Error("Failed to get job auth header from Nosana API");
    } finally {
      jobHeaderInFlight.delete(jobAddress);
    }
  };

  return {
    getAuthHeader,
    getJobAuthHeader,
  };
}
