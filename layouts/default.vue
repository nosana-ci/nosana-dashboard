<template>
  <div id="app">
    <section class="columns ml-0 mr-0 mt-0 mb-0">
      <side-bar />
      <div id="content" class="column has-navbar-fixed-top-mobile is-flex is-flex-direction-column">
        <div class="section">
          <div>
            <slot />
          </div>
        </div>
        <site-footer class="mt-auto" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useWalletRedirect } from '~/composables/useWalletRedirect';

// Initialize wallet redirect to handle navigation on connect/disconnect
useWalletRedirect();
</script>

<style lang="scss" scoped>
#content {
  min-height: 100vh;
  max-width: 1600px;
  min-width: 0;
}
</style>
