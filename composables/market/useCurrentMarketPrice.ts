import { ref, watch, computed, type Ref, isRef } from 'vue';
import type { Market } from '@nosana/sdk';
import { useToast } from 'vue-toastification';

// Define an interface for the stats object for better typing
interface MarketStats {
  price: number;
  // Add other potential fields from /api/stats if needed
}

// Add optional arguments for pre-fetched data
export function useCurrentMarketPrice(
  marketAddressOrData: Ref<string | Market | null>,
  initialStatsData?: Ref<MarketStats | null>
) {
  const { nosana } = useSDK();
  const toast = useToast();

  // Internal refs for market data
  const market = ref<Market | null>(null);
  
  // Internal loading/error states for SDK/API calls *if* they happen
  const loadingMarketInternal = ref(typeof marketAddressOrData.value === 'string');
  const errorMarketInternal = ref<any>(null);
  
  // Always create the stats fetcher, but make it lazy
  const internalStatsFetcher = useAPI('/api/stats', { 
    default: () => ({ price: 0 }) as MarketStats, 
    lazy: true, 
    immediate: false // Ensure it doesn't run immediately
  }); 

  const fetchMarketDataSDK = async (address: string) => {
    loadingMarketInternal.value = true;
    errorMarketInternal.value = null;
    try {
      market.value = await nosana.value.jobs.getMarket(address);
    } catch (err) {
      console.error(`Error fetching market ${address} from SDK:`, err);
      errorMarketInternal.value = err;
      market.value = null;
    } finally {
      loadingMarketInternal.value = false;
    }
  };

  // Watch the input, which could be an address (string) or market data (object)
  watch(marketAddressOrData, (input) => {
    // Handle null or invalid input first
    if (!input) {
      market.value = null;
      loadingMarketInternal.value = false;
      errorMarketInternal.value = null;
      return;
    }

    // Handle string (address) input
    if (typeof input === 'string') {
      market.value = null; // Reset market data first
      fetchMarketDataSDK(input);
      // If stats were not provided externally, trigger the lazy fetch
      if (!initialStatsData?.value) {
        internalStatsFetcher.execute(); // Or refresh() if execute isn't available
      }
    } 
    // Handle object (Market data) input
    else { 
      market.value = input as Market;
      loadingMarketInternal.value = false; 
      errorMarketInternal.value = null;
      // If stats were not provided, we might still need to fetch them if market object doesn't imply they exist
      // For now, only fetch when address is given, assuming object implies complete data or parent handles stats.
      // Consider if stats should be fetched here too if initialStatsData is missing.
    }
  }, { immediate: true, deep: true });

  // Compute the stats value, prioritizing external data
  const stats = computed(() => {
    if (initialStatsData?.value) {
      return initialStatsData.value;
    }
    return internalStatsFetcher.data.value;
  });

  const currentUsdPricePerHour = computed(() => {
    // Use the computed stats value
    if (!market.value || !stats.value?.price) {
      return null;
    }
    try {
      const nosPrice = stats.value.price;
      const jobPriceLamports = parseInt(String(market.value.jobPrice));
      if (isNaN(jobPriceLamports)) return null;

      const usdPrice = ((jobPriceLamports / 1e6) * 3600 * nosPrice * 1.1);
      return usdPrice;
    } catch (e) {
      console.error("Error calculating market price:", e);
      return null;
    }
  });

  // Determine loading state based on market fetch and internal stats fetch (if used)
  const isLoading = computed(() => {
    const marketLoading = typeof marketAddressOrData.value === 'string' && loadingMarketInternal.value;
    const statsLoading = !initialStatsData?.value && internalStatsFetcher.pending.value;
    return marketLoading || statsLoading;
  });

  // Determine error state similarly
  const error = computed(() => {
     const marketError = typeof marketAddressOrData.value === 'string' ? errorMarketInternal.value : null;
     const statsError = !initialStatsData?.value ? internalStatsFetcher.error.value : null;
     return marketError || statsError;
  });

  // Refresh function for both market (if needed) and stats (if needed)
  const refresh = () => {
    if (typeof marketAddressOrData.value === 'string') {
       fetchMarketDataSDK(marketAddressOrData.value);
    }
    // Refresh stats only if they weren't provided externally
    if (!initialStatsData?.value) { 
       internalStatsFetcher.execute(); // Or refresh()
    }
  };

  return {
    currentUsdPricePerHour,
    isLoading,
    error,
    refresh
  };
} 