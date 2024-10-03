<template>
  <div class="box">
    <div v-if="loading">Loading..</div>
    <div v-else>
      <div v-if="address">
        <div class="is-flex is-align-items-center is-justify-content-space-between mb-4">
          <h3 class="title is-5 address is-family-monospace my-0">
            <span>{{ address }}</span>
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
                <nuxt-link :to="`/markets/${nodeMarket[0].address.toString()}`" class="address is-family-monospace">{{
                  nodeMarket[0].address.toString() }}</nuxt-link>
              </td>
            </tr>
            <tr v-if="nodeStatus === 'RUNNING' && nodeRuns && nodeRuns.length > 0">
              <td>Running job</td>
              <td>
                <nuxt-link :to="`/jobs/${nodeRuns[0].account.job}`" class="address is-family-monospace">{{
                  nodeRuns[0].account.job }}</nuxt-link>
              </td>
            </tr>
            <template v-if="nodeStatus || (jobs && jobs.length)">
              <tr>
                <td>Node Uptime</td>
                <td v-if="!nodeInfo || !nodeInfo.uptime">Offline</td>
                <td v-else>{{ (nodeInfo.uptime / (3600 * 1000)).toFixed(1) }} hours</td>
              </tr>
              <tr>
                <td>Node GPU</td>
                <td v-if="!nodeInfo || !nodeInfo.info || !nodeInfo.info.gpu">Unknown</td>
                <td v-else>
                  <div v-for="gpu in nodeInfo.info.gpu">{{ gpu.name }}</div>
                </td>
              </tr>
              <tr>
                <td>Node Disk Space</td>
                <td v-if="!nodeInfo || !nodeInfo.info || !nodeInfo.info.disk">Unknown</td>
                <td v-else>
                  <div>{{ (nodeInfo.info.disk / 10000).toFixed(0) }} GB</div>
                </td>
              </tr>
            </template>
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
        <div v-if="jobs && jobs.jobs">
          <ExplorerJobList :per-page="limit" :total-jobs="jobs ? jobs.totalJobs : null" v-model:page="page"
            v-model:state="state" :loading-jobs="loadingJobs" title="Jobs by this node" :jobs="jobs ? jobs.jobs : null">
          </ExplorerJobList>
        </div>
      </div>
      <div v-else>Address not found</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PublicKey } from '@solana/web3.js';
import dayjs from 'dayjs';
const { data: testgridMarkets, pending: loadingTestgridMarkets } = useAPI('/api/markets', { default: () => [] });
const { params } = useRoute();
const { data: nodeInfo, pending: loadingNode } = useFetch(`https://${String(params.id)}.node.k8s.prd.nos.ci/node/info`);
const { nosana } = useSDK();
const { markets, getMarkets, loadingMarkets } = useMarkets();

if (!markets.value) {
  getMarkets();
}
const address: Ref<string | null> = ref(null);
const balance: Ref<any | null> = ref(null);
const solBalance: Ref<any | null> = ref(null);
const nodeStatus: Ref<any | null> = ref(null);
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
watch(loadingMarkets, (newLoading) => {
  if (!newLoading) {
    getAddress();
  }
})


// useIntervalFn(getMarkets, 30000);
</script>
<style lang="scss" scoped></style>
