export const useAPI: typeof useMyAsyncData = (request, opts?) => {
  const config = useRuntimeConfig()
  return useMyAsyncData(request, async () => {
    const fetchData = await $fetch(request, { baseURL: config.public.apiBase })
    return fetchData;
  }, {
    transform(value) {
      return JSON.parse(value as unknown as string)
    },
    ...opts
  });
}