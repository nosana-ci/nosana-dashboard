<template>
  <div class="landing-redirect">
    <Loader />
  </div>
</template>

<script setup lang="ts">
import Loader from "~/components/Loader.vue";

definePageMeta({
  layout: false,
});

// Redirect to login page - authentication is now handled there
onMounted(() => {
  navigateTo("/login");
});
</script>

<style lang="scss" scoped>
.landing-redirect {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
}
</style>
