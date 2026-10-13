<template>
  <!-- The playground fills the window: no page heading, no footer, the workspace
       takes the whole content column. -->
  <div id="app">
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

// Under the fixed mobile navbar.
@media screen and (max-width: 1023px) {
  .pg-page {
    padding-top: 3.5rem;
  }
}
</style>
