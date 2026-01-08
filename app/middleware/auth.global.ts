export default defineNuxtRouteMiddleware((to, from) => {
  const { status } = useAuth();
  const config = useRuntimeConfig();
  
  // Check for wallet authentication
  // The wallet context isn't available in middleware (runs before WalletProvider mounts)
  // So we check for auth cookies set after message signing
  let walletAuthenticated = false;
  if (process.client) {
    try {
      // Check the session cookie we set after wallet auth
      const sessionCookie = useCookie('nosana-wallet-session');
      if (sessionCookie.value) {
        // Check if auth is still valid (within 24 hours)
        const authTime = sessionCookie.value.timestamp || 0;
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        walletAuthenticated = sessionCookie.value.authenticated && (now - authTime < maxAge);
      }
      
      // Also check if there's a valid auth cookie for any wallet address
      // by checking if the wallet's stored address has an auth cookie
      if (!walletAuthenticated && sessionCookie.value?.address) {
        const authCookieKey = `nosana_auth_${config.public.network}_${sessionCookie.value.address}`;
        const authCookie = useCookie(authCookieKey);
        if (authCookie.value) {
          walletAuthenticated = true;
        }
      }
    } catch (error) {
      // Ignore cookie errors
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    "/", // Login page is now at root
    "/privacy-policy",
    "/tos",
    "/support"
  ];

  const isPublicRoute = publicRoutes.some((route) => to.path === route);

  // Check if user is authenticated (either via Google/Twitter or wallet)
  const isAuthenticated = status.value === "authenticated" || walletAuthenticated;

  if (to.path === "/" && isAuthenticated) {
    return navigateTo("/account/");
  }

  // If trying to access protected route without authentication, redirect to root (login)
  if (!isPublicRoute && !isAuthenticated && status.value !== "loading") {
    return navigateTo({
      path: "/",
      query: { redirect: to.fullPath },
    });
  }
});
