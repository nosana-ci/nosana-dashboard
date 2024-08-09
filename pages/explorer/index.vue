<template>
  <div>
    <div class="is-flex is-justify-content-space-between mb-5">
      <div>
        <h2 class="title">Explorer</h2>
        <h3 class="subtitle mb-2 is-capitalized">{{ config.public.network === 'mainnet' ? 'testgrid' : config.public.network }}</h3>
      </div>
      <ClientOnly>
        <wallet-multi-button :dark="$colorMode.value === 'dark'"></wallet-multi-button>
      </ClientOnly>
    </div>
    <ExplorerSearch />
    <!-- <div class="box is-flex is-flex-direction-column">
      <h2 class="title is-5">Statistics</h2>
    </div> -->
    <ExplorerGraphs />
    <div class="columns mt-4 is-multiline">
      <div class="column is-6">
        <div class="box is-flex is-flex-direction-column">
          <ExplorerJobLatest />
          
        </div>
      </div>
      <div class="column is-6">
        <div class="box is-flex is-flex-direction-column">
          <h2 class="title is-5">Test Grid Markets</h2>
          <ExplorerMarketQueues></ExplorerMarketQueues>
          <div class="has-text-right mt-auto pt-2">
            <nuxt-link to="/markets" class="button is-white">
              <span>All markets</span>
              <span class="icon"> &#8250; </span>
            </nuxt-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { WalletMultiButton } from "solana-wallets-vue";
const config = useRuntimeConfig();
</script>