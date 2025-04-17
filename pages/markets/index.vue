<template>
  <div>
    <TopBar
      :title="'Explorer'"
      :subtitle="'GPUs'"
      ref="topBar"
      v-model="showSettingsModal"
    ></TopBar>
    <div class="box has-background-white-ter">
      <Search />
    </div>
    <div class="box">
      <div class="columns">
        <div class="column is-2 has-text-centered">
          <h1 class="title is-5">GPUs</h1>
          <NodesAvailable />
        </div>
        <div class="column is-10">
          <MarketList :markets="markets"></MarketList>
          <div v-if="!loadingMarkets && !markets">Could not load markets</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import MarketList from "~/components/List/MarketList.vue";
import Search from "~/components/Search.vue";
import NodesAvailable from "~/components/Available.vue";

const { markets, getMarkets, loadingMarkets } = useMarkets();
const showSettingsModal = ref(false);
if (!markets.value && !loadingMarkets.value) {
  getMarkets();
}

// Fetch markets every 30 seconds
// useIntervalFn(getMarkets, 30000);
</script>

<style lang="scss" scoped></style>
