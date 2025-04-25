<template>
  <span class="job-price">{{ formattedPrice }}</span>
</template>

<script setup lang="ts">
import useJobPrice from '~/composables/jobs/useJobPrice';
import type { PropType } from 'vue';

// Define prop types directly in the component
export interface JobPriceOptions {
  showPerHour?: boolean
  decimalPlaces?: number
  showDollarSign?: boolean
}

export interface JobPriceProps {
  usdRewardPerHour: number | null | undefined
  timeStart?: number
  timeEnd?: number
  timeout?: number
  state?: number | string
}

const props = defineProps({
  job: {
    type: Object as PropType<JobPriceProps>,
    required: true
  },
  options: {
    type: Object as PropType<JobPriceOptions>,
    default: () => ({})
  }
});

const { formattedPrice } = useJobPrice(props.job, props.options);

</script>

<style scoped>
.job-price {
  white-space: nowrap;
}
</style> 