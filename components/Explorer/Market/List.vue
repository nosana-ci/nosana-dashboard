<template>
  <div v-if="filteredMarkets && !filteredMarkets.length">No markets</div>
  <div class="columns is-mobile is-vcentered">
    <div
      v-if="markets && markets.length > perPage"
      class="column has-text-right"
    >
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
          <th>NOS per second</th>
          <th>Job timeout</th>
          <th>Nodes in queue</th>
          <th>Jobs in queue</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!filteredMarkets">
          <td colspan="4">Loading markets..</td>
        </tr>
        <nuxt-link
          v-for="market in filteredMarkets"
          v-else
          :key="market.address.toString()"
          :to="`/markets/${market.address.toString()}`"
          custom
        >
          <template #default="{ navigate }">
            <tr class="is-clickable" @click="navigate">
              <td>
                <span
                  v-if="
                    testgridMarkets.find((tgm: any) => tgm.address ===  market.address.toString())
                  "
                  class="py-2"
                >
                  {{
                    testgridMarkets.find((tgm: any) => tgm.address ===  market.address.toString()).name
                  }}
                </span>
                <span v-else class="is-family-monospace py-2 address">
                  {{ market.address.toString() }}
                </span>
              </td>
              <td class="py-3">{{ parseInt(market.jobPrice) / 1e6 }} NOS</td>
              <td class="py-3">{{ parseInt(market.jobTimeout) / 60 }} min</td>
              <td class="py-3">
                <span v-if="market.queueType === 1">
                  {{ market.queue.length }}
                </span>
                <span v-else>-</span>
              </td>
              <td class="py-3">
                <span v-if="market.queueType === 0">
                  {{ market.queue.length }}
                </span>
                <span v-else>-</span>
              </td>
            </tr>
          </template>
        </nuxt-link>
      </tbody>
    </table>
  </div>
  <pagination
    v-if="markets && markets.length > perPage"
    v-model="page"
    class="pagination is-centered"
    :total-page="Math.ceil(markets.length / perPage)"
    :max-page="6"
  >
  </pagination>
</template>

<script setup lang="ts">
import { type Market } from '@nosana/sdk';

const { data: testgridMarkets, pending: loadingTestgridMarkets } = await useAPI('/api/markets', { default: () => [] });

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
         testgridMarkets.value.find((tgm: any) => tgm.address ===  market.address.toString())
    )
    .slice((page.value - 1) * perPage.value, page.value * perPage.value);
  return paginatedMarkets;
});
</script>
<style lang="scss" scoped>
td {
  vertical-align: middle;
}
</style>
