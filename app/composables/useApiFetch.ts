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

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts?.headers || {}),
  };

  return $fetch<T>(url, {
    baseURL: config.public.backend_url as string,
    method: opts?.method || 'GET',
    headers,
    credentials: 'include',
    ...(opts?.body && { body: opts.body }),
  });
};


