import { useWallet } from "@nosana/solana-vue";
import { useCookies } from '@vueuse/integrations/useCookies'

import { createAuthCookiesKey } from "~/utils/createAuthCookiesKey";

export function useNosanaWallet() {
  const { nosana } = useKit();
  const { connected, account } = useWallet();
  const cookies = useCookies();

  // Compatibility: create publicKey-like object from account
  const publicKey = computed(() => {
    if (!account.value?.address) return null;
    return {
      toString: () => account.value!.address,
      toBase58: () => account.value!.address,
    };
  });

  const userBalances = ref({
    nos: 0,
    sol: 0,
    usdc: 0,
    usdt: 0,
  });

  const refreshAllBalances = async () => {
    try {
      const nosBal = await nosana.value.nos.getBalance();
      userBalances.value.nos = nosBal ?? 0;
    } catch (error) {
      console.error("Failed to refresh NOS balance", error);
    }
  };

  watch(
    connected,
    async (isConnected) => {
      if (isConnected) {
        await refreshAllBalances();
      }
    },
    { immediate: true }
  );


  const signMessageError = ref(false);

  const generateAuthHeaders = async (
    options?: { key?: string; includeTime?: boolean; forceNew?: boolean }
  ): Promise<Headers> => {
    try {
      if (options?.forceNew) {
        if (account.value?.address) {
          cookies.remove(createAuthCookiesKey(account.value.address));
        }
      }

      const headerName = options?.key || 'NosanaApiAuthorization';
      const message = options?.includeTime ? Date.now().toString() : 'nosana-auth';
      
      return await nosana.value.authorization.generateHeaders(
        message,
        { key: headerName, includeTime: options?.includeTime ?? false }
      );
    } catch (error) {
      signMessageError.value = true;
      throw error as Error;
    }
  };


  return {
    userBalances,
    connected,
    publicKey,
    generateAuthHeaders,
    signMessageError,
    refreshAllBalances,
  };
}
