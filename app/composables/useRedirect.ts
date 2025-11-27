import { useWallet } from "solana-wallets-vue";
import { watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from '#imports';
import { useLoginModal } from './useLoginModal';

export function useRedirect() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const route = useRoute();
  const { status } = useAuth();
  const { openBothModal } = useLoginModal();
  
  // Check if user is authenticated (either Google or wallet)
  const isAuthenticated = computed(() => {
    return status.value === 'authenticated' || connected.value;
  });

  // Watch for authentication changes with debouncing to prevent tab switch redirects
  let redirectTimer: NodeJS.Timeout | null = null;
  
  watch(
    [connected, status, () => route.path],
    async ([isConnected, authStatus, currentPath]) => {
      // Clear any pending redirect
      if (redirectTimer) {
        clearTimeout(redirectTimer);
        redirectTimer = null;
      }
      
      // No need to handle login page redirects since login page is removed
      // The modal handles authentication flows now

      // Only redirect on protected routes when user is not authenticated
      const protectedRoutes = ['/account/deployer', '/account/host'];
      const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
      
      if (!isAuthenticated.value && isProtectedRoute) {
        // Add a small delay to prevent redirects during tab switches
        redirectTimer = setTimeout(() => {
          // Double-check authentication status before redirecting
          if (!isAuthenticated.value) {
            // Open login modal instead of redirecting to login page
            const fullPath = route.fullPath;
            openBothModal(fullPath);
          }
        }, 500);
      }
    }
  );

  return {
    connected,
    publicKey,
    isAuthenticated
  };
} 