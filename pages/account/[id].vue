<template>
  <TopBar :title="'Account Page'" :subtitle="'Details about this Solana Account'">
  </TopBar>
  <div class="box">
    <!-- General Account Info -->
    <AccountInfo :address="address" />
    <!-- Node Specifications (if node) -->
    <NodeInfo :address="address" />
    <!-- Poster Specifications (if poster) -->
    <PosterInfo :address="address" />
  </div>
</template>

<script setup lang="ts">
const { params } = useRoute();

const address: Ref<string> = ref(params.id as string);
</script>
