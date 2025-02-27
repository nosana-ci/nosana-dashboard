<template>
  <aside class="column has-background-white sidebar has-overflow-scroll" :class="{ 'is-hidden-touch': !showMenu }">
    <div class="mb-6 is-hidden-touch">
      <nuxt-link to="/">
        <logo width="160px" :animated="true" class="light-only" />
        <logo width="160px" :white="true" class="dark-only" :animated="true" />
      </nuxt-link>
    </div>
    <div class="menu">
      <ul class="menu-list is-size-5">
        <li v-if="!connected">
          <nuxt-link to="/login" active-class="is-active" @click="showMenu = false">
            <span class="icon is-small mr-4">
              <UserIcon />
            </span>
            <span>Login</span>
          </nuxt-link>
        </li>
        <li v-if="connected">
          <nuxt-link to="/dashboard" active-class="is-active" @click="showMenu = false">
            <span class="icon is-small mr-4">
              <UserIcon />
            </span>
            <span>Profile</span>
          </nuxt-link>
        </li>
        <li v-if="connected">
          <nuxt-link to="/jobs/create" active-class="is-active" @click="showMenu = false">
            <span class="icon is-small mr-4">
              <JobBuilderIcon />
            </span>
            <span>Deploy Model</span>
          </nuxt-link>
        </li>
        <li class="has-dropdown">
          <a class="menu-list-link sidebar-link" @click="toggleExplorer">
            <div class="is-flex is-align-items-center" style="width: 100%; padding-left: 0.7rem;">
              <span class="icon is-small mr-4">
                <ExplorerIcon style="opacity: 0.7;" />
              </span>
              <nuxt-link to="/explorer" style="opacity: 0.7; color: inherit; text-decoration: none;">Explorer</nuxt-link>
              <span class="icon is-small ml-auto">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="chevron" :class="{ 'is-active': showExplorerDropdown }">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </span>
            </div>
          </a>
          <ul class="submenu" :class="{ 'is-active': showExplorerDropdown }">
            <li>
              <nuxt-link to="/explorer" active-class="is-active" @click="showMenu = false">
                Explorer
              </nuxt-link>
            </li>
            <li>
              <nuxt-link to="/jobs/templates" active-class="is-active" @click="showMenu = false">
                Templates
              </nuxt-link>
            </li>
            <li>
              <nuxt-link to="/markets" active-class="is-active" @click="showMenu = false">
                GPUs
              </nuxt-link>
            </li>
            <li>
              <nuxt-link to="/leaderboards" active-class="is-active" @click="showMenu = false">
                Host Leaderboard
              </nuxt-link>
            </li>
          </ul>
        </li>
        <li>
          <nuxt-link active-class="is-active" @click="showMenu = false" to="/support" style="padding-left: 1.3rem;">
            <span class="icon is-small mr-4">
              <SupportIcon />
            </span>
            <span>Help & Support</span>
          </nuxt-link>
        </li>
      </ul>
    </div>
    <div class="is-flex is-justify-content-space-between is-align-items-center mt-auto has-text-right">
      <nuxt-link to="/status" @click="showMenu = false">
        <div class="status-dot dot-online"></div> Healthy
      </nuxt-link>

      <ColorModeSwitcher />
    </div>
  </aside>
  <nav class="navbar is-hidden-desktop is-fixed-top has-shadow">
    <div class="navbar-brand">
      <nuxt-link to="/explorer" class="navbar-item" @click="showMenu = false">
        <logo width="135px" :animated="true" class="light-only" />
        <logo width="135px" :white="true" class="dark-only" :animated="true" />
      </nuxt-link>

      <a role="button" class="navbar-burger" :class="{ 'is-active': showMenu }" @click="showMenu = !showMenu">
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
import JobBuilderIcon from '@/assets/img/icons/sidebar/job-builder.svg?component';
import ExplorerIcon from '@/assets/img/icons/sidebar/explorer.svg?component';
import UserIcon from '@/assets/img/icons/sidebar/user.svg?component';
import SupportIcon from '@/assets/img/icons/sidebar/support.svg?component';
import { useWallet } from "solana-wallets-vue";
import { computed } from 'vue';
const { connected, publicKey } = useWallet();

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
  margin-bottom: 15px !important;
  
  .sidebar-link {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    color: inherit;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      .icon, span {
        opacity: 1 !important;
      }
    }

    &.is-active {
      .icon, span {
        opacity: 1 !important;
      }
    }
  }

  .chevron {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;

    &.is-active {
      transform: rotate(-180deg);
    }
  }
}

.submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.2s ease-out;
  margin-left: 2.5rem;
  margin-bottom: -10px;

  &.is-active {
    max-height: 200px;
  }

  li {
    margin: 0.5rem 0;
  }

  a {
    color: inherit;
    text-decoration: none;
    font-size: 0.9em;
    padding: 0.25rem 0.5rem;
    display: block;

    &:hover {
      opacity: 1;
    }

    &.is-active {
      opacity: 1;
      color: white;
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
