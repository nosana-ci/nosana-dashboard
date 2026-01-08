interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean;
}

export const useApiFetch = async <T = any>(
  url: string,
  opts?: ApiFetchOptions
) => {
  const config = useRuntimeConfig();
  const { token } = useAuth();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts?.headers || {}),
  };

  if (opts?.auth && token.value) {
    headers.Authorization = token.value as string;
  }

  return $fetch<T>(url, {
    baseURL: config.public.backend_url as string,
    method: opts?.method || 'GET',
    headers,
    ...(opts?.body && { body: opts.body }),
  });
};


