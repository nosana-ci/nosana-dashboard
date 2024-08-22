<template>
  <div class="box">
    <div v-if="loading">Loading..</div>
    <div v-else>
      <div v-if="address">
        <div class="is-flex is-align-items-center is-justify-content-space-between mb-4">
          <h3 class="title is-5 address is-family-monospace my-0">
            <span v-if="address.toString() ===
      'FEEw3nDocYSyrLT4HPjibjYuaNekakWNmasNvEx3nHKi'
      ">Nosana Test Grid</span>
            <span v-else>{{ address }}</span>
          </h3>
        </div>

        <table class="table is-fullwidth is-striped mt-5 mb-6">
          <tbody>
            <tr>
              <td>NOS Balance</td>
              <td>
                <span v-if="balance">{{ balance.uiAmount }}</span> NOS
              </td>
            </tr>
            <tr>
              <td>SOL Balance</td>
              <td>
                <span v-if="solBalance">{{ solBalance / 1e9 }}</span> SOL
              </td>
            </tr>
            <tr v-if="jobs && jobs.totalJobs">
              <td>Jobs ran</td>
              <td>
                <span>{{ jobs.totalJobs }}</span>
              </td>
            </tr>
            <tr v-if="jobs && nodeNfts && nodeNfts.length > 0">
              <td>Node Access Key</td>
              <td style="vertical-align: middle">
                <div v-for="nft in nodeNfts" data-tooltip="Node Access Key found" style="width: fit-content"
                  class="is-flex">
                  <JobStatus :status="'COMPLETED'" image-only></JobStatus>
                  <span class="address is-family-monospace ml-2">{{
      Object.values(testgridMarkets).find(
        (m) => m.collection === nft.collection.address.toString(),
      )
        ? Object.values(testgridMarkets).find(
          (m) =>
            m.collection === nft.collection.address.toString(),
        ).name
        : nft.collection.address.toString()
    }}</span>
                </div>
              </td>
            </tr>
            <tr v-if="nodeStatus">
              <td>Status</td>
              <td style="vertical-align: middle">
                <div v-if="nodeStatus === 'QUEUED'" data-tooltip="Node is queued in market" style="width: fit-content"
                  class="is-flex">
                  <ExplorerJobStatus :status="'QUEUED'" image-only></ExplorerJobStatus>
                </div>
                <div v-else-if="nodeStatus === 'RUNNING'" data-tooltip="Node is running a job"
                  style="width: fit-content" class="is-flex">
                  <ExplorerJobStatus image-only :status="'RUNNING'"></ExplorerJobStatus>
                </div>
                <span v-else>-</span>
              </td>
            </tr>
            <tr v-if="nodeStatus === 'QUEUED' && nodeMarket && nodeMarket.length > 0
      ">
              <td>Market</td>
              <td>
                <nuxt-link :to="`/explorer/markets/${nodeMarket[0].address.toString()}`" class="address is-family-monospace">{{
      nodeMarket[0].address.toString() }}</nuxt-link>
              </td>
            </tr>
            <tr v-if="nodeStatus === 'RUNNING' && nodeRuns && nodeRuns.length > 0">
              <td>Running job</td>
              <td>
                <nuxt-link :to="`/explorer/jobs/${nodeRuns[0].account.job}`" class="address is-family-monospace">{{
      nodeRuns[0].account.job }}</nuxt-link>
              </td>
            </tr>
            <!-- TODO: First need to include price in the jobs.all() in SDK-->
            <!-- <tr v-if="jobs">
              <td>Total NOS earned</td>
              <td>
                <span>{{
                  jobs.reduce((a, b) => {
                    return a + b.price && b.timeEnd && b.timeStart
                      ? (b.price / 1e6) * (b.timeEnd - b.timeStart)
                      : 0;
                  }, 0)
                }}</span>
              </td>
            </tr> -->
          </tbody>
        </table>
        <div v-if="jobs && jobs.jobs && jobs.jobs.length > 0">
          <ExplorerJobList :per-page="limit" :total-jobs="jobs ? jobs.totalJobs : null" v-model:page="page" v-model:state="state"
          :loading-jobs="loadingJobs" title="Jobs by this node" :jobs="jobs ? jobs.jobs : null"
          >
        </ExplorerJobList>
        </div>
      </div>
      <div v-else>Address not found</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PublicKey, Connection } from '@solana/web3.js';
// import { Metaplex } from '@metaplex-foundation/js';
const { data: testgridMarkets, pending: loadingTestgridMarkets } = useAPI('/api/markets', { default: () => [] });
const config = useRuntimeConfig();

const { params } = useRoute();
const { nosana } = useSDK();
const { markets } = useMarkets();
const address: Ref<string | null> = ref(null);
const balance: Ref<any | null> = ref(null);
const solBalance: Ref<any | null> = ref(null);
const nodeStatus: Ref<any | null> = ref(null);
const nodeNfts: Ref<Array<any>> = ref([]);
const nodeMarket: Ref<any> = ref(null);
const nodeRuns: Ref<any> = ref(null);
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
const jobsUrl = computed(() => { return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ''}${`&node=${params.id}`}` })
const { data: jobs, pending: loadingJobs, refresh: refreshJobs } = useAPI(jobsUrl, { watch: [jobsUrl] });

// create connection for Metaplex
// TODO move this to SDK or plugin(?)
// const web3 = new Connection(config.public.rpcUrl);
// const metaplex = new Metaplex(web3);

const getAddress = async () => {
  loading.value = true;
  try {
    const pk = new PublicKey(String(params.id));
    address.value = pk.toString();

    try {
      balance.value = await nosana.value.solana.getNosBalance(address.value);
      solBalance.value = await nosana.value.solana.getSolBalance(address.value);
    } catch (e) {
      console.error('cant get balance', e);
    }
  } catch (error) {
    console.error('not a valid address', error);
    address.value = null;
  }

  // get market where node is in
  const nodesInMarkets = markets?.value?.flatMap((market) => {
    return market.queueType === 1
      ? market.queue.map((data: any) => data.toString())
      : [];
  });

  if (nodesInMarkets?.includes(address.value)) {
    nodeStatus.value = 'QUEUED';
    nodeMarket.value = markets?.value?.filter((m) =>
      m.queue.find((a: any) => a.toString() === address.value?.toString()),
    );
  }

  nodeRuns.value = await nosana.value.jobs.getRuns([
    {
      memcmp: {
        offset: 40,
        bytes: params.id,
      },
    },
  ]);

  // get active runs of node
  if (nodeRuns.value && nodeRuns.value.length) {
    nodeStatus.value = 'RUNNING';
  }
  loading.value = false;
};

watch(loadingTestgridMarkets, (newLoading) => {
  if (!newLoading) {
    getAddress();
  }
})

// useIntervalFn(getMarkets, 30000);
</script>
<style lang="scss" scoped></style>
