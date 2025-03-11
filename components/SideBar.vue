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
            :to="`/account/${publicKey}`"
            active-class="is-active "
            class="is-primary"
            @click="showMenu = false"
          >
            <span class="icon is-small mr-4">
              <UserIcon />
            </span>
            <span>My Account</span>
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to="/" active-class="is-active" @click="showMenu = false">
            <span class="icon is-small mr-4">
              <ExplorerIcon />
            </span>
            <span>Explorer</span>
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
            to="/stake"
            active-class="is-active"
            @click="showMenu = false"
          >
            <span class="icon is-small mr-4">
              <CoinsIcon />
            </span>
            <span>Staking</span>
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
            to="/jobs/templates"
            active-class="is-active"
            @click="showMenu = false"
          >
            <span class="icon is-small mr-4">
              <TemplateIcon />
            </span>
            <span>Templates</span>
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
            to="/jobs/create"
            active-class="is-active"
            @click="showMenu = false"
          >
            <span class="icon is-small mr-4">
              <JobBuilderIcon />
            </span>
            <span>Deploy Model</span>
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
            to="/markets"
            active-class="is-active"
            @click="showMenu = false"
          >
            <span class="icon is-small mr-4">
              <BrowserIcon />
            </span>
            <span>GPUs</span>
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
            to="/leaderboards"
            active-class="is-active"
            @click="showMenu = false"
          >
            <span class="icon is-small mr-4">
              <LeaderboardIcon />
            </span>
            <span>Leaderboards</span>
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
            active-class="is-active"
            @click="showMenu = false"
            to="/support"
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
import JobBuilderIcon from "@/assets/img/icons/sidebar/job-builder.svg?component";
import TemplateIcon from "@/assets/img/icons/sidebar/template.svg?component";
import ExplorerIcon from "@/assets/img/icons/sidebar/explorer.svg?component";
import UserIcon from "@/assets/img/icons/sidebar/user.svg?component";
import BrowserIcon from "@/assets/img/icons/sidebar/browser.svg?component";
import CoinsIcon from "@/assets/img/icons/sidebar/coins.svg?component";
import SupportIcon from "@/assets/img/icons/sidebar/support.svg?component";
import LeaderboardIcon from "@/assets/img/icons/sidebar/leaderboard.svg?component";
import { useWallet } from "solana-wallets-vue";
const { connected, publicKey } = useWallet();
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
