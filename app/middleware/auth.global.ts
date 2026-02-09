import { useSuperTokens } from "~/composables/useSuperTokens";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isLoading, isAuthenticated: superTokensAuth, checkSession } = useSuperTokens();
  const config = useRuntimeConfig();

  // On client, wait for session check if it's currently loading
  if (import.meta.client && isLoading.value) {
    await checkSession();
  }

  // Check for wallet authentication
  let walletAuthenticated = false;
  if (import.meta.client) {
    try {
      const sessionCookie = useCookie('nosana-wallet-session');
      if (sessionCookie.value) {
        const authTime = (sessionCookie.value as any).timestamp || 0;
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        walletAuthenticated = (sessionCookie.value as any).authenticated && (now - authTime < maxAge);
      }

      if (!walletAuthenticated && (sessionCookie.value as any)?.address) {
        const authCookieKey = `nosana_auth_${config.public.network}_${(sessionCookie.value as any).address}`;
        const authCookie = useCookie(authCookieKey);
        if (authCookie.value) {
          walletAuthenticated = true;
        }
      }
    } catch (error) {
      // Ignore cookie errors
    }
  }

  // Check for SuperTokens session
  const superTokensAuthenticated = superTokensAuth.value;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/privacy-policy",
    "/tos",
    "/support"
  ];

  const isPublicRoute = publicRoutes.some((route) => to.path === route) || to.path.startsWith('/auth/callback/');

  // Check if user is authenticated (via Google, wallet, or SuperTokens)
  const isAuthenticated = walletAuthenticated || superTokensAuthenticated;

  // Redirect authenticated users from root to account
  if (to.path === "/" && isAuthenticated) {
    return navigateTo("/account/");
  }

  // If trying to access protected route without authentication, redirect to root (login page)
  // Only redirect if we are not in a loading state
  if (!isPublicRoute && !isAuthenticated && !isLoading.value) {
    return navigateTo({
      path: "/",
      query: { redirect: to.fullPath },
    });
  }
});
