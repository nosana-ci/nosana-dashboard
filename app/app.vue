<template>
  <WalletProvider :auto-connect="true" local-storage-key="nosana-wallet">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </WalletProvider>
</template>

<script setup lang="ts">
import { WalletProvider } from '@nosana/solana-vue';
</script>

