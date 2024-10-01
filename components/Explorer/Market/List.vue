<template>
  <div v-if="filteredMarkets && !filteredMarkets.length">No markets</div>
  <div class="columns is-mobile is-vcentered">
    <div v-if="markets && markets.length > perPage" class="column has-text-right">
      {{ (page - 1) * perPage + 1 }} -
      {{ Math.min(page * perPage, markets.length) }} of
      {{ markets.length }} markets
    </div>
  </div>

  <div class="table-container">
    <table class="table is-fullwidth is-striped is-hoverable">
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Max. duration</th>
          <th>Availibility</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!filteredMarkets">
          <td colspan="4">Loading markets..</td>
        </tr>
        <nuxt-link v-for="market in filteredMarkets" v-else :key="market.address.toString()"
          :to="`/markets/${market.address.toString()}`" custom>
          <template #default="{ navigate }">
            <tr class="is-clickable" @click="navigate">
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
              <td class="py-3">{{ parseInt(market.jobTimeout) / 60 }} min</td>
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
  <pagination v-if="markets && markets.length > perPage" v-model="page" class="pagination is-centered"
    :total-page="Math.ceil(markets.length / perPage)" :max-page="6">
  </pagination>
</template>

<script setup lang="ts">
import { type Market } from '@nosana/sdk';

const { data: testgridMarkets, pending: loadingTestgridMarkets } = await useAPI('/api/markets', { default: () => [] });
const { data: runningJobs, pending: loadingRunningJobs } = await useAPI('/api/jobs/running');
const { data: stats, pending: loadingStats } = await useAPI('/api/stats');

const props = defineProps({
  markets: {
    type: Array<Market>,
    default: undefined,
  },
});
const page: Ref<number> = ref(1);
const perPage: Ref<number> = ref(25);

const filteredMarkets = computed(() => {
  if (!props.markets || !props.markets.length) return props.markets;

  const paginatedMarkets: Array<any> = props.markets
    .filter((market) =>
      testgridMarkets.value.find((tgm: any) => tgm.address === market.address.toString())
    )
    .slice((page.value - 1) * perPage.value, page.value * perPage.value);
  return paginatedMarkets;
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
