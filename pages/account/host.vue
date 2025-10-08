<template>
  <TopBar :title="'Host'" :subtitle="'Welcome to your dedicated Host Earnings and Performance page'">
  </TopBar>

  <div class="columns">
    <div class="column is-4">
      <!-- <h3 class="title is-4 mt-5 mb-4">Earnings</h3> -->
      <div class="columns is-multiline mb-4">
        <div class="column is-12">
          <div class="box has-text-centered" style="height: 100%;">
            <p class="heading">Current Month</p>
            <p class="title is-4 mb-1" v-if="!loadingHistory">
              ${{ earnedThisMonthCombined.toFixed(2) }}
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
            <p class="heading">Forecasted Monthly
              <span
                class="has-tooltip-arrow"
                data-tooltip="This is a forecast of what your earnings will be for the rest of the month based on your earnings this month so far."
                style="font-weight: normal; text-transform: none; letter-spacing: normal;"
              >
              <img
                src="~/assets/img/icons/info.svg"
                style="height: 0.8rem; vertical-align: top;"
                alt="Info"
              />
            </span>

            </p>
            <p class="title is-4 mb-1" v-if="!loadingHistory" style="height: 100%;">
              ${{ forecastAmountCombined.toFixed(2) }}
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
              ${{ totalEarnedAllTimeCombined.toFixed(2) }}
            </p>
            <p class="title is-flex is-align-items-center is-justify-content-center" v-else>-</p>
          </div>  
        </div>

      </div>
    </div>
    <!-- Moved Earnings History Section Start -->
    <div class="column is-8">
      <!-- <h3 class="title is-4 mt-5 mb-4">History</h3> -->
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
                    refreshEarningsHistoryData();
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

  <!-- Uptime Container -->
  <div 
    class="box mt-5" 
    v-if="publicKey && nodeSpecs && (
      (nodeSpecs.claimableUptimeNosRewards && nodeSpecs.claimableUptimeNosRewards > 0) ||
      (nodeSpecs.totalClaimedUptimeNosRewards && nodeSpecs.totalClaimedUptimeNosRewards > 0) ||
      nodeSpecs.marketAddress === 'Ekro9NTNqLbnMkN7x7y2rY9AeTkazcHj2PPaTxT1Cogz'
    )"
  >
    <UptimeChart :node-address="publicKey.toString()" />

    <hr class="my-4">
    <UptimeRewards 
      v-if="nodeSpecs"
      :node-specs="nodeSpecs"
      :loading-node-specs="loadingNodeSpecs"
      :connected="connected"
      :public-key="publicKey"
      :wallet="wallet"
      @refresh-node-specs="refreshNodeSpecs"
    />
  </div>

  <!-- <h3 class="title is-4 mt-5 mb-4">Info</h3> -->
  <div class="box">
    <!-- Quick Details Compact Grid -->
    <div class="content mb-5">
      <div class="columns is-multiline is-variable is-0 no-padding is-justify-content-flex-start mb-0">
        <!-- General Account Info -->
        <GeneralInfo v-if="activeAddress" :address="activeAddress" />
        <!-- Host Info -->
        <div class="column is-full">
          <h4 class="subtitle is-5 mb-3">Host Details</h4>
        </div>
        <HostInfo v-if="activeAddress" 
          :address="activeAddress"
          :node-specs="nodeSpecs"
          :node-info="nodeInfo"
          :node-ranking="nodeRanking"
          :loading-node-specs="loadingNodeSpecs" 
          :loading-node-info="loadingNodeInfo"
          :loading-node-ranking="loadingNodeRanking"
        />

        <div class="column is-full">
          <hr class="my-4">
        </div>

        <!-- System Specifications Section -->
        <div class="column is-full">
          <h4 class="subtitle is-5 mb-3">System Specifications</h4>
        </div>
        <HostSpecifications v-if="publicKey && combinedSpecs" 
          :specs="combinedSpecs" 
          :node-ranking="nodeRanking" 
          :loading-node-specs="loadingNodeSpecs"
        />
        <div v-else-if="publicKey && (loadingNodeSpecs || loadingNodeInfo )" class="column is-full">
          <p>Loading system specifications...</p>
        </div>
        <div v-else-if="publicKey" class="column is-full">
          <p>System specifications are not available for this account.</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Template Performance Comparison -->
  <div v-if="activeAddress && nodeSpecs">
    <TemplatePerformanceChart
      title="Template Performance Comparison"
      :node-id="activeAddress"
      default-metric="tokensPerSecond"
    />
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
import DeploymentList from '~/components/List/DeploymentList.vue';
import TemplatePerformanceChart from "~/components/TemplatePerformanceChart.vue";
import UptimeChart from "~/components/UptimeChart.vue";
import UptimeRewards from "~/components/UptimeRewards.vue";
import HostSpecifications from "~/components/Info/HostSpecifications.vue";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const { openWalletModal } = useLoginModal();

const { connected, publicKey, wallet } = useWallet();
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
  watch: [earningsHistoryEndpoint]
});

// --- Uptime Earnings ---
const uptimeEarningsEndpoint = computed(() => {
  if (!activeAddress.value) return undefined;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const minStartDate = new Date("2025-01-14");
  let calculatedStartDate: Date;

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  if (selectedPeriod.value === "daily") {
    calculatedStartDate = new Date(today);
    calculatedStartDate.setDate(today.getDate() - 30);
  } else {
    const monthsAgo =
      selectedPeriod.value === "3000" ? 999 : parseInt(selectedPeriod.value);
    calculatedStartDate = new Date(
      today.getFullYear(),
      today.getMonth() - monthsAgo + 1,
      1
    );
  }

  const finalStartDate = new Date(
    Math.max(calculatedStartDate.getTime(), minStartDate.getTime())
  );
  const endDateString = formatDate(yesterday);
  const startDateString = formatDate(finalStartDate);

  return `/api/nodes/heartbeats/uptime/${activeAddress.value}?startDate=${startDateString}&endDate=${endDateString}`;
});

const {
  data: uptimeEarnings,
  pending: loadingUptimeEarnings,
  refresh: refreshUptimeEarnings,
} = useAPI(
  () => {
    const endpoint = uptimeEarningsEndpoint.value;
    if (!endpoint) {
      return "";
    }
    return endpoint;
  },
  {
    default: () => [],
    immediate: true,
    watch: [uptimeEarningsEndpoint],
  }
);

const loadingHistory = computed(() => loadingEarnings.value || loadingUptimeEarnings.value); // Main loading state for chart

// Update refresh function to refresh both datasets
const refreshEarningsHistoryData = () => {
  refreshEarningsHistory();
  refreshUptimeEarnings();
};

// --- Computed Stats for Status Boxes (Raw from API) ---
const totalEarnedAllTime = computed(() => {
  return earningsHistory.value?.totalEarnedAllTime || 0;
});

const earnedThisMonth = computed(() => {
  return earningsHistory.value?.currentMonth?.currentMonthEarned || 0;
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

// --- Uptime Earnings Computed Properties ---
const uptimeEarningsAllTime = computed(() => {
  if (!uptimeEarnings.value || !Array.isArray(uptimeEarnings.value)) {
    return 0;
  }
  return uptimeEarnings.value.reduce((total, item) => {
    return total + (parseFloat(item.usdAmount) || 0);
  }, 0);
});

const uptimeEarningsThisMonth = computed(() => {
  if (!uptimeEarnings.value || !Array.isArray(uptimeEarnings.value)) {
    return 0;
  }
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  return uptimeEarnings.value.reduce((total, item) => {
    if (item.dayStart) {
      const itemDate = new Date(item.dayStart + 'T00:00:00Z');
      if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) {
        return total + (parseFloat(item.usdAmount) || 0);
      }
    }
    return total;
  }, 0);
});

const uptimeEarningsForecasted = computed(() => {
  // Calculate average daily uptime earnings from current month and project for full month
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysPassed = today.getDate();
  
  if (daysPassed === 0) return 0;
  
  const avgDailyUptimeEarnings = uptimeEarningsThisMonth.value / daysPassed;
  return avgDailyUptimeEarnings * daysInMonth;
});

// --- Combined Totals ---
const totalEarnedAllTimeCombined = computed(() => {
  return totalEarnedAllTime.value + uptimeEarningsAllTime.value;
});

const earnedThisMonthCombined = computed(() => {
  return earnedThisMonth.value + uptimeEarningsThisMonth.value;
});

const forecastAmountCombined = computed(() => {
  return forecastAmount.value + uptimeEarningsForecasted.value;
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

// Transform earnings history for multi-dataset stacked bar chart
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

  // Prepare data points arrays initialized with zeros
  const deploymentEarningsData = new Array(allLabels.length).fill(0);
  const uptimeEarningsData = new Array(allLabels.length).fill(0);

  // Populate deployment earnings data points from API results
  (earningsHistory.value?.results || []).forEach((item: MonthlyResult) => {
    // period key will be YYYY-MM-DD for daily, YYYY-MM for monthly
    const periodKey = item.period;
    const index = periodToIndexMap[periodKey];
    if (index !== undefined) {
      deploymentEarningsData[index] = item.total_usd;
    }
  });

  // Populate uptime earnings data points
  if (uptimeEarnings.value && Array.isArray(uptimeEarnings.value)) {
    if (selectedPeriod.value === "daily") {
      // For daily view, use dayStart directly
      uptimeEarnings.value.forEach((item: any) => {
        if (item.dayStart && item.usdAmount) {
          const periodKey = item.dayStart; // YYYY-MM-DD format
          const index = periodToIndexMap[periodKey];
          if (index !== undefined) {
            uptimeEarningsData[index] = parseFloat(item.usdAmount);
          }
        }
      });
    } else {
      // For monthly view, aggregate by month
      const monthlyUptimeMap: { [key: string]: number } = {};
      uptimeEarnings.value.forEach((item: any) => {
        if (item.dayStart && item.usdAmount) {
          const monthKey = item.dayStart.substring(0, 7); // YYYY-MM
          monthlyUptimeMap[monthKey] =
            (monthlyUptimeMap[monthKey] || 0) + parseFloat(item.usdAmount);
        }
      });

      Object.entries(monthlyUptimeMap).forEach(([monthKey, totalUsd]) => {
        const index = periodToIndexMap[monthKey];
        if (index !== undefined) {
          uptimeEarningsData[index] = totalUsd;
        }
      });
    }
  }

  // Define colors
  const nosanaGreen = '#10E80C';
  const nosanaGreenHover = '#33ff33';
  const uptimeBlue = '#3273dc';
  const uptimeBlueHover = '#5a9cff';

  // Create datasets
  const datasets = [
    {
      label: 'Deployment Earnings',
      data: deploymentEarningsData,
      backgroundColor: nosanaGreen,
      borderColor: 'rgba(255, 255, 255, 0.7)',
      borderWidth: 1,
      hoverBackgroundColor: nosanaGreenHover,
      hoverBorderColor: 'white',
    }
  ];

  // Only add Uptime Earnings dataset if there are actual uptime earnings
  if (uptimeEarningsAllTime.value > 0) {
    datasets.push({
      label: 'Uptime Rewards',
      data: uptimeEarningsData,
      backgroundColor: uptimeBlue,
      borderColor: 'rgba(255, 255, 255, 0.7)',
      borderWidth: 1,
      hoverBackgroundColor: uptimeBlueHover,
      hoverBorderColor: 'white',
    });
  }

  return {
    labels: allLabels,
    datasets,
    _internalPeriodMap: periodToIndexMap
  };
});

// Chart options (adapted for single dataset earnings)
const chartOptions = computed(() => {
  const { $colorMode } = useNuxtApp();
  const isDark = $colorMode?.value === 'dark';
  const textColor = isDark ? '#ffffff' : '#000000';
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2,
    interaction: {
      mode: 'index',
      intersect: false
    },
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
        display: true,
        position: 'top' as const,
        labels: {
          color: textColor,
          font: {
            fontFamily: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            size: 12,
            weight: 'normal' as const,
          },
          usePointStyle: true,
          pointStyle: 'rect',
          padding: 20,
        }
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
        displayColors: true,
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
            return `${context.dataset.label}: $${earned.toFixed(2)}`;
          },
          afterBody: function(tooltipItems: any) {
            const totalEarned = tooltipItems.reduce((sum: number, item: any) => sum + item.parsed.y, 0);
            return [`Total: $${totalEarned.toFixed(2)}`];
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        stacked: true,
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
          color: textColor,
          padding: 8
        },
        border: {
          width: 0,
          color: 'transparent'
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: isDark ? '#444444' : '#e5e5e5',
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
          color: textColor,
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

const { data: nodeSpecs, pending: loadingNodeSpecs, refresh: refreshNodeSpecs } = useAPI(
  nodeSpecsUrl,
  {
    watch: [nodeSpecsUrl],
    default: () => null
  }
);

// NEW: Node Info (public node API)
const nodeInfoUrl = computed(() => {
  if (!publicKey.value || !nodeSpecs.value) return ''; // Fetch only if we have publicKey and potentially valid nodeSpecs
  return `https://${publicKey.value.toString()}.${useRuntimeConfig().public.nodeDomain}/node/info`;
});
const { data: nodeInfo, pending: loadingNodeInfo } = useAPI(
  nodeInfoUrl,
  {
    immediate: false,
    onRequestError: () => ({ info: null }),
    onResponseError: () => ({ info: null }),
    default: () => null,
    watch: [nodeInfoUrl]
  }
);

// NEW: Node Ranking
interface NodeRanking {
  node: string;
  participationRate: number;
  uptimePercentage: number;
}
const nodeRankingUrl = computed(() => {
  if (!publicKey.value || !nodeSpecs.value?.marketAddress) return '';
  return `/api/benchmarks/node-report?node=${publicKey.value.toString()}`;
});
const { data: nodeRanking, pending: loadingNodeRanking } = useAPI(
  nodeRankingUrl,
  {
    default: () => null,
    watch: [nodeRankingUrl]
  }
);

// NEW: Combined Specs (moved from HostInfo.vue, adapted for host.vue context)
const combinedSpecs = computed(() => {
  if (!publicKey.value || !nodeSpecs.value) return null;

  const nodeInfoData = nodeInfo.value?.info;

  return {
    nodeAddress: publicKey.value.toString(),
    marketAddress: nodeSpecs.value.marketAddress,
    ram: nodeInfoData?.ram_mb
      ? Math.round(nodeInfoData.ram_mb)
      : nodeSpecs.value.ram ? Math.round(Number(nodeSpecs.value.ram)) : 0,
    diskSpace: nodeInfoData?.disk_gb
      ? Math.round(Number(nodeInfoData.disk_gb))
      : nodeSpecs.value.diskSpace ? Math.round(Number(nodeSpecs.value.diskSpace)) : 0,
    cpu: nodeInfoData?.cpu?.model ?? nodeSpecs.value.cpu,
    country: nodeInfoData?.country ?? nodeSpecs.value.country,
    download: nodeSpecs.value.avgDownload10,
    upload: nodeSpecs.value.avgUpload10,
    ping: nodeSpecs.value.avgPing10,
    gpus: nodeInfoData?.gpus?.devices
      ? nodeInfoData.gpus.devices.map((gpu: any) => ({
          gpu: gpu.name,
          memory: gpu.memory?.total_mb,
          architecture: gpu.network_architecture 
            ? `${gpu.network_architecture.major}.${gpu.network_architecture.minor}` 
            : undefined,
        }))
      : nodeSpecs.value.gpus,
    cudaVersion:
      nodeInfoData?.gpus?.cuda_driver_version ?? nodeSpecs.value.cudaVersion,
    nvmlVersion:
      nodeInfoData?.gpus?.nvml_driver_version ?? nodeSpecs.value.nvmlVersion,
    nodeVersion: nodeInfoData?.version ?? nodeSpecs.value.nodeVersion,
    systemEnvironment: nodeInfoData?.system_environment
      ? nodeInfoData.system_environment.toLowerCase().includes("wsl")
        ? "WSL"
        : nodeInfoData.system_environment
          ? "Linux"
          : null
      : nodeSpecs.value.systemEnvironment
        ? nodeSpecs.value.systemEnvironment.toLowerCase().includes("wsl")
          ? "WSL"
          : "Linux"
        : null,
  };
});

// Market relation logic (already existing)
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