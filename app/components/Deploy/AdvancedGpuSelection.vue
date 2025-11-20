<template>
  <div class="advanced-gpu-selection">
    <div class="content">
      <h3 class="title is-5 mb-4">Advanced GPU Configuration</h3>
      
      <!-- GPU Group Selection -->
      <div class="field">
        <label class="label has-text-weight-bold has-text-black">GPU Model</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="selectedGpuGroup" @change="$emit('searchGpus')">
              <option v-for="group in gpuFilters?.groups" 
                      :key="group.value" 
                      :value="group.value">
                {{ group.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- CUDA Driver Selection -->
      <div class="field">
        <label class="label has-text-weight-bold has-text-black">CUDA Driver</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="filterValues.CUDA_DRIVER" @change="$emit('searchGpus')">
              <option v-for="value in getCudaDriverValues()" 
                      :key="value" 
                      :value="value">
                {{ value }}
              </option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Market Type Selection - Replace dropdown with buttons matching simple tab -->
      <!-- <div class="field">
        <label class="label has-text-weight-bold has-text-black">Type</label>
        <div class="control">
          <div class="checkboxes is-flex">
            <button 
              class="button button-filter mr-3"
              :class="{ 'is-selected is-primary': selectedMarketType === 'all', 'is-outlined': selectedMarketType !== 'all' }"
              @click="selectedMarketType = 'all'"
            >
              All
            </button>
            <button 
              class="button button-filter mr-3"
              :class="{ 'is-selected is-primary': selectedMarketType === 'premium', 'is-outlined': selectedMarketType !== 'premium' }"
              @click="selectedMarketType = 'premium'"
            >
              Premium
            </button>
            <button 
              class="button button-filter"
              :class="{ 'is-selected is-primary': selectedMarketType === 'community', 'is-outlined': selectedMarketType !== 'community' }"
              @click="selectedMarketType = 'community'"
            >
              Community
            </button>
          </div>
        </div>
      </div> -->
      
      <!-- Dynamic Filters -->
      <template v-if="gpuFilters">
        <div v-for="(filter, key) in getCurrentFilters()" 
              :key="key" 
              class="field"
              v-show="String(key) !== 'UPLOAD_SPEED_MB' && String(key) !== 'MARKET_TYPE' && String(key) !== 'CUDA_DRIVER'">
          <label class="label">
            <span class="has-text-weight-bold has-text-black">{{ getFilterLabel(String(key)) }}</span>
            <span v-if="filter.type === 'min-max'" class="has-text-grey is-size-7 ml-2">- {{ getFilterDescription(String(key)) }} -</span>
          </label>
          
          <!-- Select Type Filters -->
          <div v-if="filter.type === 'select'" class="control">
            <!-- Button-style filters for OS and Region -->
            <div v-if="shouldUseButtonsForFilter(String(key))" class="checkboxes is-flex flex-wrap">
              <button 
                v-for="value in filter.values"
                :key="value" 
                class="button button-filter mr-2 mb-2"
                :class="{ 'is-selected is-primary': filterValues[key] === value, 'is-outlined': filterValues[key] !== value }"
                @click="filterValues[key] = value; $emit('searchGpus')"
              >
                {{ value }}
              </button>
            </div>
            <!-- Standard dropdown for other select filters -->
            <div v-else class="select is-fullwidth">
              <select v-model="filterValues[key]" @change="$emit('searchGpus')">
                <option v-for="value in filter.values" 
                        :key="value" 
                        :value="value">
                  {{ value }}
                </option>
              </select>
            </div>
          </div>

          <!-- Min-Max Type Filters -->
          <div v-if="filter.type === 'min-max'" class="control">
            <div class="field">
              <div class="columns is-mobile is-vcentered">
                <div class="column is-9">
                  <div class="slider-container">
                    <div class="range-slider">
                      <div class="range-slider__fill" 
                          :style="{ width: `${calculateFillWidth(String(key), filterValues[key] as FilterValue, filter)}%` }">
                      </div>
                      <input type="range" 
                            class="range-slider__range" 
                            :min="getMinValue(String(key), filter)"
                            :max="getMaxInputValue(String(key), filter)"
                            :value="getDisplayValue(String(key), (filterValues[key] as FilterValue).min)"
                            @input="(e) => handleSliderInput(e, String(key))"
                            @change="$emit('searchGpus')"
                            step="1">
                    </div>
                  </div>
                </div>
                <div class="column is-3">
                  <div class="input-with-unit">
                    <input class="input" 
                          type="text" 
                          inputmode="numeric" 
                          pattern="[0-9]*"
                          :value="getDisplayValue(String(key), (filterValues[key] as FilterValue).min)"
                          @input="(e) => handleSliderInput(e, String(key))" 
                          :min="getMinValue(String(key), filter)"
                          :max="getMaxInputValue(String(key), filter)"
                          :placeholder="'Min ' + String(key).replace(/_/g, ' ').toLowerCase()">
                    <span class="unit">{{ getUnit(String(key)) }}</span>
                    <span class="max-value">/ {{ getMaxValue(String(key), filter.max_value) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Available Hosts -->
      <div class="mt-4">
        <h4 class="title is-6 mb-3">Available GPUs</h4>
        <div v-if="availableHosts.length === 0 && !loadingHosts" class="has-text-centered has-text-grey">
          No GPUs found matching your criteria
        </div>
        <transition-group name="gpu-list-transition" tag="div" class="gpu-list">
          <div v-for="host in availableHosts" 
              :key="host.host_address" 
              class="gpu-box"
              :class="{ 'is-selected': selectedHostAddress === host.host_address }"
              @click="selectHost(host)">
            <div class="gpu-box__selection-indicator"></div>
            <div class="gpu-box__content">
              <div class="gpu-box__main">
                <div class="gpu-box__title">
                  <NvidiaIcon alt="NVIDIA" class="gpu-logo" />
                  {{ host.label }}
                </div>
                <div class="gpu-box__price">
                  <CurrentMarketPrice 
                    v-if="host.market_address"
                    :marketAddressOrData="host.market_address"
                    :marketsData="props.marketsData"
                    :decimalPlaces="3" 
                    :showDollarSign="true" />
                </div>
              </div>
              <div class="gpu-box__specs">
                <div class="gpu-box__specs-row">
                  <span class="has-text-grey">vCPU: {{ host.specs.CPU_CORES }} cores</span>
                  <span class="has-text-grey">Memory: {{ host.specs.RAM_MB ? Math.round(host.specs.RAM_MB / 1024) : host.specs.MEMORY_GB || 0 }} GB</span>
                  <span class="has-text-grey">Storage: {{ host.specs.DISK_SPACE_GB }} GB</span>
                </div>
                <div class="gpu-box__specs-row">
                  <span class="has-text-grey">Download: {{ Math.round(host.specs.DOWNLOAD_SPEED_MB || host.specs.BANDWIDTH_MB || 0) }} MB/s</span>
                  <span class="has-text-grey">Upload: {{ Math.round(host.specs.UPLOAD_SPEED_MB || 0) }} MB/s</span>
                  <span class="has-text-grey">OS: {{ host.specs.PLATFORM_OS || '?' }}</span>
                </div>
                <div class="gpu-box__specs-row">
                  <span class="has-text-grey">Type: {{ host.market_type ? host.market_type.charAt(0).toUpperCase() + host.market_type.slice(1) : '-' }}</span>
                  <span class="has-text-grey" v-if="host.country">Country: {{ getCountryName(host.country) }}</span>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Market } from "@nosana/sdk";
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import NvidiaIcon from '@/assets/img/icons/nvidia.svg?component';
import CurrentMarketPrice from "~/components/Market/CurrentPrice.vue";

// Initialize the countries library with English locale
countries.registerLocale(en);

// Types
interface FilterValue {
  min: number;
  max: number;
}

interface FilterValues {
  [key: string]: string | FilterValue;
}

interface HostInterface {
  host_address: string;
  label: string;
  USD_per_hour: number;
  market_address?: string;
  market_type?: string;
  specs: {
    CPU_CORES: number;
    RAM_MB?: number;
    MEMORY_GB?: number;
    DISK_SPACE_GB: number;
    DOWNLOAD_SPEED_MB?: number;
    BANDWIDTH_MB?: number;
    PLATFORM_OS?: string;
    UPLOAD_SPEED_MB?: number;
  };
  country?: string;
}

// Define props
interface Props {
  gpuFilters: any;
  selectedGpuGroup: string;
  filterValues: FilterValues;
  availableHosts: HostInterface[];
  loadingHosts: boolean;
  selectedHostAddress: string | null;
  forceUpdateCounter: number;
  marketsData?: any[] | null;
}

// Define emits
const emit = defineEmits<{
  'update:selectedGpuGroup': [value: string];
  'update:filterValues': [value: FilterValues];
  'update:selectedHostAddress': [value: string | null];
  'update:forceUpdateCounter': [value: number];
  selectedMarket: [market: Market | null];
  searchGpus: [];
}>();

// Get props
const props = defineProps<Props>();

// Field mappings constants
const FIELD_MAPPINGS = {
  API_PARAMS: {
    'PLATFORM_OS': 'platform_os',
    'CUDA_DRIVER': 'cuda_drivers',
    'CPU_CORES': 'cpu_cores',
    'RAM_MB': 'ram_mb',
    'DISK_SPACE_GB': 'disk_space_gb',
    'BANDWIDTH_MB': 'download_speed_mb',
    'DOWNLOAD_SPEED_MB': 'download_speed_mb',
    'UPLOAD_SPEED_MB': 'upload_speed_mb',
    'REGION': 'region'
  },
  LABELS: {
    'PLATFORM_OS': 'Select OS',
    'CUDA_DRIVER': 'Select CUDA driver',
    'CPU_CORES': 'CPU',
    'RAM_MB': 'Memory',
    'DISK_SPACE_GB': 'Storage',
    'BANDWIDTH_MB': 'Download Speed',
    'DOWNLOAD_SPEED_MB': 'Download Speed'
  },
  DESCRIPTIONS: {
    'CPU_CORES': 'Select amount of vCPUs',
    'RAM_MB': 'Set minimum memory in GB',
    'DISK_SPACE_GB': 'Set minimum storage in GB',
    'BANDWIDTH_MB': 'Set the minimum download speed in MB/s',
    'DOWNLOAD_SPEED_MB': 'Set the minimum download speed in MB/s'
  },
  UNITS: {
    'CPU_CORES': 'vCPU',
    'RAM_MB': 'GB',
    'DISK_SPACE_GB': 'GB',
    'BANDWIDTH_MB': 'MB/s',
    'DOWNLOAD_SPEED_MB': 'MB/s'
  },
  ZERO_MIN_FIELDS: ['RAM_MB', 'CPU_CORES', 'DISK_SPACE_GB']
};

// Computed properties for v-model
const selectedGpuGroup = computed({
  get: () => props.selectedGpuGroup,
  set: (value: string) => emit('update:selectedGpuGroup', value)
});

const filterValues = computed({
  get: () => props.filterValues,
  set: (value: FilterValues) => emit('update:filterValues', value)
});


const selectedHostAddress = computed({
  get: () => props.selectedHostAddress,
  set: (value: string | null) => emit('update:selectedHostAddress', value)
});

const forceUpdateCounter = computed({
  get: () => props.forceUpdateCounter,
  set: (value: number) => emit('update:forceUpdateCounter', value)
});

// Methods
const getCountryName = (code: string): string => {
  const countryName = countries.getName(code, 'en') || code;
  
  // Custom country name overrides
  if (code === 'TW') return 'Taiwan';
  if (code === 'US') return 'United States';
  if (code === 'RU') return 'Russia';
  if (code === 'CN') return 'China';
  
  return countryName;
};

const getFilterLabel = (key: string): string => 
  FIELD_MAPPINGS.LABELS[key as keyof typeof FIELD_MAPPINGS.LABELS] || key;

const getFilterDescription = (key: string): string => 
  FIELD_MAPPINGS.DESCRIPTIONS[key as keyof typeof FIELD_MAPPINGS.DESCRIPTIONS] || 'Set the value';

const getUnit = (key: string): string => 
  FIELD_MAPPINGS.UNITS[key as keyof typeof FIELD_MAPPINGS.UNITS] || '';

const getDisplayValue = (key: string, value: number): number => 
  key === 'RAM_MB' ? Math.round(value / 1024) : value;

const getMaxValue = (key: string, maxValue: number): number => {
  if (key === 'BANDWIDTH_MB' || key === 'DOWNLOAD_SPEED_MB') {
    return Math.round(maxValue);
  }
  return key === 'RAM_MB' ? Math.round(maxValue / 1024) : maxValue;
};

const getMinValue = (key: string, filter: any): number => 
  key === 'BANDWIDTH_MB' || key === 'DOWNLOAD_SPEED_MB' ? 0 : 
  FIELD_MAPPINGS.ZERO_MIN_FIELDS.includes(key) ? 0 : filter.min_value;

const getMaxInputValue = (key: string, filter: any): number => 
  key === 'RAM_MB' ? Math.round(filter.max_value / 1024) : filter.max_value;

const getCurrentFilters = () => {
  if (!props.gpuFilters || !props.gpuFilters['filter-options']) return {};
  
  const option = props.gpuFilters['filter-options'].find(
    (f: { value: string }) => f.value === props.selectedGpuGroup || 
    (!props.selectedGpuGroup && f.value === 'all')
  );
  
  return option?.filters || {};
};

const shouldUseButtonsForFilter = (key: string): boolean => {
  return ['PLATFORM_OS', 'REGION'].includes(key);
};

const getCudaDriverValues = (): string[] => {
  if (!props.gpuFilters || !props.gpuFilters['filter-options']) return ['All'];
  
  const option = props.gpuFilters['filter-options'].find(
    (f: { value: string }) => f.value === props.selectedGpuGroup || 
    (!props.selectedGpuGroup && f.value === 'all')
  );
  
  if (option?.filters?.CUDA_DRIVER?.values) {
    return option.filters.CUDA_DRIVER.values;
  }
  
  return ['All'];
};

const calculateFillWidth = (key: string, filterValue: FilterValue, filter: any): number => {
  // Special handling for bandwidth - always start from 0
  if (key === 'BANDWIDTH_MB' || key === 'DOWNLOAD_SPEED_MB') {
    const maxValue = filter.max_value;
    const currentValue = filterValue.min;
    return (currentValue / maxValue) * 100;
  }
  
  // Special handling for fields that can start from 0
  if (FIELD_MAPPINGS.ZERO_MIN_FIELDS.includes(key)) {
    // Use percentage of max value for these fields
    const maxValue = key === 'RAM_MB' ? Math.round(filter.max_value / 1024) : filter.max_value;
    const currentValue = key === 'RAM_MB' ? Math.round(filterValue.min / 1024) : filterValue.min;
    return (currentValue / maxValue) * 100;
  }
  
  // Standard calculation for other fields
  return ((filterValue.min - filter.min_value) / (filter.max_value - filter.min_value)) * 100;
};

const handleSliderInput = (e: Event, key: string) => {
  const value = Number((e.target as HTMLInputElement).value);
  if (!filterValues.value[key]) {
    filterValues.value[key] = { min: 0, max: 0 };
  }
  (filterValues.value[key] as FilterValue).min = key === 'RAM_MB' ? value * 1024 : value;
  forceUpdateCounter.value++;
};

const selectHost = (host: HostInterface) => {
  const newSelectedAddress = selectedHostAddress.value === host.host_address ? null : host.host_address;
  selectedHostAddress.value = newSelectedAddress;
  
  // If a host is selected, emit the market selection
  if (newSelectedAddress && host.market_address) {
    // We need to find the market object, but we don't have access to markets here
    // So we'll emit the market_address and let the parent handle it
    emit('selectedMarket', { market_address: host.market_address } as any);
  } else {
    emit('selectedMarket', null);
  }
};
</script>

<style lang="scss" scoped>
@use "sass:color";
.advanced-gpu-selection {
  width: 100%;
}

.advanced-gpu-selection .label {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  
  .has-text-grey {
    font-weight: normal;
  }
}

.flex-wrap {
  flex-wrap: wrap;
}

.slider-container {
  position: relative;
  padding: 0 1rem;
  
  .range-slider {
    position: relative;
    width: 100%;
    height: 6px;
    background: #ddd;
    border-radius: 3px;
    margin: 14px 0;
    
    &__range {
      -webkit-appearance: none;
      appearance: none;
      position: absolute;
      top: -4px;
      left: 0;
      width: 100%;
      height: 14px;
      margin: 0;
      background: transparent;
      z-index: 3;
      
      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 3px solid var(--primary-color, #2A2A2A);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      &::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 3px solid var(--primary-color, #2A2A2A);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      &:focus {
        outline: none;
      }
    }
    
    &__fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: #2A2A2A;
      border-radius: 3px;
      pointer-events: none;
    }
  }
}

.gpu-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gpu-box {
  position: relative;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;

  &:hover {
    background: #f5f5f5;
  }

  &.is-selected {
    background: #2A2A2A;
    border-color: #2A2A2A;

    .gpu-box__title,
    .gpu-box__price {
      color: #00D1B2;
    }

    .gpu-box__specs-row span {
      color: #A0A0A0;
    }

    .gpu-box__selection-indicator {
      border-color: white;
      background: white;

      &::after {
        background: #00D1B2;
      }
    }
  }

  &__content {
    flex: 1;
  }

  &__main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  &__title {
    font-weight: 600;
    color: black;
    display: flex;
    align-items: center;
  }

  .gpu-logo {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    vertical-align: middle;
  }

  &__price {
    font-size: 1.1rem;
    font-weight: 600;
    color: black;
  }

  &__specs {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__specs-row {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;

    span {
      color: #666666;
    }
  }

  &__selection-indicator {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid #ddd;
    transition: all 0.2s ease;
    flex-shrink: 0;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: transparent;
      transition: all 0.2s ease;
    }
  }
}

.input-with-unit {
  display: flex;
  align-items: center;
  width: 100%;

  .input {
    flex-grow: 1;
    min-width: 50px;
    width: 100%;
    font-size: 1rem;
  }

  .unit {
    margin-left: 0.5rem;
    color: #666;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .max-value {
    margin-left: 0.25rem;
    color: #666;
    font-size: 0.875rem;
    white-space: nowrap;
  }
}

/* GPU list transitions */
.gpu-list-transition-enter-active,
.gpu-list-transition-leave-active {
  transition: all 0.3s ease;
}
.gpu-list-transition-enter-from,
.gpu-list-transition-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.gpu-list-transition-move {
  transition: transform 0.3s ease;
}

.dark-mode {
  .slider-container .range-slider {
    background: var(--grey-darker, #333);
  }
  
  .gpu-box {
    background: var(--black-bis, #121212);
    border-color: var(--grey-darker, #333);

    &:hover {
      background: color.adjust(#121212, $lightness: 2%);
    }

    &.is-selected {
      background: #2A2A2A;
      border-color: #2A2A2A;
    }

    &__title, &__price {
      color: white;
    }
  }
}

/* Adjust slider/input column widths on mobile */
@media screen and (max-width: 768px) {
  .field > .columns.is-mobile > .column.is-9 {
    width: 60%;
  }
  .field > .columns.is-mobile > .column.is-3 {
    width: 33.3333%;
  }

  /* Stack GPU specs vertically on mobile */
  .gpu-box__specs-row {
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
  }

  /* Further adjust input unit/max-value on mobile */
  .input-with-unit .unit,
  .input-with-unit .max-value {
    font-size: 0.7rem;
    margin-left: 0.2rem;
  }
  .input-with-unit .unit { 
    margin-left: 0.3rem;
  }

  /* Allow input to shrink more on mobile */
  .input-with-unit .input {
    min-width: 0;
    flex-shrink: 1;
  }
}
</style> 