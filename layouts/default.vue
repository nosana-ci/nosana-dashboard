<template>
  <div id="app">
    <section class="columns ml-0 mr-0 mt-0 mb-0">
      <side-bar />
      <div id="content" class="column has-navbar-fixed-top-mobile is-flex is-flex-direction-column ultrawide-centered">
        <div class="section">
          <div>
            <slot />
          </div>
        </div>
        <site-footer class="mt-auto" />
      </div>
    </section>

    <!-- Login Modal -->
    <LoginModal 
      :isOpen="modalState.isOpen"
      :mode="modalState.mode"
      :redirectPath="modalState.redirectPath"
      @close="closeModal"
      @success="handleLoginSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { useRedirect } from '~/composables/useRedirect';
import { useLoginModal } from '~/composables/useLoginModal';
import { useRouter, useRoute } from 'vue-router';
import LoginModal from '~/components/LoginModal.vue';

// Initialize redirect to handle navigation on connect/disconnect
useRedirect();

// Initialize login modal
const { modalState, closeModal } = useLoginModal();
const router = useRouter();
const route = useRoute();

// Handle successful login
const handleLoginSuccess = () => {
  // Always redirect to the specified path if provided, otherwise stay on current page
  if (modalState.value.redirectPath) {
    router.push(modalState.value.redirectPath);
  }
  // If no redirect path specified, stay on the current page (do nothing)
};
</script>

<style lang="scss" scoped>
#content {
  min-height: 100vh;
  max-width: 1600px;
  min-width: 0;
}

/* Ultrawide screen centering - center main content while keeping sidebar fixed */
@media screen and (min-width: 1920px) {
  .ultrawide-centered {
    margin-left: auto;
    margin-right: auto;
    padding-left: 2rem;
    padding-right: 2rem;
  }
  
  /* Adjust the main columns container to accommodate centered content */
  .columns {
    justify-content: flex-start;
  }
}
</style>
