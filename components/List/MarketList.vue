<template>
  <div class="columns">
    <div class="column">
      <div class="tabs">
        <ul>
          <li :class="{ 'is-active': tab === 'premium' }">
            <a @click="tab = 'premium'" class="is-justify-content-flex-start">
              PREMIUM
              <div class="tooltip-container">
                <span class="has-tooltip-arrow has-text-grey no-underline" data-tooltip="Premium GPUs offer top-tier hardware from validated providers for mission-critical and time-sensitive workloads.">
                  <img src="~/assets/img/icons/info.svg" class="info-icon" />
                </span>
              </div>
            </a>
          </li>
          <li :class="{ 'is-active': tab === 'community' }">
            <a @click="tab = 'community'" class="is-justify-content-flex-start">
              COMMUNITY
              <div class="tooltip-container">
                <span class="has-tooltip-arrow has-text-grey no-underline" data-tooltip="Community GPUs provide cost-effective solutions from unvalidated hosts, ideal for testing and non-critical workloads.">
                  <img src="~/assets/img/icons/info.svg" class="info-icon" />
                </span>
              </div>
            </a>
          </li>
          <li :class="{ 'is-active': tab === 'others' }">
            <a @click="tab = 'others'" class="is-justify-content-flex-start">
              OTHERS
              <div class="tooltip-container">
                <span class="has-tooltip-arrow has-text-grey no-underline" data-tooltip="View other GPUs on the Nosana Network that are not categorized as Premium or Community.">
                  <img src="~/assets/img/icons/info.svg" class="info-icon" />
                </span>
              </div>
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div class="column is-narrow">
    </div>
  </div>
  <div class="table-container">
    <table class="table is-fullwidth is-striped is-hoverable" :class="{ 'is-narrow': select }">
      <thead>
        <tr>
          <th>GPU</th>
          <th>Price</th>
          <th>Availability</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!filteredMarkets">
          <td colspan="3">Loading GPUs..</td>
        </tr>
        <tr v-if="filteredMarkets && !filteredMarkets.length">
          <td colspan="3">No GPUs available</td>
        </tr>
        <nuxt-link v-for="market in paginatedMarkets" v-else :key="market.address.toString()"
          :to="`/markets/${market.address.toString()}`" custom>
          <template #default="{ navigate, href }">
            <tr
              class="clickable-row"
              :class="{
                'is-selected': selectedMarket === market,
                'is-incompatible': !isMarketCompatible(market)
              }"
              @click="handleMarketClick($event, market, navigate)">
              <td class="py-2">
                <a :href="href" class="clickable-row-link" @click="handleLinkClick($event, navigate)">
                  <div class="clickable-row-cell-content has-tooltip-arrow is-flex is-align-items-center" v-if="!isMarketCompatible(market)" data-tooltip="This GPU does not meet the required VRAM specifications for your job.">
                    <img src="@/assets/img/icons/nvidia.svg" alt="Nvidia" class="mr-2" style="width: 20px; height: 20px;">
                    <span v-if="testgridMarkets.find((tgm: any) => tgm.address === market.address.toString())">
                      {{
                        testgridMarkets.find(
                          (tgm: any) => tgm.address === market.address.toString()
                        ).name || market.address.toString()
                      }}
                    </span>
                    <span v-else class="is-family-monospace address">
                      {{ market.address.toString() }}
                    </span>
                  </div>
                  <div v-else class="clickable-row-cell-content is-flex is-align-items-center">
                    <img src="@/assets/img/icons/nvidia.svg" alt="Nvidia" class="mr-2" style="width: 20px; height: 20px;">
                    <span v-if="testgridMarkets.find((tgm: any) => tgm.address === market.address.toString())">
                      {{
                        testgridMarkets.find(
                          (tgm: any) => tgm.address === market.address.toString()
                        ).name || market.address.toString()
                      }}
                    </span>
                    <span v-else class="is-family-monospace address">
                      {{ market.address.toString() }}
                    </span>
                  </div>
                </a>
              </td>
              <td class="py-3">
                <span class="clickable-row-cell-content">
                  <span v-if="loadingStats">...</span>
                  <span v-else>
                    <CurrentMarketPrice
                      :marketAddressOrData="market"
                      :marketsData="testgridMarkets"
                      :decimalPlaces="3" />
                  </span>
                </span>
              </td>
              <td class="py-3">
                <span class="clickable-row-cell-content">
                  <span v-if="market.queueType === 1">
                    <span v-if="loadingRunningJobs">...</span>
                    <template v-else>
                      <span>
                        {{ market.queue.length }} /
                        <span v-if="runningJobs">
                          <span>
                            {{ market.queue.length + (runningJobs[market.address.toString()] ?
                              runningJobs[market.address.toString()].running : 0) }}
                          </span>
                        </span>
                        <span v-else>
                          ?
                        </span>
                      </span>
                      <span>
                        hosts</span>
                      <span><progress class="is-pulled-right progress is-secondary" :value="market.queue.length" :max="market.queue.length + (runningJobs[market.address.toString()] ?
                        runningJobs[market.address.toString()].running : 0)"></progress></span>
                    </template>
                  </span>
                  <span v-else>
                    <span v-if="loadingRunningJobs">0 / ...</span>
                    <span v-else>
                      0 /
                      <span v-if="runningJobs">
                        {{ (runningJobs[market.address.toString()] ? runningJobs[market.address.toString()].running : 0) }}
                      </span>
                      <span v-else>
                        ?
                      </span>
                      <span>
                        hosts</span>
                      <span><progress class="is-pulled-right progress is-secondary" :value="0" :max="(runningJobs[market.address.toString()] ?
                        runningJobs[market.address.toString()].running : 0)"></progress></span>
                    </span>
                    <br>
                    <small v-if="market.queueType === 0">{{ market.queue.length }} deployments queued</small>
                  </span>
                </span>
              </td>
            </tr>
          </template>
        </nuxt-link>
      </tbody>
    </table>
  </div>
  <pagination v-if="filteredMarkets && filteredMarkets.length > perPage" v-model="page" class="pagination is-centered"
    :total-page="Math.ceil(filteredMarkets.length / perPage)" :max-page="6">
  </pagination>
</template>

<script setup lang="ts">
import { type Market } from '@nosana/sdk';
import type { PropType } from 'vue';
import CurrentMarketPrice from "~/components/Market/CurrentPrice.vue";

//
// Hardcoded VRAM capacities for certain GPU types.
// Adjust or add more as needed.
//
const VRAM_CAPACITIES: Record<string, number> = {
  'nvidia-3060': 12,
  'nvidia-3070': 8,
  'nvidia-3080': 10,
  'nvidia-3090': 24,
  'nvidia-4060': 8,
  'nvidia-4070': 12,
  'nvidia-4080': 16,
  'nvidia-4090': 24,
  'nvidia-5070': 12,
  'nvidia-5080': 16,
  'nvidia-5090': 32,
  'nvidia-a4000': 16,
  'nvidia-a5000': 24,
  'nvidia-a6000': 48,
  'nvidia-a40': 48,
  'nvidia-a100-40gb': 40,
  'nvidia-a100-80gb': 80,
  'nvidia-h100': 80,
  'nvidia-8x-a5000': 192,
};

const { data: testgridMarkets, pending: loadingTestgridMarkets } = await useAPI('/api/markets', { default: () => [] });
const { data: runningJobs, pending: loadingRunningJobs } = await useAPI('/api/jobs/running');
const { data: stats, pending: loadingStats } = await useAPI('/api/stats');
const tab: Ref<string> = ref('premium');

/**
 * Props now accept a jobDefinition object (or similar structure)
 * so we can read the required_vram from the jobDefinition's ops.
 */
const props = defineProps({
  markets: {
    type: Array as PropType<Array<Market>>,
    default: undefined,
  },
  select: {
    type: Boolean,
    default: false
  },
  initialMarket: {
    type: Object as PropType<Market>,
    default: null
  },
  jobDefinition: {
    type: Object as PropType<any>,
    default: null
  }
});
const emit = defineEmits(['selectedMarket'])
const selectedMarket: Ref<Market | null> = ref(props.initialMarket);

//
// Compute how much VRAM is required for this job definition.
// Now checks the meta.system_requirements.required_vram field
//
const requiredVRAM = computed(() => {
  if (!props.jobDefinition?.meta?.system_requirements?.required_vram) return 0;
  return props.jobDefinition.meta.system_requirements.required_vram;
});

watch(selectedMarket, (newValue: Market | null) => {
  emit('selectedMarket', newValue)
});
const page: Ref<number> = ref(1);
const perPage: Ref<number> = ref(25);

/**
 * Filters the list of markets by:
 * - The current tab (premium, community, others).
 * - VRAM requirements, if set.
 */
const filteredMarkets = computed(() => {
  if (!props.markets || !props.markets.length) return props.markets;
  
  return props.markets.filter((market) => {
    // Get market info regardless of type
    const marketInfo = testgridMarkets.value.find((tgm: any) => tgm.address === market.address.toString());
    
    // If no market info exists, it goes to others
    if (!marketInfo) {
      return tab.value === 'others';
    }

    // Check if it's an nvidia GPU
    const isNvidiaGpu = marketInfo.slug?.toLowerCase().startsWith('nvidia');
    
    // For premium tab - only show nvidia GPUs marked as PREMIUM
    if (tab.value === 'premium') {
      return isNvidiaGpu && marketInfo.type === 'PREMIUM';
    }
    
    // For community tab - only show nvidia GPUs marked as COMMUNITY
    if (tab.value === 'community') {
      return isNvidiaGpu && marketInfo.type === 'COMMUNITY';
    }
    
    // For others tab - show all non-nvidia GPUs and any that don't fit in other categories
    if (tab.value === 'others') {
      return !isNvidiaGpu || (marketInfo.type !== 'PREMIUM' && marketInfo.type !== 'COMMUNITY');
    }

    return true;
  });
});

// New computed property to determine if a market is compatible
const isMarketCompatible = (market: Market) => {
  if (!requiredVRAM.value || requiredVRAM.value <= 0) return true;

  const marketInfo = testgridMarkets.value.find((tgm: any) => tgm.address === market.address.toString());
  if (!marketInfo?.slug) return true;
  
  // Extract the GPU model from the slug, handling both premium and community formats
  const gpuModel = marketInfo.slug.toLowerCase().replace('-community', '');
  const vramCapacity = VRAM_CAPACITIES[gpuModel];
  if (!vramCapacity) return true;
  
  return vramCapacity >= requiredVRAM.value;
};

const paginatedMarkets = computed(() => {
  if (!filteredMarkets.value || !filteredMarkets.value.length) return props.markets;
  return filteredMarkets.value.slice((page.value - 1) * perPage.value, page.value * perPage.value);
});

// Helper to get hourly price for sorting (uses base price without network fee for fair sorting)
const getMarketHourlyPrice = (market: Market) => {
  // Get base USD price from market data (before network fee)
  const marketAddress = market.address.toString();
  const marketInfo = testgridMarkets.value?.find(m => m.address === marketAddress);
  
  if (marketInfo?.usd_reward_per_hour) {
    return marketInfo.usd_reward_per_hour; // Base price for fair sorting
  }
  
  return Number.MAX_VALUE;
};

// Helper to check if market has available GPUs
const hasAvailableGPUs = (market: Market) => {
  if (market.queueType !== 1) return false; // Only relevant for FIFO queues
  if (loadingRunningJobs.value || !runningJobs.value) return false; // Need running jobs data
  
  const running = runningJobs.value[market.address.toString()]?.running || 0;
  // Market has available hosts if there are hosts in the queue OR running jobs
  return market.queue.length > 0 || running > 0;
};

// Find the best market automatically when markets or job definition changes
watch([
  () => props.markets,
  () => props.jobDefinition,
  () => runningJobs.value,
  () => stats.value,
  () => testgridMarkets.value,
  () => loadingTestgridMarkets.value,
  () => loadingRunningJobs.value
], ([
  markets,
  jobDef,
  running,
  statsData,
  testgrid,
  isLoadingTestgrid,
  isLoadingRunning
]) => {
  // Only proceed if we have all required data
  if (!markets || !jobDef || isLoadingTestgrid) return;

  // Filter for premium NVIDIA markets that are compatible and have GPUs available
  const compatibleMarkets = markets.filter(market => {
    const marketInfo = testgrid?.find(
      (tgm: any) => tgm.address === market.address.toString()
    );
    const isNvidiaGpu = marketInfo?.slug?.toLowerCase().startsWith('nvidia');
    const isPremium = marketInfo?.type === 'PREMIUM';
    return isPremium && isNvidiaGpu && isMarketCompatible(market) && hasAvailableGPUs(market);
  });

  // Sort by price and select the cheapest
  const cheapestMarket = compatibleMarkets.sort(
    (a, b) => getMarketHourlyPrice(a) - getMarketHourlyPrice(b)
  )[0];

  if (cheapestMarket && !selectedMarket.value) {
    selectedMarket.value = cheapestMarket;
    emit('selectedMarket', cheapestMarket);
  }
}, { immediate: true });

// Reset selection when job definition changes
watch(() => props.jobDefinition, () => {
  selectedMarket.value = null;
}, { immediate: true });

// Handle market row clicks with Ctrl+click support
function handleMarketClick(event: MouseEvent, market: Market, navigate: Function) {
  if (!isMarketCompatible(market)) return;
  
  if (props.select) {
    selectedMarket.value = market;
    return;
  }
  
  // Handle Ctrl+click - open in new tab without navigating current page
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    window.open(`/markets/${market.address.toString()}`, '_blank');
  } else {
    // Regular click - navigate in current page
    navigate();
  }
}

// Handle link clicks with Ctrl+click support
function handleLinkClick(event: MouseEvent, navigate: Function) {
  // Handle Ctrl+click - let browser handle opening in new tab
  if (event.ctrlKey || event.metaKey) {
    // Don't prevent default - let browser handle the Ctrl+click on the link
    return;
  } else {
    // Regular click - prevent default and use Vue navigation
    event.preventDefault();
    navigate();
  }
}
</script>
<style lang="scss" scoped>
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
    background-color: lighten($secondary, 43%);
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
}

.is-incompatible {
  opacity: 0.5;
  cursor: not-allowed !important;
  
  &:hover {
    background-color: inherit !important;
  }

  td {
    position: relative;
  }
}

.warning-icon {
  filter: invert(73%) sepia(45%) saturate(5600%) hue-rotate(359deg) brightness(101%) contrast(106%);
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
</style> 