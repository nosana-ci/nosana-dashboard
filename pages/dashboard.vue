<template>
  <div>
    <TopBar :title="'Dashboard'" :subtitle="'Your personal overview'">
    </TopBar>
    <div class="container">
      <div v-if="connected">
        <h3 class="title is-4 mb-4">Status</h3>
        <div class="columns is-multiline mb-4">
          <div class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">Deployments</p>
              <p class="title is-flex is-align-items-center is-justify-content-center">
                <RocketIcon style="width: 16px; height: 16px; fill: #10E80C; margin-right: 0.5rem;" />
                560
              </p>
            </div>
          </div>
          <div class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">NOS Balance</p>
              <p class="title" v-if="balance && nosPrice">
                {{ balance.uiAmount.toFixed(2) }} NOS
                <span class="has-text-grey is-size-6">(${{ (balance.uiAmount * nosPrice).toFixed(2) }})</span>
              </p>
              <p class="title" v-else>-</p>
            </div>
          </div>
          <div v-if="nosStaked && nosStaked.amount > 0" class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">NOS Staked</p>
              <p class="title is-flex is-align-items-center is-justify-content-center">
                <span v-if="nosStaked && nosStaked.amount >= 0">
                  {{ (nosStaked.amount / 1e6).toFixed(2) }} NOS
                </span>
                <span v-else>-</span>
                <nuxt-link to="/stake" class="ml-2">
                  <span class="container-icon" style="background-color: white; border: 1px solid #dbdbdb; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                    <PlusSymbolIcon style="width: 12px; height: 12px; transition: fill 0.2s ease;" />
                  </span>
                </nuxt-link>
              </p>
            </div>
          </div>
          <div v-if="pendingRewards > 0" class="column is-3">
            <div class="box has-text-centered">
              <p class="heading">Pending Rewards</p>
              <p class="title">{{ pendingRewards.toFixed(2) }} NOS</p>
            </div>
          </div>
        </div>
        <h3 class="title is-4 mb-7">Deployments</h3>
        <DashboardDeploymentsList :items-per-page="10" class="mb-6 deployments-list" />
        
        <div class="columns mt-6">
          <div class="column is-4">
            <h3 class="title is-4 mb-4">Welcome to Nosana</h3>
            <div class="equal-height-boxes">
              <nuxt-link to="/jobs/create" class="box has-text-black p-2 mb-2 is-block">
                <div class="is-flex is-align-items-start" style="margin: 8px 8px 0 8px;">
                  <RocketIcon style="width: 16px; height: 16px; fill: #10E80C; margin-right: 0.5rem; margin-top: 4px;" />
                  <div>
                    <h4 class="title is-6 mb-0">Getting Started</h4>
                    <p class="is-size-6 mb-0" style="line-height: 1.2;">Start your journey by deploying your first AI model on Nosana.</p>
                  </div>
                </div>
              </nuxt-link>

              <a href="https://docs.nosana.com/about/intro.html" target="_blank" class="box has-text-black p-2 mb-2 is-block">
                <div class="is-flex is-align-items-start" style="margin: 8px 8px 0 8px;">
                  <ExplorerIcon class="nosana-icon" style="width: 16px; height: 16px; margin-right: 0.5rem; margin-top: 4px;" />
                  <div>
                    <h4 class="title is-6 mb-0">Documentation</h4>
                    <p class="is-size-6 mb-0" style="line-height: 1.2;">Explore our comprehensive guides and how the network works.</p>
                  </div>
                </div>
              </a>

              <nuxt-link to="/support" class="box has-text-black p-2 is-block">
                <div class="is-flex is-align-items-start" style="margin: 8px 8px 0 8px;">
                  <SupportIcon class="nosana-icon" style="width: 16px; height: 16px; margin-right: 0.5rem; margin-top: 4px;" />
                  <div>
                    <h4 class="title is-6 mb-0">Help and Support</h4>
                    <p class="is-size-6 mb-0" style="line-height: 1.2;">Connect with our community and support team for assistance.</p>
                  </div>
                </div>
              </nuxt-link>
            </div>
          </div>
          
          <div class="column is-4">
            <h3 class="title is-4 mb-4">Cost and Usage</h3>
            <div class="box" style="height: 100%;">
              <div class="content is-flex is-flex-direction-column is-justify-content-center" style="height: 100%;">
                <div class="is-flex is-flex-direction-column" style="flex: 1; display: flex; justify-content: center;">
                  <p class="heading mb-1" style="font-size: 0.7rem;">Current month cost</p>
                  <p class="title is-4 mb-1" v-if="monthSpend && !loadingSpend">
                    ${{ monthSpend.spentThisMonth.toFixed(2) }}
                  </p>
                  <p class="title is-4 mb-1" v-else>-</p>

                  <p class="has-text-grey is-size-7 mb-0" v-if="monthSpend && monthSpend.pctChangeSoFar != null">
                    <ArrowUpIcon
                      v-if="monthSpend.pctChangeSoFar >= 0"
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #48c78e;"
                    />
                    <ArrowDownIcon
                      v-else
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #f14668;"
                    />
                    {{ monthSpend.pctChangeSoFar.toFixed(2) }}% compared to last month for same period
                  </p>
                  <p v-else class="has-text-grey is-size-7 mb-0">No comparison data</p>
                </div>

                <div class="is-flex is-justify-content-center my-3">
                  <div style="width: 100%; height: 1px; background-color: #dbdbdb;"></div>
                </div>

                <div class="is-flex is-flex-direction-column" style="flex: 1; display: flex; justify-content: center;">
                  <p class="heading mb-1" style="font-size: 0.7rem;">Forecasted month end cost</p>
                  <p class="title is-4 mb-1" v-if="monthSpend && !loadingSpend">
                    ${{ monthSpend.forecast.toFixed(2) }}
                  </p>
                  <p class="title is-4 mb-1" v-else>-</p>

                  <p class="has-text-grey is-size-7 mb-0" v-if="monthSpend && monthSpend.pctChangeForecastFromLastMonth != null">
                    <ArrowUpIcon
                      v-if="monthSpend.pctChangeForecastFromLastMonth >= 0"
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #48c78e;"
                    />
                    <ArrowDownIcon
                      v-else
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #f14668;"
                    />
                    {{ monthSpend.pctChangeForecastFromLastMonth.toFixed(2) }}% compared to last month's total cost
                  </p>
                  <p v-else class="has-text-grey is-size-7 mb-0">No forecast comparison</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="column is-4">
            <h3 class="title is-4 mb-4">Monthly History</h3>
            <div class="box" style="height: 100%; position: relative;">
              <div class="content" style="height: 100%;">
                <div class="field is-grouped is-justify-content-end" style="position: absolute; top: 12px; right: 12px; z-index: 1;">
                  <div class="control">
                    <div class="buttons has-addons">
                      <button 
                        v-for="period in ['3', '6', '12', 'all']" 
                        :key="period"
                        class="button is-small"
                        :class="{ 'is-primary': selectedMonths === period }"
                        @click="() => {
                          selectedMonths = period as '3' | '6' | '12' | 'all';
                          refreshHistory();
                        }"
                      >
                        {{ period === 'all' ? 'All' : `${period}M` }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="!loadingHistory && monthlyHistory" style="height: 315px;">
                  <Bar
                    v-if="chartData && chartData.labels.length"
                    :data="chartData"
                    :options="chartOptions"
                  />
                </div>
                <progress
                  v-else-if="loadingHistory"
                  class="progress is-small is-info"
                  max="100"
                >
                </progress>
                <p v-else>No historic data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="notification is-warning">
        Please connect your wallet to view the dashboard
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardDeploymentsList from '~/components/Dashboard/DeploymentsList.vue';
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

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const { connected, publicKey } = useWallet();
const { nosana } = useSDK();

// Get balances
const balance = ref<any | null>(null);
const nosStaked = ref<any | null>(null);
const loading = ref(false);

// Get NOS price
const { data: stats } = useAPI('/api/stats');
const nosPrice = computed(() => stats.value?.price || null);

// Get staking info
const { activeStake, rewardsInfo, poolInfo } = useStake(publicKey);
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

// 1) Setup for "getSpendThisMonth"
const spendEndpoint = computed(() => {
  if (!publicKey.value) return null; // Only call if we have an address
  return `/api/stats/spend-this-month?address=${publicKey.value.toString()}`;
});

const { data: monthSpend, pending: loadingSpend } = useAPI(spendEndpoint, {
  default: () => ({
    spentThisMonth: 0,
    breakdown: [],
    forecast: 0,
    sameDayLastMonthSpent: 0,
    pctChangeSoFar: null,
    lastMonthTotalSpent: 0,
    pctChangeForecastFromLastMonth: null
  })
});

// 2) You can also watch the public key to refresh whenever the user changes wallets
watch(() => publicKey.value, () => {
  // The composable will automatically fetch again if spendEndpoint changes
});

// 3) Example onMounted if you'd like a one-time fetch
onMounted(() => {
  // do nothing special if `useAPI` is set to watch: [spendEndpoint],
  // otherwise you can manually refresh here
});

// ------------------------
// 2) Monthly History API
// ------------------------
const selectedMonths = ref<'3' | '6' | '12' | 'all'>('3');

const monthlyHistoryEndpoint = computed(() => {
  if (!publicKey.value) return null;
  // e.g. /api/stats/monthly-history?address=xxx&months=3
  return `/api/stats/monthly-history?address=${publicKey.value.toString()}&months=${selectedMonths.value}`;
});

const {
  data: monthlyHistory,
  pending: loadingHistory,
  refresh: refreshHistory
} = useAPI(monthlyHistoryEndpoint, {
  default: () => ({
    userAddress: '',
    period: '',
    data: []
  })
});

// Get markets data for name mapping
const { data: marketsData } = useAPI('/api/markets', { default: () => [] });

// Predefined colors for different GPU types with distinct color scheme
const GPU_COLORS = {
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
    refreshHistory();
  }
);

// ------------------------
// 3) Transform monthly history for stacked bar chart
// ------------------------
/**
 * monthlyHistory.data is shaped like:
 * [
 *   {
 *     month: "2023-08",
 *     breakdown: [
 *       { market: "MarketA", totalSpent: 12.3 },
 *       { market: "MarketB", totalSpent: 4.5 },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 * 
 * We'll produce a stacked bar series for each market across different months.
 */
const chartData = computed(() => {
  if (!monthlyHistory.value?.data || !monthlyHistory.value.data.length) {
    return { labels: [], datasets: [] };
  }

  // Group markets by base name (without Community suffix)
  const marketGroups = new Map<string, Set<string>>();
  const gpuUsageCounts = new Map<string, number>();

  monthlyHistory.value.data.forEach((monthItem: any) => {
    monthItem.breakdown.forEach((b: any) => {
      const marketInfo = marketAddressToInfo.value[b.market];
      if (marketInfo) {
        const baseName = marketInfo.name;
        if (!marketGroups.has(baseName)) {
          marketGroups.set(baseName, new Set());
          gpuUsageCounts.set(baseName, 0);
        }
        marketGroups.get(baseName)?.add(b.market);
        gpuUsageCounts.set(baseName, (gpuUsageCounts.get(baseName) || 0) + b.totalSpent);
      }
    });
  });

  // Get top 3 most used GPUs
  const top3GPUs = Array.from(gpuUsageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const sortedData = [...monthlyHistory.value.data].sort(
    (a, b) => (a.month < b.month ? -1 : 1)
  );

  const labels = sortedData.map((m) => {
    const date = new Date(m.month);
    return date.toLocaleDateString('en-US', { month: 'short' }).replace(',', '') + 
           "'" + date.getFullYear().toString().slice(-2);
  });

  const datasetArray: any[] = [];

  marketGroups.forEach((addresses, baseName) => {
    const dataPoints: Array<{ total: number, community: number, premium: number }> = [];

    sortedData.forEach((monthItem) => {
      let communityTotal = 0;
      let premiumTotal = 0;

      addresses.forEach(market => {
        const marketData = monthItem.breakdown.find((b: any) => b.market === market);
        if (marketData) {
          if (marketAddressToInfo.value[market].isCommunity) {
            communityTotal += marketData.totalSpent;
          } else {
            premiumTotal += marketData.totalSpent;
          }
        }
      });

      dataPoints.push({
        total: communityTotal + premiumTotal,
        community: communityTotal,
        premium: premiumTotal
      });
    });

    const formattedName = baseName.toUpperCase();
    datasetArray.push({
      label: baseName,
      data: dataPoints.map(d => d.total),
      backgroundColor: GPU_COLORS[formattedName] || getColorForMarket(baseName),
      stack: 'totalSpent',
      communityData: dataPoints.map(d => d.community),
      premiumData: dataPoints.map(d => d.premium),
      showInLegend: top3GPUs.includes(baseName),
      borderWidth: 1,
      borderColor: 'white',
      hoverBorderColor: 'white'
    });
  });

  // Sort datasets by GPU name for consistent legend ordering
  datasetArray.sort((a, b) => a.label.localeCompare(b.label));

  return {
    labels,
    datasets: datasetArray
  };
});

// Simple helper to assign color per market
function getColorForMarket(market: string) {
  // For real usage, store a color map, or generate random but consistent color.
  // E.g. a quick hash from the market address:
  const hashVal = Array.from(market)
    .map((char) => char.charCodeAt(0))
    .reduce((acc, cur) => acc + cur, 0);
  const hue = hashVal % 360;
  return `hsl(${hue}, 50%, 50%)`;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      align: 'start' as const,
      labels: {
        boxWidth: 8,
        boxHeight: 8,
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: 11
        },
        filter: (legendItem: any) => {
          return legendItem.datasetIndex !== undefined && 
                 chartData.value.datasets[legendItem.datasetIndex]?.showInLegend;
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const dataset = context.dataset;
          const index = context.dataIndex;
          const total = dataset.data[index];
          const community = dataset.communityData[index];
          const premium = dataset.premiumData[index];
          
          const lines = [
            `${dataset.label}: $${total.toFixed(2)}`
          ];
          
          // Only add breakdown if either value is non-zero
          if (premium > 0 || community > 0) {
            if (premium > 0) {
              lines.push(`  Premium: $${premium.toFixed(2)}`);
            }
            if (community > 0) {
              lines.push(`  Community: $${community.toFixed(2)}`);
            }
          }
          
          return lines;
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
          size: 11
        }
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
        count: 4
      },
      ticks: {
        callback: function(value: any) {
          return '$' + value;
        },
        font: {
          size: 11
        },
        maxTicksLimit: 4
      }
    }
  },
  elements: {
    bar: {
      borderRadius: 4,
      borderSkipped: false
    }
  },
  barSpacing: 2,
  categorySpacing: 0.3
};

onMounted(() => {
  // If not automatically fetching, do so
  if (publicKey.value) {
    refreshHistory();
  }
});
</script>

<style scoped>
/* Deployments section */
.deployments-list {
  margin-bottom: 3rem !important;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

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
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-height: 280px;
}

/* Exclude DeploymentsList from the height restriction */
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

/* Special handling for Cost and Usage and Monthly History boxes */
.column.is-4 .box:not(.equal-height-boxes .box) {
  max-height: 360px;
}

.box .content {
  flex: 1;
  overflow-y: auto;
}

/* In any global .scss or in a <style scoped> block with deep selectors */
.icon.is-small svg {
  width: 1em;
  height: 1em;
  /* optionally, if you want slightly larger than default */
  /* width: 1.25em; 
     height: 1.25em; */
}

.plus-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.plus-icon:hover {
  transform: scale(1.1);
}

.container-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark-mode .container-icon {
  background-color: black !important;
  border-color: #363636 !important;
}

.dark-mode .container-icon svg {
  fill: white !important;
}

.dark-mode .container-icon:hover {
  border-color: #10E80C !important;
}

.dark-mode .container-icon:hover svg {
  fill: #10E80C !important;
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
  max-height: 360px;
}

.equal-height-boxes .box {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: none; /* Override the default max-height */
}

.equal-height-boxes .box:not(:last-child) {
  margin-bottom: 0.5rem;
}

.equal-height-boxes .box > div {
  height: 100%;
}

.container-icon:hover {
  border-color: #10E80C !important;
}

.container-icon:hover svg {
  fill: #10E80C !important;
}

.container-icon svg {
  fill: black;
}
</style> 