<template>
  <div>
    <TopBar :title="'Explorer'" :subtitle="config.public.network === 'mainnet' ? 'testgrid' :
      config.public.network"></TopBar>
    <ExplorerSearch />
    <ExplorerJobStats />
    <ExplorerJobTimestamps />
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
const config = useRuntimeConfig();
</script>