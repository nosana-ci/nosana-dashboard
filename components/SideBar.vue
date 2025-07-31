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
        <li v-if="connected || status === 'authenticated'">
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
            to="/deploy"
            active-class="is-active"
            @click="showMenu = false"
          >
            <span class="icon is-small mr-4">
              <JobBuilderIcon  />
            </span>
            <span>Deploy Model</span>
          </nuxt-link>
        </li>
        <li class="has-dropdown">
          <a class="menu-list-link sidebar-link" @click="toggleExplorer"
            :class="{ 'is-active': $route.path === '/explorer' || $route.path.includes('/markets') || $route.path === '/leaderboards' || ($route.path === '/account/host' && status !== 'authenticated') || $route.path === '/stake'}"
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
                Deployments
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
            <li>
              <nuxt-link
                to="/leaderboards"
                active-class="is-active"
                class="submenu-link"
                @click="showMenu = false"
              >
                Host Leaderboard
              </nuxt-link>
            </li>
            <li v-if="status !== 'authenticated'">
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
      class="is-flex is-justify-content-flex-start is-align-items-center mt-auto"
    >
      <nuxt-link to="/status" @click="showMenu = false">
        <div class="status-dot dot-online"></div>
        Healthy
      </nuxt-link>
    </div>
  </aside>
  <nav class="navbar is-hidden-desktop is-fixed-top has-shadow">
    <div class="navbar-brand">
      <nuxt-link to="/" class="navbar-item" @click="showMenu = false">
        <logo width="135px" :animated="true" class="light-only" />
        <logo width="135px" :white="true" class="dark-only" :animated="true" />
      </nuxt-link>

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
  </nav>
</template>

<script lang="ts" setup>
const showMenu = ref(false);
const showExplorerDropdown = ref(false);
const connectingFromSidebar = ref(false);
import JobBuilderIcon from "@/assets/img/icons/sidebar/job-builder.svg?component";
import ExplorerIcon from "@/assets/img/icons/sidebar/explorer.svg?component";
import UserIcon from "@/assets/img/icons/sidebar/user.svg?component";
import SupportIcon from "@/assets/img/icons/sidebar/support.svg?component";
import { useWallet } from "solana-wallets-vue";
import { computed, onMounted, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const { connected } = useWallet();
const { status } = useAuth();
const route = useRoute();
const router = useRouter();
const { openBothModal, openWalletModal } = useLoginModal();


// Check if the current route is an explorer page
const isExplorerPage = computed(() => {
  return route.path === '/explorer' || route.path.includes('/markets') || route.path === '/leaderboards' || (route.path === '/account/host' && status.value !== 'authenticated') || route.path === '/stake';
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

  .is-active {
    .icon {
      color: $secondary;
      opacity: 1;
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
      div {
        opacity: 1;
        color: inherit;
      }

      .icon,
      span {
        opacity: 1;
        color: white;
      }

      span.icon:first-of-type {
        color: $secondary;
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
  .sidebar-link {
    color: $grey-lighter;

    &:hover {
      color: $grey-lighter;
    }

    &.is-active {
      color: $secondary;
      
      .icon, 
      span {
        color: $black !important;
      }
      
      span.icon:first-of-type {
        color: $secondary !important;
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
    color: #d8d8d8 !important;
    
    &:hover {
      opacity: 1 !important;
      background-color: #363636 !important;
    }

    &.is-active {
      background-color: #363636 !important;
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
</style>
