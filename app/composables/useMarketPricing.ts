import { computed, ref, watch, type Ref, type ComputedRef } from 'vue';

// Network fee constant (10% = 1.1 multiplier)
export const NETWORK_FEE_MULTIPLIER = 1.1;

/** A market's base USD rate as the deployment pays it: the network fee added. */
export const withNetworkFee = (usd: number): number => usd * NETWORK_FEE_MULTIPLIER;

/**
 * Centralized pricing: a job's `usdRewardPerHour` (its market's base rate when
 * it was posted) plus the 10% network fee. Used everywhere a job is priced, so
 * nothing needs the markets list.
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
  price?: number;
}

/**
 * Calculate job pricing based on duration and market USD rate
 * @param jobData - Job information including its hourly rate and timing
 * @param options - Display options
 */
export function useJobPricing(
  jobData: Ref<JobData>,
  options: MarketPricingOptions = {},
) {
  const defaultOptions = {
    showPerHour: false,
    decimalPlaces: 3,
    showDollarSign: true
  };

  const opts = { ...defaultOptions, ...options };

  // What an hour costs the job, network fee included.
  const usdPricePerHour = computed(() => {
    const rate = jobData.value?.usdRewardPerHour;
    return rate ? withNetworkFee(rate) : null;
  });
  const isLoading = computed(() => false);

  // Calculate job duration in hours
  const durationHours = computed(() => {
    const job = jobData.value;
    if (!job || !job.timeStart) return 0;

    const timeStart = job.timeStart;
    const timeEnd = job.timeEnd || Math.floor(Date.now() / 1000);
    const duration = Math.max(0, timeEnd - timeStart);

    return duration / 3600; // Convert seconds to hours
  });

  // The base USD rate per hour, without the network fee.
  const baseUsdPricePerHour = computed(() => jobData.value?.usdRewardPerHour ?? null);

  // Calculate host fee NOS (base amount without network fee)
  const hostFeeNos = computed(() => {
    const job = jobData.value;
    if (!job?.price || !job?.timeStart) return 0;

    const timeStart = job.timeStart;
    const timeEnd = job.timeEnd || Math.floor(Date.now() / 1000);
    const runtime = Math.max(0, timeEnd - timeStart);

    // NOS = (price per second * runtime in seconds) / 1e6
    return (job.price * runtime) / 1e6;
  });

  // Calculate network fee NOS (10% of host fee)
  const networkFeeNos = computed(() => {
    return hostFeeNos.value * 0.1;
  });

  // Calculate total NOS (host fee + network fee)
  const totalNos = computed(() => {
    return hostFeeNos.value + networkFeeNos.value;
  });

  // Calculate host fee USD (base rate * hours, without network fee)
  const hostFeeUsd = computed(() => {
    const baseRate = baseUsdPricePerHour.value;
    const hours = durationHours.value;

    if (!baseRate || hours <= 0) return 0;

    return baseRate * hours;
  });

  // Calculate network fee USD (10% of host fee)
  const networkFeeUsd = computed(() => {
    return hostFeeUsd.value * 0.1;
  });

  // Calculate total USD (host fee + network fee)
  const totalCostUsd = computed(() => {
    return hostFeeUsd.value + networkFeeUsd.value;
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
    baseUsdPricePerHour,
    durationHours,
    hostFeeNos,
    networkFeeNos,
    totalNos,
    hostFeeUsd,
    networkFeeUsd,
    totalCostUsd,
    formattedPrice,
    isLoading
  };
}

