interface APIOptions extends Record<string, any> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean; // Add auth header if true
  default?: () => any;
  credentials?: boolean; // Send cookies with request (default: true)
}

export const useAPI = (
  request: string | Ref<string>,
  opts?: APIOptions
) => {
  const config = useRuntimeConfig();
  return useMyAsyncData(
    toValue(request).toString(),
    async () => {
      const url = toValue(request);
      if (!url || url === '') return opts?.default ? opts.default() : null;

      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(opts?.headers || {}),
      };

      return $fetch(url, {
        baseURL: config.public.backend_url as string,
        method: opts?.method || 'GET',
        headers,
        ...(opts?.credentials !== false ? { credentials: 'include' as const } : {}),
        ...(opts?.body && { body: opts.body }),
      });
    },
    opts
  );
};