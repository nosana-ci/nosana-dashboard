export const useAPI2: typeof useFetch<any> = (request, opts?) => {
  const config = useRuntimeConfig()
  return useMyAsyncData(toValue(request).toString(), async () => {
    const url = toValue(request);
    if (url === '') return;
    return $fetch(config.public.oldApiBase + url)
  }, {
    transform(value: any) {
      return JSON.parse(value as unknown as string)
    },
    ...opts
  });
}