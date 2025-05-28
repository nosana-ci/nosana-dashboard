import { computed } from 'vue'
import type { ComputedRef } from 'vue'
// Import prop types from the component that defines them
import type { JobPriceProps, JobPriceOptions } from '~/components/Job/Price.vue';

export default function useJobPrice(job: JobPriceProps, options: JobPriceOptions = {}) {
  // Default options
  const defaultOptions = {
    showPerHour: true,
    decimalPlaces: 3,
    showDollarSign: true
  }
  
  const opts = { ...defaultOptions, ...options }
  
  // Helper function to format price with options
  const formatPrice = (price: number, options: typeof opts) => {
    const dollarSign = options.showDollarSign ? '$' : '';
    return `${dollarSign}${price.toFixed(options.decimalPlaces)}`;
  };
  
  // Current timestamp for calculating ongoing durations
  const now = computed(() => Math.floor(Date.now() / 1000))
  
  // Calculate the job duration in seconds
  const duration = computed(() => {
    const timeStart = job.timeStart || 0;
    const timeEnd = job.timeEnd || 0;
    const now = Math.floor(Date.now() / 1000);
    const end = timeEnd > 0 ? timeEnd : now;
    const maxDuration = job.timeout || 7200;

    const result = {
      timeStart,
      timeEnd,
      now,
      end,
      maxDuration,
      actualDuration: end - timeStart,
      isCompleted: timeEnd > 0
    };

    return result;
  })
  
  // Calculate duration in hours for price calculation
  const durationHours = computed(() => {
    const dur = duration.value;
    const hours = Math.max(0, dur.actualDuration) / 3600;
    return hours;
  })
  
  // Calculate the price in USD
  const priceUsd = computed(() => {
    const usdRewardPerHour = job.usdRewardPerHour || 0;
    const hours = durationHours.value;
    const price = usdRewardPerHour * hours;
    return price;
  })
  
  // Format price for display
  const formattedPrice = computed(() => {
    const jobState = job.state;
    const showPerHour = opts.showPerHour;
    const timeEnd = job.timeEnd || 0;
    const usdRewardPerHour = job.usdRewardPerHour || 0;

    if (showPerHour) {
      const formatted = formatPrice(usdRewardPerHour, opts);
      return `${formatted} / hr`;
    } else {
      const price = priceUsd.value;
      const formatted = formatPrice(price, opts);
      return formatted;
    }
  })
  
  // Determines if the job is currently running
  const isRunning = computed(() => {
    return Number(job.state) === 1 && !job.timeEnd
  })
  
  // Calculate the price in USD at current moment (for running jobs)
  const currentPriceUsd = computed(() => {
    if (!job.usdRewardPerHour || !job.timeStart) return 0
    const currentDuration = (now.value - job.timeStart) / 3600 // in hours
    return (job.usdRewardPerHour * Math.min(currentDuration, (job.timeout || 7200) / 3600)) * 1.1
  })
  
  return {
    duration,
    durationHours,
    priceUsd,
    formattedPrice,
    isRunning,
    currentPriceUsd
  }
} 