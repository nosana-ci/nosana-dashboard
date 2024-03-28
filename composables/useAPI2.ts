export const useAPI2: typeof useFetch<any> = (request, opts?) => {
  const config = useRuntimeConfig()
  return useMyAsyncData(toValue(request).toString(), async () => {
    const url = toValue(request);
    if (url === '') return;
    return $fetch('https://backend.k8s.prd.nos.ci' + url)
  }, {
    transform(value: any) {
      return JSON.parse(value as unknown as string)
    },
    ...opts
  });
}