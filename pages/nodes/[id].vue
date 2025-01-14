<template>
  <TopBar :title="'Host Page'" :subtitle="'Details about this Nosana Host'">
  </TopBar>
  <div class="box">
    <!-- General Account Info -->
    <AccountInfo :address="address" />
    <!-- Node Specifications (if node) -->
    <NodeInfo :address="address" />
  </div>
</template>

<script setup lang="ts">
const { params } = useRoute();

const address: Ref<string> = ref(params.id as string);
</script>
