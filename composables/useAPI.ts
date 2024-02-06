export const useAPI: typeof useFetch<any> = (request, opts?) => {
  const config = useRuntimeConfig()
  return useMyAsyncData(request, async () => {
    // TODO: find a better way to do this. very hacky atm
    // when the address is already passed as a string, it loses reactivity
    // therefore when fetching stake, watched object (publicKey) has to be converted to string
    if (request === '/stake/' && opts) {
      // @ts-ignore
      return opts.watch[0].value ? 
        $fetch(request + opts.watch[0].value.toString(), { baseURL: config.public.apiBase }) 
        : null;
    } else {
      return $fetch(request, { baseURL: config.public.apiBase })
    }
  }, opts);
}