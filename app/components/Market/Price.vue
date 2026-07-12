<template>
  <span class="market-price">
    <span v-if="isLoading">...</span>
    <span v-else-if="formattedPrice !== 'N/A'">{{ formattedPrice }}</span>
    <span v-else>N/A</span>
  </span>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { useJobPricing, useMarketUsdPrice, type JobData, type MarketPricingOptions } from '~/composables/useMarketPricing';
import type { Market } from '@nosana/kit';

const props = defineProps({
  // For job-based pricing (shows total cost or hourly rate based on job data)
  job: {
    type: Object as PropType<JobData>,
    default: null
  },
  
  // For market-only pricing (shows hourly rate for a market)
  marketAddress: {
    type: [String, Object] as PropType<string | Market | null>,
    default: null
  },
  
  // Duration in hours (for estimated cost calculation)
  durationHours: {
    type: Number,
    default: null
  },
  
  // Display options
  options: {
    type: Object as PropType<MarketPricingOptions>,
    default: () => ({})
  },
  
  // Optional pre-fetched markets data for performance
  marketsData: {
    type: Array,
    default: null
  }
});

// If job data is provided, use job pricing
const jobPricing = computed(() => {
  if (!props.job) return null;
  
  const jobDataRef = computed(() => props.job);
  const marketsDataRef = computed(() => props.marketsData);
  
  return useJobPricing(jobDataRef, props.options, marketsDataRef);
});

// If only market address is provided, use market pricing
const marketPricing = computed(() => {
  if (props.job || !props.marketAddress) return null;
  
  const marketAddressRef = computed(() => props.marketAddress);
  const marketsDataRef = computed(() => props.marketsData);
  
  return useMarketUsdPrice(marketAddressRef, marketsDataRef);
});

// Calculate estimated cost if duration is provided
const estimatedCost = computed(() => {
  if (!props.durationHours || props.job) return null;
  
  const rate = marketPricing.value?.usdPricePerHour.value;
  if (!rate) return null;
  
  return rate * props.durationHours;
});

const formattedPrice = computed(() => {
  const options = {
    showPerHour: false,
    decimalPlaces: 3,
    showDollarSign: true,
    ...props.options
  };
  
  // Job-based pricing
  if (jobPricing.value) {
    return jobPricing.value.formattedPrice.value;
  }
  
  // Market-based pricing with estimated cost
  if (estimatedCost.value !== null) {
    const dollarSign = options.showDollarSign ? '$' : '';
    return `${dollarSign}${estimatedCost.value.toFixed(options.decimalPlaces)}`;
  }
  
  // Market-based hourly rate
  if (marketPricing.value?.usdPricePerHour.value) {
    const rate = marketPricing.value.usdPricePerHour.value;
    const dollarSign = options.showDollarSign ? '$' : '';
    const suffix = options.showPerHour ? '/h' : '';
    return `${dollarSign}${rate.toFixed(options.decimalPlaces)}${suffix}`;
  }
  
  return 'N/A';
});

const isLoading = computed(() => {
  return jobPricing.value?.isLoading.value || 
         marketPricing.value?.isLoading.value || 
         false;
});
</script>

<style scoped>
.market-price {
  white-space: nowrap;
}
</style>