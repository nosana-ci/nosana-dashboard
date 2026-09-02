<template>
  <div>
    <TopBar
      title="Billing"
      subtitle="Manage your payment methods and purchase history"
    />
    <div v-if="!isAuthenticated && !isLoading" class="section has-text-centered">
      <p class="has-text-grey">Please sign in to manage billing.</p>
    </div>
    <Loader v-else-if="isLoading" />
    <AccountBillingSection v-else class="mt-6" />
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, isLoading } = useSuperTokens();
</script>
