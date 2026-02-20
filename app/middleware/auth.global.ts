import { useSuperTokens } from "~/composables/useSuperTokens";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const {
    isLoading,
    isAuthenticated: superTokensAuth,
    isEmailVerified,
    checkSession,
  } = useSuperTokens();
  const config = useRuntimeConfig();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/privacy-policy",
    "/tos",
    "/support",
    "/st-auth/reset-password",
    "/st-auth/verify-email",
  ];

  const isPublicRoute =
    publicRoutes.some((route) => to.path === route) ||
    to.path.startsWith("/st-auth/callback/") ||
    to.path.startsWith("/st-auth/verify-email") ||
    to.path.startsWith("/st-auth/reset-password");

  // On client, wait for session check if it's currently loading
  // Skip for public routes to avoid unnecessary API calls when not authenticated
  if (import.meta.client && isLoading.value && !isPublicRoute) {
    await checkSession();
  }

  // Check for wallet authentication
  let walletAuthenticated = false;
  if (import.meta.client) {
    try {
      const sessionCookie = useCookie("nosana-wallet-session");
      if (sessionCookie.value) {
        const authTime = (sessionCookie.value as any).timestamp || 0;
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        walletAuthenticated =
          (sessionCookie.value as any).authenticated && now - authTime < maxAge;
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

  // Check if user is authenticated (via Google, wallet, or SuperTokens)
  const isAuthenticated = walletAuthenticated || superTokensAuthenticated;

  // Redirect authenticated users from root to account (only if email is verified)
  if (to.path === "/" && isAuthenticated && isEmailVerified.value !== false) {
    return navigateTo("/account/");
  }

  // If user is authenticated but email is not verified, redirect to verification page
  // ONLY for protected routes - allow access to public routes regardless of verification status
  if (isPublicRoute) {
    return;
  }

  if (isAuthenticated && isEmailVerified.value === false) {
    if (
      !to.path.startsWith("/st-auth/verify-email") &&
      !to.path.startsWith("/st-auth/callback/") &&
      !to.path.startsWith("/st-auth/reset-password")
    ) {
      return navigateTo("/st-auth/verify-email");
    }
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
