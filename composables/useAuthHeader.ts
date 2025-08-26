export function useAuthHeader() {
  const { status, data: userData } = useAuth();
  const { generateAuthHeaders, hasSessionAuth } = useNosanaWallet();

  const creditHeader = computed<string | null>(() => {
    const header = (userData.value as any)?.authenticationHeader as string | undefined;
    return status.value === 'authenticated' && header ? header : null;
  });

  const hasAuth = computed<boolean>(() => {
    return Boolean(creditHeader.value || hasSessionAuth.value);
  });

  const ensureAuth = async (): Promise<string> => {
    if (creditHeader.value) return creditHeader.value;
    const headers = await generateAuthHeaders({ key: 'Authorization' });
    return headers.get('Authorization') || headers.get('authorization') || '';
  };

  return { hasAuth, ensureAuth, creditHeader };
}


