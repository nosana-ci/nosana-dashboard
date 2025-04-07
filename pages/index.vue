<template>
  <div class="login-page" :class="{ 'dark-mode': isDarkMode }">
    <!-- World Map Background -->
    <div class="world-map-wrapper">
      <WorldMap />
    </div>

    <!-- Main Content -->
    <div class="content-wrapper">
      <!-- Top Left -->
      <div class="left-content">
        <h1 class="title is-2">Nosana dashboard</h1>
        <!-- <h2 class="subtitle is-4 mb-6">Launch the dashboard</h2> -->
        <nuxt-link
          to="/deploy"
          active-class="is-active"
          class="button is-primary"
        >
          Create a deployment
        </nuxt-link>

        <!-- Bottom Stats -->
        <div class="hosts-stats">
          <div class="stats-box">
            <span class="icon mr-3">
              <RocketIcon class="rocket-icon" />
            </span>
            <div class="stats-text">
              <div class="has-text-grey is-size-6">GPUs Available</div>
              <div class="has-text-black has-text-weight-bold is-size-4">
                {{ queuedHosts }}/{{ activeHosts }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Right -->
      <div class="right-content">
        <button
          class="button ml-auto mr-2 is-rounded is-large is-text"
          @click="showSettingsModal = true"
        >
          <span class="icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 16 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.71971 1.2926L6.41471 2.9726C6.11846 3.06573 5.83097 3.18635 5.55971 3.32761L4.14971 2.35761L2.33979 4.16753L3.31479 5.57252C3.17292 5.84439 3.05355 6.13003 2.95979 6.42753L1.27979 6.73252V9.29252L2.95979 9.59751C3.05354 9.89564 3.17729 10.18 3.31979 10.4525L2.33979 11.8575L4.14971 13.6674L5.5547 12.6974C5.82719 12.8399 6.11657 12.9587 6.4147 13.0524L6.71969 14.7324H9.27969L9.58468 13.0524C9.88218 12.9587 10.1678 12.8393 10.4397 12.6974L11.8447 13.6674L13.6546 11.8575L12.6796 10.4525C12.8208 10.1813 12.9415 9.89878 13.0346 9.60252L14.7196 9.29252V6.73252L13.0346 6.42753C12.9415 6.1319 12.8252 5.84815 12.6846 5.57753L13.6546 4.16753L11.8447 2.35761L10.4397 3.32761C10.1678 3.18574 9.88218 3.06636 9.58468 2.9726L9.27969 1.2926H6.71971ZM7.9997 4.9726C9.67842 4.9726 11.0397 6.33385 11.0397 8.0126C11.0397 9.69135 9.67846 11.0526 7.9997 11.0526C6.32095 11.0526 4.95971 9.69135 4.95971 8.0126C4.95971 6.33385 6.32095 4.9726 7.9997 4.9726Z"
                fill="currentColor"
              ></path>
            </svg>
          </span>
        </button>
        <div class="wallet-container">
          <ClientOnly>
            <wallet-multi-button :dark="isDarkMode" />
          </ClientOnly>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div class="modal" :class="{ 'is-active': showSettingsModal }">
      <div class="modal-background" @click="showSettingsModal = false"></div>
      <div class="modal-content">
        <div class="box">
          <h2 class="title mb-5 has-text-weight-bold">Settings</h2>
          <h3 class="title is-5">Global Priority Fee Level</h3>
          <p class="subtitle is-size-5">
            These fees apply across Nosana's entire product suite, such as
            staking actions, posting jobs etc.
          </p>
          <div class="field has-addons">
            <p class="control">
              <button
                class="button is-medium is-primary"
                @click="setPrioFeeConfig('low')"
                :class="{ 'is-outlined': prioFee.strategy !== 'low' }"
              >
                <span>Slow</span>
              </button>
            </p>
            <p class="control">
              <button
                class="button is-medium is-primary"
                @click="setPrioFeeConfig('medium')"
                :class="{ 'is-outlined': prioFee.strategy !== 'medium' }"
              >
                <span>Medium</span>
              </button>
            </p>
            <p class="control">
              <button
                class="button is-medium is-primary"
                @click="setPrioFeeConfig('high')"
                :class="{ 'is-outlined': prioFee.strategy !== 'high' }"
              >
                <span>Fast</span>
              </button>
            </p>
            <p class="control">
              <button
                class="button is-medium is-primary"
                @click="setPrioFeeConfig('veryHigh')"
                :class="{ 'is-outlined': prioFee.strategy !== 'veryHigh' }"
              >
                <span>Ultra</span>
              </button>
            </p>
          </div>
        </div>
      </div>
      <button
        class="modal-close is-large"
        @click="showSettingsModal = false"
        aria-label="close"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { WalletMultiButton } from "solana-wallets-vue";
import { useAPI } from "~/composables/useAPI";
import { useSDK } from "~/composables/useSDK";
import WorldMap from "~/components/Explorer/Nodes/WorldMap.vue";
import RocketIcon from "~/assets/img/icons/rocket.svg?component";

const { data: nodeStatsResponse } = await useAPI("/api/stats/nodes-country");
const showSettingsModal = ref(false);
const { prioFee } = useSDK();

// Get running nodes from jobs API
const { data: runningNodesData } = useAPI("/api/jobs/running", {
  transform: (data: any) => {
    if (!data) return { total: 0 };
    return {
      total: Object.values(data).reduce(
        (sum: number, market: any) => sum + (market.running || 0),
        0
      ),
    };
  },
  default: () => ({ total: 0 }),
});

// Define interface for node stats item
interface NodeStatsItem {
  country: string;
  running: number;
  queue: number;
  offline: number;
  total: number;
}

// Calculate queued hosts
const queuedHosts = computed(() => {
  if (
    !nodeStatsResponse.value?.data ||
    !Array.isArray(nodeStatsResponse.value.data)
  )
    return 0;

  let total = 0;
  // Group by country and sum up queues
  nodeStatsResponse.value.data.forEach((item: NodeStatsItem) => {
    if (item.queue > 0) {
      total += item.queue;
    }
  });

  // Use API's total if available, otherwise use our calculation
  return nodeStatsResponse.value.totals?.totalQueued ?? total;
});

// Calculate active hosts using running nodes from jobs API
const activeHosts = computed(() => {
  const runningCount = runningNodesData.value?.total || 0;
  const queuedCount = queuedHosts.value;
  return runningCount + queuedCount;
});

// Priority fee configuration mapping
const PRIO_FEE_CONFIGS = {
  low: {
    strategy: "low",
    staticFee: 10000,
    dynamicPriorityFee: true,
    maxPriorityFee: 1000000,
  },
  medium: {
    strategy: "medium",
    staticFee: 100000,
    dynamicPriorityFee: true,
    maxPriorityFee: 15000000,
  },
  high: {
    strategy: "high",
    staticFee: 100000,
    dynamicPriorityFee: true,
    maxPriorityFee: 15000000,
  },
  veryHigh: {
    strategy: "veryHigh",
    staticFee: 100000,
    dynamicPriorityFee: true,
    maxPriorityFee: 15000000,
  },
};

const setPrioFeeConfig = (level: keyof typeof PRIO_FEE_CONFIGS) => {
  const config = PRIO_FEE_CONFIGS[level];
  prioFee.value = config;
};

// Add dark mode detection
const isDarkMode = computed(() =>
  document.documentElement.classList.contains("dark-mode")
);
</script>

<style lang="scss" scoped>
.login-page {
  position: fixed;
  top: 0;
  left: 280px;
  width: calc(100vw - 280px);
  height: 100vh;
  overflow: hidden;
  background: transparent;

  &.dark-mode {
    .world-map-wrapper {
      background: #121212;
    }
  }
}

.world-map-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  transition: background-color 0.3s ease;
  overflow: hidden;

  :deep(.box) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  :deep(.world-map-container) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  :deep(.aspect-ratio-container) {
    /* No max-width to allow the map to be cut off at the sides */
    overflow: hidden;
  }

  :deep(.v-chart) {
    overflow: hidden;
  }
}

.content-wrapper {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  @media screen and (max-width: 1024px) {
    top: 50px;
    padding: 1rem;
  }
  
  @media screen and (max-width: 450px) {
    flex-direction: column;
    padding: 0.75rem;
  }
}

.left-content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  pointer-events: none;

  .button {
    pointer-events: auto;
    position: relative;
    z-index: 3;
  }
  
  @media screen and (max-width: 450px) {
    h1.title {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    
    .button {
      font-size: 0.85rem;
      padding: 0.5em 0.75em;
    }
  }
}

.right-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  pointer-events: none;

  .button {
    pointer-events: auto;
    position: relative;
    z-index: 3;
  }
  
  @media screen and (max-width: 450px) {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    gap: 0.5rem;
    align-items: center;
    
    .button {
      padding: 0.25rem;
      height: auto;
      display: flex;
      align-items: center;
      
      .icon {
        width: 1.5rem;
        height: 1.5rem;
        
        svg {
          width: 1.5rem;
          height: 1.5rem;
        }
      }
    }
  }
}

.wallet-container {
  pointer-events: auto;
  position: relative;
  z-index: 999;
  
  @media screen and (max-width: 450px) {
    transform: scale(0.85);
    transform-origin: right center;
    
    :deep(.wallet-adapter-button) {
      font-size: 0.7rem;
      padding: 0 0.5rem;
      height: 1.75rem;
      
      .wallet-adapter-button-start-icon {
        margin-right: 4px;
        width: 16px;
        height: 16px;
      }
    }
  }
}

.hosts-stats {
  margin-top: auto;
  padding-bottom: 2rem;
  pointer-events: auto;
  position: relative;
  z-index: 3;
  
  @media screen and (max-width: 450px) {
    padding-bottom: 1rem;
  }
}

.stats-box {
  border-radius: 8px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media screen and (max-width: 450px) {
    padding: 0.75rem 1rem;
    
    .is-size-4 {
      font-size: 1.25rem !important;
    }
    
    .is-size-6 {
      font-size: 0.8rem !important;
    }
  }
}

.rocket-icon {
  width: 28px;
  height: 28px;
  fill: #10e80c;
  
  @media screen and (max-width: 450px) {
    width: 20px;
    height: 20px;
  }
}

.left-content :deep(.button.is-primary) {
  background-color: #10e80c !important;
  border-color: transparent !important;
  color: #1a1a1a !important;
  font-weight: bold !important;

  &:hover {
    background-color: darken(#10e80c, 5%) !important;
  }

  &.is-outlined {
    background-color: transparent !important;
    border-color: #10e80c !important;
    color: #10e80c !important;
  }
}

@include touch {
  .login-page {
    left: 0;
    width: 100vw;
  }
}

.modal-content {
  position: relative;
  z-index: 2;
}
</style>
