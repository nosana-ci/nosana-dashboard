<template>
  <div>
    <TopBar 
      :title="'My Account'"
      :subtitle="'Your personal overview'" 
      ref="topBar"
      v-model="showSettingsModal"
    >
    </TopBar>
    <div class="container">
      <div v-if="connected">
        <h3 class="title is-4 mb-4">Status</h3>
        <AccountStatusCards
          :total-deployments="totalDeployments"
          :balance="balance"
          :nos-price="nosPrice"
          :nos-staked="nosStaked"
          :pending-rewards="pendingRewards"
          :claiming-rewards="claimingRewards"
          @claim-rewards="claimRewards"
        >
          <template #deployments-icon>
            <RocketIcon style="width: 16px; height: 16px; fill: #10E80C; margin-right: 0.5rem;" />
          </template>
          <template #stake-link>
            <nuxt-link to="/stake" class="ml-2">
              <span class="container-icon" style="background-color: white; border: 1px solid #dbdbdb; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                <PlusSymbolIcon style="width: 12px; height: 12px; transition: fill 0.2s ease;" />
              </span>
            </nuxt-link>
          </template>
        </AccountStatusCards>
        <h3 class="title is-4 mb-7">Deployments</h3>
        <ListDeploymentsList :items-per-page="10" class="mb-6 deployments-list" @update:total-deployments="totalDeployments = $event" />
        <div class="columns mt-6">
          <div class="column is-4">
            <h3 class="title is-4 mb-4">Welcome to Nosana</h3>
            <AccountWelcomeBox>
              <template #deploy-icon>
                <RocketIcon style="width: 16px; height: 16px; fill: #10E80C; margin-right: 0.5rem; margin-top: 4px;" />
              </template>
              <template #docs-icon>
                <ExplorerIcon class="nosana-icon" style="width: 16px; height: 16px; margin-right: 0.5rem; margin-top: 4px;" />
              </template>
              <template #support-icon>
                <SupportIcon class="nosana-icon" style="width: 16px; height: 16px; margin-right: 0.5rem; margin-top: 4px;" />
              </template>
            </AccountWelcomeBox>
          </div>
          <div class="column is-4">
            <h3 class="title is-4 mb-4">Cost and Usage</h3>
            <AccountCostUsage
              :spent-this-month="spentThisMonth"
              :forecast-amount="forecastAmount"
              :pct-change-so-far="pctChangeSoFar"
              :pct-change-forecast-from-last-month="pctChangeForecastFromLastMonth"
              :loading-spending="loadingSpending"
            >
              <template #arrow-up>
                <ArrowUpIcon class="icon is-small mr-1" style="width: 10px; height: 10px; fill: #48c78e;" />
              </template>
              <template #arrow-down>
                <ArrowDownIcon class="icon is-small mr-1" style="width: 10px; height: 10px; fill: #f14668;" />
              </template>
            </AccountCostUsage>
          </div>
          <div class="column is-4">
            <h3 class="title is-4 mb-4">Monthly History</h3>
            <AccountMonthlyHistory
              :chart-data="chartData"
              :chart-options="chartOptions"
              :loading-history="loadingHistory"
              :monthly-history="monthlyHistory"
              :selected-months="selectedMonths"
              @update:selectedMonths="(val: string) => { selectedMonths = val as '3' | '6' | '12'; refreshSpendingHistory(); }"
            />
          </div>
        </div>
      </div>
      <div v-else class="notification is-warning">
        Please connect your wallet to view your account
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ListDeploymentsList from '~/components/List/AccountDeploymentsList.vue';
import { useWallet } from 'solana-wallets-vue';
import { useStake } from '~/composables/useStake';
import { useAPI } from '~/composables/useAPI';
import { computed, ref, onMounted, watch } from 'vue';
import RocketIcon from '@/assets/img/icons/rocket.svg?component';
import ExplorerIcon from '@/assets/img/icons/sidebar/explorer.svg?component';
import SupportIcon from '@/assets/img/icons/sidebar/support.svg?component';
import ArrowUpIcon from '@/assets/img/icons/arrow-up.svg?component';
import ArrowDownIcon from '@/assets/img/icons/arrow-down.svg?component';
import PlusSymbolIcon from '@/assets/img/icons/plus_symbol.svg?component';
import { useToast } from "vue-toastification";
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';
import AccountStatusCards from '~/components/Account/StatusCards.vue';
import AccountWelcomeBox from '~/components/Account/WelcomeBox.vue';
import AccountCostUsage from '~/components/Account/CostUsage.vue';
import AccountMonthlyHistory from '~/components/Account/MonthlyHistory.vue';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);
const showSettingsModal = ref(false);
const toast = useToast();
const { connected, publicKey } = useWallet();
const { nosana } = useSDK();
const claimingRewards = ref(false);
const totalDeployments = ref(0);

// Define type for spending history results item
interface MonthlyResult {
  period: string;
  total_usd: number;
  breakdown: Array<{ market: string; totalSpent: number }>;
  daily_breakdown?: Record<string, Record<string, number>>;
}

// Get balances
const balance = ref<any | null>(null);
const nosStaked = ref<any | null>(null);
const loading = ref(false);

// Get NOS price
const { data: stats } = useAPI('/api/stats');
const nosPrice = computed(() => stats.value?.price || null);

// Get staking info
const { activeStake, rewardsInfo, poolInfo, refreshStake, refreshBalance } = useStake(publicKey);
const timestamp = useTimestamp({ interval: 1000 });

// Calculate pending rewards
const pendingRewards = computed(() => {
  if (rewardsInfo.value?.account && poolInfo.value) {
    const currentReflection = rewardsInfo.value.account.reflection;
    const currentXnos = rewardsInfo.value.account.xnos;
    const totalReflection = rewardsInfo.value.global.totalReflection;
    const totalXnos = rewardsInfo.value.global.totalXnos;
    
    if (totalXnos === 0 || totalReflection === 0) return 0;
    
    const rate = totalReflection / totalXnos;
    if (rate === 0) return 0;
    
    const xnosBalance = currentReflection / rate;
    const pendingReward = Math.max(0, (xnosBalance - currentXnos) / 1e6);
    
    return pendingReward;
  }
  return 0;
});

// Fetch balances
const checkBalances = async () => {
  loading.value = true;
  try {
    if (publicKey.value) {
      balance.value = await nosana.value.solana.getNosBalance(publicKey.value.toString());
      try {
        nosStaked.value = await nosana.value.stake.get(publicKey.value.toString());
      } catch (error) {
        nosStaked.value = null;
      }
    }
  } catch (error) {
    console.error("Error fetching balances:", error);
  }
  loading.value = false;
};

watch(() => publicKey.value, () => {
  checkBalances();
});

onMounted(() => {
  checkBalances();
});

// Modify API calls to use a single endpoint
const selectedMonths = ref<'3' | '6' | '12'>('3');

const spendingHistoryEndpoint = computed(() => {
  if (!publicKey.value) return null;
  
  // Create date based on selected months
  const today = new Date();
  let startDate: Date;
  
  // Use the selected number of months
  const monthsAgo = parseInt(selectedMonths.value);
  startDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
  
  // Format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  return `/api/stats/spending-history?address=${publicKey.value.toString()}&start_date=${formatDate(startDate)}&group_by=month`;
});

const {
  data: spendingHistory,
  pending: loadingSpending,
  refresh: refreshSpendingHistory
} = useAPI(() => spendingHistoryEndpoint.value || '', {
  default: () => ({
    userAddress: '',
    startDate: '',
    endDate: '',
    groupBy: '',
    results: [],
    forecast: 0,
    comparison: null,
    sameDayComparison: null
  })
});

// Compute values for Cost and Usage section
const spentThisMonth = computed(() => {
  if (!spendingHistory.value?.results) return 0;

  const today = new Date();
  const currentYear = today.getFullYear();
  // getMonth() is 0-indexed, so add 1. Pad with '0' if needed.
  const currentMonthFormatted = (today.getMonth() + 1).toString().padStart(2, '0');
  const currentPeriod = `${currentYear}-${currentMonthFormatted}`; // Format: "YYYY-MM"

  const currentMonthData = spendingHistory.value.results.find(
    (item: any) => item.period === currentPeriod
  );

  return currentMonthData ? currentMonthData.total_usd : 0;
});

const monthBreakdown = computed(() => {
  const currentMonth = spendingHistory.value?.results?.[0];
  return currentMonth ? currentMonth.breakdown : [];
});

const forecastAmount = computed(() => {
  return spendingHistory.value?.forecast || 0;
});

const pctChangeSoFar = computed(() => {
  return spendingHistory.value?.sameDayComparison?.pctChangeSoFar ?? null;
});

const pctChangeForecastFromLastMonth = computed(() => {
  return spendingHistory.value?.comparison?.pctChange ?? null;
});

// Watch changes to refresh data
watch(
  [() => publicKey.value, () => selectedMonths.value],
  () => {
    refreshSpendingHistory();
  }
);

// Pass monthly history data to chart
const monthlyHistory = computed(() => spendingHistory.value);
const loadingHistory = computed(() => loadingSpending.value);

// Get markets data for name mapping
const { data: marketsData } = useAPI('/api/markets', { default: () => [] });

// Predefined colors for different GPU types with distinct color scheme
const GPU_COLORS: Record<string, string> = {
  // 3000 Series
  'NVIDIA 3060':     '#16C47F',
  'NVIDIA 3070':     '#FFD65A',
  'NVIDIA 3080':     '#FF9D23',
  'NVIDIA 3090':     '#F93827',
  // 4000 Series
  'NVIDIA 4060':     '#26355D',
  'NVIDIA 4070':     '#AF47D2',
  'NVIDIA 4080':     '#FF8F00',
  'NVIDIA 4090':     '#FFDB00',
  // 5000 Series
  'NVIDIA 5070':     '#6420AA',
  'NVIDIA 5080':     '#FF3EA5',
  'NVIDIA 5090':     '#FF7ED4',
  // Professional Series
  'NVIDIA 4000/A4000':  '#3F0071',
  'NVIDIA 5000/A5000':  '#FB2576',
  'NVIDIA 6000/A6000':  '#332FD0',
  'NVIDIA A40':       '#00FFAB',
  'NVIDIA A100 40GB':  '#14C38E',
  'NVIDIA A100 80GB':  '#B8F1B0',
  'NVIDIA H100':      '#E3FCBF',
};
// Create a mapping of market addresses to names and group info
const marketAddressToInfo = computed(() => {
  if (!marketsData.value) return {};
  return marketsData.value.reduce((acc: Record<string, { name: string, isCommunity: boolean }>, market: any) => {
    if (market.slug?.toLowerCase().includes('nvidia')) {
      acc[market.address] = {
        name: market.name.replace(' Community', ''), // Remove Community suffix
        isCommunity: market.name.includes('Community')
      };
    }
    return acc;
  }, {});
});
// Optionally watch for changes in the wallet or months to auto-refresh
watch(
  () => publicKey.value,
  () => {
    refreshSpendingHistory();
  }
);

// ------------------------
// 3) Transform monthly history for stacked bar chart
// ------------------------
const chartData = computed(() => {
  if (!spendingHistory.value?.results && !loadingSpending.value) {
    // Handle case where there are no results at all, even if not loading
    return { labels: [], datasets: [] };
  }
  if (!spendingHistory.value?.startDate) {
    // Need start date to generate full range if results are empty
    return { labels: [], datasets: [] };
  }

  // --- Generate Full Date Range Labels ---
  const today = new Date();
  let chartStartDate: Date;

  // Calculate start date based on selection
  const monthsAgo = parseInt(selectedMonths.value);
  chartStartDate = new Date(today.getFullYear(), today.getMonth() - monthsAgo + 1, 1); // +1 because we want *inclusive* months
  
  const allMonthLabels: string[] = [];
  const periodToIndexMap: { [key: string]: number } = {};
  let currentDate = new Date(chartStartDate);
  let index = 0;

  // Ensure loop ends correctly by comparing month and year
  while (
    currentDate.getFullYear() < today.getFullYear() ||
    (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() <= today.getMonth())
  ) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    // Remove year from the label
    const label = currentDate.toLocaleDateString('en-US', { month: 'short' }).replace(',', '');
    allMonthLabels.push(label);

    const periodKey = `${year}-${(month + 1).toString().padStart(2, '0')}`; // YYYY-MM
    periodToIndexMap[periodKey] = index;

    // Move to the next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    index++;
  }
  // --- End Generate Full Date Range Labels ---


  // Group markets and calculate usage (same as before)
  const marketGroups = new Map<string, Set<string>>();
  const gpuUsageCounts = new Map<string, number>();

  (spendingHistory.value?.results || []).forEach((monthItem: MonthlyResult) => {
    monthItem.breakdown.forEach((b: any) => {
      const marketInfo = marketAddressToInfo.value[b.market];
      if (marketInfo) {
        const baseName = marketInfo.name;
        if (!marketGroups.has(baseName)) {
          marketGroups.set(baseName, new Set());
          gpuUsageCounts.set(baseName, 0);
        }
        marketGroups.get(baseName)?.add(b.market);
        // Note: Use total_usd from the *month* for ranking, not breakdown totalSpent
        // to handle cases where breakdown might be incomplete? Check API logic.
        // Let's stick to summing breakdown for now as it seems intended for usage calc.
        gpuUsageCounts.set(baseName, (gpuUsageCounts.get(baseName) || 0) + b.totalSpent);
      }
    });
  });

  // Get top 3 most used GPUs (same as before)
  const top3GPUs = Array.from(gpuUsageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  // --- Build Datasets with Full Month Range ---
  const datasetArray: any[] = [];

  marketGroups.forEach((addresses, baseName) => {
    // Initialize data arrays with zeros for all months in the range
    const dataPoints = new Array(allMonthLabels.length).fill(0);
    const communityDataPoints = new Array(allMonthLabels.length).fill(0);
    const premiumDataPoints = new Array(allMonthLabels.length).fill(0);

    // Iterate through API results and place data in the correct index
    (spendingHistory.value?.results || []).forEach((monthItem: MonthlyResult) => {
      const monthIndex = periodToIndexMap[monthItem.period];
      // Only process if the period from API is within our generated range
      if (monthIndex !== undefined) {
        let communityTotal = 0;
        let premiumTotal = 0;

        addresses.forEach(market => {
          const marketData = monthItem.breakdown.find((b: any) => b.market === market);
          if (marketData) {
            const marketInfo = marketAddressToInfo.value[market];
            // Ensure marketInfo exists before accessing properties
            if (marketInfo) {
              if (marketInfo.isCommunity) {
                communityTotal += marketData.totalSpent;
              } else {
                premiumTotal += marketData.totalSpent;
              }
            }
          }
        });

        // Update the data arrays at the calculated index
        dataPoints[monthIndex] = communityTotal + premiumTotal;
        communityDataPoints[monthIndex] = communityTotal;
        premiumDataPoints[monthIndex] = premiumTotal;
      }
    });

    // Create the dataset object (same as before, but uses the full-length data arrays)
    const formattedName = baseName.toUpperCase();
    datasetArray.push({
      label: baseName,
      data: dataPoints,
      backgroundColor: GPU_COLORS[formattedName] || getColorForMarket(baseName, true),
      stack: 'totalSpent',
      communityData: communityDataPoints,
      premiumData: premiumDataPoints,
      showInLegend: top3GPUs.includes(baseName),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.7)',
      hoverBorderColor: 'white',
      hoverBackgroundColor: GPU_COLORS[formattedName] ? 
        makeColorBrighter(GPU_COLORS[formattedName]) :
        makeColorBrighter(getColorForMarket(baseName, true))
    });
  });

  // Sort datasets by GPU name (same as before)
  datasetArray.sort((a, b) => a.label.localeCompare(b.label));

  return {
    labels: allMonthLabels, // Use the generated full list of labels
    datasets: datasetArray
  };
});

// Simple helper to assign color per market
function getColorForMarket(market: string, vibrant = false): string {
  // For real usage, store a color map, or generate random but consistent color.
  // E.g. a quick hash from the market address:
  const hashVal = Array.from(market)
    .map((char) => char.charCodeAt(0))
    .reduce((acc, cur) => acc + cur, 0);
  
  const hue = hashVal % 360;
  
  // More vibrant colors with higher saturation
  if (vibrant) {
    return `hsl(${hue}, 70%, 55%)`;
  }
  
  // Original color version
  return `hsl(${hue}, 50%, 50%)`;
}

// Helper function to make colors more vibrant for hover state
function makeColorBrighter(color: string): string {
  // For HSL colors
  if (color.startsWith('hsl')) {
    // Extract the hue, saturation, and lightness values
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]);
      const l = parseInt(match[3]);
      
      // Increase lightness for hover (max 65% to avoid washing out)
      const newL = Math.min(l + 10, 65);
      return `hsl(${h}, ${s}%, ${newL}%)`;
    }
  }
  
  // For hex colors - fallback to original if can't process
  return color;
}

const chartOptions = {
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
      display: true,
      position: 'bottom' as const,
      align: 'start' as const,
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          family: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          size: 12,
          weight: 'normal' as const,
          lineHeight: 1.2
        },
        color: '#000000',
        filter: (legendItem: any) => {
          return legendItem.datasetIndex !== undefined && 
                 chartData.value.datasets[legendItem.datasetIndex]?.showInLegend;
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        family: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        size: 14,
        weight: 'normal' as const,
        lineHeight: 1.4
      },
      titleColor: '#ffffff',
      bodyFont: {
        family: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
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
          const labels = chartData.value.labels;
          // Calculate the total for this month
          let monthTotal = 0;
          chartData.value.datasets.forEach((dataset: any) => {
            monthTotal += dataset.data[index] || 0;
          });
          
          const formattedTotal = '$' + monthTotal.toFixed(2);
          return `${labels[index]} - Total: ${formattedTotal}`;
        },
        label: function(context: any) {
          const dataset = context.dataset;
          const index = context.dataIndex;
          const total = dataset.data[index];
          
          // Only return the GPU name and total amount, no premium/community breakdown
          return `${dataset.label}: $${total.toFixed(2)}`;
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
          family: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
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
      stacked: true,
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
          family: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
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
      borderWidth: 1
    }
  },
  barPercentage: 0.95,
  categoryPercentage: 0.95,
  animation: {
    duration: 800
  },
  font: {
    family: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
  }
};

onMounted(() => {
  // If not automatically fetching, do so
  if (publicKey.value) {
    refreshSpendingHistory();
  }
  
  // Add CSS to improve text rendering
  const style = document.createElement('style');
  style.textContent = `
    canvas {
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `;
  document.head.appendChild(style);
});

// Claim rewards function
const claimRewards = async () => {
  if (!activeStake.value || !pendingRewards.value || pendingRewards.value <= 0) return;
  
  claimingRewards.value = true;
  try {
    const claim = await nosana.value.stake.claimRewards();
    await refreshStake();
    await refreshBalance();
    console.log('claim', claim);
    toast.success('Succesfully claimed rewards');
  } catch (error: any) {
    console.error('Cannot claim rewards', error);
    toast.error(error.toString());
  } finally {
    claimingRewards.value = false;
  }
};
</script>

<style scoped>
/* Modernized UI Styles */

body, .container {
  font-family: 'Inter', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
  background: #f7f8fa;
  color: #23272f;
}

.container {
  width: 100vw;
  min-height: 100vh;
  height: 100%;
  max-width: none;
  margin: 0;
  padding: 2.5rem 2vw 2.5rem 2vw;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: none;
}

.section-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 2.5rem 0 2rem 0;
  border: none;
}

.heading {
  text-transform: uppercase;
  font-size: 0.85rem;
  font-weight: 600;
  color: #7a7a7a;
  margin-bottom: 0.5rem;
  letter-spacing: 0.04em;
}

.title {
  font-size: 1.6rem;
  margin-bottom: 1.2rem !important;
  font-weight: 600;
  color: #23272f;
  letter-spacing: -0.01em;
}

h3.title {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 1.5rem !important;
  color: #23272f;
}

.box {
  background: #fff;
  color: #23272f;
  border-radius: 16px;
  box-shadow: 0 4px 24px 0 rgba(30,34,40,0.08), 0 1.5px 4px 0 rgba(30,34,40,0.03);
  border: none;
  transition: background 0.5s cubic-bezier(.4,2,.6,1), box-shadow 0.5s cubic-bezier(.4,2,.6,1), border-color 0.5s cubic-bezier(.4,2,.6,1);
}

.box:hover {
  box-shadow: 0 8px 32px 0 rgba(30,34,40,0.16);
  border: 1px solid #10E80C1A; /* subtle green border on hover */
}

/* Exclude ListDeploymentsList from the height restriction */
.deployments-list > .box {
  max-height: none;
  height: auto;
  overflow: visible;
}

.deployments-list > .box .columns,
.deployments-list > .box .column,
.deployments-list > .box .table-container {
  height: auto;
  max-height: none;
}

.column.is-4 .box:not(.equal-height-boxes .box) {
  max-height: 380px;
}

.box .content {
  flex: 1;
  overflow-y: auto;
}

.icon.is-small svg {
  width: 1.1em;
  height: 1.1em;
  vertical-align: middle;
}

.plus-icon, .container-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: #f3f4f6;
  border: 1.5px solid #e5e7eb;
  transition: box-shadow 0.18s, border-color 0.18s, background 0.18s;
}

.plus-icon:hover, .container-icon:hover {
  background: #e8f8ee;
  border-color: #10E80C;
  box-shadow: 0 2px 8px 0 rgba(16,232,12,0.08);
}

.container-icon svg {
  fill: #23272f;
  transition: fill 0.18s;
}

.container-icon:hover svg {
  fill: #10E80C;
}

.nosana-icon {
  color: #10E80C;
}

.nosana-icon :deep(path) {
  fill: #10E80C;
}

.equal-height-boxes {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 380px;
  gap: 0.7rem;
}

.equal-height-boxes .box {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: none;
  margin-bottom: 0 !important;
}

.equal-height-boxes .box > div {
  height: 100%;
}

.button.is-small {
  border-radius: 8px;
  font-size: 0.98rem;
  font-weight: 500;
  padding: 0.35em 1.1em;
  background: #10E80C;
  color: #fff;
  border: none;
  box-shadow: 0 1px 4px 0 rgba(16,232,12,0.08);
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
}

.button.is-small:hover, .button.is-small:focus {
  background: #0bcf0a;
  color: #fff;
  box-shadow: 0 2px 8px 0 rgba(16,232,12,0.12);
}

.button.is-primary {
  background: #10E80C;
  color: #fff;
}

.button.is-primary:hover, .button.is-primary:focus {
  background: #0bcf0a;
  color: #fff;
}

.buttons.has-addons .button {
  border-radius: 8px !important;
  margin-right: 0.5rem;
  background: #f3f4f6;
  color: #23272f;
  border: 1.5px solid #e5e7eb;
  font-weight: 500;
  transition: background 0.18s, color 0.18s, border-color 0.18s;
}

.buttons.has-addons .button.is-primary {
  background: #10E80C;
  color: #fff;
  border-color: #10E80C;
}

.buttons.has-addons .button:last-child {
  margin-right: 0;
}

.buttons.has-addons .button:hover {
  background: #e8f8ee;
  color: #10E80C;
  border-color: #10E80C;
}

/* Chart area improvements */
.box .content {
  padding: 0.5rem 0.2rem 0.5rem 0.2rem;
}

/* Notification style */
.notification.is-warning {
  background: #fffbe6;
  color: #b08900;
  border-radius: 12px;
  border: 1.5px solid #ffe58f;
  font-size: 1.1rem;
  margin-top: 2rem;
  box-shadow: 0 2px 8px 0 rgba(255,229,143,0.08);
}

.dark-mode .container {
  width: 100%; /* Prevent horizontal overflow */
  min-height: 100vh;
  height: 100%;
  max-width: none;
  margin: 0;
  padding: 2.5rem 2vw 2.5rem 2vw;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.dark-mode .box {
  background: #000 !important;
  color: #f1f1f1;
  border-radius: 16px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.55);
  border: 1px solid rgba(255,255,255,0.03);
  transition: background 0.18s, box-shadow 0.18s, border-color 0.18s;
}

.dark-mode .box:hover {
  background: #181818 !important;
  box-shadow: 0 8px 32px 0 rgba(0,0,0,0.75);
  border-color: #10E80C;
}

.dark-mode .button,
.dark-mode .container-icon,
.dark-mode .plus-icon {
  transition: background 0.18s cubic-bezier(.4,2,.6,1),
              color 0.18s cubic-bezier(.4,2,.6,1),
              box-shadow 0.18s cubic-bezier(.4,2,.6,1),
              border-color 0.18s cubic-bezier(.4,2,.6,1);
}

.dark-mode .button:hover,
.dark-mode .container-icon:hover,
.dark-mode .plus-icon:hover {
  background: #181818 !important;
  color: #10E80C !important;
  border-color: #10E80C !important;
  box-shadow: 0 2px 8px 0 rgba(16,232,12,0.12);
}

.dark-mode .section-divider {
  background: rgba(255,255,255,0.04);
}

.dark-mode .heading,
.dark-mode .title {
  color: #fff;
}

.dark-mode .has-text-grey {
  color: #b0b3b8 !important;
}

@media screen and (max-width: 1024px) {
  .container {
    padding: 1.5rem 1vw;
  }
  .columns {
    flex-direction: column;
    gap: 1.5rem;
  }
  .column {
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 1.5rem;
  }
}

@media screen and (max-width: 768px) {
  .container {
    padding: 1rem 0.5vw;
  }
  .columns {
    flex-direction: column;
    gap: 1.2rem;
  }
  .column {
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 1.2rem;
  }
  .box {
    padding: 1rem 0.7rem;
    border-radius: 12px;
  }
  .equal-height-boxes {
    max-height: none;
  }
}

.dark-mode .container {
  background: #181A1B !important;
}

.box {
  transition: background 0.32s cubic-bezier(.4,2,.6,1), box-shadow 0.32s cubic-bezier(.4,2,.6,1), border-color 0.32s cubic-bezier(.4,2,.6,1) !important;
}
</style> 