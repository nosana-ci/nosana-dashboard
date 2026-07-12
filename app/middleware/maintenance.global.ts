const SKIP_MAINTENANCE_KEY = "skipMaintenance";

function shouldSkipMaintenance(to: { path: string; query: Record<string, unknown> }) {
  if (to.query.skipMaintenance) return true;
  if (import.meta.client && typeof localStorage !== "undefined" && localStorage.getItem(SKIP_MAINTENANCE_KEY)) {
    return true;
  }
  return false;
}

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig();
  if (config.public.maintenance) {
    if (shouldSkipMaintenance(to)) {
      if (import.meta.client && to.query.skipMaintenance) {
        localStorage.setItem(SKIP_MAINTENANCE_KEY, "1");
      }
      return;
    }
    if (to.path !== "/maintenance") {
      return navigateTo("/maintenance", { replace: true });
    }
    return;
  }
  if (to.path === "/maintenance") {
    return navigateTo("/", { replace: true });
  }
});
