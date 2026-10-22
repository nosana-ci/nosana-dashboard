<template>
  <!-- The signed-in account, at the foot of the sidebar: who is signed in,
       what they can spend, and the account links, opening upwards. -->
  <div ref="root" class="account-menu">
    <template v-if="showProfileSection">
      <div
        v-if="open"
        id="account-menu-list"
        class="account-dropdown"
        role="menu"
      >
        <button class="account-item" role="menuitem" @click="goTo('/account')">
          <UserIcon class="account-icon" />
          <span>Account</span>
        </button>
        <button
          v-if="isGoogleAuthenticated"
          class="account-item"
          role="menuitem"
          @click="goTo('/account/billing')"
        >
          <WalletIcon class="account-icon" />
          <span>Billing</span>
        </button>
        <button class="account-item" role="menuitem" @click="goTo('/support')">
          <SupportIcon class="account-icon" />
          <span>Help &amp; Support</span>
        </button>
        <!-- Priority fee for wallet users -->
        <button
          v-if="!isGoogleAuthenticated"
          class="account-item"
          role="menuitem"
          @click="openPriorityFee"
        >
          <SettingsIcon class="account-icon" />
          <span>Priority fee</span>
        </button>
        <hr class="account-divider" />
        <button class="account-item is-logout" role="menuitem" @click="logout">
          <LogoutIcon class="account-icon" />
          <span>Log out</span>
        </button>
      </div>

      <button
        type="button"
        class="account-button"
        :class="{ 'is-open': open }"
        aria-haspopup="menu"
        aria-controls="account-menu-list"
        :aria-expanded="open"
        @click="open = !open"
      >
        <span class="account-avatar">
          <img
            v-if="!isGoogleAuthenticated && connected && wallet?.icon"
            :src="wallet.icon"
            :alt="`${wallet.name} icon`"
            class="wallet-icon"
          />
          <AccountAvatar v-else class="auth-icon" />
        </span>
        <span class="account-info">
          <span class="account-name">{{ userName }}</span>
          <span class="account-balance">{{ identitySubline }}</span>
        </span>
        <svg
          class="account-arrow"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 6l3-3 3 3M5 10l3 3 3-3"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </template>

    <!-- Priority fee settings, for wallet users. On the body, so the sticky
         sidebar's stacking never puts it under the page. -->
    <Teleport to="body">
      <div class="modal" :class="{ 'is-active': showPriorityFee }">
        <div class="modal-background" @click="showPriorityFee = false"></div>
        <div class="modal-content">
          <div class="box">
            <h2 class="title mb-5 has-text-weight-bold">Settings</h2>
            <h3 class="title is-5">Global Prio-fee Level</h3>
            <p class="subtitle is-size-5">
              These fees apply across Nosana's entire product suite, such as
              staking actions, posting jobs etc.
            </p>
            <div class="field has-addons">
              <p
                v-for="level in PRIO_FEE_LEVELS"
                :key="level.strategy"
                class="control"
              >
                <button
                  class="button is-medium is-primary"
                  :class="{
                    'is-outlined': prioFee.strategy !== level.strategy,
                  }"
                  @click="setPrioFee(level.strategy)"
                >
                  <span>{{ level.label }}</span>
                </button>
              </p>
            </div>
          </div>
        </div>
        <button
          class="modal-close is-large"
          aria-label="close"
          @click="showPriorityFee = false"
        ></button>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { useWallet } from "@nosana/solana-vue";
import { onClickOutside, onKeyStroke, useDebounceFn } from "@vueuse/core";
import UserIcon from "@/assets/img/icons/sidebar/user.svg?component";
import SettingsIcon from "@/assets/img/icons/settings.svg?component";
import LogoutIcon from "@/assets/img/icons/logout.svg?component";
import WalletIcon from "@/assets/img/icons/wallet.svg?component";
import SupportIcon from "@/assets/img/icons/sidebar/support.svg?component";
import AccountAvatar from "~/components/Common/AccountAvatar.vue";

const { prioFee } = useKit();
const { isAuthenticated, isLoading, signOut, userData } = useSuperTokens();
const router = useRouter();
const route = useRoute();
const { connected, account, wallet, disconnect } = useWallet();

const open = ref(false);
const root = ref<HTMLElement | null>(null);
onClickOutside(root, () => {
  open.value = false;
});
onKeyStroke("Escape", () => {
  open.value = false;
});

const isGoogleAuthenticated = computed(() => isAuthenticated.value);

// Latching: once the user is known to be signed in, keep the menu rendered
// through a background session re-check, so it never flickers out.
const wasAuthenticated = ref(false);
watch(
  () => isGoogleAuthenticated.value || connected.value,
  (signedIn) => {
    if (signedIn) wasAuthenticated.value = true;
  },
  { immediate: true },
);
const showProfileSection = computed(
  () =>
    isGoogleAuthenticated.value ||
    connected.value ||
    (isLoading.value && wasAuthenticated.value),
);

// The email or provider name, else the wallet address shortened.
const userName = computed(() => {
  const named =
    userData.value?.email ||
    userData.value?.providerUsername ||
    userData.value?.name;
  if (named) return named;
  const address = account.value?.address;
  return address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "";
});

// Credit balance: the shared single source of truth (see useCreditBalance).
const {
  creditBalance,
  hasLoaded: hasLoadedCreditBalance,
  fetchBalance: fetchCreditBalance,
  reset: resetCreditBalance,
} = useCreditBalance();

// The NOS price, to show a wallet's shared vault in dollars.
const { data: stats } = useAPI("/stats");
const nosPrice = computed(() => stats.value?.price || 0);
const { balance: sharedVaultBalance, ensureSharedVault } = useSharedVault();
const vaultBalanceUSD = computed(
  () => (sharedVaultBalance.value.NOS || 0) * nosPrice.value,
);

// Under the name: the spendable balance, labelled for the account type.
const identitySubline = computed(() => {
  if (isGoogleAuthenticated.value) {
    return `$${(creditBalance.value || 0).toFixed(2)} in credits`;
  }
  if (connected.value) {
    return `$${vaultBalanceUSD.value.toFixed(2)} available`;
  }
  return "";
});

// One credit-balance request at a time: a newer one cancels the older.
const balanceRequest = shallowRef<AbortController | null>(null);
const refreshCreditBalance = useDebounceFn(() => {
  balanceRequest.value?.abort();
  const controller = new AbortController();
  balanceRequest.value = controller;
  return fetchCreditBalance(controller.signal);
}, 100);
onUnmounted(() => balanceRequest.value?.abort());

// Fetch once signed in (not during a session refresh); reset on sign-out so
// the next sign-in fetches again.
watch(
  [isAuthenticated, isLoading],
  ([authenticated, loading], previous) => {
    if (loading) return;
    if (authenticated && !hasLoadedCreditBalance.value) {
      void refreshCreditBalance();
    } else if (!authenticated && previous?.[0]) {
      resetCreditBalance();
    }
  },
  { immediate: true },
);

// A connected wallet's shared vault, for its balance (a no-op once resolved
// for that wallet; a wallet switch resolves the new one).
watch(
  () => (connected.value ? account.value?.address : undefined),
  (address) => {
    if (address) ensureSharedVault();
  },
  { immediate: true },
);

const { onCreditRefresh } = useCreditRefresh();
onCreditRefresh(async () => {
  if (isAuthenticated.value) await fetchCreditBalance();
});

function goTo(path: string) {
  open.value = false;
  router.push(path);
}

// Signing out of a public page stays on the create page; anywhere else goes
// to sign-in, coming back to the same page afterwards.
const isPublicRoute = (path: string) =>
  path === "/" ||
  path === "/deployments/create" ||
  path === "/privacy-policy" ||
  path === "/tos" ||
  path.startsWith("/st-auth/");

const postLogoutTarget = () =>
  isPublicRoute(route.path)
    ? "/deployments/create"
    : { path: "/", query: { redirect: route.fullPath } };

async function logout() {
  open.value = false;
  try {
    useCookie("nosana-wallet-session").value = null;
    // Sign out of SuperTokens when a session exists.
    try {
      const Session = await import("supertokens-web-js/recipe/session");
      if (await Session.default.doesSessionExist()) {
        await Session.default.signOut();
      }
    } catch {
      // SuperTokens not initialised.
    }
    if (connected.value) {
      await disconnect();
    } else if (isAuthenticated.value) {
      await signOut();
    }
    await navigateTo(postLogoutTarget());
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

// --- Priority fee (wallet users) ---
type PrioFeeStrategy = "low" | "medium" | "high" | "veryHigh";

const PRIO_FEE_LEVELS: Array<{ strategy: PrioFeeStrategy; label: string }> = [
  { strategy: "low", label: "Slow" },
  { strategy: "medium", label: "Medium" },
  { strategy: "high", label: "Fast" },
  { strategy: "veryHigh", label: "Ultra" },
];

const PRIO_FEE_CONFIGS: Record<
  PrioFeeStrategy,
  {
    strategy: PrioFeeStrategy;
    staticFee: number;
    dynamicPriorityFee: boolean;
    maxPriorityFee: number;
  }
> = {
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

const showPriorityFee = ref(false);
function openPriorityFee() {
  open.value = false;
  showPriorityFee.value = true;
}
function setPrioFee(strategy: PrioFeeStrategy) {
  prioFee.value = PRIO_FEE_CONFIGS[strategy];
}
</script>

<style scoped lang="scss">
@use "sass:color";

.account-menu {
  position: relative;
}

/* The trigger: laid out like the sidebar's menu items above it, with no box
   of its own, only their hover background */
.account-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 0;
  border-radius: $menu-item-radius;
  background: transparent;
  color: $menu-item-color;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover,
  &.is-open {
    background-color: $menu-item-hover-background-color;
  }

  &:focus-visible {
    outline: 2px solid $secondary;
    outline-offset: 2px;
  }
}

.account-avatar {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: $grey-lightest;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: background-color 0.2s ease;

  .account-button:hover &,
  .account-button.is-open & {
    background: $white;
  }
}

.wallet-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.auth-icon {
  width: 18px;
  height: 18px;
  color: $text-muted;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.account-name,
.account-balance {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-name {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.25;
}

.account-balance {
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  color: $secondary-text;
}

// Faded like the menu icons, full strength while the menu is open.
.account-arrow {
  flex-shrink: 0;
  width: 15px;
  height: 15px;
  opacity: 0.5;
  transition: opacity 0.2s ease;

  .account-button:hover &,
  .is-open & {
    opacity: 1;
  }
}

/* The menu opens upwards from the foot of the sidebar */
.account-dropdown {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px;
  border-radius: 14px;
  border: 1px solid $border;
  background: $box-background-color;
  box-shadow:
    0 1px 2px rgba($black, 0.04),
    0 12px 32px rgba($black, 0.12);
  transform-origin: bottom center;
}

@media (prefers-reduced-motion: no-preference) {
  .account-dropdown {
    animation: account-menu-in 0.16s ease;
  }
}

@keyframes account-menu-in {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.97);
  }
}

.account-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: 0;
  border-radius: 9px;
  background: none;
  color: $text;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background-color: $surface-hover;
  }

  // The item's icon picks up Nosana green on hover.
  &:hover .account-icon {
    color: $secondary;
  }

  &.is-logout:hover {
    background-color: rgba($danger, 0.08);
    color: $danger;

    .account-icon {
      color: $danger;
    }
  }
}

.account-icon {
  flex-shrink: 0;
  width: 17px;
  height: 17px;
  color: $text-muted;
  transition: color 0.15s ease;
}

.account-divider {
  height: 1px;
  margin: 5px 0;
  border: 0;
  background: $border;
}

html.dark-mode {
  .account-button {
    color: $grey-lighter;

    &:hover,
    &.is-open {
      background-color: $grey-darker;
    }
  }

  .account-avatar {
    background: rgba($white, 0.08);
  }

  .account-button:hover .account-avatar,
  .account-button.is-open .account-avatar {
    background: rgba($white, 0.12);
  }

  .account-name {
    color: $white;
  }

  .account-dropdown {
    background: $box-background-color-dark;
    border-color: rgba($white, 0.1);
    box-shadow: 0 10px 25px rgba($black, 0.3);
  }

  .auth-icon,
  .account-icon {
    color: $grey-light;
  }

  .account-balance {
    color: $secondary;
  }

  .account-item {
    color: $white;

    &:hover {
      background-color: color.adjust(
        $box-background-color-dark,
        $lightness: 6%
      );
    }

    &.is-logout:hover {
      background-color: rgba($danger, 0.16);
      color: $danger;
    }
  }

  .account-divider {
    background: color.adjust($box-background-color-dark, $lightness: 8%);
  }
}
</style>
