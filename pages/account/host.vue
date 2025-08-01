<template>
  <TopBar :title="'Host'" :subtitle="'Welcome to your dedicated Host Earnings and Performance page'">
  </TopBar>

  <div class="columns">
    <div class="column is-4">
      <h3 class="title is-4 mt-5 mb-4">Earnings</h3>
      <div class="columns is-multiline mb-4">
        <div class="column is-12">
          <div class="box has-text-centered" style="height: 100%;">
            <p class="heading">Current Month</p>
            <p class="title is-4 mb-1" v-if="!loadingHistory">
              ${{ displayedEarnedThisMonth.toFixed(2) }}
            </p>
            <p class="title is-4 mb-1" v-else>-</p>
            <p class="has-text-grey is-size-7 mb-0" v-if="displayedPctChangeSoFar != null">
              <ArrowUpIcon
                v-if="displayedPctChangeSoFar >= 0"
                class="icon is-small mr-1"
                style="width: 10px; height: 10px; fill: #48c78e;"
              />
              <ArrowDownIcon
                v-else
                class="icon is-small mr-1"
                style="width: 10px; height: 10px; fill: #f14668;"
              />
              {{ displayedPctChangeSoFar.toFixed(2) }}% compared to same day last month
            </p>
          </div>
        </div>
        <div class="column is-12">
          <div class="box has-text-centered">
            <p class="heading">Forecasted Monthly</p>
            <p class="title is-4 mb-1" v-if="!loadingHistory" style="height: 100%;">
              ${{ displayedForecastAmount.toFixed(2) }}
            </p>
            <p class="title is-4 mb-1" v-else>-</p>
            <p class="has-text-grey is-size-7 mb-0" v-if="displayedPctChangeForecast != null">
              <ArrowUpIcon
                v-if="displayedPctChangeForecast >= 0"
                class="icon is-small mr-1"
                style="width: 10px; height: 10px; fill: #48c78e;"
              />
              <ArrowDownIcon
                v-else
                class="icon is-small mr-1"
                style="width: 10px; height: 10px; fill: #f14668;"
              />
              {{ displayedPctChangeForecast.toFixed(2) }}% vs last month (total)
            </p>
          </div>
        </div>
        <div class="column is-12">
          <div class="box has-text-centered" style="height: 100%;">
            <p class="heading">All Time</p>
            <p
              class="title is-flex is-align-items-center is-justify-content-center"
              v-if="!loadingHistory"
            >
              ${{ totalEarnedAllTime.toFixed(2) }}
            </p>
            <p class="title is-flex is-align-items-center is-justify-content-center" v-else>-</p>
          </div>
        </div>
      </div>
    </div>
    <!-- Moved Earnings History Section Start -->
    <div class="column is-8">
      <h3 class="title is-4 mt-5 mb-4">History</h3>
      <div class="box" style="height: 400px; position: relative;">
        <div class="content" style="height: 100%;">
          <div class="field is-grouped is-justify-content-end" style="position: absolute; top: 12px; right: 12px; z-index: 1;">
            <div class="control">
              <div class="buttons has-addons">
                <button
                  v-for="period in ['daily', '3', '3000']"
                  :key="period"
                  class="button is-small"
                  :class="{ 'is-primary': selectedPeriod === period }"
                  @click="() => {
                    selectedPeriod = period as 'daily' | '3' | '3000';
                    refreshEarningsHistory();
                  }"
                >
                  {{ period === 'daily' ? 'Daily (30D)' : (period === '3000' ? 'All time' : `${period}M`) }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="!loadingHistory && chartData" style="height: 100%;">
            <Bar
              v-if="chartData.labels.length"
              :data="chartData"
              :options="chartOptions"
              style="padding-top: 10px; height: 350px;"
            />
            <p v-else class="has-text-centered mt-6">No earnings data for the selected period.</p>
          </div>
          <progress
            v-else-if="loadingHistory"
            class="progress is-small is-info"
            max="100"
          >
          </progress>
          <p v-else>No earnings data available.</p>
        </div>
      </div>
    </div>


  </div>
  <!-- Moved Earnings History Section End -->

  <h3 class="title is-4 mt-5 mb-4">Info</h3>
  <div class="box">
    <!-- Quick Details Compact Grid -->
    <div class="content mb-5">
      <div class="columns is-multiline is-variable is-0 no-padding is-justify-content-flex-start mb-0">
        <!-- General Account Info -->
        <GeneralInfo v-if="activeAddress" :address="activeAddress" />
        <!-- Host Info -->
        <HostInfo v-if="activeAddress" :address="activeAddress" />
      </div>
    </div>
  </div>
  
  <!-- Benchmark Histograms -->
  <div class="columns" v-if="activeAddress && nodeSpecs && benchmarkMarketId">
    <div class="column is-6">
      <NodeBenchmarkHistogram
        title="LLM Performance"
        type="llm"
        :node-id="activeAddress"
        :market-id="benchmarkMarketId"
        default-metric="averageTokensPerSecond"
        :metrics="[
          { value: 'averageTokensPerSecond', label: 'Tokens / Second' },
          { value: 'avgClockSpeed', label: 'Clock Speed (MHz)' },
          { value: 'avgWattage', label: 'Power Usage (W)' },
          { value: 'avgTemperature', label: 'Temperature (°C)' },
        ]"
        x-axis-label="Concurrent Users"
      />
    </div>
    <div class="column is-6">
      <NodeBenchmarkHistogram
        title="Image Generation Performance"
        type="image-gen"
        :node-id="activeAddress"
        :market-id="benchmarkMarketId"
        default-metric="imagesPerSecond"
        :metrics="[
          { value: 'imagesPerSecond', label: 'Images / Second' },
          { value: 'avgClockSpeed', label: 'Clock Speed (MHz)' },
          { value: 'avgWattage', label: 'Power Usage (W)' },
          { value: 'avgTemperature', label: 'Temperature (°C)' },
        ]"
        x-axis-label="Batch Size"
      />
    </div>
  </div>
  
  <!-- Deployments ran list moved from HostInfo to here -->
  <div class="box mt-5" v-if="activeAddress">
    <DeploymentList
      :per-page="jobLimit"
      :total-jobs="totalRunJobs"
      v-model:page="jobPage"
      v-model:state="jobState"
      :loading-jobs="loadingJobs"
      title="Deployments Ran"
      :jobs="jobs?.jobs || []"
      :states="[1, 2]"
    />
  </div>
</template>

<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";
import { useStake } from "~/composables/useStake";
import { useAPI } from "~/composables/useAPI";
import { computed, ref, onMounted, watch, nextTick } from 'vue';
import { Bar } from 'vue-chartjs';
import GeneralInfo from "~/components/Info/GeneralInfo.vue";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';
import ArrowUpIcon from '@/assets/img/icons/arrow-up.svg?component';
import ArrowDownIcon from '@/assets/img/icons/arrow-down.svg?component';
import HostInfo from "~/components/Info/HostInfo.vue";
import DeploymentList from "~/components/List/DeploymentList.vue";
import NodeBenchmarkHistogram from "~/components/BenchmarkHistogram.vue";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const { openWalletModal } = useLoginModal();

const { connected, publicKey } = useWallet();
const { status, data: userData } = useAuth();
const { nosana } = useSDK();

// Get active address (either wallet or Google-generated)
const activeAddress = computed(() => {
  if (status.value === 'authenticated' && userData.value?.generatedAddress) {
    return userData.value.generatedAddress;
  }
  if (connected.value && publicKey.value) {
    return publicKey.value.toString();
  }
  return null;
});

// Check if user should be prompted for wallet connection
const shouldPromptWalletConnection = computed(() => {
  return !connected.value && status.value !== 'authenticated';
});

// Watch for when user accesses the page without wallet connection
const route = useRoute();
watch(shouldPromptWalletConnection, (shouldPrompt) => {
  if (shouldPrompt) {
    openWalletModal(route.fullPath);
  }
}, { immediate: true });

// Get balances
const balance = ref<any | null>(null);
const nosStaked = ref<any | null>(null);
const loading = ref(false);

// Get NOS price
const { data: stats } = useAPI("/api/stats");
const nosPrice = computed(() => stats.value?.price || null);

// Fetch balances
const checkBalances = async () => {
  loading.value = true;
  try {
    if (activeAddress.value) {
      balance.value = await nosana.value.solana.getNosBalance(
        activeAddress.value
      );
      try {
        nosStaked.value = await nosana.value.stake.get(
          activeAddress.value
        );
      } catch (error) {
        nosStaked.value = null;
      }
    }
  } catch (error) {
    console.error("Error fetching balances:", error);
  }
  loading.value = false;
};

// --- Earnings History ---
// Define type for earnings history results item
interface MonthlyResult {
  period: string;
  total_usd: number;
  breakdown: Array<{ market: string; totalEarnedUsd: number }>; // Note: totalEarnedUsd instead of totalSpent
  daily_breakdown?: Record<string, Record<string, number>>;
}

// API call for earnings history
const selectedPeriod = ref<'daily' | '3' | '3000'>('3000');
const earningsHistoryEndpoint = computed(() => {
  if (!activeAddress.value) return undefined;
  
  const today = new Date();
  const minStartDate = new Date('2025-01-14');
  let calculatedStartDate: Date;
  let groupBy: 'day' | 'month' = 'month';

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (selectedPeriod.value === 'daily') {
    groupBy = 'day';
    calculatedStartDate = new Date(today);
    calculatedStartDate.setDate(today.getDate() - 30);
  } else {
    groupBy = 'month';
    const monthsAgo = selectedPeriod.value === '3000' ? 999 : parseInt(selectedPeriod.value);
    calculatedStartDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo + 1, 1);
  }

  const finalStartDate = new Date(Math.max(calculatedStartDate.getTime(), minStartDate.getTime()));

  return `/api/stats/earning-history?address=${activeAddress.value}&start_date=${formatDate(finalStartDate)}&group_by=${groupBy}`;
});

const {
  data: earningsHistory,
  pending: loadingEarnings,
  refresh: refreshEarningsHistory
} = useAPI(() => {
  const endpoint = earningsHistoryEndpoint.value;
  if (!endpoint) {
    return '';
  }
  return endpoint;
}, {
  default: () => ({
    nodeAddress: '',
    startDate: '',
    endDate: '',
    groupBy: '',
    results: [],
    forecast: 0,
    comparison: null,
    sameDayComparison: null
  }),
  immediate: true,
  watch: false
});

const loadingHistory = computed(() => loadingEarnings.value); // Main loading state for chart

// --- Computed Stats for Status Boxes (Raw from API) ---
const totalEarnedAllTime = computed(() => {
  return earningsHistory.value?.totalEarnedAllTime || 0;
});

const earnedThisMonth = computed(() => {
  return earningsHistory.value?.sameDayComparison?.currentMonthEarned || 0;
});

const forecastAmount = computed(() => {
  return earningsHistory.value?.forecast || 0;
});

const pctChangeSoFar = computed(() => {
  return earningsHistory.value?.sameDayComparison?.pctChangeSoFar ?? null;
});

const pctChangeForecastFromLastMonth = computed(() => {
  return earningsHistory.value?.comparison?.pctChange ?? null;
});

// --- Persistent Refs for Display --- //
const displayedEarnedThisMonth = ref(0);
const displayedForecastAmount = ref(0);
const displayedPctChangeSoFar = ref<number | null>(null);
const displayedPctChangeForecast = ref<number | null>(null);

// Watcher to update displayed values only for monthly periods
watch(earningsHistory, (newData) => {
  // Always update total earned
  // totalEarnedAllTime is computed directly, no need to persist

  // Only update forecast/comparison if the data isn't from the daily view
  if (selectedPeriod.value !== 'daily') {
    displayedEarnedThisMonth.value = newData?.sameDayComparison?.currentMonthEarned || 0;
    displayedForecastAmount.value = newData?.forecast || 0;
    displayedPctChangeSoFar.value = newData?.sameDayComparison?.pctChangeSoFar ?? null;
    displayedPctChangeForecast.value = newData?.comparison?.pctChange ?? null;
  }
}, { immediate: true }); // Immediate: run once on load

// --- End Computed Stats & Persistent Refs ---

// Remove markets API call as it's no longer needed for single-color chart
// const { data: marketsData } = useAPI('/api/markets', { default: () => [] });

// Remove predefined colors as we use a single color now
// const GPU_COLORS: Record<string, string> = { ... };

// Remove market mapping as it's no longer needed
// const marketAddressToInfo = computed(() => { ... });

// Transform earnings history for single-color stacked bar chart
const chartData = computed(() => {
  if (!earningsHistory.value?.results && !loadingEarnings.value) {
    return { labels: [], datasets: [] };
  }
   if (!earningsHistory.value?.startDate) {
    return { labels: [], datasets: [] };
  }

  // --- Generate Labels and Map --- //
  const allLabels: string[] = [];
  const periodToIndexMap: { [key: string]: number } = {};
  const today = new Date();
  const minStartDate = new Date('2025-01-14T00:00:00Z'); // Use UTC for consistency

  if (selectedPeriod.value === 'daily') {
    let currentDate = new Date();
    currentDate.setDate(today.getDate() - 29); // Start from 29 days ago

    // Ensure daily view doesn't go before minStartDate either
    let loopStartDate = new Date(Math.max(currentDate.getTime(), minStartDate.getTime()));

    let index = 0;
    while(loopStartDate <= today) {
      const month = (loopStartDate.getMonth() + 1).toString().padStart(2, '0');
      const day = loopStartDate.getDate().toString().padStart(2, '0');
      const label = `${month}/${day}`;
      allLabels.push(label);

      const periodKey = loopStartDate.toISOString().split('T')[0]; // YYYY-MM-DD
      periodToIndexMap[periodKey] = index++;

      loopStartDate.setDate(loopStartDate.getDate() + 1); // Move to the next day
    }

  } else {
    // Monthly label generation
    let calculatedChartStartDate: Date;
    const monthsAgo = selectedPeriod.value === '3000' ? 999 : parseInt(selectedPeriod.value);
    calculatedChartStartDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo + 1, 1);

    // Ensure the start date for label generation also respects the minimum date
    // Set to the start of the month for the minimum date
    const effectiveMinMonthStart = new Date(minStartDate.getFullYear(), minStartDate.getMonth(), 1);
    let loopStartDate = new Date(Math.max(calculatedChartStartDate.getTime(), effectiveMinMonthStart.getTime()));

    let index = 0;
    while (
      loopStartDate.getFullYear() < today.getFullYear() ||
      (loopStartDate.getFullYear() === today.getFullYear() && loopStartDate.getMonth() <= today.getMonth())
    ) {
      const year = loopStartDate.getFullYear();
      const month = loopStartDate.getMonth();
      const label = loopStartDate.toLocaleDateString('en-US', { month: 'short' }).replace(',', '');
      allLabels.push(label);
      const periodKey = `${year}-${(month + 1).toString().padStart(2, '0')}`; // YYYY-MM
      periodToIndexMap[periodKey] = index++;
      loopStartDate.setMonth(loopStartDate.getMonth() + 1);
    }
  }
  // --- End Label Generation ---

  // Prepare data points array initialized with zeros
  const dataPoints = new Array(allLabels.length).fill(0);

  // Populate data points from API results
  (earningsHistory.value?.results || []).forEach((item: MonthlyResult) => {
    // period key will be YYYY-MM-DD for daily, YYYY-MM for monthly
    const periodKey = item.period;
    const index = periodToIndexMap[periodKey];
    if (index !== undefined) {
      dataPoints[index] = item.total_usd;
    }
  });

  // Define Nosana green color and a slightly brighter version for hover
  const nosanaGreen = '#10E80C';
  const nosanaGreenHover = '#33ff33'; // Simple brighter green

  // Create a single dataset for total earnings
  const dataset = {
    label: 'Total Earnings',
    data: dataPoints,
    backgroundColor: nosanaGreen,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    hoverBackgroundColor: nosanaGreenHover,
    hoverBorderColor: 'white',
  };

  return {
    labels: allLabels, // Use the generated labels
    datasets: [dataset],
    _internalPeriodMap: periodToIndexMap
  };
});

// Remove unused helper functions
// function getColorForMarket(...) { ... }
// function makeColorBrighter(...) { ... }

// Chart options (adapted for single dataset earnings)
const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2,
    layout: {
      padding: {
        left: 5,
        right: 10,
        top: 20,
        bottom: 5
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
           fontFamily: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          size: 14,
          weight: 'normal' as const,
          lineHeight: 1.4
        },
        titleColor: '#ffffff',
        bodyFont: {
           fontFamily: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          size: 13,
          lineHeight: 1.4
        },
        bodyColor: '#ffffff',
        padding: 12,
        cornerRadius: 4,
        displayColors: false,
        boxPadding: 4,
        callbacks: {
          title: function(tooltipItems: any) {
             const index = tooltipItems[0].dataIndex;
             const labels = chartData.value.labels; // Access labels directly
             const periodMap = chartData.value._internalPeriodMap; // Access map

             // Ensure periodMap exists before using it
             const periodKey = periodMap ? Object.keys(periodMap).find(key => periodMap[key] === index) : undefined;

            if (selectedPeriod.value === 'daily' && periodKey) {
               try {
                  const date = new Date(periodKey + 'T00:00:00Z');
                  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' , timeZone: 'UTC'});
              } catch (e) {
                   console.error("Error formatting daily tooltip title:", e);
                  return labels[index];
              }
            } else {
              return labels[index];
            }
          },
          label: function(context: any) {
            const earned = context.parsed.y;
            return `Total Earned: $${earned.toFixed(2)}`;
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
           font: {
            fontFamily: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            size: 13,
            weight: 'normal' as const,
            lineHeight: 1.2
          },
          color: '#000000',
          padding: 8
        },
        border: {
          width: 0,
          color: 'transparent'
        }
      },
      y: {
        grid: {
          color: '#e5e5e5',
          drawBorder: false,
          lineWidth: 0.5,
          tickLength: 4,
          display: true,
          drawTicks: true,
          drawOnChartArea: true,
          count: 5
        },
        border: {
          width: 0,
          color: 'transparent'
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value;
          },
          font: {
             fontFamily: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            size: 12,
            weight: 'normal' as const,
            lineHeight: 1.2
          },
          color: '#000000',
          maxTicksLimit: 5,
          padding: 10
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false,
        borderWidth: 1,
      }
    },
     barPercentage: 0.95,
    categoryPercentage: 0.95,
    animation: {
      duration: 800
    }
  };
});

// Job list data - moved from HostInfo
const jobPage = ref(1);
const jobState = ref<number | null>(null);
const jobStateMapping = {
  0: "QUEUED",
  1: "RUNNING",
  2: "COMPLETED",
  3: "STOPPED",
};
const jobLimit = ref(10);

const jobsUrl = computed(() => {
  if (!activeAddress.value) return null;
  
  return `/api/jobs?limit=${jobLimit.value}&offset=${
    (jobPage.value - 1) * jobLimit.value
  }${jobState.value !== null ? `&state=${jobStateMapping[jobState.value as keyof typeof jobStateMapping]}` : ""}${
    "&node=" + activeAddress.value
  }`;
});

interface JobsResponse {
  totalJobs: number;
  jobs: any[];
}

const initialJobsLoadInitiated = ref(false);
const { data: jobs, pending: loadingJobs, refresh: refreshJobs, error: jobsError } = useAPI(
  () => {
    const url = jobsUrl.value;
    if (!url) {
      return '';
    }
    initialJobsLoadInitiated.value = true;
    return url;
  },
  { 
    watch: [jobsUrl], 
    default: () => ({ totalJobs: 0, jobs: [] }),
    immediate: false
  }
);

const totalRunJobs = computed(() => {
  return jobs.value?.totalJobs ?? undefined;
});

// Node specs data for benchmark
const nodeSpecsUrl = computed(() => activeAddress.value ? `/api/nodes/${activeAddress.value}/specs` : '');

const { data: nodeSpecs, pending: loadingNodeSpecs } = useAPI(
  nodeSpecsUrl,
  {
    // @ts-ignore // Add ignore for custom option
    disableToastOnError: true,
    watch: [nodeSpecsUrl],
    default: () => null
  }
);

// Create a ref to store the market relation result
const marketRelationId = ref<string | null>(null);

// Define a function to fetch the market relation
async function fetchMarketRelation() {
  if (
    nodeSpecs.value?.status === "ONBOARDED" &&
    nodeSpecs.value.marketAddress &&
    activeAddress.value
  ) {
    try {
      const { data } = await useAPI(
        `/api/nodes/market-relation?market=${nodeSpecs.value.marketAddress}`
      );
      if (data && data.value) {
         marketRelationId.value = data.value;
      } else {
         marketRelationId.value = null;
         console.warn("Market relation API did not return expected data:", data);
      }
    } catch (err) {
      console.error("Error fetching market relation:", err);
       marketRelationId.value = null;
    }
  } else {
      marketRelationId.value = null;
  }
}

watch(
  nodeSpecs,
  (newSpecs) => {
    marketRelationId.value = null;
    if (newSpecs && newSpecs.status === "ONBOARDED" && newSpecs.marketAddress) {
      fetchMarketRelation();
    }
  },
  { immediate: true, deep: true }
);

const benchmarkMarketId = computed(() => {
  if (!nodeSpecs.value || !nodeSpecs.value.marketAddress) {
    return undefined;
  }
  if (nodeSpecs.value.status === "ONBOARDED") {
     return marketRelationId.value ?? undefined;
  }
  return nodeSpecs.value.marketAddress;
});

// Add watcher for activeAddress to trigger initial fetch
watch([activeAddress, selectedPeriod], ([newAddress, newPeriod]) => {
  if (newAddress && earningsHistoryEndpoint.value) {
    // Add a small delay to ensure reactive dependencies are settled
    nextTick(() => {
      refreshEarningsHistory();
    });
  }
}, { immediate: true });

// Modify the activeAddress watcher to check the flag
watch(activeAddress, (newAddress) => {
  if (newAddress && !initialJobsLoadInitiated.value) {
    console.log('Address available and initial load not started, refreshing jobs...');
    nextTick(() => {
      refreshJobs();
    });
  }
}, { immediate: true });

// Modify the onMounted to check the flag
onMounted(() => {
  checkBalances();
  const style = document.createElement('style');
  style.textContent = `
    canvas {
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `;
  document.head.appendChild(style);

  if (activeAddress.value && !initialJobsLoadInitiated.value) {
    nextTick(() => {
      refreshJobs();
    });
  }
});
</script>
<style scoped>
.heading {
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 600;
  color: #7a7a7a;
  margin-bottom: 0.5rem;
}

.title {
  font-size: 1.5rem;
  margin-bottom: 1rem !important;
}

.box {
  min-height: 120px;
}

.box .content {
  flex: 1;
}

.box[style*="height: 400px"] { 
  padding: 1.5rem; 
}

.buttons.has-addons .button {
  border-radius: 4px; 
}
.buttons.has-addons .button:not(:last-child) {
  border-right: none;
  margin-right: -1px;
}
.buttons.has-addons .button:first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.buttons.has-addons .button:last-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.buttons.has-addons .button.is-primary {
  z-index: 1; 
}

/* Quick Details specific styling */
.quick-detail-item {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .quick-detail-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #7a7a7a;
    text-transform: uppercase;
    margin-bottom: 0.1rem;
  }

  .quick-detail-value {
    font-size: 0.85rem;
    font-weight: 500;
    color: #363636;
    word-break: break-word;

    .icon-text {
      color: #363636;
    }
  }
}

.no-padding {
  padding: 0 !important;
}

html.dark-mode {
  .quick-detail-item {
    .quick-detail-label {
      color: #b0b0b0;
    }

    .quick-detail-value,
    .quick-detail-value .icon-text {
      color: #ffffff;
    }
  }
}
</style>