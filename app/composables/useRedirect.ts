import { useWallet } from "@nosana/solana-vue";
import { useAuth } from '#imports';

export function useRedirect() {
  const { connected, account } = useWallet();
  const { status } = useAuth();
  
  // Compatibility: create publicKey-like object from account
  const publicKey = computed(() => {
    if (!account.value?.address) return null;
    return {
      toString: () => account.value!.address,
      toBase58: () => account.value!.address,
    };
  });
  
  // Check if user is authenticated (either Google or wallet)
  const isAuthenticated = computed(() => {
    return status.value === 'authenticated' || connected.value;
  });

  return {
    connected,
    publicKey,
    isAuthenticated
  };
} 