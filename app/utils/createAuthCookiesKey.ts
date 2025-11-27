
export function createAuthCookiesKey(key: string): string {
  const config = useRuntimeConfig();
  return `nosana_auth_${config.public.network}_${key}`;
};