<template>
  <div>
    <div v-if="!filteredMarkets.length" class="has-text-centered py-5">
      <p class="has-text-grey">No GPUs available</p>
    </div>
    <div v-else class="gpu-grid">
      <nuxt-link v-for="market in filteredMarkets" :key="market.address?.toString() || market.id"
        :to="`/markets/${market.address?.toString() || ''}`" custom>
        <template #default="{ navigate }">
          <div
            class="gpu-card"
            :class="{
              'is-selected': selectedMarket && selectedMarket.address?.toString() === market.address?.toString(),
              'is-incompatible': !isMarketCompatible(market)
            }"
            :data-tooltip="!isMarketCompatible(market) ? 'This GPU does not meet the required VRAM specifications for your job.' : null"
            @click="isMarketCompatible(market) && (select ? (selectedMarket = market) : navigate())"
          >
            <div class="gpu-card-header">
              <NvidiaIcon v-if="showLogo" alt="NVIDIA" class="gpu-logo" />
              <h3 class="gpu-name">{{ getMarketName(market) }}</h3>
            </div>
            <div class="gpu-card-body">
              <div class="gpu-info-row">
                <span class="gpu-label">Price</span>
                <span class="gpu-value">
                  <span v-if="loadingStats">...</span>
                  <CurrentMarketPrice
                    v-else
                    :marketAddressOrData="market"
                    :marketsData="testgridMarkets"
                    :decimalPlaces="3" />
                </span>
              </div>
              <div class="gpu-info-row">
                <span class="gpu-label">Available</span>
                <span class="gpu-value">
                  <span v-if="loadingRunningJobs">...</span>
                  <span v-else-if="market.queueType === 1">
                    {{ market.queue.length }}
                  </span>
                  <span v-else>
                    0
                  </span>
                </span>
              </div>
            </div>
          </div>
        </template>
      </nuxt-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Market } from '@nosana/kit';
import { useAPI } from "~/composables/useAPI";
import NvidiaIcon from '@/assets/img/icons/nvidia.svg?component';
import CurrentMarketPrice from "~/components/Market/CurrentPrice.vue";

const { data: runningJobs, pending: loadingRunningJobs } = await useAPI('/api/jobs/running');
const { data: stats, pending: loadingStats } = await useAPI('/api/stats');
const tab: Ref<string> = ref('premium');
const config = useRuntimeConfig();

// Define types for market info
interface MarketInfo {
  address: string;
  name?: string;
  type?: string;
  client?: boolean;
  lowest_vram?: number;
  usd_reward_per_hour?: number;
}

/**
 * Props now accept a jobDefinition object (or similar structure)
 * so we can read the required_vram from the jobDefinition's ops.
 */
const props = defineProps({
  markets: {
    type: Array as PropType<Array<Market>>,
    default: () => [],
  },
  testgridMarkets: {
    type: Array as PropType<Array<MarketInfo>>,
    default: () => [],
  },
  typeFilter: {
    type: Array as PropType<Array<string>>,
    default: () => [],
  },
  select: {
    type: Boolean,
    default: false,
  },
  jobDefinition: {
    type: Object,
    default: null,
  },
  skipAutoSelection: {
    type: Boolean,
    default: false,
  },
  initialMarket: {
    type: Object as PropType<Market | null>,
    default: null,
  },
  showLogo: {
    type: Boolean,
    default: false,
  },
});

// Component setup
const selectedMarket = ref<Market | null>(props.initialMarket || null);
const emit = defineEmits(['selectedMarket']);
const didInitialSetup = ref(props.initialMarket !== null);


// Watch for market selection changes and emit
watch(() => selectedMarket.value, (newValue: Market | null, oldValue: Market | null) => {
  emit('selectedMarket', newValue);
});

// Watch for external market changes (from parent component)
watch(() => props.initialMarket, (newInitialMarket, oldInitialMarket) => {
  if (newInitialMarket && newInitialMarket !== selectedMarket.value) {
    selectedMarket.value = newInitialMarket;
  } else if (!newInitialMarket) {
    selectedMarket.value = null;
  }
}, { immediate: true });

// Compute how much VRAM is required for this job definition
const requiredVRAM = computed(() => props.jobDefinition?.meta?.system_requirements?.required_vram ?? 0);

// Helper function to find market info by address
const findMarketInfo = (market: Market): MarketInfo | undefined => {
  return props.testgridMarkets.find(tgm => tgm.address === market.address?.toString());
};

// Helper to get market name
const getMarketName = (market: Market): string => {
  const marketInfo = findMarketInfo(market);
  return marketInfo?.name || market.address?.toString() || 'Unknown Market';
};


// Helper to get running job count
const getRunningJobCount = (market: Market): number => {
  if (!runningJobs.value) return 0;
  const address = market.address?.toString();
  return runningJobs.value[address]?.running || 0;
};

/**
 * Filters the list of markets by:
 * - Excluding client markets
 * - The current tab (premium, community, others).
 * - VRAM requirements, if set.
 */
const filteredMarkets = computed(() => {
  if (!props.markets?.length) return [];
  
  return props.markets.filter((market) => {
    const marketInfo = findMarketInfo(market);
    
    // If no market info exists, show on devnet but filter by others on mainnet
    if (!marketInfo) {
      // On devnet, show all markets regardless of missing testgrid data
      if (config.public.network === 'devnet') {
        return true;
      }
      // On mainnet, use the original logic
      return tab.value === 'others';
    }

    // Exclude client markets
    if (marketInfo.client === true) {
      return false;
    }
    
    // Filter based on the selected type (PREMIUM or COMMUNITY)
    if (props.typeFilter.length === 1) {
      if (props.typeFilter.includes('PREMIUM')) {
        return marketInfo.type === 'PREMIUM';
      }
      if (props.typeFilter.includes('COMMUNITY')) {
        return marketInfo.type === 'COMMUNITY';
      }
    }

    return true;
  });
});

// Helper to get hourly price for sorting (uses base price without network fee for fair sorting)
const getMarketHourlyPrice = (market: Market) => {
  // Get base USD price from market data (before network fee)
  const marketAddress = market.address?.toString();
  const marketInfo = props.testgridMarkets?.find(m => m.address === marketAddress);
  
  if (marketInfo?.usd_reward_per_hour) {
    return marketInfo.usd_reward_per_hour; // Base price for fair sorting
  }
  
  return Number.MAX_VALUE;  
};

// Helper to check if market has available GPUs
const hasAvailableGPUs = (market: Market) => {
  if (market.queueType !== 1) return false;
  return market.queue.length > 0;
};

/**
 * Check if a market is compatible with the job's VRAM requirements
 * @param market The market to check compatibility for
 * @returns Boolean indicating whether the market meets VRAM requirements
 */
const isMarketCompatible = (market: Market) => {
  const marketInfo = findMarketInfo(market);
  
  // If we don't have market info, assume it's compatible (don't auto-mark as incompatible)
  if (!marketInfo || !marketInfo.lowest_vram) return true;
  
  return marketInfo.lowest_vram >= (requiredVRAM.value ?? 0);
};

/**
 * Finds compatible markets of a specific type (Premium or Community)
 * @param gpuType The type of GPU to filter for (PREMIUM or COMMUNITY)
 * @returns Array of compatible markets of the specified type
 */
const findCompatibleMarkets = (gpuType: string) => {
  if (!props.markets?.length) return [];
  
  return props.markets.filter((market) => {
    const marketInfo = findMarketInfo(market);
    if (!marketInfo) return false;
    
    return (
      // Must match the requested type (PREMIUM or COMMUNITY)
      marketInfo.type === gpuType &&
      // Must not be a client market
      marketInfo.client !== true &&
      // Must meet VRAM requirements for the job
      isMarketCompatible(market) &&
      // Must have available GPUs
      hasAvailableGPUs(market)
    );
  });
};

/**
 * Main market selection handler - manages auto-selection
 * This is the central function for all selection logic
 */
const selectBestMarket = async () => {
  // Only proceed if we have the markets data
  if (!props.markets?.length) return;
  
  // Don't attempt auto-selection if the job definition is missing
  if (!props.jobDefinition) return;
  
  // Try Premium markets first
  let compatibleMarkets = findCompatibleMarkets('PREMIUM');
  
  // If no Premium markets are available, try Community markets
  if (compatibleMarkets.length === 0) {
    compatibleMarkets = findCompatibleMarkets('COMMUNITY');
  }
  
  // If we have compatible markets, select the cheapest one
  if (compatibleMarkets.length > 0) {
    const cheapestMarket = compatibleMarkets.sort(
      (a, b) => getMarketHourlyPrice(a) - getMarketHourlyPrice(b)
    )[0];
    
    // Find the exact reference in the markets array for proper UI highlighting
    const exactRef = props.markets.find(m => m.address?.toString() === cheapestMarket.address?.toString());
    
    // Wait for nextTick to ensure Vue updates the DOM after reactivity changes
    await nextTick();
    
    // Update the selection
    selectedMarket.value = exactRef || cheapestMarket;
  } else {
    // If no viable market is found, ensure selection is cleared
    selectedMarket.value = null;
  }
};

// Main watcher for auto-selection - DISABLED to preserve user selections
// watch([
//   () => props.markets,
//   () => props.jobDefinition,
//   () => props.testgridMarkets,
//   () => loadingRunningJobs.value,
//   () => stats.value,
//   () => props.isFromRepost,
//   () => props.skipAutoSelection
// ], async () => {
//   // Skip auto-selection if in repost mode or explicitly disabled
//   if (props.isFromRepost || 
//       props.skipAutoSelection || 
//       (props.initialMarket && !didInitialSetup.value)) {
//     
//     didInitialSetup.value = true;
//     return;
//   }
//   
//   // Auto-select market when appropriate
//   await selectBestMarket();
// }, { immediate: true });
</script>
<style lang="scss" scoped>
@use "sass:color";
.columns {
  position: static;
}

.column {
  position: static;
}

.tabs {
  position: static;
  overflow: visible;
  margin-bottom: 0;

  ul {
    position: static;
    border-bottom: 3px solid $grey-lighter;
    margin-bottom: 0;
    width: 100%;
  }

  li {
    a {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin-bottom: -3px;
      border-bottom-width: 3px;
      border-bottom-color: transparent;
    }

    &.is-active a {
      border-bottom-color: $primary;
    }
  }
}

.has-tooltip-arrow {
  width: 100%;
  display: block;
  
  &[data-tooltip] {
    &::before,
    &::after {
      z-index: 99999 !important;
    }
  }
}

// Add responsive tooltip styles for mobile
@include touch {
  .tabs {
    li {
      position: relative;

      a {
        flex-wrap: wrap;
      }
    }
  }

  .tooltip-container {
    position: static;
    
    .has-tooltip-arrow {
      &[data-tooltip] {
        position: static;
        
        &::before,
        &::after {
          position: absolute !important;
          opacity: 1 !important;
          transform: none !important;
          left: -16px !important;
          right: -16px !important;
          margin: 0 !important;
          width: calc(100% + 32px) !important;
          white-space: normal !important;
          top: 100% !important;
          padding: 0.75rem !important;
          z-index: 99999 !important;
          box-sizing: border-box !important;
          max-width: calc(100vw - 32px) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
        }

        &::before {
          background: $white !important;
          border: 1px solid $grey-lighter !important;
          border-radius: 4px !important;
          color: $grey-dark !important;
          font-size: 0.75rem !important;
          display: block !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          content: attr(data-tooltip) !important;
          margin-top: 4px !important;
        }

        &::after {
          display: none !important;
        }
      }
    }
  }
}

.info-icon {
  width: 14px;
  height: 14px;
  vertical-align: -2px;
  margin-left: 0.25rem;
  opacity: 0.7;
}

td {
  vertical-align: middle;
}

.progress {
  max-width: 100px;

  &::-webkit-progress-bar {
    background-color: color.adjust($secondary, $lightness: 43%);
  }
}

.no-underline {
  text-decoration: none !important;
  border-bottom: none !important;
}

.info-container {
  line-height: 1;
  margin: 0;
  padding: 0;
  height: 20px;
}

.table-container {
  margin-top: 0;
  position: relative;
}

.is-incompatible {
  opacity: 0.5;
  cursor: not-allowed !important;
  background-color: rgba(0, 0, 0, 0.05);
}

.dark-mode .is-incompatible {
  background-color: rgba(255, 255, 255, 0.05);
}

.warning-icon {
  filter: invert(73%) sepia(45%) saturate(5600%) hue-rotate(359deg) brightness(101%) contrast(106%);
}

.gpu-logo {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  vertical-align: middle;
}

.table {
  [data-tooltip] {
    position: relative;
    display: inline-block;
    width: 100%;
    text-decoration: none;
    border-bottom: none;
  }

  [data-tooltip]::before,
  [data-tooltip]::after {
    position: absolute;
    z-index: 100;
  }
}

/* Add styles to remove dotted line from all tooltips in the component */
[data-tooltip] {
  text-decoration: none !important;
  border-bottom: none !important;
  cursor: pointer;
}

.dark-mode .is-incompatible {
  background-color: rgba(255, 255, 255, 0.05);
}

.dark-mode .gpu-logo {
  filter: none !important;
}

.warning-icon {
  filter: invert(73%) sepia(45%) saturate(5600%) hue-rotate(359deg) brightness(101%) contrast(106%);
}

/* Grid layout styles */
.gpu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.gpu-card {
  background: white;
  border: 2px solid #e8eaed;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gpu-card:hover {
  border-color: #10E80C;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.gpu-card.is-selected {
  border-color: #10E80C;
  background: #f0fff0;
  box-shadow: 0 2px 8px rgba(16, 232, 12, 0.2);
}

.gpu-card.is-incompatible {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #e0e0e0;
}

.gpu-card.is-incompatible:hover {
  border-color: #e0e0e0;
  box-shadow: none;
}

.gpu-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e8eaed;
}

.gpu-logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.gpu-name {
  font-size: 1rem;
  font-weight: 500;
  color: #202124;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gpu-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gpu-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.gpu-label {
  color: #5f6368;
  font-weight: 500;
}

.gpu-value {
  color: #202124;
  text-align: right;
}

/* Dark mode styles */
.dark-mode .gpu-card {
  background: #2c2c2c;
  border-color: #3a3a3a;
}

.dark-mode .gpu-card:hover {
  border-color: #10E80C;
}

.dark-mode .gpu-card.is-selected {
  background: #0d2e0c;
  border-color: #10E80C;
}

.dark-mode .gpu-card-header {
  border-bottom-color: #3a3a3a;
}

.dark-mode .gpu-name {
  color: #e8eaed;
}

.dark-mode .gpu-label {
  color: #9e9e9e;
}

.dark-mode .gpu-value {
  color: #e8eaed;
}
</style>
