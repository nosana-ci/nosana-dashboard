import { useWallet } from "solana-wallets-vue";
import { useAuth } from '#imports';

export function useRedirect() {
  const { connected, publicKey } = useWallet();
  const { status } = useAuth();
  
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