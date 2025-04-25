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
  
  // Current timestamp for calculating ongoing durations
  const now = computed(() => Math.floor(Date.now() / 1000))
  
  // Calculate the job duration in seconds
  const duration = computed(() => {
    if (!job.timeStart) return 0
    
    const end = job.timeEnd || now.value
    // Cap duration at timeout if specified
    const maxDuration = job.timeout || 7200 // Default 2 hours (7200 seconds)
    return Math.min(end - job.timeStart, maxDuration)
  })
  
  // Calculate duration in hours for price calculation
  const durationHours = computed(() => duration.value / 3600)
  
  // Calculate the price in USD
  const priceUsd = computed(() => {
    if (!job.usdRewardPerHour) return 0
    return (job.usdRewardPerHour * durationHours.value) * 1.1
  })
  
  // Format price for display
  const formattedPrice = computed(() => {
    const dollarSign = opts.showDollarSign ? '$' : ''
    
    // For running jobs, we can show per hour rate if requested
    if (Number(job.state) === 1 && opts.showPerHour && !job.timeEnd) {
      return `${dollarSign}${((job.usdRewardPerHour || 0) * 1.1).toFixed(opts.decimalPlaces)} / hr`
    }
    
    // For completed or other jobs, show total price
    return `${dollarSign}${priceUsd.value.toFixed(opts.decimalPlaces)}`
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