<template>
  <div class="columns">
    <div class="column">
      <div class="tabs">
        <ul>
          <li :class="{ 'is-active': tab === 'premium' }">
            <a @click="tab = 'premium'" class="is-justify-content-flex-start">PREMIUM</a>
          </li>
          <li :class="{ 'is-active': tab === 'community' }">
            <a @click="tab = 'community'" class="is-justify-content-flex-start">COMMUNITY</a>
          </li>
          <li :class="{ 'is-active': tab === 'all' }">
            <a @click="tab = 'all'" class="is-justify-content-flex-start">ALL</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="column is-narrow">
      <div v-if="filteredMarkets && filteredMarkets.length" class="has-text-right">
        <span v-if="filteredMarkets.length > perPage">{{ (page - 1) * perPage + 1 }} -
          {{ Math.min(page * perPage, filteredMarkets.length) }} of </span>
        <span>{{ filteredMarkets.length }} markets</span>
      </div>
    </div>
  </div>

  <div class="table-container">
    <table class="table is-fullwidth is-striped is-hoverable" :class="{ 'is-narrow': select }">
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Availibility</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!filteredMarkets">
          <td colspan="3">Loading markets..</td>
        </tr>
        <tr v-if="filteredMarkets && !filteredMarkets.length">
          <td colspan="3">No markets</td>
        </tr>
        <nuxt-link v-for="market in paginatedMarkets" v-else :key="market.address.toString()"
          :to="`/markets/${market.address.toString()}`" custom>
          <template #default="{ navigate }">
            <tr class="is-clickable" :class="{ 'is-selected': selectedMarket === market }"
              @click="select ? selectedMarket = market : navigate()">
              <td>
                <span v-if="
                  testgridMarkets.find((tgm: any) => tgm.address === market.address.toString())
                " class="py-2">
                  {{
                    testgridMarkets.find((tgm: any) => tgm.address === market.address.toString()).name
                  }}
                </span>
                <span v-else class="is-family-monospace py-2 address">
                  {{ market.address.toString() }}
                </span>
              </td>
              <td class="py-3">
                <span v-if="loadingStats">...</span>
                <span v-else-if="stats && stats[0] && stats[0].price">
                  ${{ ((stats[0].price * (parseInt(market.jobPrice) / 1e6)) * 3600).toFixed(2) }} / h
                </span>
                <span v-else>{{ parseInt(market.jobPrice) / 1e6 }} NOS/s</span>
              </td>
              <td class="py-3">
                <span v-if="market.queueType === 1">
                  <span v-if="loadingRunningJobs">...</span>
                  <template v-else>
                    <span>
                      {{ market.queue.length }} /
                      <span v-if="runningJobs">
                        <span>
                          {{ market.queue.length + (runningJobs[market.address] ?
                            runningJobs[market.address].running : 0) }}
                        </span>
                      </span>
                      <span v-else>
                        ?
                      </span>
                    </span>
                    <span>
                      nodes</span>
                    <span><progress class="is-pulled-right progress is-secondary" :value="market.queue.length" :max="market.queue.length + (runningJobs[market.address] ?
                      runningJobs[market.address].running : 0)"></progress></span>
                  </template>
                </span>
                <span v-else>
                  <span v-if="loadingRunningJobs">0 / ...</span>
                  <span v-else>
                    0 /
                    <span v-if="runningJobs">
                      {{ (runningJobs[market.address] ? runningJobs[market.address].running : 0) }}
                    </span>
                    <span v-else>
                      ?
                    </span>
                    <span>
                      nodes</span>
                    <span><progress class="is-pulled-right progress is-secondary" :value="0" :max="(runningJobs[market.address] ?
                      runningJobs[market.address].running : 0)"></progress></span>
                  </span>
                  <br>
                  <small v-if="market.queueType === 0">{{ market.queue.length }} jobs queued</small>
                </span>
              </td>
            </tr>
          </template>
        </nuxt-link>
      </tbody>
    </table>
  </div>
  <pagination v-if="filteredMarkets && filteredMarkets.length > perPage" v-model="page" class="pagination is-centered"
    :total-page="Math.ceil(filteredMarkets.length / perPage)" :max-page="6">
  </pagination>
</template>

<script setup lang="ts">
import { type Market } from '@nosana/sdk';

const { data: testgridMarkets, pending: loadingTestgridMarkets } = await useAPI('/api/markets', { default: () => [] });
const { data: runningJobs, pending: loadingRunningJobs } = await useAPI('/api/jobs/running');
const { data: stats, pending: loadingStats } = await useAPI('/api/stats');
const tab: Ref<string> = ref('premium');

const props = defineProps({
  markets: {
    type: Array<Market>,
    default: undefined,
  },
  select: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['selectedMarket'])
const selectedMarket: Ref<Market | null> = ref(null);

watch(selectedMarket, (newValue: Market | null) => {
  emit('selectedMarket', newValue)
});
const page: Ref<number> = ref(1);
const perPage: Ref<number> = ref(25);

const filteredMarkets = computed(() => {
  if (!props.markets || !props.markets.length) return props.markets;
  return props.markets
    .filter((market) => {
      if (tab.value === 'premium') {
        return testgridMarkets.value.find((tgm: any) => tgm.address === market.address.toString() && tgm.type === 'PREMIUM');
      }
      if (tab.value === 'community') {
        return testgridMarkets.value.find((tgm: any) => tgm.address === market.address.toString() && tgm.type === 'COMMUNITY');
      }
      return true;
    });
});
const paginatedMarkets = computed(() => {
  if (!filteredMarkets.value || !filteredMarkets.value.length) return props.markets;
  return filteredMarkets.value.slice((page.value - 1) * perPage.value, page.value * perPage.value);
});
</script>
<style lang="scss" scoped>
td {
  vertical-align: middle;
}

.progress {
  max-width: 100px;

  &::-webkit-progress-bar {
    background-color: lighten($secondary, 43%);
  }
}
</style>
