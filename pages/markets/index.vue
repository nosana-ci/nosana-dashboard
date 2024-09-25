<template>
  <div>
    <TopBar :title="'Explorer'" :subtitle="'Markets'"></TopBar>
    <div class="box has-background-white-ter">
      <ExplorerSearch />
    </div>
    <div class="box">
      <h1 class="title is-5">Test Grid Markets</h1>
      <ExplorerMarketList :markets="markets"></ExplorerMarketList>
      <div v-if="!loadingMarkets && !markets">Could not load markets</div>
    </div>
  </div>

</template>
<script setup lang="ts">
const { markets, getMarkets, loadingMarkets } = useMarkets();


if (!markets.value) {
  getMarkets();
}


// Fetch markets every 30 seconds
// useIntervalFn(getMarkets, 30000);
</script>
