const markets: Ref<Array<any> | undefined> = ref(undefined);

const { nosana } = useSDK();

const loadingMarkets = ref(false);

const getMarkets = async () => {
  console.log("retrieving all markets..");
  loadingMarkets.value = true;
  try {
    markets.value = (await nosana.value.jobs.allMarkets()).sort(
      function (a, b) {
        console.log(parseInt(a.jobPrice));
        return parseInt(a.jobPrice) < parseInt(b.jobPrice) ? -1 : 1;
      }
    );
  } catch (e) {
    console.error(e);
  }
  loadingMarkets.value = false;
};

export const useMarkets = () => {
  return { markets, getMarkets, loadingMarkets };
};
