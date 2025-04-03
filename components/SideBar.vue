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
        <li v-if="connected">
          <nuxt-link
            to="/account"
            active-class="is-active"
            @click="showMenu = false"
          >
            <span class="icon is-small mr-4">
              <UserIcon />
            </span>
            <span>My Account</span>
          </nuxt-link>
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
            :class="{ 'is-active': $route.path === '/explorer' || $route.path.includes('/markets') || $route.path === '/leaderboards'}"
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
          </ul>
        </li>
        <li>
          <nuxt-link
            to="/stake"
            active-class="is-active"
            @click="showMenu = false"
            style="padding-left: 1.1rem"
          >
            <span class="icon is-small mr-4">
              <CoinsIcon />
            </span>
            <span>Staking</span>
          </nuxt-link>
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
      class="is-flex is-justify-content-space-between is-align-items-center mt-auto has-text-right"
    >
      <nuxt-link to="/status" @click="showMenu = false">
        <div class="status-dot dot-online"></div>
        Healthy
      </nuxt-link>

      <ColorModeSwitcher />
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
import JobBuilderIcon from "@/assets/img/icons/sidebar/job-builder.svg?component";
import TemplateIcon from "@/assets/img/icons/sidebar/template.svg?component";
import ExplorerIcon from "@/assets/img/icons/sidebar/explorer.svg?component";
import UserIcon from "@/assets/img/icons/sidebar/user.svg?component";
import BrowserIcon from "@/assets/img/icons/sidebar/browser.svg?component";
import CoinsIcon from "@/assets/img/icons/sidebar/coins.svg?component";
import SupportIcon from "@/assets/img/icons/sidebar/support.svg?component";
import LeaderboardIcon from "@/assets/img/icons/sidebar/leaderboard.svg?component";
import { useWallet } from "solana-wallets-vue";
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

const { connected, publicKey } = useWallet();
const route = useRoute();

// Check if the current route is an explorer page
const isExplorerPage = computed(() => {
  return route.path === '/explorer' || route.path.includes('/markets') || route.path === '/leaderboards' || route.path === '/stake';
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

const toggleExplorer = () => {
  showExplorerDropdown.value = !showExplorerDropdown.value;
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

    &.is-active {
      transform: rotate(-180deg);
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
</style>
