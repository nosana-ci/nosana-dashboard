import { useSuperTokens } from "~/composables/useSuperTokens";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const config = useRuntimeConfig();
  const inMaintenanceBypass =
    config.public.maintenance &&
    import.meta.client &&
    typeof localStorage !== "undefined" &&
    localStorage.getItem("skipMaintenance");
  if (config.public.maintenance && !inMaintenanceBypass) {
    return;
  }
  const {
    isLoading,
    isAuthenticated: superTokensAuth,
    isEmailVerified,
    checkSession,
  } = useSuperTokens();
  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/privacy-policy",
    "/tos",
    "/st-auth/reset-password",
    "/deployments/create",
  ];

  const normalizedPath =
    to.path.length > 1 ? to.path.replace(/\/+$/, "") : to.path;

  const isPublicRoute =
    publicRoutes.some((route) => normalizedPath === route) ||
    to.path.startsWith("/st-auth/callback/") ||
    to.path.startsWith("/st-auth/verify-email") ||
    to.path.startsWith("/st-auth/reset-password");
  const isBillingRoute = to.path === "/account/billing";

  // On client, always check session for protected routes
  // SuperTokens cookies are HttpOnly so we can't check them via JS
  // Instead we make an async call to verify the session
  if (import.meta.client && !isPublicRoute) {
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

  if (isBillingRoute && walletAuthenticated && !superTokensAuthenticated) {
    return navigateTo("/account");
  }

  // If user is authenticated but email is not verified, redirect to verification page
  // ONLY for protected routes - allow access to public routes regardless of verification status
  if (isPublicRoute) {
    return;
  }

  if (superTokensAuthenticated && isEmailVerified.value === false) {
    if (
      !to.path.startsWith("/st-auth/verify-email") &&
      !to.path.startsWith("/st-auth/callback/") &&
      !to.path.startsWith("/st-auth/reset-password")
    ) {
      return navigateTo("/st-auth/verify-email");
    }
  }

  // If trying to access protected route without authentication, send to login page
  if (!isPublicRoute && !isAuthenticated && !isLoading.value) {
    return navigateTo({
      path: "/",
      query: { redirect: to.fullPath },
    });
  }

});
