<template>
  <span class="current-market-price">
    <span v-if="isLoading">...</span>
    <span v-else-if="formattedPrice !== 'N/A'">{{ formattedPrice }}</span>
    <span v-else>N/A</span>
  </span>
</template>

<script setup lang="ts">
import { computed, toRef, type PropType } from 'vue';
import { useMarketUsdPrice } from '~/composables/useMarketPricing';
import type { Market } from '@nosana/kit';

const props = defineProps({
  // Can be market address (string) OR pre-fetched market data (Market object)
  marketAddressOrData: {
    type: [String, Object] as PropType<string | Market | null>,
    required: true
  },
  // Optional pre-fetched markets data for performance
  marketsData: {
    type: Array,
    default: null
  },
  // Optional USD price override (bypasses calculation)
  usdPriceOverride: {
    type: Number,
    default: null
  },
  decimalPlaces: {
    type: Number,
    default: 3
  },
  showDollarSign: {
    type: Boolean,
    default: true
  }
});

// Use the new centralized pricing system
const marketAddressRef = toRef(props, 'marketAddressOrData');
const marketsDataRef = computed(() => props.marketsData);

const { usdPricePerHour, isLoading } = useMarketUsdPrice(marketAddressRef, marketsDataRef);

const formattedPrice = computed(() => {
  // Use USD override if provided
  const price = props.usdPriceOverride !== null ? props.usdPriceOverride : usdPricePerHour.value;
  
  if (price === null) {
    return 'N/A';
  }
  const prefix = props.showDollarSign ? '$' : '';
  return `${prefix}${price.toFixed(props.decimalPlaces)}/h`;
});

</script>

<style scoped>
.current-market-price {
  white-space: nowrap;
}
</style> 