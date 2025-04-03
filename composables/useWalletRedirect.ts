import { useWallet } from "solana-wallets-vue";
import { watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted, nextTick } from "vue";

export function useWalletRedirect() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const route = useRoute();
  
  // Track if initial page load has completed
  const initialLoadComplete = ref(false);
  
  // Wait for hydration to complete
  onMounted(() => {
    nextTick(() => {
      initialLoadComplete.value = true;
    });
  });

  // Watch for wallet connection changes
  watch(
    connected,
    async (isConnected) => {
      // Only perform redirects after initial page load
      if (!initialLoadComplete.value) return;
      
      if (isConnected) {
        // If connected on landing page, navigate to My Account
        if (route.path === '/') {
          router.push('/dashboard');
        }
      }
    }
  );

  return {
    connected,
    publicKey
  };
} 