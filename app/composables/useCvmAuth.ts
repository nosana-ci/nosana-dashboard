import {
  createNosanaAuthorization,
  walletToAuthorizationSigner,
} from "@nosana/kit";
import { useSuperTokens } from "~/composables/useSuperTokens";
import { useWallet } from "@nosana/solana-vue";
import { useKit } from "~/composables/useKit";

// Wallet headers embed a timestamp the CVM rejects after 300s, so expire the
// cache comfortably before that.
const JOB_HEADER_TTL_MS = 4 * 60 * 1000;
const jobHeaderCache = new Map<string, { header: string; expiresAt: number }>();
const jobHeaderInFlight = new Map<string, Promise<string>>();

/**
 * The one node-side header Kit does not produce: a confidential VM serves its
 * own log socket at wss://<jobAddress>.<nodeDomain> and validates a header
 * whose signed message is the job address itself. Kit's authorization store
 * keys cookies by wallet only, so job headers are cached here instead.
 */
export function useCvmAuth() {
  const { nosana, wallet } = useKit();
  const { connected } = useWallet();
  const { isAuthenticated: superTokensAuth, checkSession } = useSuperTokens();

  const getJobAuthHeader = async (jobAddress: string): Promise<string> => {
    const cached = jobHeaderCache.get(jobAddress);
    if (cached && cached.expiresAt > Date.now()) return cached.header;

    const existing = jobHeaderInFlight.get(jobAddress);
    if (existing) return existing;

    const promise = (async () => {
      // Decide the auth path from a settled session state, not the reactive
      // flag alone, which can be transiently false right after navigation.
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

  return { getJobAuthHeader };
}
