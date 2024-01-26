export const useAPI: typeof useFetch = (request, opts?) => {
  const config = useRuntimeConfig()
  return useMyAsyncData(request, async () => {
    return $fetch(request, { baseURL: config.public.apiBase })
  }, {
    transform(value) {
      return JSON.parse(value as unknown as string)
    },
    ...opts
  });
}