import Session from "supertokens-web-js/recipe/session";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { status } = useAuth();
  const config = useRuntimeConfig();

  // Check for wallet authentication
  let walletAuthenticated = false;
  if (process.client) {
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
  let superTokensAuthenticated = false;
  if (process.client) {
    try {
      superTokensAuthenticated = await Session.doesSessionExist();
    } catch (error) {
      // SuperTokens not initialized yet or error checking session
      console.warn("Error checking SuperTokens session:", error);
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/privacy-policy",
    "/tos",
    "/support"
  ];

  const isPublicRoute = publicRoutes.some((route) => to.path === route) || to.path.startsWith('/auth/callback/');

  // Check if user is authenticated (via Google, wallet, or SuperTokens)
  const isAuthenticated = status.value === "authenticated" || walletAuthenticated || superTokensAuthenticated;

  // Redirect authenticated users from root to account
  if (to.path === "/" && isAuthenticated) {
    return navigateTo("/account/");
  }

  // If trying to access protected route without authentication, redirect to root (login page)
  if (!isPublicRoute && !isAuthenticated && status.value !== "loading") {
    return navigateTo({
      path: "/",
      query: { redirect: to.fullPath },
    });
  }
});
