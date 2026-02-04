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
            <GoogleIcon v-if="getAuthProvider() === 'google'" alt="Google icon" class="auth-icon" />
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
            <img v-if="wallet.icon" :src="wallet.icon" :alt="wallet.name + ' icon'" class="wallet-icon" />
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
        <!-- Account button for credit users -->
        <button v-if="isGoogleAuthenticated" class="dropdown-item-simple" @click.stop="goToAccount">
          <UserIcon class="dropdown-icon" />
          Account
        </button>
        <!-- Priority Fee Settings for wallet users -->
        <button v-else class="dropdown-item-simple" @click.stop="openPriorityFeeSettings">
          <SettingsIcon class="dropdown-icon" />
          Priority Fee Settings
        </button>
        <hr class="dropdown-divider">
        <button class="dropdown-item-simple logout-item" @click.stop="logout">
          <LogoutIcon class="dropdown-icon" />
          Log out
        </button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { SolanaWalletButton, useWallet } from "@nosana/solana-vue";
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import GoogleIcon from '@/assets/img/icons/google.svg?component';
import UserIcon from '@/assets/img/icons/sidebar/user.svg?component';
import SettingsIcon from '@/assets/img/icons/settings.svg?component';
import LogoutIcon from '@/assets/img/icons/logout.svg?component';
import { useRouter } from 'vue-router';

const { nosana, prioFee } = useKit();
const { status, signOut, data: session, token } = useAuth();
const router = useRouter();
const { connected, account, wallet, disconnect } = useWallet();

// Compatibility: create publicKey-like object from account
const publicKey = computed(() => {
  if (!account.value?.address) return null;
  return {
    toString: () => account.value!.address,
    toBase58: () => account.value!.address,
  };
});

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

const goToAccount = () => {
  showUserProfileDropdown.value = false;
  router.push('/account');
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
  // Only fetch if user is authenticated AND has a valid token
  if (status.value !== 'authenticated' || !token.value) {
    return;
  }
  
  loadingCreditBalance.value = true;
  try {
    const data = await nosana.value.api.credits.balance();
    creditBalance.value = data.assignedCredits
      ? data.assignedCredits - data.settledCredits - data.reservedCredits
      : 0;
    hasLoadedCreditBalance.value = true;
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
    // Note: SDK calls don't support AbortSignal directly, but we can check if aborted
    if (signal?.aborted) return;
    
    const bal = await nosana.value.nos.getBalance(publicKey.value.toBase58());
    nosBalance.value = bal !== null ? { uiAmount: bal } : null;
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
    // Clear wallet session cookie
    const sessionCookie = useCookie('nosana-wallet-session');
    sessionCookie.value = null;
    
    // Try to sign out from SuperTokens if a session exists
    try {
      const Session = await import('supertokens-web-js/recipe/session');
      if (await Session.default.doesSessionExist()) {
        await Session.default.signOut();
      }
    } catch (e) {
      // Ignore if SuperTokens not initialized
    }
    
    if (connected.value) {
      await disconnect();
      await navigateTo('/');
    } else if (status.value === 'authenticated') {
      await signOut({ redirect: false });
      await navigateTo('/');
    } else {
      await navigateTo('/');
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
  
  // Skip loading state (session refresh in progress)
  if (newStatus === 'loading') return;
  
  // Only fetch if authenticated AND haven't loaded yet
  if (newStatus === 'authenticated' && newToken && !hasLoadedCreditBalance.value) {
    debouncedFetchCreditBalance();
  } else if (newStatus === 'unauthenticated') {
    // Reset on logout so next login will fetch
    hasLoadedCreditBalance.value = false;
    creditBalance.value = 0;
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

<style scoped lang="scss">
@use "sass:color";
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
  background: $box-background-color;
}


.profile-avatar {
  width: 40px;
  height: 32px;
  border-radius: 8px;
  background: $grey;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: $white;
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
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.profile-balance {
  font-size: 0.75rem;
  font-weight: 600;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.dropdown-arrow {
  transition: transform 0.2s ease;
  color: $grey;
}

.dropdown-arrow.is-flipped {
  transform: rotate(-90deg);
}

.dropdown-menu-simple {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 99999;
  background: $box-background-color;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba($black, 0.1);
  border: 1px solid $border;
  padding: 0;
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
  color: $text;
}

.dropdown-item-simple:hover {
  background-color: $grey-lightest;
}

.dropdown-item-simple.logout-item {
  color: $danger;
}

.dropdown-item-simple.logout-item:hover {
  background-color: rgba($danger, 0.08);
}


.dropdown-icon {
  flex-shrink: 0;
  color: $grey;
  width: 16px;
  height: 16px;
}

.logout-item .dropdown-icon {
  color: $danger;
}

.dropdown-divider {


  border: none;
  margin: 0;
}

/* Dark mode styles */
.dark-mode .profile-button {
  background: $box-background-color-dark;
}

.dark-mode .profile-name {
  color: $white;
}

.dark-mode .profile-balance {
  color: $white;
}

.dark-mode .dropdown-menu-simple {
  background: $box-background-color-dark;
  border: none;
  box-shadow: 0 10px 25px rgba($black, 0.3);
}

.dark-mode .dropdown-item-simple {
  color: $white;
}

.dark-mode .dropdown-item-simple:hover {
  background-color: color.adjust($box-background-color-dark, $lightness: -5%);
}

.dark-mode .dropdown-item-simple.logout-item {
  color: $danger;
}

.dark-mode .dropdown-item-simple.logout-item:hover {
  background-color: rgba($danger, 0.12);
}

.dark-mode .dropdown-divider {
  background: $grey-darker;
}

.dark-mode .dropdown-icon {
  color: $grey-light;
}

.dark-mode .logout-item .dropdown-icon {
  color: $danger;
}

.dark-mode .profile-avatar {
  background: $grey-darker;
}

/* Sticky profile on deploy page */
.sticky-profile {
  position: fixed !important;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: $box-background-color;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba($black, 0.1);
}

.dark-mode .sticky-profile {
  background: $box-background-color-dark;
  box-shadow: 0 4px 12px rgba($black, 0.3);
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
</style>
