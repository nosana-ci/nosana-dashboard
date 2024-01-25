export const useAPI: typeof useFetch = (request, opts?) => {
  const config = useRuntimeConfig()
  return useFetch(request, {
    baseURL: config.public.apiBase, lazy: true, transform: (value) => {
      return JSON.parse(value as unknown as string)
    }, server: false, ...opts
  })
}