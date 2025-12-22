import { useWallet } from "solana-wallets-vue";

export default defineNuxtRouteMiddleware((to, from) => {
  const { status } = useAuth();
  const { connected } = useWallet();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/", // Login page is now at root
    "/privacy-policy",
    "/tos",
    "/support"
  ];

  const isPublicRoute = publicRoutes.some((route) => to.path === route);

  // Check if user is authenticated (either via Google/Twitter or wallet)
  const isAuthenticated = status.value === "authenticated" || connected.value;

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
