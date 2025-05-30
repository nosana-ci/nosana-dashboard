<template>
  <div class="is-flex is-justify-content-space-between mb-5 is-flex-wrap-wrap">
    <div>
      <h2 class="title">{{ title }}</h2>
      <h3 v-if="subtitle" class="subtitle mb-2">
        {{ subtitle }}
      </h3>
    </div>
    <button v-if="!hideButtons" class="button ml-auto mr-2 is-rounded is-large is-text" @click="updateShowSettingsModal(true)">
      <span class="icon">
        <svg width="32" height="32" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6.71971 1.2926L6.41471 2.9726C6.11846 3.06573 5.83097 3.18635 5.55971 3.32761L4.14971 2.35761L2.33979 4.16753L3.31479 5.57252C3.17292 5.84439 3.05355 6.13003 2.95979 6.42753L1.27979 6.73252V9.29252L2.95979 9.59751C3.05354 9.89564 3.17729 10.18 3.31979 10.4525L2.33979 11.8575L4.14971 13.6674L5.5547 12.6974C5.82719 12.8399 6.11657 12.9587 6.4147 13.0524L6.71969 14.7324H9.27969L9.58468 13.0524C9.88218 12.9587 10.1678 12.8393 10.4397 12.6974L11.8447 13.6674L13.6546 11.8575L12.6796 10.4525C12.8208 10.1813 12.9415 9.89878 13.0346 9.60252L14.7196 9.29252V6.73252L13.0346 6.42753C12.9415 6.1319 12.8252 5.84815 12.6846 5.57753L13.6546 4.16753L11.8447 2.35761L10.4397 3.32761C10.1678 3.18574 9.88218 3.06636 9.58468 2.9726L9.27969 1.2926H6.71971ZM7.9997 4.9726C9.67842 4.9726 11.0397 6.33385 11.0397 8.0126C11.0397 9.69135 9.67846 11.0526 7.9997 11.0526C6.32095 11.0526 4.95971 9.69135 4.95971 8.0126C4.95971 6.33385 6.32095 4.9726 7.9997 4.9726Z"
            fill="currentColor"></path>
        </svg>
      </span>
    </button>
    <div class="modal" :class="{ 'is-active': modelValue }">
      <div class="modal-background" @click="updateShowSettingsModal(false)"></div>
      <div class="modal-content">
        <div class="box">
          <h2 class="title mb-5 has-text-weight-bold">Settings</h2>
          <h3 class="title is-5">
            Global Priority Fee Level
          </h3>
          <p class="subtitle is-size-5">
            These fees apply across Nosana's entire product suite, such as staking actions, posting jobs etc.
          </p>
          <div class="field has-addons">
            <p class="control">
              <button class="button is-medium is-primary" @click="setPrioFeeConfig('low')"
                :class="{ 'is-outlined': prioFee.strategy !== 'low' }">
                <span>Slow</span>
              </button>
            </p>
            <p class="control">
              <button class="button is-medium is-primary" @click="setPrioFeeConfig('medium')"
                :class="{ 'is-outlined': prioFee.strategy !== 'medium' }">
                <span>Medium</span>
              </button>
            </p>
            <p class="control">
              <button class="button is-medium is-primary" @click="setPrioFeeConfig('high')"
                :class="{ 'is-outlined': prioFee.strategy !== 'high' }">
                <span>Fast</span>
              </button>
            </p>
            <p class="control">
              <button class="button is-medium is-primary" @click="setPrioFeeConfig('veryHigh')"
                :class="{ 'is-outlined': prioFee.strategy !== 'veryHigh' }">
                <span>Ultra</span>
              </button>
            </p>
          </div>
        </div>
      </div>
      <button class="modal-close is-large" @click="updateShowSettingsModal(false)" aria-label="close"></button>
    </div>
    <ClientOnly v-if="!hideButtons">
      <wallet-multi-button :dark="$colorMode.value === 'dark'"></wallet-multi-button>
    </ClientOnly>
  </div>
</template>
<script lang="ts" setup>
import { WalletMultiButton } from "solana-wallets-vue";
const { prioFee } = useSDK();

interface PrioFeeConfig {
  strategy: 'low' | 'medium' | 'high' | 'veryHigh';
  staticFee: number;
  dynamicPriorityFee: boolean;
  maximumPriorityFee: number;
}

// Priority fee configuration mapping
const PRIO_FEE_CONFIGS: Record<string, PrioFeeConfig> = {
  low: {
    strategy: 'low',
    staticFee: 10000,
    dynamicPriorityFee: true,
    maximumPriorityFee: 1000000
  },
  medium: {
    strategy: 'medium',
    staticFee: 100000,
    dynamicPriorityFee: true,
    maximumPriorityFee: 15000000
  },
  high: {
    strategy: 'high',
    staticFee: 100000,
    dynamicPriorityFee: true,
    maximumPriorityFee: 15000000
  },
  veryHigh: {
    strategy: 'veryHigh',
    staticFee: 100000,
    dynamicPriorityFee: true,
    maximumPriorityFee: 15000000
  }
};

const setPrioFeeConfig = (level: keyof typeof PRIO_FEE_CONFIGS) => {
  const config = PRIO_FEE_CONFIGS[level];
  prioFee.value = config;
};

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: false
  },
  hideButtons: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const updateShowSettingsModal = (value: boolean) => {
  emit('update:modelValue', value);
};
</script>