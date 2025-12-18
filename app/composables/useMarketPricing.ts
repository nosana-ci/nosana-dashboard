import { computed, ref, watch, type Ref, type ComputedRef } from 'vue';
import type { Market } from '@nosana/sdk';

// Network fee constant (10% = 1.1 multiplier)
const NETWORK_FEE_MULTIPLIER = 1.1;

/**
 * Centralized pricing system that uses usd_reward_per_hour from markets table + 10%
 * This should be used everywhere for consistent pricing across the entire application
 */

export interface MarketPricingOptions {
  showPerHour?: boolean;
  decimalPlaces?: number;
  showDollarSign?: boolean;
}

export interface JobData {
  timeStart?: number;
  timeEnd?: number;
  timeout?: number;
  state?: number | string;
  market?: string;
  usdRewardPerHour?: number;
}

/**
 * Get USD price per hour for a market (with 10% network fee included)
 * @param marketAddress - Market address or Market object
 * @param marketsData - Optional pre-fetched markets data
 * @returns USD price per hour including 10% network fee
 */
export function useMarketUsdPrice(
  marketAddress: Ref<string | Market | null | undefined>,
  marketsData?: Ref<any[] | null | undefined>
) {
  const shouldFetchInternally = !marketsData;
  const { data: internalMarketsData, pending: loadingMarkets } = useAPI('/api/markets', { 
    default: () => [], 
    lazy: !shouldFetchInternally,
    immediate: shouldFetchInternally
  });

  const markets = computed(() => {
    // Prioritize external markets data if provided
    if (marketsData && marketsData.value && marketsData.value.length > 0) {
      return marketsData.value;
    }
    // Fallback to internal data
    return internalMarketsData.value || [];
  });

  const usdPricePerHour = computed(() => {
    if (!marketAddress.value) return null;

    const address = typeof marketAddress.value === 'string' 
      ? marketAddress.value 
      : marketAddress.value.address?.toString();
    
    if (!address) return null;

    const availableMarkets = markets.value;
    if (!availableMarkets || availableMarkets.length === 0) {
      return null;
    }

    // Only use USD pricing from markets API - no fallbacks to jobPrice
    const marketInfo = availableMarkets.find((m: any) => m.address === address);
    if (marketInfo?.usd_reward_per_hour) {
      return marketInfo.usd_reward_per_hour * NETWORK_FEE_MULTIPLIER;
    }

    return null;
  });

  return {
    usdPricePerHour,
    isLoading: computed(() => !marketsData && loadingMarkets.value),
    markets
  };
}

/**
 * Calculate job pricing based on duration and market USD rate
 * @param jobData - Job information including market and timing
 * @param options - Display options
 * @param marketsData - Optional pre-fetched markets data
 */
export function useJobPricing(
  jobData: Ref<JobData>,
  options: MarketPricingOptions = {},
  marketsData?: Ref<any[] | null | undefined>
) {
  const defaultOptions = {
    showPerHour: false,
    decimalPlaces: 3,
    showDollarSign: true
  };
  
  const opts = { ...defaultOptions, ...options };

  // Get market USD price
  const marketAddress = computed(() => jobData.value?.market || null);
  const { usdPricePerHour, isLoading } = useMarketUsdPrice(marketAddress, marketsData);

  // Calculate job duration in hours (capped at timeout if set)
  const durationHours = computed(() => {
    const job = jobData.value;
    if (!job || !job.timeStart) return 0;

    const timeStart = job.timeStart;
    const timeEnd = job.timeEnd || Math.floor(Date.now() / 1000);
    let duration = Math.max(0, timeEnd - timeStart);
    
    // Cap duration at timeout if set (timeout is in seconds)
    if (job.timeout && duration > job.timeout) {
      duration = job.timeout;
    }
    
    return duration / 3600; // Convert seconds to hours
  });

  // Calculate total job cost
  const totalCostUsd = computed(() => {
    const hourlyRate = usdPricePerHour.value;
    const hours = durationHours.value;
    
    if (!hourlyRate || hours <= 0) return 0;
    
    return hourlyRate * hours;
  });

  // Format price for display
  const formatPrice = (price: number) => {
    const dollarSign = opts.showDollarSign ? '$' : '';
    return `${dollarSign}${price.toFixed(opts.decimalPlaces)}`;
  };

  const formattedPrice = computed(() => {
    if (opts.showPerHour) {
      const hourlyRate = usdPricePerHour.value;
      if (!hourlyRate) return 'N/A';
      return `${formatPrice(hourlyRate)}/h`;
    } else {
      const total = totalCostUsd.value;
      if (total <= 0) return 'N/A';
      return formatPrice(total);
    }
  });

  return {
    usdPricePerHour,
    durationHours,
    totalCostUsd,
    formattedPrice,
    isLoading
  };
}

/**
 * Calculate estimated cost for a given duration and market
 * Used primarily on deploy page for cost estimation
 */
export function useEstimatedCost(
  marketAddress: Ref<string | Market | null | undefined>,
  durationHours: Ref<number>,
  marketsData?: Ref<any[] | null | undefined>
) {
  const { usdPricePerHour, isLoading } = useMarketUsdPrice(marketAddress, marketsData);

  const estimatedCost = computed(() => {
    const hourlyRate = usdPricePerHour.value;
    const hours = durationHours.value;
    
    if (!hourlyRate || hours <= 0) return 0;
    
    return hourlyRate * hours;
  });

  const formattedCost = computed(() => {
    const cost = estimatedCost.value;
    if (cost <= 0) return '$0.000';
    return `$${cost.toFixed(3)}`;
  });

  const formattedHourlyRate = computed(() => {
    const rate = usdPricePerHour.value;
    if (!rate) return '$0.000/h';
    return `$${rate.toFixed(3)}/h`;
  });

  return {
    usdPricePerHour,
    estimatedCost,
    formattedCost,
    formattedHourlyRate,
    isLoading
  };
}

/**
 * Get the raw NOS rate per hour that hosts receive (without network fee)
 * Used for displaying host payment information
 */
export function useHostNosRate(
  marketAddress: Ref<string | Market | null | undefined>,
  marketsData?: Ref<any[] | null | undefined>
) {
  const { nosana } = useSDK();
  
  const nosRatePerHour = computed(() => {
    if (!marketAddress.value) return null;
    
    const marketObject = typeof marketAddress.value === 'object' 
      ? marketAddress.value 
      : null;
    
    if (marketObject?.jobPrice) {
      const jobPriceLamports = parseInt(String(marketObject.jobPrice));
      if (!isNaN(jobPriceLamports)) {
        // Raw NOS rate per hour (what hosts receive, no network fee)
        return (jobPriceLamports / 1e6) * 3600;
      }
    }
    
    return null;
  });
  
  return {
    nosRatePerHour
  };
}