interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean;
  credentials?: boolean; // Send cookies with request (default: false)
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
    baseURL: config.public.apiBase as string,
    method: opts?.method || 'GET',
    headers,
    ...(opts?.credentials ? { credentials: 'include' as const } : {}),
    ...(opts?.body && { body: opts.body }),
  });
};


