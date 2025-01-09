<template>
  <div class="box">
    <div v-if="loading && !market">Loading market..</div>
    <div v-else>
      <div v-if="market">
        <h3 class="title mt-3">
          {{
            testgridMarkets.find(m => m.address === marketId)
              ? testgridMarkets.find(m => m.address === marketId).name
              : marketId
          }}
        </h3>
        <table class="table is-fullwidth is-striped">
          <tbody>
            <tr v-if="testgridMarkets.find(m => m.address === marketId)">
              <td>Market Address</td>
              <td>
                <a target="_blank" class="address is-family-monospace"
                  :href="'https://explorer.solana.com/address/' + marketId">{{ marketId }}</a>
              </td>
            </tr>
            <tr>
              <td>Authority</td>
              <td>
                <a target="_blank" class="address is-family-monospace" :href="'https://explorer.solana.com/address/' + market.authority
                  ">{{ market.authority }}</a>
              </td>
            </tr>
            <tr>
              <td>Job expiration</td>
              <td>{{ market.jobExpiration / 3600 }} hours</td>
            </tr>
            <tr>
              <td>Price</td>
              <td>{{ market.jobPrice / 1e6 }} NOS/s</td>
            </tr>
            <tr>
              <td>Node access key</td>
              <td>
                <a target="_blank" class="address is-family-monospace" :href="'https://explorer.solana.com/address/' +
                  market.nodeAccessKey.toString()
                  ">{{ market.nodeAccessKey.toString() }}</a>
              </td>
            </tr>
            <tr>
              <td>Minimum Stake</td>
              <td>{{ market.nodeXnosMinimum / 1e6 }} NOS</td>
            </tr>
          </tbody>
        </table>
        <div class="py-5 queues columns">
          <div class="node-queue column is-half">
            <h2 class="title is-5">Node Queue</h2>
            <p v-if="market.queue && market.queue.length > 0" class="mb-2">
              Total of: {{ market.queue.length }} node(s) in queue
            </p>
            <p v-else>There are no nodes in the queue at the moment</p>
            <ol v-if="market.queue && market.queue.length > 0">
              <li v-for="node in market.queue">
                <nuxt-link :to="`/account/${node}`" class="address is-family-monospace">
                  {{ node }}
                </nuxt-link>
              </li>
            </ol>
          </div>
          <div class="running-nodes column is-half">
            <h2 class="title is-5">Running Nodes</h2>
            <template v-if="runningNodes.length > 0">
              <p class="mb-2">
                Total of: {{ runningNodes.length }} node(s) running
              </p>
              <ol>
                <li v-for="node in runningNodes" :key="node">
                  <nuxt-link :to="`/account/${node}`" class="address is-family-monospace">
                    {{ node }}
                  </nuxt-link>
                </li>
              </ol>
            </template>
            <p v-else>There are no nodes running at the moment</p>
          </div>
        </div>
        <ExplorerJobList :per-page="limit" :total-jobs="jobs ? jobs.totalJobs : null" v-model:page="page"
          v-model:state="state" :loading-jobs="loadingJobs" title="All Jobs in this market"
          :jobs="jobs ? jobs.jobs : null">
        </ExplorerJobList>
      </div>
      <div v-else>Market not found</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Market } from '@nosana/sdk';
const { data: testgridMarkets, pending: loadingTestgridMarkets } = useAPI('/api/markets', { default: () => [] });

const { params } = useRoute();
const { nosana } = useSDK();
const market: Ref<Market | null> = ref(null);
const marketId: Ref<string> = ref(String(params.id));
const loading: Ref<boolean> = ref(false);

const page: Ref<number> = ref(1);
const state: Ref<number | null> = ref(null);
const jobStateMapping: any = {
  0: 'QUEUED',
  1: 'RUNNING',
  2: 'COMPLETED',
  3: 'STOPPED',
};
const limit: Ref<number> = ref(10);
const jobsUrl = computed(() => { return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ''}${`&market=${marketId.value}`}` })
const { data: jobs, pending: loadingJobs, refresh: refreshJobs } = useAPI(jobsUrl, { watch: [jobsUrl] });
watch(jobsUrl, () => {
  console.log('resetting jobs..')
  jobs.value = null
})

const runningNodesUrl = computed(() => `/api/jobs/running-nodes?market=${marketId.value}`);
const { data: runningNodesData, pending: loadingRunningNodes, refresh: refreshRunningNodes } = useAPI(runningNodesUrl, { 
  watch: [runningNodesUrl],
  transform: (data) => data?.nodes || [],
  default: () => [],
  immediate: true,
  lazy: true
});

const runningNodes = computed(() => runningNodesData.value || []);

const getMarket = async () => {
  try {
    loading.value = true;
    market.value = await nosana.value.jobs.getMarket(marketId.value);
  } catch (e) {
    market.value = null;
  }
  loading.value = false;
};

getMarket();
</script>
<style lang="scss" scoped></style>
