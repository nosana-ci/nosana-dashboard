<template>
  <aside
    class="column has-background-white sidebar has-overflow-scroll"
    :class="{ 'is-hidden-touch': !showMenu }"
  >
    <div class="mb-6 is-hidden-touch">
      <nuxt-link to="/">
        <logo width="160px" :animated="true" class="light-only" />
        <logo width="160px" :white="true" class="dark-only" :animated="true" />
      </nuxt-link>
    </div>
    <div class="menu">
      <ul class="menu-list is-size-5">
        <li>
          <nuxt-link
            :to="deployRoute"
            class="deploy-cta"
            @click="showMenu = false"
          >
            <span class="icon is-small mr-4">
              <JobBuilderIcon  />
            </span>
            <span>Deploy</span>
          </nuxt-link>
        </li>
        <li v-if="connected || status === 'authenticated' || status === 'loading'">
          <nuxt-link
            to="/account/deployer"
            active-class="is-active"
            @click="showMenu = false"
            style="padding-left: 1.1rem"
          >
            <span class="icon is-small mr-4">
              <UserIcon />
            </span>
            <span>Account</span>
          </nuxt-link>
        </li>
        <li v-if="!connected && status === 'unauthenticated'">
          <a
            @click="openBothModal($route.fullPath); showMenu = false"
            style="padding-left: 1.1rem; cursor: pointer"
          >
            <span class="icon is-small mr-4">
              <UserIcon />
            </span>
            <span>Login</span>
          </a>
        </li>
        <li>
          <nuxt-link
            to="/deployments"
            active-class="is-active"
            @click="showMenu = false"
          >
            <span class="icon is-small mr-4">
              <ListIcon />
            </span>
            <span>Deployments</span>
          </nuxt-link>
        </li>
        <li class="has-dropdown">
          <a class="menu-list-link sidebar-link" @click="toggleExplorer"
            :class="{ 'is-active': $route.path === '/explorer' || $route.path.includes('/markets') || ($route.path === '/account/host' && !isAuthenticatedStable) || $route.path === '/stake'}"
          >
            <div
              class="is-flex is-align-items-center"
              style="width: 100%; padding-left: 0.6rem;"
            >
              <span class="icon is-small mr-4">
                <ExplorerIcon />
              </span>
              <span style="opacity: 1">Explorer</span>
              <span class="icon is-small ml-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  class="chevron"
                  :class="{ 'is-active': showExplorerDropdown }"
                >
                  <path
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  />
                </svg>
              </span>
            </div>
          </a>
          <ul class="submenu" :class="{ 'is-active': showExplorerDropdown }">
            <li>
              <nuxt-link
                to="/explorer"
                active-class="is-active"
                class="submenu-link"
                @click="showMenu = false"
              >
                Jobs
              </nuxt-link>
            </li>
            <li>
              <nuxt-link
                to="/markets"
                active-class="is-active"
                class="submenu-link"
                @click="showMenu = false"
              >
                GPUs
              </nuxt-link>
            </li>
            <li v-if="!isAuthenticatedStable">
              <a
                v-if="!connected"
                @click="openWalletModal($route.fullPath); showMenu = false"
                class="submenu-link"
                style="cursor: pointer"
              >
                Host Earnings
              </a>
              <nuxt-link
                v-else
                to="/account/host"
                active-class="is-active"
                class="submenu-link"
                @click="showMenu = false"
              >
                Host Earnings
              </nuxt-link>
            </li>
            <li>
              <nuxt-link
                to="/stake"
                active-class="is-active"
                class="submenu-link"
                @click="showMenu = false"
              >
                Staking
              </nuxt-link>
            </li>
          </ul>
        </li>
        <li>
          <nuxt-link
            active-class="is-active"
            @click="showMenu = false"
            to="/support"
            style="padding-left: 1.1rem"
          >
            <span class="icon is-small mr-4">
              <SupportIcon />
            </span>
            <span>Help & Support</span>
          </nuxt-link>
        </li>
      </ul>
    </div>
    <div
      class="is-flex is-justify-content-space-between is-align-items-center mt-auto"
    >
      <a href="https://nosana.statuspage.io" target="_blank" rel="noopener" @click="showMenu = false">
        <div class="status-dot dot-online"></div>
        Status
      </a>
      <button 
        class="sidebar-theme-toggle"
        @click="toggleDarkMode"
        :title="$colorMode.value === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path v-if="$colorMode.value === 'dark'" fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" fill="currentColor"/>
          <path v-else d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </aside>
  <nav class="navbar is-hidden-desktop is-fixed-top has-shadow">
    <div class="navbar-brand is-flex is-align-items-center is-justify-content-space-between" style="width: 100%;">
      <nuxt-link to="/" class="navbar-item" @click="showMenu = false">
        <logo width="135px" :animated="true" class="light-only" />
        <logo width="135px" :white="true" class="dark-only" :animated="true" />
      </nuxt-link>

      <div class="is-flex is-align-items-center">
        <!-- Simple mobile user avatar -->
        <div v-if="connected || status === 'authenticated' || status === 'loading'" class="dropdown mobile-avatar-dropdown mr-3" :class="{ 'is-active': showMobileDropdown }">
          <div class="dropdown-trigger">
            <span class="mobile-avatar-trigger" @click="showMobileDropdown = !showMobileDropdown">
              <template v-if="connected && wallet">
                <img v-if="wallet.adapter.icon" :src="wallet.adapter.icon" :alt="wallet.adapter.name + ' icon'" class="wallet-icon" />
                <span v-else>W</span>
              </template>
              <template v-else>
                {{ (data?.email && data.email.charAt(0).toUpperCase()) || 'U' }}
              </template>
            </span>
          </div>
          <div class="dropdown-menu">
            <div class="dropdown-content">
              <div class="dropdown-item">
                <p class="is-size-7 has-text-grey mb-0">{{ connected ? getWalletAddress() : (data?.email || '') }}</p>
              </div>
              <hr class="dropdown-divider">
              <a class="dropdown-item logout-item" @click="handleLogout">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="dropdown-icon">
                  <path d="M6 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H6M10 6L14 10M14 10L10 14M14 10H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Log out
              </a>
            </div>
          </div>
        </div>

        <a
          role="button"
          class="navbar-burger"
          :class="{ 'is-active': showMenu }"
          @click="showMenu = !showMenu"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
const showMenu = ref(false);
const showExplorerDropdown = ref(false);
const connectingFromSidebar = ref(false);
const showMobileDropdown = ref(false);
import JobBuilderIcon from "@/assets/img/icons/sidebar/job-builder.svg?component";
import ListIcon from "@/assets/img/icons/sidebar/list.svg?component";
import ExplorerIcon from "@/assets/img/icons/sidebar/explorer.svg?component";
import UserIcon from "@/assets/img/icons/sidebar/user.svg?component";
import SupportIcon from "@/assets/img/icons/sidebar/support.svg?component";
import { useWallet } from "solana-wallets-vue";
import { computed, onMounted, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const { connected, disconnect, publicKey, wallet } = useWallet();
const { status, signOut, data } = useAuth();
const route = useRoute();
const router = useRouter();
const { openBothModal, openWalletModal } = useLoginModal();

const isAuthenticatedStable = ref(status.value === 'authenticated')
watch(status, (newStatus) => {
  if (newStatus === 'authenticated') {
    isAuthenticatedStable.value = true
  } else if (newStatus === 'unauthenticated') {
    isAuthenticatedStable.value = false
  }
  // if loading: keep previous definitive state
}, { flush: 'sync' })

// Computed property for deploy route based on authentication type
const deployRoute = computed(() => {
  if (status.value === 'authenticated') {
    // Logged in with Google account (credit system)
    return '/deployments/create';
  } else if (connected.value) {
    // Logged in with Solana wallet
    return '/deploy';
  } else {
    // Not logged in, default to credit system route
    return '/deployments/create';
  }
});


// Check if the current route is an explorer page
const isExplorerPage = computed(() => {
  return route.path === '/explorer' || route.path.includes('/markets') || (route.path === '/account/host' && status.value !== 'authenticated') || route.path === '/stake';
});

// Update dropdown states based on the current route
const updateDropdownStates = () => {
  showExplorerDropdown.value = isExplorerPage.value;
};

// Set initial states on mount
onMounted(() => {
  updateDropdownStates();
});

// Watch for route changes to update dropdown states
watch(() => route.path, () => {
  updateDropdownStates();
});

// Navigate to account page only when connecting from sidebar
watch(connected, (isConnected, prevConnected) => {
  if (isConnected && !prevConnected && connectingFromSidebar.value) {
    router.push('/account/deployer');
    showMenu.value = false;  // Close mobile menu if open
    connectingFromSidebar.value = false;  // Reset the flag
  }
});


const toggleExplorer = () => {
  showExplorerDropdown.value = !showExplorerDropdown.value;
};

const isActive = (paths: string[]) => {
  return paths.includes(route.path);
};

// Handle logout
const handleLogout = async () => {
  showMobileDropdown.value = false;
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

// Toggle dark mode
const toggleDarkMode = () => {
  useColorMode().preference = useColorMode().value === 'dark' ? 'light' : 'dark';
};

// Format wallet address for display
const getWalletAddress = () => {
  if (!publicKey?.value) return '';
  const address = publicKey.value.toBase58();
  return `${address.slice(0, 4)}..${address.slice(-4)}`;
};

</script>

<style lang="scss" scoped>
.sidebar {
  box-shadow: 0px 6px 40px 0px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 280px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: sticky;
  padding: 30px;
  top: 0;
}

.menu-list {
  li:not(:last-child) {
    margin-bottom: 15px;
  }

  [disabled] {
    pointer-events: none;
  }

  a,
  span {
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }

  .icon {
    opacity: 0.5;
  }

  a.is-active {
    background-color: $menu-item-hover-background-color;
    color: $text !important;
    
    .icon {
      color: $text;
      opacity: 1;
    }
    
    span {
      color: $text !important;
    }
  }
  
  .deploy-cta {
    background-color: $menu-item-active-background-color;
    color: $menu-item-active-color !important;
    
    .icon {
      color: $secondary;
      opacity: 1;
    }
    
    span:not(.icon) {
      color: $menu-item-active-color !important;
    }
  }
}

.has-dropdown {
  margin-bottom: 5px !important;

  .sidebar-link {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    color: inherit;
    text-decoration: none;
    cursor: pointer;

    div {
      color: $menu-item-color;
      opacity: 1;
      transition: opacity 0.2s ease;
    }

    &:hover {
      div {
        opacity: 1;
      }

      .icon,
      span {
        opacity: 1;
      }
    }

    &.is-active {
      background-color: $menu-item-hover-background-color;
      
      div {
        opacity: 1;
        color: inherit;
      }

      .icon,
      span {
        opacity: 1;
        color: $text;
      }

      span.icon:first-of-type {
        color: $text;
      }
    }
  }

  .chevron {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
    opacity: 0.5;
    transform: rotate(90deg);

    &.is-active {
      transform: rotate(0deg);
    }
  }
}

.submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  margin-left: 2rem;
  margin-bottom: 5px;

  &.is-active {
    max-height: 300px;
  }
}

.submenu-link {
  opacity: 0.9 !important;
  transition: opacity 0.2s ease !important;
  text-decoration: none !important;
  font-size: 1em !important;
  display: flex !important;
  align-items: center !important;
  height: 32px !important;
  color: #4a4a4a !important;
  padding: 0 8px !important;
  border-radius: 4px !important;

  &:hover {
    opacity: 1 !important;
    background-color: #f5f5f5 !important;
  }

  &.is-active {
    opacity: 1 !important;
    background-color: #f5f5f5 !important;
  }
}

.dark-mode {
  .deploy-cta {
    background-color: $white;
    color: $text !important;
    
    .icon {
      color: $secondary;
    }
    
    span:not(.icon) {
      color: $text !important;
    }
  }
  
  .menu-list {
    a.is-active {
      background-color: $grey-darker !important;
      color: $white !important;
      
      .icon, 
      span {
        color: $white !important;
      }
      
      span.icon:first-of-type {
        color: $white !important;
      }
    }
  }
  
  .sidebar-link {
    color: $grey-lighter;

    &:hover {
      color: $grey-lighter;
    }

    &.is-active {
      background-color: $grey-darker;
      
      .icon, 
      span {
        color: $white !important;
      }
      
      span.icon:first-of-type {
        color: $white !important;
      }
    }
  }

  .menu-list-link {
    div {
      color: $grey-lighter !important;
    }

    .icon,
    span {
      opacity: 0.5;
    }

    &:hover {
      .icon,
      span {
        opacity: 1;
      }
    }
  }

  .submenu-link {
    color: $grey-lighter !important;
    
    &:hover {
      opacity: 1 !important;
      background-color: $grey-darker !important;
    }

    &.is-active {
      background-color: $grey-darker !important;
    }
  }
}

@include touch {
  .sidebar {
    max-width: unset !important;
    position: fixed;
    width: 100% !important;
    height: calc(100% - $navbar-height);
    top: $navbar-height;
    z-index: 5;
  }
}

// Profile dropdown styles
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
  transform: rotate(90deg);
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
  background: #0A0A0A;
}

.dark-mode .profile-name {
  color: #d1d5db;
}

.dark-mode .profile-balance {
  color: #d1d5db;
}

.dark-mode .dropdown-menu-simple {
  background: #1f2937;
  border-color: #374151;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.dark-mode .dropdown-item-simple {
  color: #d1d5db;
}

.dark-mode .dropdown-item-simple:hover {
  background-color: #374151;
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

.sidebar-theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  color: #6b7280;
}

.sidebar-theme-toggle:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.dark-mode .sidebar-theme-toggle {
  color: #9ca3af;
}

.dark-mode .sidebar-theme-toggle:hover {
  background-color: #374151;
  color: #d1d5db;
}

/* Mobile avatar styling - no blue highlight */
.mobile-avatar-tag {
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.mobile-avatar-tag:hover {
  opacity: 0.8;
}

.mobile-avatar-tag:focus {
  outline: none;
  box-shadow: none;
}

/* Cleaner mobile avatar trigger */
.mobile-avatar-trigger {
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: $grey-lightest;
  padding: 0;
  overflow: hidden;
}

.mobile-avatar-trigger img.wallet-icon {
  width: 22px;
  height: 22px;
  border-radius: 4px;
}

.dark-mode .mobile-avatar-trigger {
  background: #363636;
}

/* Make fallback initial white inside avatar */
.mobile-avatar-trigger span {
  color: #ffffff;
  font-weight: 600;
}

/* Match desktop red logout style in mobile dropdown */
.mobile-avatar-dropdown .dropdown-item.logout-item {
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 1rem;
}

.mobile-avatar-dropdown .dropdown-item.logout-item:hover {
  background-color: #fef2f2;
}

.mobile-avatar-dropdown .dropdown-item.logout-item .dropdown-icon {
  color: #dc2626;
}

/* Ensure mobile avatar dropdown stays within viewport */
.mobile-avatar-dropdown .dropdown-menu {
  left: auto !important;
  right: 0 !important;
  transform: none !important;
  width: max-content;
  min-width: 180px;
  max-width: calc(100vw - 16px);
}

.mobile-avatar-dropdown .dropdown-content,
.mobile-avatar-dropdown .dropdown-item {
  white-space: normal !important;
}

.mobile-avatar-dropdown .dropdown-content {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
