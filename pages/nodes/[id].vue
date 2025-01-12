<template>
  <TopBar :title="'Node Page'" :subtitle="'Details about this Nosana Node'">
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
