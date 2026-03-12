import { useSuperTokens } from "~/composables/useSuperTokens";
import { useWallet } from "@nosana/solana-vue";
import { useKit } from "~/composables/useKit";

/**
 * Composable for getting authentication headers in deployment contexts.
 * Handles both credit and wallet users, with support for DM-signed headers.
 */
export function useDeploymentAuth() {
  const { nosana } = useKit();
  const { connected } = useWallet();
  const { isAuthenticated: superTokensAuth } = useSuperTokens();

  /**
   * Gets the appropriate auth header for WebSocket/SSE connections.
   * 
   * Priority:
   * 1. Credit users: uses nosana api module to sign message and get auth header
   * 2. Wallet users: use wallet signing via kit
   * 
   * @returns Promise resolving to the auth header string
   * @throws Error if no authentication is available
   */
  const getAuthHeader = async (): Promise<string> => {
    const signOptions = ['nosana-auth', { includeTime: false }] as const;

    try {
      if (superTokensAuth.value) {
        const message = await nosana.value.api.auth.signMessage(...signOptions)
        return `${signOptions[0]}:${message}`;
      } else {
        if (!connected.value) {
          throw new Error('No authentication available - wallet not connected');
        }

        return await nosana.value.authorization.generate(...signOptions);
      }
    } catch (error) {
      throw new Error('Failed to get auth header from Nosana API');
    }
  }

  return {
    getAuthHeader,
  };
}
