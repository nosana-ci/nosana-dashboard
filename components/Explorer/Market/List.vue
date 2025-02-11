<template>
  <div class="columns">
    <div class="column">
      <div class="tabs">
        <ul>
          <li :class="{ 'is-active': tab === 'premium' }">
            <a @click="tab = 'premium'" class="is-justify-content-flex-start">
              PREMIUM
              <div class="tooltip-container">
                <span class="has-tooltip-arrow has-text-grey no-underline" data-tooltip="Premium Market offers top-tier GPUs from validated providers for mission-critical and time-sensitive workloads.">
                  <img src="~/assets/img/icons/info.svg" class="info-icon" />
                </span>
              </div>
            </a>
          </li>
          <li :class="{ 'is-active': tab === 'community' }">
            <a @click="tab = 'community'" class="is-justify-content-flex-start">
              COMMUNITY
              <div class="tooltip-container">
                <span class="has-tooltip-arrow has-text-grey no-underline" data-tooltip="Community Market provides cost-effective GPU solutions from unvalidated hosts, ideal for testing and non-critical workloads.">
                  <img src="~/assets/img/icons/info.svg" class="info-icon" />
                </span>
              </div>
            </a>
          </li>
          <li :class="{ 'is-active': tab === 'all' }">
            <a @click="tab = 'all'" class="is-justify-content-flex-start">
              ALL
              <div class="tooltip-container">
                <span class="has-tooltip-arrow has-text-grey no-underline" data-tooltip="View all markets on the Nosana Network, including community-created and private markets.">
                  <img src="~/assets/img/icons/info.svg" class="info-icon" />
                </span>
              </div>
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div class="column is-narrow">
      <div v-if="filteredMarkets && filteredMarkets.length" class="has-text-right">
        <span v-if="filteredMarkets.length > perPage">{{ (page - 1) * perPage + 1 }} -
          {{ Math.min(page * perPage, filteredMarkets.length) }} of </span>
        <span>{{ filteredMarkets.length }} markets</span>
      </div>
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
          <template #default="{ navigate }">
            <tr
              class="is-clickable"
              :class="{
                'is-selected': selectedMarket === market,
                'is-incompatible': !isMarketCompatible(market)
              }"
              @click="isMarketCompatible(market) && (select ? (selectedMarket = market) : navigate())">
              <td class="py-2">
                <div class="has-tooltip-arrow" v-if="!isMarketCompatible(market)" data-tooltip="This GPU does not meet the required VRAM specifications for your job.">
                  <span v-if="testgridMarkets.find((tgm: any) => tgm.address === market.address.toString())">
                    {{
                      testgridMarkets.find(
                        (tgm: any) => tgm.address === market.address.toString()
                      ).slug?.toUpperCase() || market.address.toString()
                    }}
                  </span>
                  <span v-else class="is-family-monospace address">
                    {{ market.address.toString() }}
                  </span>
                </div>
                <div v-else>
                  <span v-if="testgridMarkets.find((tgm: any) => tgm.address === market.address.toString())">
                    {{
                      testgridMarkets.find(
                        (tgm: any) => tgm.address === market.address.toString()
                      ).slug?.toUpperCase() || market.address.toString()
                    }}
                  </span>
                  <span v-else class="is-family-monospace address">
                    {{ market.address.toString() }}
                  </span>
                </div>
              </td>
              <td class="py-3">
                <span v-if="loadingStats">...</span>
                <span v-else-if="stats && stats[0] && stats[0].price">
                  ${{ ((stats[0].price * (parseInt(market.jobPrice) / 1e6)) * 3600).toFixed(2) }} / h
                </span>
                <span v-else>{{ parseInt(market.jobPrice) / 1e6 }} NOS/s</span>
              </td>
              <td class="py-3">
                <span v-if="market.queueType === 1">
                  <span v-if="loadingRunningJobs">...</span>
                  <template v-else>
                    <span>
                      {{ market.queue.length }} /
                      <span v-if="runningJobs">
                        <span>
                          {{ market.queue.length + (runningJobs[market.address] ?
                            runningJobs[market.address].running : 0) }}
                        </span>
                      </span>
                      <span v-else>
                        ?
                      </span>
                    </span>
                    <span>
                      hosts</span>
                    <span><progress class="is-pulled-right progress is-secondary" :value="market.queue.length" :max="market.queue.length + (runningJobs[market.address] ?
                      runningJobs[market.address].running : 0)"></progress></span>
                  </template>
                </span>
                <span v-else>
                  <span v-if="loadingRunningJobs">0 / ...</span>
                  <span v-else>
                    0 /
                    <span v-if="runningJobs">
                      {{ (runningJobs[market.address] ? runningJobs[market.address].running : 0) }}
                    </span>
                    <span v-else>
                      ?
                    </span>
                    <span>
                      hosts</span>
                    <span><progress class="is-pulled-right progress is-secondary" :value="0" :max="(runningJobs[market.address] ?
                      runningJobs[market.address].running : 0)"></progress></span>
                  </span>
                  <br>
                  <small v-if="market.queueType === 0">{{ market.queue.length }} jobs queued</small>
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

//
// Hardcoded VRAM capacities for certain GPU types.
// Adjust or add more as needed.
//
const VRAM_CAPACITIES: Record<string, number> = {
  'nvidia-4090': 24,
  'nvidia-3060': 8,
  'nvidia-4070': 12
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
    type: Array<Market>,
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
// Now checks the meta.system_requirments.required_vram field
//
const requiredVRAM = computed(() => {
  if (!props.jobDefinition?.meta?.system_requirments?.required_vram) return 0;
  return props.jobDefinition.meta.system_requirments.required_vram;
});

watch(selectedMarket, (newValue: Market | null) => {
  emit('selectedMarket', newValue)
});
const page: Ref<number> = ref(1);
const perPage: Ref<number> = ref(25);

/**
 * Filters the list of markets by:
 * - The current tab (premium, community, all).
 * - VRAM requirements, if set.
 */
const filteredMarkets = computed(() => {
  if (!props.markets || !props.markets.length) return props.markets;
  
  return props.markets.filter((market) => {
    if (tab.value === 'premium') {
      const isPremium = testgridMarkets.value.find((tgm: any) => tgm.address === market.address.toString() && tgm.type === 'PREMIUM');
      if (!isPremium) return false;
    }
    if (tab.value === 'community') {
      const isCommunity = testgridMarkets.value.find((tgm: any) => tgm.address === market.address.toString() && tgm.type === 'COMMUNITY');
      if (!isCommunity) return false;
    }
    return true;
  });
});

// New computed property to determine if a market is compatible
const isMarketCompatible = (market: Market) => {
  if (!requiredVRAM.value || requiredVRAM.value <= 0) return true;

  const marketInfo = testgridMarkets.value.find((tgm: any) => tgm.address === market.address.toString());
  if (!marketInfo) return true;
  
  const vramCapacity = VRAM_CAPACITIES[marketInfo.slug];
  if (!vramCapacity) return true;
  
  return vramCapacity >= requiredVRAM.value;
};

const paginatedMarkets = computed(() => {
  if (!filteredMarkets.value || !filteredMarkets.value.length) return props.markets;
  return filteredMarkets.value.slice((page.value - 1) * perPage.value, page.value * perPage.value);
});

// Helper to get hourly price for a market
const getMarketHourlyPrice = (market: Market) => {
  if (!stats.value?.[0]?.price) return Number.MAX_VALUE;
  return (stats.value[0].price * (parseInt(market.jobPrice) / 1e6)) * 3600;
};

// Helper to check if market has available GPUs
const hasAvailableGPUs = (market: Market) => {
  if (market.queueType !== 1) return false;
  if (loadingRunningJobs.value) return false;
  
  const running = runningJobs.value?.[market.address]?.running || 0;
  return market.queue.length > 0 && running > 0;
};

// Find the best market automatically when markets or job definition changes
watch([() => props.markets, () => props.jobDefinition, runningJobs, stats], () => {
  if (!props.select || !props.markets || !props.jobDefinition) return;

  // Filter for premium markets that are compatible and have GPUs available
  const compatibleMarkets = props.markets.filter(market => {
    const isPremium = testgridMarkets.value.find(
      (tgm: any) => tgm.address === market.address.toString() && tgm.type === 'PREMIUM'
    );
    return isPremium && isMarketCompatible(market) && hasAvailableGPUs(market);
  });

  // Sort by price and select the cheapest
  const cheapestMarket = compatibleMarkets.sort(
    (a, b) => getMarketHourlyPrice(a) - getMarketHourlyPrice(b)
  )[0];

  if (cheapestMarket) {
    selectedMarket.value = cheapestMarket;
    emit('selectedMarket', cheapestMarket);
  }
}, { immediate: true });
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
