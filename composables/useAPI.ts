export const useAPI: typeof useFetch<any> = (request, opts?) => {
  const config = useRuntimeConfig()
  return useMyAsyncData(toValue(request).toString(), async () => {
    const url = toValue(request);
    if (!url || url === '') return opts?.default ? opts.default() : null;
    return $fetch(url, { baseURL: config.public.apiBase })
  }, opts);
}