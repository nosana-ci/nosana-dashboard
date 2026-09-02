<template>
  <div class="is-flex is-justify-content-space-between mb-5 is-flex-wrap-wrap">
    <div>
      <h2 class="title">{{ title }}</h2>
      <h3 v-if="subtitle" class="subtitle mb-2">
        {{ subtitle }}
      </h3>
    </div>
    <div class="modal" :class="{ 'is-active': modelValue }">
      <div
        class="modal-background"
        @click="updateShowSettingsModal(false)"
      ></div>
      <div class="modal-content">
        <div class="box">
          <h2 class="title mb-5 has-text-weight-bold">Settings</h2>
          <h3 class="title is-5">Global Prio-fee Level</h3>
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
        @click="updateShowSettingsModal(false)"
        aria-label="close"
      ></button>
    </div>
    <!-- Profile Section -->
    <div
      v-if="(isGoogleAuthenticated || connected) && !hideButtons"
      class="dropdown is-right profile-dropdown"
      :class="{
        'is-active': showUserProfileDropdown,
        'sticky-profile': $route.path === '/deploy',
      }"
    >
      <div class="dropdown-trigger">
        <div
          class="profile-button"
          :class="{ 'is-open': showUserProfileDropdown }"
          role="button"
          tabindex="0"
          aria-haspopup="true"
          aria-controls="profile-dropdown-menu"
          @click="toggleUserProfileDropdown"
          @keydown.enter.prevent="toggleUserProfileDropdown"
          @keydown.space.prevent="toggleUserProfileDropdown"
        >
          <!-- Google Auth User -->
          <template v-if="isGoogleAuthenticated">
            <span class="profile-balance"
              >${{ getCreditBalance().toFixed(2) }}</span
            >
            <div class="profile-avatar auth-avatar">
              <UserIcon class="auth-icon has-text-grey" />
            </div>
          </template>
          <!-- Wallet User -->
          <template v-else-if="connected && wallet">
            <div class="profile-avatar wallet-avatar">
              <img
                v-if="wallet.icon"
                :src="wallet.icon"
                :alt="wallet.name + ' icon'"
                class="wallet-icon"
              />
              <span v-else>W</span>
            </div>
            <div class="profile-info">
              <span class="profile-name">{{ getUserName() }}</span>
              <span class="profile-balance"
                >${{ vaultBalanceUSD.toFixed(2) }}</span
              >
            </div>
          </template>
          <svg
            class="dropdown-arrow"
            :class="{ 'is-flipped': showUserProfileDropdown }"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <div id="profile-dropdown-menu" class="dropdown-menu" role="menu">
        <div class="dropdown-content">
          <!-- Identity header -->
          <div class="dropdown-header">
            <div class="dropdown-header-avatar">
              <img
                v-if="connected && wallet && wallet.icon"
                :src="wallet.icon"
                :alt="wallet.name + ' icon'"
                class="wallet-icon"
              />
              <UserIcon v-else class="auth-icon" />
            </div>
            <div class="dropdown-header-info">
              <span class="dropdown-header-name">{{ getUserName() }}</span>
              <span class="dropdown-header-sub">{{ identitySubline }}</span>
            </div>
          </div>

          <hr class="dropdown-divider" />

          <!-- Account links -->
          <div class="dropdown-section">
            <button
              class="dropdown-item"
              @click.stop="goTo('/account')"
            >
              <UserIcon class="dropdown-icon" />
              <span class="dropdown-item-text">Account</span>
            </button>
            <button
              v-if="isGoogleAuthenticated"
              class="dropdown-item"
              @click.stop="goTo('/account/billing')"
            >
              <WalletIcon class="dropdown-icon" />
              <span class="dropdown-item-text">Billing</span>
            </button>
            <button
              class="dropdown-item"
              @click.stop="goTo('/developers')"
            >
              <CodeIcon class="dropdown-icon" />
              <span class="dropdown-item-text">Developers</span>
            </button>
            <button
              class="dropdown-item"
              @click.stop="goTo('/support')"
            >
              <SupportIcon class="dropdown-icon" />
              <span class="dropdown-item-text">Help &amp; Support</span>
            </button>
            <!-- Priority fee for wallet users -->
            <button
              v-if="!isGoogleAuthenticated"
              class="dropdown-item"
              @click.stop="openPriorityFeeSettings"
            >
              <SettingsIcon class="dropdown-icon" />
              <span class="dropdown-item-text">Priority fee</span>
            </button>
          </div>

          <hr class="dropdown-divider" />

          <!-- Theme -->
          <div class="dropdown-theme-row">
            <span class="dropdown-theme-label">Theme</span>
            <div class="dropdown-theme-toggle">
              <button
                class="theme-toggle-btn"
                :class="{ 'is-active': $colorMode.value === 'light' }"
                @click.stop="useColorMode().preference = 'light'"
                title="Light Mode"
              >
                <SunIcon class="dropdown-icon" />
              </button>
              <button
                class="theme-toggle-btn"
                :class="{ 'is-active': $colorMode.value === 'dark' }"
                @click.stop="useColorMode().preference = 'dark'"
                title="Dark Mode"
              >
                <MoonIcon class="dropdown-icon" />
              </button>
            </div>
          </div>

          <hr class="dropdown-divider" />

          <button class="dropdown-item logout-item" @click.stop="logout">
            <LogoutIcon class="dropdown-icon" />
            <span class="dropdown-item-text">Log out</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { SolanaWalletButton, useWallet } from "@nosana/solana-vue";
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import GoogleIcon from "@/assets/img/icons/google.svg?component";
import UserIcon from "@/assets/img/icons/sidebar/user.svg?component";
import SettingsIcon from "@/assets/img/icons/settings.svg?component";
import LogoutIcon from "@/assets/img/icons/logout.svg?component";
import WalletIcon from "@/assets/img/icons/wallet.svg?component";
import CodeIcon from "@/assets/img/icons/sidebar/code.svg?component";
import SupportIcon from "@/assets/img/icons/sidebar/support.svg?component";
import SunIcon from "@/assets/img/icons/sun.svg?component";
import MoonIcon from "@/assets/img/icons/moon.svg?component";
import { useRoute, useRouter } from "vue-router";

const { nosana, prioFee } = useKit();
const { isAuthenticated, isLoading, signOut, userData } = useSuperTokens();
const router = useRouter();
const route = useRoute();
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
  return isAuthenticated.value;
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

const goTo = (path: string) => {
  showUserProfileDropdown.value = false;
  router.push(path);
};

// Wallet address formatting
const getWalletAddress = () => {
  if (!publicKey.value) return "";
  const address = publicKey.value.toBase58();
  return `${address.slice(0, 4)}..${address.slice(-4)}`;
};

const getUserName = () => {
  if (
    userData.value?.email ||
    userData.value?.providerUsername ||
    userData.value?.name
  ) {
    return (
      userData.value.email ||
      userData.value.providerUsername ||
      userData.value.name
    );
  }
  // Wallet user: show truncated address
  const addr = account.value?.address;
  if (addr) {
    return addr.slice(0, 4) + "..." + addr.slice(-4);
  }
  return "";
};

const getUserInitials = () => {
  const name = getUserName();
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAuthProvider = () => {
  return "google";
};

// Credit balance state - shared single source of truth (see useCreditBalance).
const {
  creditBalance,
  hasLoaded: hasLoadedCreditBalance,
  fetchBalance: fetchCreditBalance,
  reset: resetCreditBalance,
} = useCreditBalance();

const getCreditBalance = () => {
  return creditBalance.value || 0;
};

// Get NOS price from stats API with memoization
const { data: stats } = useAPI("/stats");
const nosPrice = computed(() => stats.value?.price || 0);

// Shared vault balance (wallet users): the platform-spendable balance shown
// in the profile chip — the analog of the credit balance for credit users.
const { balance: sharedVaultBalance, ensureSharedVault } = useSharedVault();
const vaultBalanceUSD = computed(
  () => (sharedVaultBalance.value.NOS || 0) * nosPrice.value,
);

// Secondary line under the name in the dropdown header: the spendable balance,
// labelled for whichever account type is signed in.
const identitySubline = computed(() => {
  if (isGoogleAuthenticated.value) {
    return `$${getCreditBalance().toFixed(2)} in credits`;
  }
  if (connected.value) {
    return `$${vaultBalanceUSD.value.toFixed(2)} available`;
  }
  return "";
});

// Credit balance fetching is provided by useCreditBalance (fetchCreditBalance).

const isPublicRoute = (path: string) =>
  path === "/" ||
  path === "/deployments/create" ||
  path === "/privacy-policy" ||
  path === "/tos" ||
  path.startsWith("/st-auth/");

const getPostLogoutTarget = () => {
  if (isPublicRoute(route.path)) {
    return "/deployments/create";
  }

  return {
    path: "/",
    query: { redirect: route.fullPath },
  };
};

// Logout function
const logout = async () => {
  showUserProfileDropdown.value = false;
  try {
    // Clear wallet session cookie
    const sessionCookie = useCookie("nosana-wallet-session");
    sessionCookie.value = null;

    // Try to sign out from SuperTokens if a session exists
    try {
      const Session = await import("supertokens-web-js/recipe/session");
      if (await Session.default.doesSessionExist()) {
        await Session.default.signOut();
      }
    } catch (e) {
      // Ignore if SuperTokens not initialized
    }

    if (connected.value) {
      await disconnect();
      await navigateTo(getPostLogoutTarget());
    } else if (isAuthenticated.value) {
      await signOut();
      await navigateTo(getPostLogoutTarget());
    } else {
      await navigateTo(getPostLogoutTarget());
    }
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

// Close dropdown when clicking outside (onMounted)

// Debounced API calls with abort controllers to prevent race conditions
let creditBalanceTimeout: NodeJS.Timeout | null = null;
let creditBalanceController: AbortController | null = null;

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

// Watch for authentication status and token changes (optimized)
watch(
  [isAuthenticated, isLoading],
  async (
    [newIsAuthenticated, newIsLoading],
    [oldIsAuthenticated, oldIsLoading],
  ) => {
    // Skip loading state (session refresh in progress)
    if (newIsLoading) return;

    // Only fetch if authenticated AND haven't loaded yet
    if (newIsAuthenticated && !hasLoadedCreditBalance.value) {
      debouncedFetchCreditBalance();
    } else if (!newIsAuthenticated && oldIsAuthenticated) {
      // Reset on logout so next login will fetch
      resetCreditBalance();
    }
  },
  { immediate: true },
);

// Watch for wallet connection changes (optimized)
watch(
  [connected, publicKey],
  async (newValues, oldValues) => {
    const [newConnected, newPublicKey] = newValues;
    const [oldConnected, oldPublicKey] = oldValues || [];

    // Only fetch if wallet actually connected or changed
    if (
      newConnected &&
      newPublicKey &&
      (!oldConnected || oldPublicKey?.toBase58() !== newPublicKey?.toBase58())
    ) {
      // Resolve the shared vault for the profile-chip balance (no-op if
      // already resolved for this wallet; invalidates on wallet switch).
      ensureSharedVault();
    }
  },
  { immediate: true },
);

// Watch for credit refresh events
const { onCreditRefresh } = useCreditRefresh();
onCreditRefresh(async () => {
  if (isAuthenticated.value) {
    await fetchCreditBalance();
  }
});

// Store click handler reference for cleanup
let clickHandler: ((e: Event) => void) | null = null;

onMounted(() => {
  if (process.client) {
    clickHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      const dropdown = target?.closest?.(".profile-dropdown");
      if (!dropdown && showUserProfileDropdown.value) {
        showUserProfileDropdown.value = false;
      }
    };
    document.addEventListener("click", clickHandler);
  }
});

onUnmounted(() => {
  // Clean up timeouts to prevent memory leaks
  if (creditBalanceTimeout) {
    clearTimeout(creditBalanceTimeout);
    creditBalanceTimeout = null;
  }

  // Abort any pending requests
  if (creditBalanceController) {
    creditBalanceController.abort();
    creditBalanceController = null;
  }

  // Clean up event listener
  if (clickHandler && process.client) {
    document.removeEventListener("click", clickHandler);
    clickHandler = null;
  }
});

interface PrioFeeConfig {
  strategy: "low" | "medium" | "high" | "veryHigh";
  staticFee: number;
  dynamicPriorityFee: boolean;
  maxPriorityFee: number;
}

// Priority fee configuration mapping
const PRIO_FEE_CONFIGS: Record<string, PrioFeeConfig> = {
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
    default: false,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const updateShowSettingsModal = (value: boolean) => {
  emit("update:modelValue", value);
};

// Expose functions for parent components to call
defineExpose({
  fetchCreditBalance,
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
  /* Override the app-wide `.dropdown { width: 100% }` in global.scss so the
     trigger stays sized to its content and right-aligned in the top bar. */
  width: auto;
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border: 1px solid transparent;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
  background: $box-background-color;
}

.profile-button:hover,
.profile-button.is-open {
  border-color: $border;
}

.profile-avatar {
  width: 32px;
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
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.dropdown-arrow {
  transition: transform 0.2s ease;
  color: $grey;
}

.dropdown-arrow.is-flipped {
  transform: rotate(180deg);
}

/* Bulma dropdown-menu: widen it and give it a little more breathing room */
.dropdown-menu {
  z-index: 99999;
  min-width: 248px;
  max-width: 280px;
  padding-top: 8px;
}

/* Bulma dropdown-content: the visible card */
.dropdown-content {
  background: $box-background-color;
  border-radius: 14px;
  border: 1px solid $border;
  box-shadow:
    0 1px 2px rgba($black, 0.04),
    0 12px 32px rgba($black, 0.12);
  padding: 6px;
}

/* Reveal animation (Bulma toggles display, so animate on appearance) */
.dropdown.is-active .dropdown-menu {
  transform-origin: top right;
}

@media (prefers-reduced-motion: no-preference) {
  .dropdown.is-active .dropdown-menu {
    animation: profile-menu-in 0.16s ease;
  }
}

@keyframes profile-menu-in {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Identity header */
.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.65rem 0.7rem;
}

.dropdown-header-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: $grey-lightest;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .wallet-icon {
    width: 22px;
    height: 22px;
  }

  .auth-icon {
    width: 20px;
    height: 20px;
    color: $grey;
  }
}

.dropdown-header-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.dropdown-header-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-header-sub {
  font-size: 0.75rem;
  font-weight: 600;
  color: $secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-section {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* Override Bulma's .dropdown-item for our actionable rows.
   Scoped under .dropdown-content to win over Bulma's a/button.dropdown-item. */
.dropdown-content .dropdown-item {
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: none;
  border-radius: 9px;
  background: none;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: $text;
}

.dropdown-content .dropdown-item:hover {
  background-color: $grey-lightest;
  color: $text;
}

/* Signature accent: the item's icon picks up Nosana green on hover */
.dropdown-content .dropdown-item:hover .dropdown-icon {
  color: $secondary;
}

.dropdown-item-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.dropdown-content .dropdown-item.logout-item {
  color: $text;
}

.dropdown-content .dropdown-item.logout-item:hover {
  background-color: rgba($danger, 0.08);
  color: $danger;
}

.dropdown-content .dropdown-item.logout-item:hover .dropdown-icon {
  color: $danger;
}

.dropdown-icon {
  flex-shrink: 0;
  color: $grey;
  width: 17px;
  height: 17px;
  transition: color 0.15s ease;
}

.logout-item .dropdown-icon {
  color: $grey;
}

.dropdown-divider {
  border: none;
  height: 1px;
  background: $border;
  margin: 5px 0;
}

/* Theme row: label on the left, segmented control on the right */
.dropdown-theme-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.15rem 0.35rem 0.15rem 0.65rem;
}

.dropdown-theme-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text;
}

.dropdown-theme-toggle {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 9px;
  background: $grey-lightest;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.65rem;
  border: none;
  border-radius: 7px;
  background: none;
  cursor: pointer;
  color: $grey;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.theme-toggle-btn:hover {
  color: $text;
}

.theme-toggle-btn.is-active {
  background-color: $box-background-color;
  color: $text;
  box-shadow: 0 1px 2px rgba($black, 0.12);
}

/* Dark mode styles */
.dark-mode .profile-button {
  background: $box-background-color-dark;
}

.dark-mode .dropdown-header-avatar {
  background: color.adjust($box-background-color-dark, $lightness: 5%);
}

.dark-mode .dropdown-header-avatar .auth-icon {
  color: $grey-light;
}

.dark-mode .dropdown-header-name {
  color: $white;
}

.dark-mode .dropdown-theme-label {
  color: $white;
}

.dark-mode .dropdown-theme-toggle {
  background: color.adjust($box-background-color-dark, $lightness: 5%);
}

.dark-mode .theme-toggle-btn {
  color: $grey-light;
}

.dark-mode .theme-toggle-btn:hover {
  color: $white;
}

.dark-mode .theme-toggle-btn.is-active {
  background-color: color.adjust($box-background-color-dark, $lightness: 12%);
  color: $white;
  box-shadow: 0 1px 2px rgba($black, 0.3);
}

.dark-mode .profile-name {
  color: $white;
}

.dark-mode .profile-balance {
  color: $white;
}

.dark-mode .dropdown-content {
  background: $box-background-color-dark;
  border: none;
  box-shadow: 0 10px 25px rgba($black, 0.3);
}

.dark-mode .dropdown-content .dropdown-item {
  color: $white;
}

.dark-mode .dropdown-content .dropdown-item:hover {
  background-color: color.adjust($box-background-color-dark, $lightness: 6%);
  color: $white;
}

.dark-mode .dropdown-content .dropdown-item.logout-item {
  color: $white;
}

.dark-mode .dropdown-content .dropdown-item.logout-item:hover {
  background-color: rgba($danger, 0.16);
  color: $danger;
}

.dark-mode .dropdown-content .dropdown-item.logout-item:hover .dropdown-icon {
  color: $danger;
}

.dark-mode .dropdown-divider {
  background: color.adjust($box-background-color-dark, $lightness: 8%);
}

.dark-mode .dropdown-icon {
  color: $grey-light;
}

.dark-mode .logout-item .dropdown-icon {
  color: $grey-light;
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
