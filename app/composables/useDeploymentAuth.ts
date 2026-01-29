import { useKit } from "~/composables/useKit";
import { useAuth } from "#imports";
import { useWallet } from "@nosana/solana-vue";

/**
 * Composable for getting authentication headers in deployment contexts.
 * Handles both credit and wallet users, with support for DM-signed headers.
 */
export function useDeploymentAuth() {
  const { nosana } = useKit();
  const { status, data: userData } = useAuth();
  const { connected } = useWallet();

  /**
   * Gets the appropriate auth header for WebSocket/SSE connections.
   * 
   * Priority:
   * 1. If deploymentId is provided: use DM-signed header (works for both credit and wallet users)
   * 2. Credit users: use credit header from userData
   * 3. Wallet users: use wallet signing via kit
   * 
   * @param deploymentId - Optional deployment ID. If provided, uses DM-signed header.
   * @returns Promise resolving to the auth header string
   * @throws Error if no authentication is available
   */
  const getAuthHeader = async (deploymentId?: string): Promise<string> => {
    // If deploymentId is provided, use DM-signed header (works for both credit and wallet users)
    if (deploymentId && status.value === 'authenticated') {
      try {
        const dep = await nosana.value.api.deployments.get(deploymentId);
        return await (dep as any).generateAuthHeader();
      } catch (error) {
        console.error('Failed to get deployment auth header, falling back to regular auth:', error);
        // Fall through to other auth methods
      }
    }

    // Credit users: use credit header
    const creditHeader = (userData.value as any)?.authenticationHeader as string | undefined;
    if (creditHeader && status.value === 'authenticated') {
      return creditHeader;
    }

    // Wallet users: use wallet signing
    if (!connected.value) {
      throw new Error('No authentication available - wallet not connected');
    }
    const headers = await nosana.value.authorization.generateHeaders('nosana-auth', { 
      key: 'Authorization', 
      includeTime: false 
    });
    const authHeader = headers.get('Authorization') || headers.get('authorization');
    if (!authHeader) {
      throw new Error('Failed to generate authentication header');
    }
    return authHeader;
  };

  return {
    getAuthHeader,
  };
}
