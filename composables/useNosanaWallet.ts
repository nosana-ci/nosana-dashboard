import { useWallet } from "solana-wallets-vue";
import { useCookies } from '@vueuse/integrations/useCookies'

import { createAuthCookiesKey } from "~/utils/createAuthCookiesKey";

export function useNosanaWallet() {
  const { nosana } = useSDK();
  const { connected, publicKey } = useWallet();
  const cookies = useCookies();

  const userBalances = ref({
    nos: 0,
    sol: 0,
    usdc: 0,
    usdt: 0,
  });

  const refreshAllBalances = async () => {
    try {
      const nosBal = await nosana.value.solana.getNosBalance();
      userBalances.value.nos = nosBal?.uiAmount ?? 0;
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
        cookies.remove(createAuthCookiesKey(publicKey.value!.toString()));
      }

      return await nosana.value.authorization.generateHeader('NosanaApiAuthorization', options?.includeTime ? { includeTime: options.includeTime } : undefined);
    } catch (error) {
      console.error('authorization.generate error:', error);
      signMessageError.value = true;
      throw error as Error;
    }
  };


  return {
    userBalances,
    connected,
    publicKey,
    generateAuthHeaders,
  };
}
