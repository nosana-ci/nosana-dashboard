export const useAPI: typeof useFetch<any> = (request, opts?) => {
  const config = useRuntimeConfig()
  return useMyAsyncData(toValue(request).toString(), async () => {
    const url = toValue(request);
    if (url === '') return;
    return $fetch(url, { baseURL: config.public.apiBase })
  }, opts);
}