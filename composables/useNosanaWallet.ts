import base58 from "bs58";
import { useLocalStorage } from "@vueuse/core";
import { useWallet } from "solana-wallets-vue";

import type { MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";

export function useNosanaWallet() {
  const { nosana } = useSDK();
  const { connected, publicKey, wallet } = useWallet();

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

  const storedAuthHeader = useLocalStorage<string | null>(
    "nosanaAuthHeader",
    null
  );

  const isVerified = ref(storedAuthHeader.value !== null);

  const signMessageError = ref(false);

  const signMessage = async (forceNew = false) => {
    if (storedAuthHeader.value && !forceNew) {
      isVerified.value = true;
      return storedAuthHeader.value;
    }

    if (!connected.value || !publicKey.value || !wallet.value) {
      throw new Error("Wallet not connected or not found");
    }

    try {
      signMessageError.value = false;
      const message = "Hello Nosana Node!";
      const encodedMessage = new TextEncoder().encode(message);
      const adapter = wallet.value.adapter as MessageSignerWalletAdapter;

      if (!adapter.signMessage) {
        throw new Error("Wallet does not support message signing");
      }

      const signedMessage = await adapter.signMessage(encodedMessage);
      const authHeader = `${message}:${base58.encode(signedMessage)}`;

      storedAuthHeader.value = authHeader;
      isVerified.value = true;
      return authHeader;
    } catch (error) {
      signMessageError.value = true;
      isVerified.value = false;
      throw error;
    }
  };

  watch(
    publicKey,
    async (newPublicKey) => {
      // If you want to invalidate stored auth when wallet changes:
      if (!newPublicKey) {
        storedAuthHeader.value = null;
        isVerified.value = false;
      }
    },
    { immediate: true }
  );

  return {
    userBalances,
    isVerified,
    connected,
    publicKey,
    signMessage,
  };
}
