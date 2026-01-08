import type { Market } from "@nosana/kit";

const markets: Ref<Array<Market> | undefined> = ref(undefined);
const loadingMarkets = ref(false);

export const useMarkets = () => {
  const { nosana } = useKit();

const getMarkets = async () => {
  loadingMarkets.value = true;
  try {
      markets.value = (await nosana.value.jobs.markets()).sort(
      function (a, b) {
          return parseInt(String(a.jobPrice)) < parseInt(String(b.jobPrice)) ? -1 : 1;
      }
    );
  } catch (e) {
    console.error(e);
  }
  loadingMarkets.value = false;
};

  return { markets, getMarkets, loadingMarkets };
};
