<template>
  <span class="current-market-price">
    <span v-if="isLoading">...</span>
    <span v-else-if="error">Error</span>
    <span v-else-if="formattedPrice !== null">{{ formattedPrice }}</span>
    <span v-else>N/A</span>
  </span>
</template>

<script setup lang="ts">
import { computed, toRef, type Ref, type PropType } from 'vue';
import { useCurrentMarketPrice } from '~/composables/market/useCurrentMarketPrice';
import type { Market } from '@nosana/sdk'; // Import Market type

// Define MarketStats interface consistent with the composable
interface MarketStats {
  price: number;
}

const props = defineProps({
  // Can be market address (string) OR pre-fetched market data (Market object)
  marketAddressOrData: {
    type: [String, Object] as PropType<string | Market | null>,
    required: true
  },
  // Optional pre-fetched stats data
  statsData: {
    type: Object as PropType<MarketStats | null>,
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

// Use toRef for props passed to the composable
const marketAddressOrDataRef = toRef(props, 'marketAddressOrData');
const statsDataRef = toRef(props, 'statsData');

// Pass the optional stats data ref to the composable
const { currentUsdPricePerHour, isLoading, error } = useCurrentMarketPrice(
  marketAddressOrDataRef,
  statsDataRef
);

const formattedPrice = computed(() => {
  if (currentUsdPricePerHour.value === null) {
    return null;
  }
  const prefix = props.showDollarSign ? '$' : '';
  return `${prefix}${currentUsdPricePerHour.value.toFixed(props.decimalPlaces)}/h`;
});

</script>

<style scoped>
.current-market-price {
  white-space: nowrap;
}
</style> 