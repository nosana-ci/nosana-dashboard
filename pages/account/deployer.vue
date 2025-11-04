<template>
  <div>
    <TopBar 
      :title="status === 'authenticated' ? 'Hi ' + (userData?.email || userData?.name || 'User') : 'My Account'"
      :subtitle="'Your personal overview'" 
      ref="topBar"
      v-model="showSettingsModal"
    >
      <template v-if="activeAddress" #extra>
        <div class="is-flex is-align-items-center">
          <span class="tag is-light mr-2">
            {{ addressSource === 'wallet' ? 'Wallet Connected' : 'Generated Address' }}
          </span>
          <span class="is-family-monospace is-size-7">
            {{ activeAddress.slice(0, 4) }}...{{ activeAddress.slice(-4) }}
          </span>
        </div>
      </template>
    </TopBar>
    <div class="container">
      <!-- Credit Invitation Section (shown when unauthenticated with invitation token) -->
      <div v-if="invitationToken && !canShowAccountData" class="section">
        <div class="columns is-centered">
          <div class="column is-half">
            <div class="box has-text-centered">
              <div v-if="loadingInvitation">
                <div class="loader is-loading"></div>
                <p class="mt-2">Loading invitation details...</p>
              </div>
              
              <div v-else-if="invitationError" class="has-text-danger">
                <span class="icon is-large">
                  <i class="fas fa-exclamation-triangle fa-2x"></i>
                </span>
                <h1 class="title is-4 mt-2">Invalid Invitation</h1>
                <p>{{ invitationError }}</p>
                <button @click="openBothModal($route.fullPath)" class="button is-primary mt-3">
                  Go to Login
                </button>
              </div>
              
              <div v-else-if="invitation">
                <span class="icon is-large has-text-success">
                  <i class="fas fa-gift fa-2x"></i>
                </span>
                <h1 class="title is-3 mt-2">Credit Invitation</h1>
                <p class="subtitle">
                  You've been invited to claim credits
                </p>
                
                <div class="credit-amount-display">
                  {{ formatCredits(invitation.creditsAmount) }}
                </div>
                
                <div v-if="invitation.expirationDate || invitation.restrictedEmail" class="invitation-meta">
                  <div v-if="invitation.expirationDate" class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span :class="{ 'expired': invitation.isExpired }">
                      Expires {{ formatDate(invitation.expirationDate) }}
                    </span>
                  </div>
                  
                  <div v-if="invitation.restrictedEmail" class="meta-item">
                    <i class="fas fa-envelope"></i>
                    <span>For {{ invitation.restrictedEmail }}</span>
                  </div>
                </div>
                
                <div v-if="invitation.isClaimed" class="notification is-warning">
                  <span class="icon">
                    <i class="fas fa-clock"></i>
                  </span>
                  <strong>Already Claimed</strong><br>
                  This credit invitation has already been claimed.
                </div>
                
                <div v-else-if="invitation.isExpired" class="notification is-danger">
                  <span class="icon">
                    <i class="fas fa-clock"></i>
                  </span>
                  <strong>Expired</strong><br>
                  This credit invitation has expired.
                </div>
                
                <div v-else>
                  <button 
                    @click="openGoogleModal($route.fullPath)"
                    class="button is-primary is-large"
                  >
                    <span class="icon">
                      <i class="fas fa-sign-in-alt"></i>
                    </span>
                    <span>Sign In to Claim Credits</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Invitation Claim (shown when authenticated with unclaimed invitation) -->
      <div v-if="invitationToken && canShowAccountData && invitation && !invitation.isClaimed && !invitation.isExpired" class="section">
        <div class="columns is-centered">
          <div class="column is-half">
            <div class="box has-text-centered has-background-success-light">
              <div v-if="invitation.restrictedEmail && userData?.email !== invitation.restrictedEmail" class="notification is-warning">
                <strong>Email Restriction</strong><br>
                This invitation is restricted to another email address.
              </div>
              
              <div v-else>
                <span class="icon is-large has-text-success">
                  <i class="fas fa-gift fa-2x"></i>
                </span>
                <h2 class="title is-4 mt-2">Ready to Claim!</h2>
                
                <button
                  @click="claimInvitation"
                  :disabled="claiming"
                  :class="['button', 'is-dark', { 'is-loading': claiming }]"
                >
                  <span>
                    {{ claiming ? 'Claiming...' : `Claim ${formatCredits(invitation.creditsAmount)} Credits` }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="canShowAccountData">
        <h3 class="title is-4 mb-0">Status</h3>
        <div class="mb-4"></div>
        <div class="columns is-multiline mb-4">
          <div class="column is-3">
            <div class="box has-text-centered equal-height-box">
              <p class="heading">{{ status === 'authenticated' ? 'Deployments' : 'Jobs' }}</p>
              <p class="title is-flex is-align-items-center is-justify-content-center">
                <RocketIcon style="width: 16px; height: 16px; fill: #10E80C; margin-right: 0.5rem;" />
                {{ status === 'authenticated' ? totalDeployments : totalJobs }}
              </p>
            </div>
          </div>
          <!-- Credit Balance for Google Auth Users -->
          <div class="column is-3" v-if="canShowAccountData">
            <CreditBalance ref="creditBalanceRef" />
          </div>
          <!-- NOS Balance for Wallet Users -->
          <div class="column is-3" v-if="connected">
            <div class="box has-text-centered">
              <p class="heading">NOS Balance</p>
              <p class="title" v-if="balance && nosPrice">
                {{ balance.uiAmount.toFixed(2) }} NOS
                <span class="has-text-grey is-size-6">(${{ (balance.uiAmount * nosPrice).toFixed(2) }})</span>
              </p>
              <p class="title" v-else>-</p>
            </div>
          </div>
          <template v-if="showStakingData">
            <div v-if="nosStaked && nosStaked.amount > 0" class="column is-3">
              <div class="box has-text-centered">
                <p class="heading">NOS Staked</p>
                <p class="title is-flex is-align-items-center is-justify-content-center">
                  <span v-if="nosStaked && nosStaked.amount >= 0">
                    {{ (nosStaked.amount / 1e6).toFixed(2) }} NOS
                  </span>
                  <span v-else>-</span>
                  <nuxt-link to="/stake" class="ml-2">
                    <span class="container-icon">
                      <FontAwesomeIcon :icon="faPlus" style="width: 12px; height: 12px;" />
                    </span>
                  </nuxt-link>
                </p>
              </div>
            </div>
            <div v-if="pendingRewards > 0" class="column is-3">
              <div class="box has-text-centered">
                <p class="heading">Pending Rewards</p>
                <p class="title is-flex is-align-items-center is-justify-content-center">
                  {{ pendingRewards.toFixed(2) }} NOS
                  <button @click="claimRewards" class="ml-2 button is-small is-primary" :class="{ 'is-loading': claimingRewards }">
                    Claim
                  </button>
                </p>
              </div>
            </div>
          </template>
        </div>
        
        <!-- API Tokens Section -->
        <ApiKeys class="pb-5" v-if="canShowAccountData" />
        
        <!-- For Credit Users: Show Deployments -->
        <div v-if="canShowAccountData">
          <div class="is-flex is-justify-content-space-between is-align-items-center mb-4">
            <h3 class="title is-4 mb-0">Deployments</h3>
            <nuxt-link to="/deployments/create" class="button is-dark">
              <span class="icon">
                <FontAwesomeIcon :icon="faPlus" />
              </span>
              <span>Create Deployment</span>
            </nuxt-link>
          </div>
          <DeploymentsList 
            :items-per-page="10" 
            :limit="10" 
            :show-pagination="false" 
            class="mb-2" 
            @update:total-deployments="totalDeployments = $event" 
          />
        </div>

        <!-- For Wallet Users: Show Jobs -->
        <div v-else-if="connected">
          <div class="is-flex is-justify-content-space-between is-align-items-center mb-4">
            <h3 class="title is-4 mb-0">Job History</h3>
            <nuxt-link to="/deploy" class="button is-dark">
              <span class="icon">
                <FontAwesomeIcon :icon="faPlus" />
              </span>
              <span>Deploy New Job</span>
            </nuxt-link>
          </div>
          <JobList 
            :items-per-page="10" 
            job-type="combined"
            class="mb-2" 
            @update:total-deployments="totalJobs = $event" 
          />
        </div>
        
        <div class="columns mt-6">
          <div class="column is-4">
            <h3 class="title is-4 mb-0">Welcome to Nosana</h3>
            <div class="mb-4"></div>
            <div class="equal-height-boxes">
              <nuxt-link to="/deploy" class="box has-text-black p-2 mb-2 is-block">
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
            <h3 class="title is-4 mb-0">Cost and Usage</h3>
            <div class="mb-4"></div>
            <div class="box" style="height: 100%;">
              <div class="content is-flex is-flex-direction-column is-justify-content-center" style="height: 100%;">
                <div class="is-flex is-flex-direction-column" style="flex: 1; display: flex; justify-content: center;">
                  <p class="heading mb-1" style="font-size: 0.7rem;">Current month cost</p>
                  <p class="title is-4 mb-1" v-if="!loadingSpending">
                    ${{ spentThisMonth.toFixed(2) }}
                  </p>
                  <p class="title is-4 mb-1" v-else>-</p>

                  <p class="has-text-grey is-size-7 mb-0" v-if="pctChangeSoFar != null">
                    <ArrowUpIcon
                      v-if="pctChangeSoFar >= 0"
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #48c78e;"
                    />
                    <ArrowDownIcon
                      v-else
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #f14668;"
                    />
                    {{ pctChangeSoFar.toFixed(2) }}% compared to last month for same period
                  </p>
                </div>

                <div class="is-flex is-justify-content-center my-3">
                  <div style="width: 100%; height: 1px; background-color: #dbdbdb;"></div>
                </div>

                <div class="is-flex is-flex-direction-column" style="flex: 1; display: flex; justify-content: center;">
                  <p class="heading mb-1" style="font-size: 0.7rem;">Forecasted month end cost</p>
                  <p class="title is-4 mb-1" v-if="!loadingSpending">
                    ${{ forecastAmount.toFixed(2) }}
                  </p>
                  <p class="title is-4 mb-1" v-else>-</p>

                  <p class="has-text-grey is-size-7 mb-0" v-if="pctChangeForecastFromLastMonth != null">
                    <ArrowUpIcon
                      v-if="pctChangeForecastFromLastMonth >= 0"
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #48c78e;"
                    />
                    <ArrowDownIcon
                      v-else
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #f14668;"
                    />
                    {{ pctChangeForecastFromLastMonth.toFixed(2) }}% compared to last month's total cost
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="column is-4">
            <h3 class="title is-4 mb-0">Monthly History</h3>
            <div class="mb-4"></div>
            <div class="box" style="height: 100%; position: relative;">
              <div class="content" style="height: 100%;">
                <div class="field is-grouped is-justify-content-end" style="position: absolute; top: 12px; right: 12px; z-index: 1;">
                  <div class="control">
                    <div class="buttons has-addons">
                      <button 
                        v-for="period in ['3', '6', '12']" 
                        :key="period"
                        class="button is-small"
                        :class="{ 'is-primary': selectedMonths === period }"
                        @click="() => {
                          selectedMonths = period as '3' | '6' | '12';
                          refreshSpendingHistory();
                        }"
                      >
                        {{ `${period}M` }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="!loadingHistory && monthlyHistory" style="height: 315px;">
                  <Bar
                    v-if="chartData && chartData.labels.length"
                    :data="chartData"
                    :options="chartOptions"
                    style="padding-top: 10px"
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
    </div>
    <Loader v-if="loading" />
    <OnboardModal 
      v-model:show="showOnboardModal"
      @onboarding-progress="onboardingInProgress = $event"
    />
  </div>
</template>

<script setup lang="ts">
import DeploymentsList from '~/components/List/DeploymentsList.vue';
import JobList from '~/components/List/JobList.vue';
import { useWallet } from 'solana-wallets-vue';
import { useStake } from '~/composables/useStake';
import { useAPI } from '~/composables/useAPI';
import { computed, ref, onMounted, watch } from 'vue';
import CreditBalance from "~/components/Account/CreditBalance.vue";
import RocketIcon from '@/assets/img/icons/rocket.svg?component';
import ExplorerIcon from '@/assets/img/icons/sidebar/explorer.svg?component';
import SupportIcon from '@/assets/img/icons/sidebar/support.svg?component';
import ArrowUpIcon from '@/assets/img/icons/arrow-up.svg?component';
import ArrowDownIcon from '@/assets/img/icons/arrow-down.svg?component';
import { useToast } from "vue-toastification";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
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
import { useRouter } from "vue-router";
import OnboardModal from '~/components/Account/OnboardModal.vue';
import ApiKeys from '~/components/Account/ApiKeys.vue';

const config = useRuntimeConfig().public;
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);
const { status, data: userData, signOut, token } = useAuth();
const { $colorMode } = useNuxtApp();
const route = useRoute();
const showSettingsModal = ref(false);
const toast = useToast();
const { connected, publicKey, wallet } = useWallet();
const { nosana } = useSDK();
const claimingRewards = ref(false);
const onboardingInProgress = ref(false);
const creditBalanceRef = ref();
const { triggerCreditRefresh } = useCreditRefresh();
const { openGoogleModal } = useLoginModal();

// Credit invitation variables
const invitationToken = computed(() => route.query.token as string);
const invitation = ref(null);
const loadingInvitation = ref(false);
const invitationError = ref('');
const claiming = ref(false);

const showOnboardModal = computed(() => 
  status.value === 'authenticated' && 
  userData.value && 
  onboardingInProgress.value
);
const totalDeployments = ref(0);
const totalJobs = ref(0);

// (debug status watcher removed)


const activeAddress = computed(() => {
  if (status.value === 'authenticated' && userData.value?.generatedAddress) {
    return userData.value.generatedAddress;
  }
  if (connected.value && publicKey.value) {
    return publicKey.value.toString();
  }
  return null;
});

const addressSource = computed(() => {
  if (status.value === 'authenticated' && userData.value?.generatedAddress) {
    return 'generated';
  }
  if (connected.value && publicKey.value) {
    return 'wallet';
  }
  return null;
});

const canShowAccountData = computed(() => {
  // Don't hide account data during loading states - only hide if truly unauthenticated
  if (status.value === 'loading') {
    // During loading, check if we have any indication of authentication
    return userData.value?.generatedAddress || connected.value;
  }
  return status.value === 'authenticated' || connected.value;
});

// (debug canShowAccountData watcher removed)

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

const showStakingData = computed(() => {
  return addressSource.value === 'wallet';
});

const pendingRewards = computed(() => {
  if (!showStakingData.value) return 0;
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
    if (activeAddress.value) {
      balance.value = await nosana.value.solana.getNosBalance(activeAddress.value);
      console.log('balance', balance.value);
      // Only fetch staking data for wallet connections
      if (addressSource.value === 'wallet') {
        try {
          nosStaked.value = await nosana.value.stake.get(activeAddress.value);
        } catch (error) {
          nosStaked.value = null;
        }
      } else {
        // Reset staking data for authenticated users
        nosStaked.value = null;
      }
    }
  } catch (error) {
    console.error("Error fetching balances:", error);
    balance.value = null;
  }
  loading.value = false;
};

// Add debouncing to prevent excessive API calls during tab switches
let refreshTimeout: NodeJS.Timeout | null = null;
let lastStableAddress: string | null = null;

watch(
  [
    () => activeAddress.value,
    () => status.value,
    () => userData.value?.generatedAddress
  ],
  (newValues, oldValues) => {
    const [newAddress, newStatus, newGenerated] = newValues;
    const [oldAddress, oldStatus, oldGenerated] = oldValues || [null, null, null];
    
    // Clear any pending refresh
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
    
    // Skip if authentication is loading (temporary state during tab switches)
    if (newStatus === 'loading') {
      return;
    }
    
    // Skip if address is temporarily null during loading but we have a stable address
    if (!newAddress && lastStableAddress && newStatus === 'loading') {
      return;
    }
    
    // Only refresh if we have a meaningful address change (not just loading states)
    const addressReallyChanged = newAddress && newAddress !== lastStableAddress;
    
    if (addressReallyChanged) {
      lastStableAddress = newAddress;
      
      refreshTimeout = setTimeout(() => {
        checkBalances();
        refreshSpendingHistory();
      }, 500);
    } else {
      // Update stable address if we have a valid one
      if (newAddress) {
        lastStableAddress = newAddress;
      }
    }
  }
);

onMounted(() => {
  if (canShowAccountData.value && activeAddress.value) {
    lastStableAddress = activeAddress.value; // Initialize stable address
    checkBalances();
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

// Modify API calls to use a single endpoint
const selectedMonths = ref<'3' | '6' | '12'>('3');

const spendingHistoryEndpoint = computed(() => {
  if (!activeAddress.value) return null;
  
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
  
  return `/api/stats/spending-history?address=${activeAddress.value}&start_date=${formatDate(startDate)}&group_by=month`;
});

const {
  data: spendingHistory,
  pending: loadingSpending,
  refresh: _refreshSpendingHistory
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

// Wrapper function
const refreshSpendingHistory = () => {
  return _refreshSpendingHistory();
};

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

// Watch changes to refresh data - separate watcher for month selection only
watch(
  () => selectedMonths.value,
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

// Remove duplicate watcher - already handled in main watcher above
// This was causing duplicate API calls

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

const chartOptions = computed(() => {
  const isDark = $colorMode?.value === 'dark';
  const textColor = isDark ? '#ffffff' : '#000000';
  const gridColor = isDark ? '#444444' : '#e5e5e5';
  const tooltipBg = isDark ? 'rgba(55, 65, 81, 0.95)' : 'rgba(0, 0, 0, 0.8)';

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
        color: textColor,
        filter: (legendItem: any) => {
          return legendItem.datasetIndex !== undefined && 
                 chartData.value.datasets[legendItem.datasetIndex]?.showInLegend;
        }
      }
    },
    tooltip: {
      backgroundColor: tooltipBg,
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
      grid: {
        color: gridColor,
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
});

// Removed duplicate onMounted - merged into the main one above

// Claim rewards function
const claimRewards = async () => {
  if (!showStakingData.value || !activeStake.value || !pendingRewards.value || pendingRewards.value <= 0) return;
  
  claimingRewards.value = true;
  try {
    const claim = await nosana.value.stake.claimRewards();
    await refreshStake();
    await refreshBalance();
    console.log('claim', claim);
    toast.success('Successfully claimed rewards');
  } catch (error: any) {
    console.error('Cannot claim rewards', error);
    toast.error(error.toString());
  } finally {
    claimingRewards.value = false;
  }
};

const logout = async () => {
  loading.value = true;
  await signOut({
    callbackUrl: '/',
  });
  loading.value = false;
};

// Credit invitation functions
const formatCredits = (cents) => {
  const amount = typeof cents === 'number' ? cents : 0;
  return `$${(amount / 1000).toFixed(2)}`;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const loadInvitation = async () => {
  if (!invitationToken.value) return;
  
  try {
    loadingInvitation.value = true;
    invitationError.value = '';
    
    const response = await $fetch(`${config.apiBase}/api/credits/invitations/${invitationToken.value}`);
    invitation.value = response;
    
    if (response.isClaimed) {
      invitationError.value = 'This credit invitation has already been claimed.';
    } else if (response.isExpired) {
      invitationError.value = 'This credit invitation has expired.';
    }
  } catch (err) {
    console.error('Error loading invitation:', err);
    invitationError.value = err.data?.message || 'Failed to load invitation details';
  } finally {
    loadingInvitation.value = false;
  }
};

const claimInvitation = async () => {
  if (!invitationToken.value || !token.value) return;
  
  try {
    claiming.value = true;
    
    const response = await $fetch(`${config.apiBase}/api/credits/invitations/${invitationToken.value}/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });
    
    toast.success(`Successfully claimed ${formatCredits(response.amount * 1000)} credits!`);
    
    // Refresh credit balance locally and globally
    if (creditBalanceRef.value?.fetchBalance) {
      await creditBalanceRef.value.fetchBalance();
    }
    
    // Trigger global credit refresh to update all credit displays
    triggerCreditRefresh();
    
    // Reload invitation to show it's claimed
    await loadInvitation();
    
    try {
      trackEvent('credit_claimed', {
        amount: response.amount,
        code: invitationToken.value,
        user_id: userData.value?.generatedAddress,
      });
    } catch (error) {
      console.warn("Error tracking credit invitation claimed:", error);
    }
    
  } catch (err) {
    console.error('Error claiming invitation:', err);
    toast.error(err.data?.message || 'Failed to claim invitation');
  } finally {
    claiming.value = false;
  }
};

// Watch for invitation token changes and authentication status
watch([invitationToken, status], ([token, authStatus]) => {
  if (token) {
    loadInvitation();
  }
}, { immediate: true });
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto 0 0;
  padding: 1.5rem;
}

.heading {
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 600;
  color: #7a7a7a;
  margin-bottom: 0.5rem;
}


.box {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.equal-height-box {
  height: 150px !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
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

@media screen and (max-width: 768px) {
  .deployments-list {
    overflow-x: auto;
    /* Optional: Add padding if needed */
    /* padding-bottom: 1rem; */
  }
}

/* Credit Invitation Styles */
.credit-amount-display {
  font-size: 3rem;
  font-weight: 800;
  color: #10E80C;
  text-align: center;
  margin: 2rem 0;
  text-shadow: 0 2px 4px rgba(16, 232, 12, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  letter-spacing: -0.02em;
}

.invitation-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(16, 232, 12, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(16, 232, 12, 0.2);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.meta-item i {
  color: #10E80C;
  width: 16px;
}

.meta-item .expired {
  color: #f14668;
}

@media (max-width: 768px) {
  .credit-amount-display {
    font-size: 2.5rem;
  }
}
</style> 