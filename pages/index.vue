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
        <div class="topbar-wrapper">
          <TopBar 
            title="" 
            :hide-buttons="false"
            v-model="showSettingsModal"
          />
        </div>
      </div>
    </div>


    <Loader v-if="loading" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet } from "solana-wallets-vue";
import { useRouter } from "vue-router";
import { useAPI } from "~/composables/useAPI";
import WorldMap from "~/components/WorldMap.vue";
import RocketIcon from "~/assets/img/icons/rocket.svg?component";
import Loader from "~/components/Loader.vue";
import TopBar from "~/components/TopBar.vue";

const { data: nodeStatsResponse } = await useAPI("/api/stats/nodes-country");
const { status } = useAuth();
const { connected } = useWallet();
const router = useRouter();

const showSettingsModal = ref(false);
const loading = ref(false);

// Check if user is authenticated
const isAuthenticated = computed(() => {
  return status.value === 'authenticated' || connected.value;
});

// Handle Google OAuth callback on root page
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    // This is a popup window completing OAuth, just close it
    if (window.opener) {
      window.close();
      return;
    }
  }
  
});

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

/* Ensure modals are always on top */
:deep(.modal) {
  z-index: 1000;
}

:deep(.modal.is-active) {
  display: flex;
}

.topbar-wrapper {
  pointer-events: auto;
}
</style>
