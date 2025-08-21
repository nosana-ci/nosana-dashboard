<template>
  <div>
    <div class="flex">
      <!-- <div class="field px-1 mt-5 mb-5">
        <div class="control">
          <div class="checkboxes is-flex">
            <button 
              class="button button-filter mr-3"
              :class="{ 'is-selected is-primary': activeFilter === 'ALL', 'is-outlined': activeFilter !== 'ALL' }"
              @click="toggleGpuType('ALL')"
            >
              All
            </button>
            <button 
              class="button button-filter mr-3"
              :class="{ 'is-selected is-primary': activeFilter === 'PREMIUM', 'is-outlined': activeFilter !== 'PREMIUM' }"
              @click="toggleGpuType('PREMIUM')"
            >
              Premium
            </button>
            <button 
              class="button button-filter"
              :class="{ 'is-selected is-primary': activeFilter === 'COMMUNITY', 'is-outlined': activeFilter !== 'COMMUNITY' }"
              @click="toggleGpuType('COMMUNITY')"
            >
              Community
            </button>
          </div>
        </div>
      </div> -->
      <div v-if="loadingMarkets">
        Loading GPUs...
      </div>
      <ListDeployMarketList
        v-else-if="markets"
        :key="`market-list-${activeFilterKey}`"
        :markets="markets"
        :testgridMarkets="testgridMarkets"
        :select="true"
        :typeFilter="gpuTypeCheckbox"
        :jobDefinition="jobDefinition"
        :skipAutoSelection="skipAutoSelection"
        :initialMarket="selectedMarket"
        :showLogo="true"
        @selectedMarket="$emit('selectedMarket', $event)"
      />
      <div v-else>
        Could not load available GPUs
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Market, JobDefinition } from "@nosana/sdk";

// Define props
interface Props {
  markets: Market[] | null;
  testgridMarkets: any[];
  loadingMarkets: boolean;
  gpuTypeCheckbox: string[];
  activeFilter: string;
  jobDefinition: JobDefinition | null | string;
  skipAutoSelection: boolean;
  selectedMarket: Market | null;
  activeFilterKey: string;
}

// Define emits
const emit = defineEmits<{
  selectedMarket: [market: Market | null];
  'update:activeFilter': [value: string];
  'update:gpuTypeCheckbox': [value: string[]];
}>();

// Get props
const props = defineProps<Props>();

// Methods
const toggleGpuType = (type: string) => {
  emit('update:activeFilter', type);
  if (type === 'ALL') {
    emit('update:gpuTypeCheckbox', ['PREMIUM', 'COMMUNITY']);
  } else {
    emit('update:gpuTypeCheckbox', [type]);
  }
};
</script>

<style lang="scss" scoped>
// No additional styles needed - inherits from parent
</style> 