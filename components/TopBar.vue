<template>
  <div class="is-flex is-justify-content-space-between mb-5 is-flex-wrap-wrap">
    <div>
      <h2 class="title">{{ title }}</h2>
      <h3 v-if="subtitle" class="subtitle mb-2">
        {{ subtitle }}
      </h3>
    </div>
    <div class="modal" :class="{ 'is-active': modelValue }">
      <div class="modal-background" @click="updateShowSettingsModal(false)"></div>
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
    <!-- Profile Section -->
    <div v-if="(isGoogleAuthenticated || connected) && !hideButtons" class="profile-dropdown" :class="{ 'sticky-profile': $route.path === '/deploy' }">
      <div class="profile-button" @click="toggleUserProfileDropdown">
        <!-- Google Auth User -->
        <template v-if="isGoogleAuthenticated">
          <div class="profile-avatar auth-avatar">
            <img v-if="getAuthProvider() === 'google'" src="@/assets/img/icons/google.svg" alt="Google icon" class="auth-icon" />
            <img v-else-if="getAuthProvider() === 'twitter'" src="@/assets/img/icons/twitter.svg" alt="Twitter icon" class="auth-icon" />
            <span v-else>{{ getUserInitials() }}</span>
          </div>
          <div class="profile-info">
            <span class="profile-name">{{ getUserName() }}</span>
            <span class="profile-balance">${{ getCreditBalance().toFixed(2) }}</span>
          </div>
        </template>
        <!-- Wallet User -->
        <template v-else-if="connected && wallet">
          <div class="profile-avatar wallet-avatar">
            <img v-if="wallet.adapter.icon" :src="wallet.adapter.icon" :alt="wallet.adapter.name + ' icon'" class="wallet-icon" />
            <span v-else>W</span>
          </div>
          <div class="profile-info">
            <span class="profile-name">{{ getWalletAddress() }}</span>
            <span class="profile-balance">${{ getNosBalanceUSD().toFixed(2) }}</span>
          </div>
        </template>
        <svg class="dropdown-arrow" :class="{ 'is-flipped': showUserProfileDropdown }" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      
      <div v-if="showUserProfileDropdown" class="dropdown-menu-simple">
        <button class="dropdown-item-simple" @click.stop="openPriorityFeeSettings">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="dropdown-icon">
            <path d="M6.71971 1.2926L6.41471 2.9726C6.11846 3.06573 5.83097 3.18635 5.55971 3.32761L4.14971 2.35761L2.33979 4.16753L3.31479 5.57252C3.17292 5.84439 3.05355 6.13003 2.95979 6.42753L1.27979 6.73252V9.29252L2.95979 9.59751C3.05354 9.89564 3.17729 10.18 3.31979 10.4525L2.33979 11.8575L4.14971 13.6674L5.5547 12.6974C5.82719 12.8399 6.11657 12.9587 6.4147 13.0524L6.71969 14.7324H9.27969L9.58468 13.0524C9.88218 12.9587 10.1678 12.8393 10.4397 12.6974L11.8447 13.6674L13.6546 11.8575L12.6796 10.4525C12.8208 10.1813 12.9415 9.89878 13.0346 9.60252L14.7196 9.29252V6.73252L13.0346 6.42753C12.9415 6.1319 12.8252 5.84815 12.6846 5.57753L13.6546 4.16753L11.8447 2.35761L10.4397 3.32761C10.1678 3.18574 9.88218 3.06636 9.58468 2.9726L9.27969 1.2926H6.71971ZM7.9997 4.9726C9.67842 4.9726 11.0397 6.33385 11.0397 8.0126C11.0397 9.69135 9.67846 11.0526 7.9997 11.0526C6.32095 11.0526 4.95971 9.69135 4.95971 8.0126C4.95971 6.33385 6.32095 4.9726 7.9997 4.9726Z" fill="currentColor"/>
          </svg>
          Priority Fee Settings
        </button>
        <hr class="dropdown-divider">
        <button class="dropdown-item-simple logout-item" @click.stop="logout">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="dropdown-icon">
            <path d="M6 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H6M10 6L14 10M14 10L10 14M14 10H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Log out
        </button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { WalletMultiButton } from "solana-wallets-vue";
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useWallet } from 'solana-wallets-vue';

const { prioFee } = useSDK();
const { status, signOut, data: session, token } = useAuth();
const router = useRouter();
const { connected, publicKey, wallet, disconnect } = useWallet();

// Profile dropdown state  
const showUserProfileDropdown = ref(false);

// Memoized authentication state to prevent unnecessary template re-renders
const isGoogleAuthenticated = computed(() => {
  const currentStatus = status.value;
  return currentStatus === 'authenticated' || currentStatus === 'loading';
});

// Profile dropdown functions
const toggleUserProfileDropdown = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  showUserProfileDropdown.value = !showUserProfileDropdown.value;
};

const openPriorityFeeSettings = () => {
  showUserProfileDropdown.value = false;
  updateShowSettingsModal(true);
};

// Wallet address formatting
const getWalletAddress = () => {
  if (!publicKey.value) return '';
  const address = publicKey.value.toBase58();
  return `${address.slice(0, 4)}..${address.slice(-4)}`;
};


const getUserName = () => {
  return session.value?.email || session.value?.providerUsername || session.value?.name || 'User';
};

const getUserInitials = () => {
  const name = getUserName();
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getAuthProvider = () => {
  if (session.value?.id?.startsWith('twitter_')) {
    return 'twitter';
  }
  return 'google';
};

// Credit balance state - using useState to persist across navigation
const creditBalance = useState('topbar-credit-balance', () => 0);
const loadingCreditBalance = ref(false);
const hasLoadedCreditBalance = useState('topbar-has-loaded-balance', () => false);

// NOS balance state
const nosBalance = ref<any | null>(null);
const loadingNosBalance = ref(false);

const getCreditBalance = () => {
  return creditBalance.value || 0;
};

// Get NOS price from stats API with memoization
const { data: stats } = useAPI('/api/stats');
const nosPrice = computed(() => stats.value?.price || 0);

// Memoized NOS balance in USD to prevent recalculation on every render
const nosBalanceUSD = computed(() => {
  if (!nosBalance.value || !nosPrice.value) return 0;
  return (nosBalance.value.uiAmount || 0) * nosPrice.value;
});

const getNosBalanceUSD = () => nosBalanceUSD.value;

// Fetch credit balance
const fetchCreditBalance = async (signal?: AbortSignal) => {
  if (status.value !== 'authenticated') return;
  
  loadingCreditBalance.value = true;
  try {
    const config = useRuntimeConfig().public;
    
    const response = await fetch(`${config.apiBase}/api/credits/balance`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token.value as string,
      },
      signal, // Pass the abort signal
    });

    if (response.ok) {
      const data = await response.json();
      creditBalance.value = data.assignedCredits
        ? data.assignedCredits - data.settledCredits - data.reservedCredits
        : 0;
      hasLoadedCreditBalance.value = true;
    } else {
      console.error("Failed to fetch credit balance");
    }
  } catch (error) {
    // Don't log errors for aborted requests
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error("Error fetching credit balance:", error);
    }
  } finally {
    loadingCreditBalance.value = false;
  }
};

// Fetch NOS balance
const fetchNosBalance = async (signal?: AbortSignal) => {
  if (!connected.value || !publicKey.value) return;
  
  loadingNosBalance.value = true;
  try {
    const { nosana } = useSDK();
    // Note: SDK calls don't support AbortSignal directly, but we can check if aborted
    if (signal?.aborted) return;
    
    nosBalance.value = await nosana.value.solana.getNosBalance(publicKey.value.toBase58());
  } catch (error) {
    // Don't log errors for aborted requests
    if (!(error instanceof Error && error.name === 'AbortError') && !signal?.aborted) {
      console.error("Error fetching NOS balance:", error);
    }
    nosBalance.value = null;
  } finally {
    loadingNosBalance.value = false;
  }
};

// Logout function
const logout = async () => {
  showUserProfileDropdown.value = false;
  try {
    if (connected.value) {
      await disconnect();
    } else if (status.value === 'authenticated') {
      const redirect = window.location.pathname === '/account/deployer' ? true : false;
      await signOut({ redirect: false });
      if (redirect) {
        await navigateTo('/');
      }
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

// Close dropdown when clicking outside (onMounted)

// Debounced API calls with abort controllers to prevent race conditions
let creditBalanceTimeout: NodeJS.Timeout | null = null;
let nosBalanceTimeout: NodeJS.Timeout | null = null;
let creditBalanceController: AbortController | null = null;
let nosBalanceController: AbortController | null = null;

const debouncedFetchCreditBalance = () => {
  // Cancel any pending request
  if (creditBalanceController) {
    creditBalanceController.abort();
  }
  
  if (creditBalanceTimeout) clearTimeout(creditBalanceTimeout);
  creditBalanceTimeout = setTimeout(() => {
    creditBalanceController = new AbortController();
    fetchCreditBalance(creditBalanceController.signal);
  }, 100);
};

const debouncedFetchNosBalance = () => {
  // Cancel any pending request
  if (nosBalanceController) {
    nosBalanceController.abort();
  }
  
  if (nosBalanceTimeout) clearTimeout(nosBalanceTimeout);
  nosBalanceTimeout = setTimeout(() => {
    nosBalanceController = new AbortController();
    fetchNosBalance(nosBalanceController.signal);
  }, 100);
};

// Watch for authentication status and token changes (optimized)
watch([status, token], async (newValues, oldValues) => {
  const [newStatus, newToken] = newValues;
  const [oldStatus, oldToken] = oldValues || [];
  
  // Only fetch if authentication state actually changed to authenticated
  if (newStatus === 'authenticated' && newToken && 
      (oldStatus !== 'authenticated' || oldToken !== newToken)) {
    debouncedFetchCreditBalance();
  }
}, { immediate: true });

// Watch for wallet connection changes (optimized)
watch([connected, publicKey], async (newValues, oldValues) => {
  const [newConnected, newPublicKey] = newValues;
  const [oldConnected, oldPublicKey] = oldValues || [];
  
  // Only fetch if wallet actually connected or changed
  if (newConnected && newPublicKey && 
      (!oldConnected || oldPublicKey?.toBase58() !== newPublicKey?.toBase58())) {
    debouncedFetchNosBalance();
  }
}, { immediate: true });

// Watch for credit refresh events
const { onCreditRefresh } = useCreditRefresh();
onCreditRefresh(async () => {
  if (status.value === 'authenticated') {
    await fetchCreditBalance();
  }
});

// Store click handler reference for cleanup
let clickHandler: ((e: Event) => void) | null = null;

onMounted(() => {
  if (process.client) {
    clickHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      const dropdown = target?.closest?.('.profile-dropdown');
      if (!dropdown && showUserProfileDropdown.value) {
        showUserProfileDropdown.value = false;
      }
    };
    document.addEventListener('click', clickHandler);
  }
});

onUnmounted(() => {
  // Clean up timeouts to prevent memory leaks
  if (creditBalanceTimeout) {
    clearTimeout(creditBalanceTimeout);
    creditBalanceTimeout = null;
  }
  if (nosBalanceTimeout) {
    clearTimeout(nosBalanceTimeout);
    nosBalanceTimeout = null;
  }
  
  // Abort any pending requests
  if (creditBalanceController) {
    creditBalanceController.abort();
    creditBalanceController = null;
  }
  if (nosBalanceController) {
    nosBalanceController.abort();
    nosBalanceController = null;
  }
  
  // Clean up event listener
  if (clickHandler && process.client) {
    document.removeEventListener('click', clickHandler);
    clickHandler = null;
  }
});

interface PrioFeeConfig {
  strategy: 'low' | 'medium' | 'high' | 'veryHigh';
  staticFee: number;
  dynamicPriorityFee: boolean;
  maxPriorityFee: number;
}

// Priority fee configuration mapping
const PRIO_FEE_CONFIGS: Record<string, PrioFeeConfig> = {
  low: {
    strategy: 'low',
    staticFee: 10000,
    dynamicPriorityFee: true,
    maxPriorityFee: 1000000
  },
  medium: {
    strategy: 'medium',
    staticFee: 100000,
    dynamicPriorityFee: true,
    maxPriorityFee: 15000000
  },
  high: {
    strategy: 'high',
    staticFee: 100000,
    dynamicPriorityFee: true,
    maxPriorityFee: 15000000
  },
  veryHigh: {
    strategy: 'veryHigh',
    staticFee: 100000,
    dynamicPriorityFee: true,
    maxPriorityFee: 15000000
  }
};

const setPrioFeeConfig = (level: keyof typeof PRIO_FEE_CONFIGS) => {
  const config = PRIO_FEE_CONFIGS[level];
  prioFee.value = config;
};

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: false,
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

// Expose functions for parent components to call
defineExpose({
  fetchCreditBalance,
  fetchNosBalance
});
</script>

<style scoped>
.profile-dropdown {
  position: relative;
  cursor: pointer;
  user-select: none;
  z-index: 100;
  flex-shrink: 0;
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  background: white;
}


.profile-avatar {
  width: 40px;
  height: 32px;
  border-radius: 8px;
  background: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.wallet-avatar {
  background: transparent !important;
  padding: 0 !important;
}

.wallet-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 6px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  max-width: 120px;
}

.profile-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.profile-balance {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.dropdown-arrow {
  transition: transform 0.2s ease;
  color: #6b7280;
}

.dropdown-arrow.is-flipped {
  transform: rotate(-90deg);
}

.dropdown-menu-simple {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 99999;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 0.25rem 0;
  width: 100%;
}


.dropdown-item-simple {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
}

.dropdown-item-simple:hover {
  background-color: #f9fafb;
}

.dropdown-item-simple.logout-item {
  color: #dc2626;
}

.dropdown-item-simple.logout-item:hover {
  background-color: #fef2f2;
}


.dropdown-icon {
  flex-shrink: 0;
  color: #6b7280;
}

.logout-item .dropdown-icon {
  color: #dc2626;
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  border: none;
  margin: 0.5rem 0;
}

/* Dark mode styles */
.dark-mode .profile-button {
  background: #000000;
}

.dark-mode .profile-name {
  color: #d1d5db;
}

.dark-mode .profile-balance {
  color: #d1d5db;
}

.dark-mode .dropdown-menu-simple {
  background: #000000;
  border: none;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.dark-mode .dropdown-item-simple {
  color: #d1d5db;
}

.dark-mode .dropdown-item-simple:hover {
  background-color: #1a1a1a;
}

.dark-mode .dropdown-item-simple.logout-item {
  color: #f87171;
}

.dark-mode .dropdown-item-simple.logout-item:hover {
  background-color: #450a0a;
}

.dark-mode .dropdown-divider {
  background: #374151;
}

.dark-mode .dropdown-icon {
  color: #9ca3af;
}

.dark-mode .logout-item .dropdown-icon {
  color: #f87171;
}

.dark-mode .profile-avatar {
  background: #4b5563;
}

/* Sticky profile on deploy page */
.sticky-profile {
  position: fixed !important;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark-mode .sticky-profile {
  background: #1a1a1a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Hide TopBar profile section on mobile to prevent overlap with sidebar */
@media screen and (max-width: 1023px) {
  .profile-dropdown,
  .button.is-primary {
    display: none !important;
  }
}

.auth-avatar {
  background: transparent !important;
  padding: 0 !important;
}

.auth-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 6px;
}

/* X (Twitter) icon specific styling */
img[alt="Twitter icon"] {
  background-color: #000;
  border-radius: 6px;
  padding: 4px;
}

.dark-mode img[alt="Twitter icon"] {
  background-color: #000;
}
</style>
