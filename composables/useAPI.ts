export const useAPI: typeof useMyAsyncData = (request, opts?) => {
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