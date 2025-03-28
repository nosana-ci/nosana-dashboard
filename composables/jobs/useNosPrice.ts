export function useNosPrice(): Ref<number> {
  const nosPrice = ref<number>(0);

  // Retrive the price of NOS token
  const { data } = useAPI(
    "https://api.coingecko.com/api/v3/simple/price?ids=nosana&vs_currencies=usd",
    {
      immediate: true,
      default: () => ({
        nosana: { usd: 0 },
      }),
    }
  );

  watch(data, () => {
    nosPrice.value = data.value.nosana.usd;
  }),
    {
      immediate: true,
    };

  return nosPrice;
}
