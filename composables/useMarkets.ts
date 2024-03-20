const markets: Ref<Array<any> | undefined> = ref(undefined);

const { nosana, network } = useSDK();

watch(network, () => {
  markets.value = undefined;
});

const loadingMarkets = ref(false);

const getMarkets = async () => {
  console.log('retrieving all markets..');
  loadingMarkets.value = true;
  try {
    markets.value = await nosana.value.jobs.allMarkets();
  } catch (e) {
    console.error(e);
  }
  loadingMarkets.value = false;
};

export const useMarkets = () => {
  return { markets, getMarkets, loadingMarkets };
};
