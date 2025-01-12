<template>
  <TopBar :title="'Job Poster Page'" :subtitle="'Details about this Job Poster'">
  </TopBar>
  <div class="box">
    <!-- General Account Info -->
    <AccountInfo :address="address" />
    <!-- Poster Specifications (if poster) -->
    <PosterInfo :address="address" />
  </div>
</template>

<script setup lang="ts">
const { params } = useRoute();

const address: Ref<string> = ref(params.id as string);
</script>
