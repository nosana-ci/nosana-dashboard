<template>
  <div>
    <TopBar :title="'Explorer'" :subtitle="'GPU Markets'"></TopBar>
    <div class="box has-background-white-ter">
      <ExplorerSearch />
    </div>
    <div class="box">
      <div class="columns">
        <div class="column is-2 has-text-centered">
          <h1 class="title is-5">GPU Markets</h1>
          <ExplorerNodesAvailable />
        </div>
        <div class="column is-10">
          <ExplorerMarketList :markets="markets"></ExplorerMarketList>
          <div v-if="!loadingMarkets && !markets">Could not load markets</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { markets, getMarkets, loadingMarkets } = useMarkets();

if (!markets.value && !loadingMarkets.value) {
  getMarkets();
}

// Fetch markets every 30 seconds
// useIntervalFn(getMarkets, 30000);
</script>

<style lang="scss" scoped></style>