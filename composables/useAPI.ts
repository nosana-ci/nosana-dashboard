interface APIOptions extends Record<string, any> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean; // Add auth header if true
  default?: () => any;
}

export const useAPI = (
  request: string | Ref<string>,
  opts?: APIOptions
) => {
  const config = useRuntimeConfig();
  const { token } = useAuth();

  return useMyAsyncData(
    toValue(request).toString(),
    async () => {
      const url = toValue(request);
      if (!url || url === '') return opts?.default ? opts.default() : null;

      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(opts?.headers || {}),
      };

      if (opts?.auth && token.value) {
        headers.Authorization = token.value as string;
      }

      return $fetch(url, {
        baseURL: config.public.apiBase as string,
        method: opts?.method || 'GET',
        headers,
        ...(opts?.body && { body: opts.body }),
      });
    },
    opts
  );
};