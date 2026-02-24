<template>
  <div>
    <TopBar
      :title="
        (isAuthenticated || isLoading) && userData?.email
          ? 'Hi ' + (userData.email || userData.name || 'User')
          : 'My Account'
      "
      :subtitle="'Your personal overview'"
      ref="topBar"
      v-model="showSettingsModal"
    >
      <template v-if="activeAddress" #extra>
        <div class="is-flex is-align-items-center">
          <span class="tag is-light mr-2">Address</span>
          <span class="is-family-monospace is-size-7">
            {{ activeAddress.slice(0, 4) }}...{{ activeAddress.slice(-4) }}
          </span>
        </div>
      </template>
    </TopBar>
    <div>
      <AccountClaimModal
        v-model="showInvitationModal"
        type="invitation"
        :token="invitationToken"
        :invitation="invitation"
        @claimed="handleFreeCreditsClaimed"
      />
      <AccountClaimModal
        v-model="showFreeCreditsModal"
        type="grant"
        @claimed="handleFreeCreditsClaimed"
      />
      <AccountClaimModal
        v-model="showClaimModal"
        type="manual"
        @claimed="handleFreeCreditsClaimed"
      />
      <!-- Credit Invitation Section - only show when there's an issue -->
      <div
        v-if="
          invitationToken &&
          (invitationError ||
            (invitation &&
              (invitation.isClaimed ||
                invitation.isExpired ||
                (invitation.restrictedEmail &&
                  userData?.email !== invitation.restrictedEmail))))
        "
        class="section"
      >
        <div class="columns is-centered">
          <div class="column is-half">
            <div class="box has-text-centered">
              <div v-if="loadingInvitation">
                <div class="loader is-loading"></div>
                <p class="mt-2">Loading invitation details...</p>
              </div>

              <div v-else-if="invitationError" class="has-text-danger py-3">
                <h1 class="title is-4">Invalid Invitation</h1>
                <p>{{ invitationError }}</p>
              </div>

              <div v-else-if="invitation">
                <h1 class="title is-3 mt-2">Credit Invitation</h1>

                <div v-if="invitation.expirationDate" class="invitation-meta">
                  <div v-if="invitation.expirationDate" class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span :class="{ expired: invitation.isExpired }">
                      Expires {{ formatDate(invitation.expirationDate) }}
                    </span>
                  </div>
                </div>

                <div
                  v-if="invitation.isClaimed"
                  class="notification is-warning"
                >
                  <span class="icon">
                    <i class="fas fa-clock"></i>
                  </span>
                  <strong>Already Claimed</strong><br />
                  This credit invitation has already been claimed.
                </div>

                <div
                  v-else-if="invitation.isExpired"
                  class="notification is-danger"
                >
                  <span class="icon">
                    <i class="fas fa-clock"></i>
                  </span>
                  <strong>Expired</strong><br />
                  This credit invitation has expired.
                </div>

                <div v-else>
                  <div
                    v-if="
                      invitation.restrictedEmail &&
                      userData?.email !== invitation.restrictedEmail
                    "
                    class="notification is-warning"
                  >
                    <strong>Email Restriction</strong><br />
                    This invitation is restricted to another email address.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Loader v-if="isLoading && !canShowAccountData" />
      <div v-else-if="canShowAccountData">
        <div class="columns mt-6">
          <div class="column is-4">
            <h3 class="title is-4 mb-0">Cost and Usage</h3>
            <div class="mb-4"></div>
            <div class="box cost-and-usage-box">
              <!-- Credit / NOS balance at the top -->
              <div v-if="isAuthenticated" class="balance-section">
                <CreditBalance />
              </div>
              <div
                v-else-if="connected && publicKey && nosBalance"
                class="balance-section has-text-centered"
              >
                <p
                  class="heading mb-1"
                  style="
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    font-weight: 600;
                    color: #7a7a7a;
                  "
                >
                  NOS Balance
                </p>
                <p class="title is-4 mb-1">
                  {{ nosBalance.uiAmount.toFixed(2) }} NOS
                  <span class="has-text-grey is-size-6"
                    >${{ (nosBalance.uiAmount * nosPrice).toFixed(2) }}</span
                  >
                </p>
              </div>
              <div class="usage-divider"></div>

              <!-- This month + forecast side by side -->
              <div class="columns is-mobile mb-0">
                <div class="column">
                  <p class="heading mb-1" style="font-size: 0.7rem">
                    This months cost
                  </p>
                  <p
                    class="title is-4 mb-1"
                    v-if="!loadingSpending || hasLoadedSpendingOnce"
                  >
                    ${{ spentThisMonth.toFixed(2) }}
                  </p>
                  <p class="title is-4 mb-1" v-else>-</p>
                  <p
                    class="has-text-grey is-size-7 mb-0"
                    v-if="pctChangeSoFar != null"
                  >
                    <ArrowUpIcon
                      v-if="pctChangeSoFar >= 0"
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #48c78e"
                    />
                    <ArrowDownIcon
                      v-else
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #f14668"
                    />
                    {{ pctChangeSoFar.toFixed(2) }}% vs last month
                  </p>
                </div>
                <div class="column">
                  <p class="heading mb-1" style="font-size: 0.7rem">
                    Forecasted cost
                  </p>
                  <p
                    class="title is-4 mb-1"
                    v-if="!loadingSpending || hasLoadedSpendingOnce"
                  >
                    ${{ forecastAmount.toFixed(2) }}
                  </p>
                  <p class="title is-4 mb-1" v-else>-</p>
                  <p
                    class="has-text-grey is-size-7 mb-0"
                    v-if="pctChangeForecastFromLastMonth != null"
                  >
                    <ArrowUpIcon
                      v-if="pctChangeForecastFromLastMonth >= 0"
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #48c78e"
                    />
                    <ArrowDownIcon
                      v-else
                      class="icon is-small mr-1"
                      style="width: 10px; height: 10px; fill: #f14668"
                    />
                    {{ pctChangeForecastFromLastMonth.toFixed(2) }}% vs last
                    month
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="column is-4">
            <h3 class="title is-4 mb-0">Monthly History</h3>
            <div class="mb-4"></div>
            <div class="box" style="height: 100%; position: relative">
              <div class="content" style="height: 100%">
                <div
                  class="field is-grouped is-justify-content-end"
                  style="position: absolute; top: 12px; right: 12px; z-index: 1"
                >
                  <div class="control">
                    <div class="buttons has-addons">
                      <button
                        v-for="period in ['3', '6', '12']"
                        :key="period"
                        class="button is-small"
                        :class="{ 'is-primary': selectedMonths === period }"
                        @click="
                          () => {
                            selectedMonths = period as '3' | '6' | '12';
                            refreshSpendingHistory();
                          }
                        "
                      >
                        {{ `${period}M` }}
                      </button>
                    </div>
                  </div>
                </div>
                <progress
                  v-if="loadingHistory && !hasLoadedHistoryOnce"
                  class="progress is-small is-info"
                  max="100"
                ></progress>
                <div
                  v-else-if="
                    hasLoadedHistoryOnce || (!loadingHistory && monthlyHistory)
                  "
                  style="height: 315px; position: relative"
                >
                  <Bar
                    v-if="chartData && chartData.labels.length"
                    :data="chartData"
                    :options="chartOptions"
                    style="padding-top: 10px"
                  />
                  <p v-else-if="!loadingHistory">No historic data.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="column is-4">
            <h3 class="title is-4 mb-0">Welcome to Nosana</h3>
            <div class="mb-4"></div>
            <div class="equal-height-boxes">
              <nuxt-link
                to="/deployments/create"
                class="box has-text-black p-2 mb-2 is-block"
              >
                <div
                  class="is-flex is-align-items-start"
                  style="margin: 8px 8px 0 8px"
                >
                  <RocketIcon
                    style="
                      width: 16px;
                      height: 16px;
                      fill: #10e80c;
                      margin-right: 0.5rem;
                      margin-top: 4px;
                    "
                  />
                  <div>
                    <h4 class="title is-6 mb-0">Getting Started</h4>
                    <p class="is-size-6 mb-0" style="line-height: 1.2">
                      Start your journey by deploying your first AI model on
                      Nosana.
                    </p>
                  </div>
                </div>
              </nuxt-link>

              <a
                href="https://learn.nosana.com/"
                target="_blank"
                class="box has-text-black p-2 mb-2 is-block"
              >
                <div
                  class="is-flex is-align-items-start"
                  style="margin: 8px 8px 0 8px"
                >
                  <ExplorerIcon
                    class="nosana-icon"
                    style="
                      width: 16px;
                      height: 16px;
                      margin-right: 0.5rem;
                      margin-top: 4px;
                    "
                  />
                  <div>
                    <h4 class="title is-6 mb-0">Documentation</h4>
                    <p class="is-size-6 mb-0" style="line-height: 1.2">
                      Explore our comprehensive guides and how the network
                      works.
                    </p>
                  </div>
                </div>
              </a>

              <nuxt-link to="/support" class="box has-text-black p-2 is-block">
                <div
                  class="is-flex is-align-items-start"
                  style="margin: 8px 8px 0 8px"
                >
                  <SupportIcon
                    class="nosana-icon"
                    style="
                      width: 16px;
                      height: 16px;
                      margin-right: 0.5rem;
                      margin-top: 4px;
                    "
                  />
                  <div>
                    <h4 class="title is-6 mb-0">Help and Support</h4>
                    <p class="is-size-6 mb-0" style="line-height: 1.2">
                      Connect with our community and support team for
                      assistance.
                    </p>
                  </div>
                </div>
              </nuxt-link>
            </div>
          </div>
        </div>

        <!-- API Keys Section -->
        <ApiKeys class="pt-6" v-if="canShowAccountData" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DeploymentsTable from "~/components/DeploymentsTable/Table.vue";
import JobList from "~/components/List/JobList.vue";
import { useWallet } from "@nosana/solana-vue";
import { useAPI } from "~/composables/useAPI";
import { computed, ref, onMounted, watch } from "vue";
import RocketIcon from "@/assets/img/icons/rocket.svg?component";
import ExplorerIcon from "@/assets/img/icons/sidebar/explorer.svg?component";
import SupportIcon from "@/assets/img/icons/sidebar/support.svg?component";
import ArrowUpIcon from "@/assets/img/icons/arrow-up.svg?component";
import ArrowDownIcon from "@/assets/img/icons/arrow-down.svg?component";
import { useToast } from "vue-toastification";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { useRouter, useRoute } from "vue-router";
import ApiKeys from "~/components/Account/ApiKeys.vue";
import AccountClaimModal from "~/components/Account/ClaimModal.vue";
import CreditBalance from "~/components/Account/CreditBalance.vue";

const config = useRuntimeConfig().public;
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
);
const { isAuthenticated, isLoading, userData, signOut, checkSession } =
  useSuperTokens();
const { $colorMode } = useNuxtApp();
const route = useRoute();
const showSettingsModal = ref(false);
const toast = useToast();
const { connected, account, wallet } = useWallet();

// Compatibility: create publicKey-like object from account
const publicKey = computed(() => {
  if (!account.value?.address) return null;
  return {
    toString: () => account.value!.address,
    toBase58: () => account.value!.address,
  };
});
const { nosana } = useKit();
const { triggerCreditRefresh } = useCreditRefresh();

// NOS balance (wallet users)
const nosBalance = ref<{ uiAmount: number } | null>(null);
const { data: stats } = useAPI("/api/stats");
const nosPrice = computed(() => stats.value?.price || 0);

watch(
  [connected, publicKey],
  async ([newConnected, newPublicKey]) => {
    if (newConnected && newPublicKey) {
      try {
        const bal = await nosana.value.nos.getBalance(newPublicKey.toBase58());
        nosBalance.value = bal !== null ? { uiAmount: bal } : null;
      } catch {
        nosBalance.value = null;
      }
    } else {
      nosBalance.value = null;
    }
  },
  { immediate: true },
);

interface Invitation {
  creditsAmount: number;
  expirationDate: string | Date | null;
  restrictedEmail: string | null;
  isClaimed: boolean;
  isExpired: boolean;
}

// Credit invitation variables
const invitationToken = computed(() => route.query.token as string);
const invitation = ref<Invitation | null>(null);
const loadingInvitation = ref(false);
const invitationError = ref("");
const claiming = ref(false);
let invitationLoadPromise: Promise<void> | null = null;

const showFreeCreditsModal = ref(false);
const showInvitationModal = ref(false);
const showClaimModal = ref(false);
const checkedEligibility = ref(false);

const checkFreeCreditsEligibility = async () => {
  if (!isAuthenticated.value || checkedEligibility.value) {
    return;
  }

  // Mark in-flight immediately so a concurrent call can't slip through
  checkedEligibility.value = true;

  // If we have an invitation token, ensure it's loaded before checking eligibility
  if (invitationToken.value) {
    await loadInvitation();
  }

  // If we have an invitation token, show that modal instead of checking for free credits
  if (
    invitationToken.value &&
    invitation.value &&
    !invitation.value.isClaimed &&
    !invitation.value.isExpired
  ) {
    if (
      !invitation.value.restrictedEmail ||
      userData.value?.email === invitation.value.restrictedEmail
    ) {
      showInvitationModal.value = true;
      return;
    }
  }

  try {
    const data = await $fetch<{ eligible: boolean }>(
      `${config.backend_url}/api/credits/request/eligibility`,
      {
        credentials: "include",
      },
    );

    if (data && data.eligible) {
      showFreeCreditsModal.value = true;
    }
  } catch (error) {
    checkedEligibility.value = false; // allow retry on network error
    console.error("Error checking free credits eligibility:", error);
  }
};

const handleFreeCreditsClaimed = async () => {
  triggerCreditRefresh();
  if (showInvitationModal.value) {
    navigateTo("/account", { replace: true });
  }
};

const activeAddress = computed(() => {
  if (isAuthenticated.value && userData.value?.generatedAddress) {
    return userData.value.generatedAddress;
  }
  if (connected.value && publicKey.value) {
    return publicKey.value.toString();
  }
  return null;
});

// Latching ref: once true, never goes back to false — prevents flicker when
// isLoading briefly toggles true/false after mount while isAuthenticated stays true.
const canShowAccountData = ref(false);
watch(
  () => isAuthenticated.value || connected.value,
  (val) => {
    if (val) canShowAccountData.value = true;
  },
  { immediate: true },
);

// Define type for spending history results item
interface MonthlyResult {
  period: string;
  total_usd: number;
  breakdown: Array<{ market: string; totalSpent: number }>;
  daily_breakdown?: Record<string, Record<string, number>>;
}

// Add debouncing to prevent excessive API calls during tab switches
let refreshTimeout: NodeJS.Timeout | null = null;
// Initialize from current activeAddress so the watcher doesn't treat the
// initial isLoading transition as a genuine address change.
let lastStableAddress: string | null = activeAddress.value;

watch(
  [
    () => activeAddress.value,
    () => isLoading.value,
    () => userData.value?.generatedAddress,
  ],
  (newValues, oldValues) => {
    const [newAddress, newLoading] = newValues;

    // Clear any pending refresh
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }

    // Skip if authentication is loading (temporary state during tab switches)
    if (newLoading) {
      return;
    }

    // Only refresh if we have a meaningful address change (not just loading states)
    const addressReallyChanged = newAddress && newAddress !== lastStableAddress;

    if (addressReallyChanged) {
      lastStableAddress = newAddress;

      refreshTimeout = setTimeout(async () => {
        await checkFreeCreditsEligibility();
        refreshSpendingHistory();
      }, 500);
    } else {
      // Update stable address if we have a valid one
      if (newAddress) {
        lastStableAddress = newAddress;
      }
    }
  },
);

onMounted(async () => {
  // Explicitly fetch user data for the account page
  await checkSession(true);

  if (canShowAccountData.value && activeAddress.value) {
    lastStableAddress = activeAddress.value; // Keep stable address in sync after checkSession
    // Wait for eligibility check first — opening the modal while other async
    // fetches are in-flight causes navigations that close it prematurely.
    await checkFreeCreditsEligibility();
    refreshSpendingHistory();
  }

  // Add CSS to improve text rendering
  const style = document.createElement("style");
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
const selectedMonths = ref<"3" | "6" | "12">("3");

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
    return date.toISOString().split("T")[0];
  };

  return `/api/stats/spending-history?address=${activeAddress.value}&start_date=${formatDate(startDate)}&group_by=month`;
});

const {
  data: spendingHistory,
  pending: loadingSpending,
  refresh: _refreshSpendingHistory,
} = useAPI(
  computed(() => spendingHistoryEndpoint.value || ""),
  {
    default: () => ({
      userAddress: "",
      startDate: "",
      endDate: "",
      groupBy: "",
      results: [],
      forecast: 0,
      comparison: null,
      sameDayComparison: null,
    }),
  },
);

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
  const currentMonthFormatted = (today.getMonth() + 1)
    .toString()
    .padStart(2, "0");
  const currentPeriod = `${currentYear}-${currentMonthFormatted}`; // Format: "YYYY-MM"

  const currentMonthData = spendingHistory.value.results.find(
    (item: any) => item.period === currentPeriod,
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
  },
);

// Pass monthly history data to chart
const monthlyHistory = computed(() => spendingHistory.value);
const loadingHistory = computed(() => loadingSpending.value);
const hasLoadedHistoryOnce = ref(false);
const hasLoadedSpendingOnce = ref(false);
watch(loadingHistory, (val) => {
  if (!val) {
    hasLoadedHistoryOnce.value = true;
    hasLoadedSpendingOnce.value = true;
  }
});

// Get markets data for name mapping
const { data: marketsData } = useAPI("/api/markets", { default: () => [] });

// Predefined colors for different GPU types with distinct color scheme
const GPU_COLORS: Record<string, string> = {
  // 3000 Series
  "NVIDIA 3060": "#16C47F",
  "NVIDIA 3070": "#FFD65A",
  "NVIDIA 3080": "#FF9D23",
  "NVIDIA 3090": "#F93827",
  // 4000 Series
  "NVIDIA 4060": "#26355D",
  "NVIDIA 4070": "#AF47D2",
  "NVIDIA 4080": "#FF8F00",
  "NVIDIA 4090": "#FFDB00",
  // 5000 Series
  "NVIDIA 5070": "#6420AA",
  "NVIDIA 5080": "#FF3EA5",
  "NVIDIA 5090": "#FF7ED4",
  // Professional Series
  "NVIDIA 4000/A4000": "#3F0071",
  "NVIDIA 5000/A5000": "#FB2576",
  "NVIDIA 6000/A6000": "#332FD0",
  "NVIDIA A40": "#00FFAB",
  "NVIDIA A100 40GB": "#14C38E",
  "NVIDIA A100 80GB": "#B8F1B0",
  "NVIDIA H100": "#E3FCBF",
};

// Create a mapping of market addresses to names and group info
const marketAddressToInfo = computed(() => {
  if (!marketsData.value) return {};
  return marketsData.value.reduce(
    (
      acc: Record<string, { name: string; isCommunity: boolean }>,
      market: any,
    ) => {
      // Include all markets, not just NVIDIA ones
      if (market.address) {
        acc[market.address] = {
          name:
            market.name?.replace(" Community", "") ||
            market.address.slice(0, 8) + "...", // Remove Community suffix or use truncated address
          isCommunity: market.name?.includes("Community") || false,
        };
      }
      return acc;
    },
    {},
  );
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
  chartStartDate = new Date(
    today.getFullYear(),
    today.getMonth() - monthsAgo + 1,
    1,
  ); // +1 because we want *inclusive* months

  const allMonthLabels: string[] = [];
  const periodToIndexMap: { [key: string]: number } = {};
  let currentDate = new Date(chartStartDate);
  let index = 0;

  // Ensure loop ends correctly by comparing month and year
  while (
    currentDate.getFullYear() < today.getFullYear() ||
    (currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() <= today.getMonth())
  ) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    // Remove year from the label
    const label = currentDate
      .toLocaleDateString("en-US", { month: "short" })
      .replace(",", "");
    allMonthLabels.push(label);

    const periodKey = `${year}-${(month + 1).toString().padStart(2, "0")}`; // YYYY-MM
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
      // Include all markets, even if not in marketsData (custom markets)
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
        gpuUsageCounts.set(
          baseName,
          (gpuUsageCounts.get(baseName) || 0) + b.totalSpent,
        );
      } else {
        // Handle custom markets that aren't in marketsData
        // Use truncated address as the name
        const baseName = `Custom (${b.market.slice(0, 8)}...)`;
        if (!marketGroups.has(baseName)) {
          marketGroups.set(baseName, new Set());
          gpuUsageCounts.set(baseName, 0);
        }
        marketGroups.get(baseName)?.add(b.market);
        gpuUsageCounts.set(
          baseName,
          (gpuUsageCounts.get(baseName) || 0) + b.totalSpent,
        );
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
    (spendingHistory.value?.results || []).forEach(
      (monthItem: MonthlyResult) => {
        const monthIndex = periodToIndexMap[monthItem.period];
        // Only process if the period from API is within our generated range
        if (monthIndex !== undefined) {
          let communityTotal = 0;
          let premiumTotal = 0;

          addresses.forEach((market) => {
            const marketData = monthItem.breakdown.find(
              (b: any) => b.market === market,
            );
            if (marketData) {
              const marketInfo = marketAddressToInfo.value[market];
              // Ensure marketInfo exists before accessing properties
              if (marketInfo) {
                if (marketInfo.isCommunity) {
                  communityTotal += marketData.totalSpent;
                } else {
                  premiumTotal += marketData.totalSpent;
                }
              } else {
                // Handle custom markets - treat as premium by default
                premiumTotal += marketData.totalSpent;
              }
            }
          });

          // Update the data arrays at the calculated index
          dataPoints[monthIndex] = communityTotal + premiumTotal;
          communityDataPoints[monthIndex] = communityTotal;
          premiumDataPoints[monthIndex] = premiumTotal;
        }
      },
    );

    // Create the dataset object (same as before, but uses the full-length data arrays)
    const formattedName = baseName.toUpperCase();
    datasetArray.push({
      label: baseName,
      data: dataPoints,
      backgroundColor:
        GPU_COLORS[formattedName] || getColorForMarket(baseName, true),
      stack: "totalSpent",
      communityData: communityDataPoints,
      premiumData: premiumDataPoints,
      showInLegend: top3GPUs.includes(baseName),
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.7)",
      hoverBorderColor: "white",
      hoverBackgroundColor: GPU_COLORS[formattedName]
        ? makeColorBrighter(GPU_COLORS[formattedName])
        : makeColorBrighter(getColorForMarket(baseName, true)),
    });
  });

  // Sort datasets by GPU name (same as before)
  datasetArray.sort((a, b) => a.label.localeCompare(b.label));

  return {
    labels: allMonthLabels, // Use the generated full list of labels
    datasets: datasetArray,
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
  if (color.startsWith("hsl")) {
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
  const isDark = $colorMode?.value === "dark";
  const textColor = isDark ? "#ffffff" : "#000000";
  const gridColor = isDark ? "#444444" : "#e5e5e5";
  const tooltipBg = isDark ? "rgba(55, 65, 81, 0.95)" : "rgba(0, 0, 0, 0.8)";

  return {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2,
    layout: {
      padding: {
        left: 5,
        right: 10,
        top: 20,
        bottom: 5,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        align: "start" as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          padding: 15,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            family:
              "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            size: 12,
            weight: "normal" as const,
            lineHeight: 1.2,
          },
          color: textColor,
          filter: (legendItem: any) => {
            return (
              legendItem.datasetIndex !== undefined &&
              chartData.value.datasets[legendItem.datasetIndex]?.showInLegend
            );
          },
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleFont: {
          family:
            "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          size: 14,
          weight: "normal" as const,
          lineHeight: 1.4,
        },
        titleColor: "#ffffff",
        bodyFont: {
          family:
            "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          size: 13,
          lineHeight: 1.4,
        },
        bodyColor: "#ffffff",
        padding: 12,
        cornerRadius: 4,
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          title: function (tooltipItems: any) {
            const index = tooltipItems[0].dataIndex;
            const labels = chartData.value.labels;
            // Calculate the total for this month
            let monthTotal = 0;
            chartData.value.datasets.forEach((dataset: any) => {
              monthTotal += dataset.data[index] || 0;
            });

            const formattedTotal = "$" + monthTotal.toFixed(2);
            return `${labels[index]} - Total: ${formattedTotal}`;
          },
          label: function (context: any) {
            const dataset = context.dataset;
            const index = context.dataIndex;
            const total = dataset.data[index];

            // Only return the GPU name and total amount, no premium/community breakdown
            return `${dataset.label}: $${total.toFixed(2)}`;
          },
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family:
              "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            size: 13,
            weight: "normal" as const,
            lineHeight: 1.2,
          },
          color: textColor,
          padding: 8,
        },
        border: {
          width: 0,
          color: "transparent",
        },
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
          count: 5,
        },
        border: {
          width: 0,
          color: "transparent",
        },
        ticks: {
          callback: function (value: any) {
            return "$" + value;
          },
          font: {
            family:
              "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            size: 12,
            weight: "normal" as const,
            lineHeight: 1.2,
          },
          color: textColor,
          maxTicksLimit: 5,
          padding: 10,
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false,
        borderWidth: 1,
      },
    },
    barPercentage: 0.95,
    categoryPercentage: 0.95,
    animation: {
      duration: 800,
    },
    font: {
      family:
        "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    },
  };
});

const formatDate = (dateString: string | Date | null) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const loadInvitation = async () => {
  if (!invitationToken.value) return;

  // If already loading, return the existing promise
  if (invitationLoadPromise) {
    return invitationLoadPromise;
  }

  // Create a new load promise
  invitationLoadPromise = (async () => {
    try {
      loadingInvitation.value = true;
      invitationError.value = "";

      const response = await $fetch<Invitation>(
        `${config.backend_url}/api/credits/invitations/${invitationToken.value}`,
        {
          credentials: "include",
        },
      );
      invitation.value = response;

      if (response.isClaimed) {
        invitationError.value =
          "This credit invitation has already been claimed.";
      } else if (response.isExpired) {
        invitationError.value = "This credit invitation has expired.";
      }
    } catch (err: any) {
      console.error("Error loading invitation:", err);
      invitationError.value =
        err.data?.message || "Failed to load invitation details";
    } finally {
      loadingInvitation.value = false;
      invitationLoadPromise = null;
    }
  })();

  return invitationLoadPromise;
};

// Watch for invitation token changes and authentication status
watch(
  [invitationToken, isAuthenticated],
  ([token, authenticated]) => {
    if (token) {
      loadInvitation();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
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
  justify-content: flex-start;
}

.usage-divider {
  width: 100%;
  height: 1px;
  background-color: #dbdbdb;
  margin: 1rem 0;
}

.balance-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cost-and-usage-box {
  justify-content: space-evenly;
}

.buttons.has-addons .button:focus,
.buttons.has-addons .button:focus-visible {
  outline: none;
  box-shadow: none;
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
  border-color: #10e80c !important;
}

.dark-mode .container-icon:hover svg {
  fill: #10e80c !important;
}

.nosana-icon {
  color: #10e80c;
}

.nosana-icon :deep(path) {
  fill: #10e80c;
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
  border-color: #10e80c !important;
}

.container-icon:hover svg {
  fill: #10e80c !important;
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
  color: #10e80c;
  text-align: center;
  margin: 2rem 0;
  text-shadow: 0 2px 4px rgba(16, 232, 12, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
  color: #10e80c;
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
