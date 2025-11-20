import type { SessionDataObject } from '@sidebase/nuxt-auth/dist/runtime/types'

interface AuthenticatedUser extends SessionDataObject {
  authenticationHeader?: string;
}

export function useAuthHeader() {
  const { status, data: userData } = useAuth();
  const { nosana } = useSDK();
  const { generateAuthHeaders, hasSessionAuth } = useNosanaWallet();

  const creditHeader = computed<string | null>(() => {
    const header = (userData.value as AuthenticatedUser)?.authenticationHeader;
    return status.value === 'authenticated' && header ? header : null;
  });

  const hasAuth = computed<boolean>(() => {
    return Boolean(creditHeader.value || hasSessionAuth);
  });

  /**
   * Returns a node Authorization string. If a deploymentId is provided,
   * retrieves a vault-signed header via SDK (DM).
   */
  const ensureAuth = async (options?: { deploymentId?: string }): Promise<string> => {
    if (creditHeader.value) return creditHeader.value;
    if (options?.deploymentId) {
      const dep = await nosana.value.deployments.get(options.deploymentId);
      // SDK returns the raw "message:signature[:timestamp]" string
      return await dep.generateAuthHeader();
    }
    const headers = await generateAuthHeaders({ key: 'Authorization' });
    const authHeader = headers.get('Authorization') || headers.get('authorization');
    if (!authHeader) {
      throw new Error('Failed to generate authentication header');
    }
    return authHeader;
  };

  return { hasAuth, ensureAuth, creditHeader };
}


