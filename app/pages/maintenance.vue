<template>
  <div class="maintenance">
    <div class="maintenance__content">
      <Logo class="maintenance__logo" />
      <h1 class="maintenance__title">Under maintenance</h1>
      <p class="maintenance__text">
        We're performing scheduled maintenance. Please check back shortly.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "empty",
});

onMounted(() => {
  if (typeof localStorage !== "undefined" && localStorage.getItem("skipMaintenance")) {
    navigateTo("/", { replace: true });
  }
});
</script>

<style lang="scss" scoped>
.maintenance {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--body-background-color);
}

.maintenance__content {
  text-align: center;
  padding: 2rem;
}

.maintenance__logo {
  margin-bottom: 2rem;
}

.maintenance__title {
  font-family: var(--title-family);
  font-size: 3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.maintenance__text {
  color: var(--text-light);
}
</style>
