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
        <li>
          <nuxt-link to="/" active-class="is-active" @click="showMenu = false">
            <span class="icon is-small mr-4">
              <ExplorerIcon />
            </span>
            <span>Explorer</span>
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to="/stake" active-class="is-active" @click="showMenu = false">
            <span class="icon is-small mr-4">
              <CoinsIcon />
            </span>
            <span>Staking</span>
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to="/jobs/create" active-class="is-active" @click="showMenu = false">
            <span class="icon is-small mr-4">
              <JobBuilderIcon />
            </span>
            <span>Job Builder</span>
          </nuxt-link>
        </li>


        <li>
          <nuxt-link to="/jobs" active-class="is-active" @click="showMenu = false">
            <span class="icon is-small mr-4">
              <BlocksIcon />
            </span>
            <span>Jobs</span>
          </nuxt-link>
        </li>
        <li>
          <nuxt-link to="/markets" active-class="is-active" @click="showMenu = false">
            <span class="icon is-small mr-4">
              <BrowserIcon />
            </span>
            <span>GPU Markets</span>
          </nuxt-link>
        </li>
        <!-- <li>
          <nuxt-link active-class="is-active" @click="showMenu = false" disabled>
            <span class="icon is-small mr-4">
              <svg width="16" height="17" viewBox="0 0 16 17" fill="none">
                <path
                  d="M5.81095 16.5L5.49254 13.94C5.32007 13.8733 5.15768 13.7933 5.00537 13.7C4.85307 13.6067 4.70368 13.5067 4.55721 13.4L2.18905 14.4L0 10.6L2.04975 9.04C2.03648 8.94667 2.02985 8.8568 2.02985 8.7704V8.2304C2.02985 8.14347 2.03648 8.05333 2.04975 7.96L0 6.4L2.18905 2.6L4.55721 3.6C4.70315 3.49333 4.85572 3.39333 5.01493 3.3C5.17413 3.20667 5.33333 3.12667 5.49254 3.06L5.81095 0.5H10.1891L10.5075 3.06C10.6799 3.12667 10.8426 3.20667 10.9954 3.3C11.1483 3.39333 11.2974 3.49333 11.4428 3.6L13.8109 2.6L16 6.4L13.9502 7.96C13.9635 8.05333 13.9701 8.14347 13.9701 8.2304V8.7696C13.9701 8.85653 13.9569 8.94667 13.9303 9.04L15.9801 10.6L13.791 14.4L11.4428 13.4C11.2969 13.5067 11.1443 13.6067 10.9851 13.7C10.8259 13.7933 10.6667 13.8733 10.5075 13.94L10.1891 16.5H5.81095ZM8.0398 11.3C8.80929 11.3 9.466 11.0267 10.01 10.48C10.5539 9.93333 10.8259 9.27333 10.8259 8.5C10.8259 7.72667 10.5539 7.06667 10.01 6.52C9.466 5.97333 8.80929 5.7 8.0398 5.7C7.25705 5.7 6.59688 5.97333 6.0593 6.52C5.52173 7.06667 5.2532 7.72667 5.25373 8.5C5.25373 9.27333 5.52252 9.93333 6.0601 10.48C6.59768 11.0267 7.25758 11.3 8.0398 11.3Z"
                  fill="currentColor" />
              </svg>
            </span>
            <span>Settings</span>
          </nuxt-link>
        </li> -->
        <li>
          <nuxt-link active-class="is-active" @click="showMenu = false" to="/support">
            <span class="icon is-small mr-4">
              <SupportIcon />
            </span>
            <span>Help & Support</span>
          </nuxt-link>
        </li>
      </ul>
    </div>
    <ColorModeSwitcher class="mt-auto has-text-right" />
  </aside>
  <nav class="navbar is-hidden-desktop is-fixed-top has-shadow">
    <div class="navbar-brand">
      <nuxt-link to="/" class="navbar-item" @click="showMenu = false">
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
import JobBuilderIcon from '@/assets/img/icons/sidebar/job-builder.svg?component';
import BlocksIcon from '@/assets/img/icons/sidebar/blocks.svg?component';
import ExplorerIcon from '@/assets/img/icons/sidebar/explorer.svg?component';
import BrowserIcon from '@/assets/img/icons/sidebar/browser.svg?component';
import CoinsIcon from '@/assets/img/icons/sidebar/coins.svg?component';
import SupportIcon from '@/assets/img/icons/sidebar/support.svg?component';

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
