<template>
  <!-- The playground fills the window: no page heading, no footer, the workspace
       takes the whole content column. -->
  <div id="app" :class="{ 'pg-nav-hidden': navHidden }">
    <section class="columns ml-0 mr-0 mt-0 mb-0">
      <side-bar />
      <div id="content" class="column has-navbar-fixed-top-mobile pg-page">
        <slot />
      </div>
    </section>
    <AccountBuyCreditsModal
      v-model="buyCreditsModalOpen"
      @purchased="onBuyCreditsPurchased"
    />
    <AuthLoginModal />
  </div>
</template>

<script setup lang="ts">
const navHidden = usePlaygroundNav();
const { isOpen: buyCreditsModalOpen, notifyPurchased } = useBuyCreditsModal();
const { triggerCreditRefresh } = useCreditRefresh();

const onBuyCreditsPurchased = () => {
  triggerCreditRefresh();
  notifyPurchased();
};
</script>

<style lang="scss" scoped>
// Edge to edge: the workspace is the page, not a card on it.
.pg-page {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100vh;
  height: 100dvh;
  padding: 0;
  overflow: hidden;
}

// The navigation reads as the outer column of the window's sidebar: a step
// darker than the chat list beside it, the softest hairline between, no shadow.
// The colours come from ui.css, where the theme is known. Only the playground
// can hide it, from the control next to the chat search.
:deep(.sidebar.sidebar) {
  box-shadow: none !important;
  border-right: 1px solid var(--pg-nav-border);
  background-color: var(--pg-nav) !important;
}

// Hidden on desktop only: on touch the sidebar is the mobile navbar.
@media screen and (min-width: 1024px) {
  .pg-nav-hidden :deep(.sidebar) {
    display: none;
  }
}

// Under the fixed mobile navbar.
@media screen and (max-width: 1023px) {
  .pg-page {
    padding-top: 3.5rem;
  }
}
</style>
