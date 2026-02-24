export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig();
  if (config.public.maintenance) {
    if (to.path !== "/maintenance") {
      return navigateTo("/maintenance", { replace: true });
    }
    return;
  }
  if (to.path === "/maintenance") {
    return navigateTo("/", { replace: true });
  }
});
