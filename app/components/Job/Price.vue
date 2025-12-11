<template>
  <span class="job-price">{{ formattedPrice }}</span>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { useJobPricing, type JobData, type MarketPricingOptions } from '~/composables/useMarketPricing';

// Legacy interface for backward compatibility
export interface JobPriceOptions extends MarketPricingOptions {}

export interface JobPriceProps extends JobData {
  usdRewardPerHour?: number | null | undefined
}

const props = defineProps({
  job: {
    type: Object as PropType<JobPriceProps>,
    required: true
  },
  options: {
    type: Object as PropType<JobPriceOptions>,
    default: () => ({})
  },
  // Optional pre-fetched markets data for performance
  marketsData: {
    type: Array,
    default: null
  }
});

// Convert job data to the new format
const jobData = computed((): JobData => ({
  timeStart: props.job.timeStart,
  timeEnd: props.job.timeEnd,
  timeout: props.job.timeout,
  state: props.job.state,
  market: props.job.market,
  usdRewardPerHour: props.job.usdRewardPerHour
}));

const marketsDataRef = computed(() => props.marketsData);

const { formattedPrice } = useJobPricing(jobData, props.options, marketsDataRef);

</script>

<style scoped>
.job-price {
  white-space: nowrap;
}
</style> 