<template>
  <div>
    <div v-if="!isNode">
      <div v-if="loadingJobs || loadingSpecs || loadingMarkets || loadingRuns">
        Checking if account is node..
      </div>
      <div v-else>
        <!-- Not a node-->
      </div>
    </div>
    <div v-else>
      <table class="table is-fullwidth">
        <tbody>
          <tr>
            <td colspan="2" class="has-background-light">
              <h4 class="title is-5">Node Info</h4>
            </td>
          </tr>
          <tr>
            <td>Jobs ran</td>
            <td v-if="loadingJobs">...</td>
            <td v-else-if="jobs">
              <span>{{ jobs.totalJobs }}</span>
            </td>
            <td v-else class="has-text-danger">Could not retrieve jobs</td>
          </tr>
          <tr>
            <td>Status</td>
            <td v-if="!queueInfo">
              <span v-if="loadingMarkets || loadingRuns">...</span>
              <span v-else>
                <div v-if="nodeRuns && nodeRuns.length" data-tooltip="Node is running a job" style="width: fit-content"
                  class="is-flex">
                  <ExplorerJobStatus :status="'RUNNING'"></ExplorerJobStatus>
                </div>
                <div v-else>
                  <span v-if="nodeInfo">(Re)starting</span>
                  <span v-else-if="loadingInfo">...</span>
                  <span v-else>Offline</span>
                </div>
              </span>
            </td>
            <td v-else style="vertical-align: middle">
              <div data-tooltip="Node is queued in market" style="width: fit-content" class="is-flex">
                <ExplorerJobStatus :status="'QUEUED'"></ExplorerJobStatus>
              </div>
            </td>
          </tr>
          <tr v-if="nodeRuns && nodeRuns.length > 0">
            <td>Running job</td>
            <td>
              <nuxt-link :to="`/jobs/${nodeRuns[0].account.job}`" class="address is-family-monospace">{{
                nodeRuns[0].account.job }}</nuxt-link>
            </td>
          </tr>
          <tr>
            <td>Market</td>
            <td v-if="queueInfo">
              <span>
                <nuxt-link :to="`/markets/${queueInfo.market.address.toString()}`" class="address is-family-monospace">
                  <span
                    v-if="testgridMarkets && testgridMarkets.find((tgm: any) => tgm.address === queueInfo!.market.address.toString())">
                    {{ testgridMarkets.find((tgm: any) => tgm.address === queueInfo!.market.address.toString()).name }}
                  </span>
                  <span v-else>{{ queueInfo.market.address.toString() }}</span>
                </nuxt-link>
              </span>
            </td>
            <td v-else>
              <span v-if="nodeSpecs">
                <nuxt-link :to="`/markets/${nodeSpecs.marketAddress}`" class="address is-family-monospace">
                  <span
                    v-if="testgridMarkets && testgridMarkets.find((tgm: any) => tgm.address === nodeSpecs.marketAddress)">
                    {{ testgridMarkets.find((tgm: any) => tgm.address === nodeSpecs.marketAddress).name }}
                  </span>
                  <span v-else>{{ nodeSpecs.marketAddress }}</span>
                </nuxt-link>
              </span>
              <span v-else-if="loadingMarkets || loadingSpecs">...</span>
              <span v-else>-</span>
            </td>
          </tr>
          <tr v-if="nodeInfo || queueInfo || (nodeRuns && nodeRuns.length)">
            <td>Node Version</td>
            <td v-if="nodeInfo">v{{ nodeInfo.version }}</td>
            <td v-else-if="loadingInfo">...</td>
            <td v-else>Offline</td>
          </tr>
          <NodeSpecification v-if="nodeSpecs" :specs="nodeSpecs" />
          <!-- Performance Section -->
          <tr>
            <td colspan="2" class="has-background-light">
              <h4 class="title is-5 mb-0">Performance</h4>
            </td>
          </tr>
          <tr>
            <td>
              <span class="is-flex-inline">
                <span>Performance Rank</span>
                <span class="has-tooltip-arrow ml-1" style="vertical-align: middle;" data-tooltip="An aggregated performance ranking based on all leaderboard
                positions of the node compared to all other nodes in the market.">
                  <img src="~/assets/img/icons/info.svg" />
                </span>
              </span>
            </td>
            <td v-if="!nodeRanking">-</td>
            <td v-else>{{ nodeRanking.performanceRank }}</td>
          </tr>
          <tr>
            <td>

              <span class="">
                <span>Stability Rank</span>
                <span class="has-tooltip-arrow ml-1" style="vertical-align: middle;" data-tooltip="An aggregated stability ranking based on the nodes performance
                  variance. The less variance the better.">
                  <img src="~/assets/img/icons/info.svg" />
                </span>
              </span>
            </td>
            <td v-if="!nodeRanking">-</td>
            <td v-else>{{ nodeRanking.stabilityRank }}</td>
          </tr>
          <tr>
            <td>Average Download Speed (Mbps)</td>
            <td v-if="
              !genericBenchmarkResponse || !genericBenchmarkResponse.data.length
            ">
              -
            </td>
            <td v-else>
              {{ genericBenchmarkResponse.data[0]?.metrics.internetSpeedDownload }}
            </td>
          </tr>
          <tr>
            <td>Average Upload Speed (Mbps)</td>
            <td v-if="
              !genericBenchmarkResponse || !genericBenchmarkResponse.data.length
            ">
              -
            </td>
            <td v-else>
              {{ genericBenchmarkResponse.data[0]?.metrics.internetSpeedUpload }}
            </td>
          </tr>
        </tbody>
      </table>
      <!-- <div class="columns">
        <div class="column is-6">
          <NodeBenchmarkHistogram title="LLM Performance" type="llm" :node-id="address"
            :market-id="nodeSpecs.marketAddress" default-metric="averageTokensPerSecond" :metrics="[
              {
                value: 'averageTokensPerSecond',
                label: 'Tokens / Second',
              },
              { value: 'avgClockSpeed', label: 'Clock Speed (MHz)' },
              { value: 'avgWattage', label: 'Power Usage (W)' },
              { value: 'avgTemperature', label: 'Temperature (°C)' },
            ]" x-axis-label="Concurrent Users" />
        </div>

        <div class="column is-6">
          <NodeBenchmarkHistogram title="Image Generation Performance" type="image-gen" :node-id="address"
            :market-id="nodeSpecs.marketAddress" default-metric="imagesPerSecond" :metrics="[
              { value: 'imagesPerSecond', label: 'Images / Second' },
              { value: 'avgClockSpeed', label: 'Clock Speed (MHz)' },
              { value: 'avgWattage', label: 'Power Usage (W)' },
              { value: 'avgTemperature', label: 'Temperature (°C)' },
            ]" x-axis-label="Batch Size" />
        </div>
      </div> -->
      <ExplorerJobList :per-page="limit" :total-jobs="jobs ? jobs.totalJobs : null" v-model:page="page"
        v-model:state="state" :loading-jobs="loadingJobs" title="Jobs Ran" :jobs="jobs ? jobs.jobs : null"
        :states="[1, 2]">
      </ExplorerJobList>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { type Market, type Run } from "@nosana/sdk";
const { nosana } = useSDK();
const { data: testgridMarkets, pending: loadingTestgridMarkets } = useAPI('/api/markets');
interface Props {
  address: string;
}
const props = defineProps<Props>();


/***************
 * Node Queue  *
 ***************/
const { markets, getMarkets, loadingMarkets } = useMarkets();
if (!markets.value) {
  // Retrieve markets if we don't have them
  getMarkets();
}
const queueInfo: ComputedRef<{ market: Market, position: number } | undefined> = computed(() => {
  let position: number = -1;
  const market = (markets?.value?.find((m) => {
    position = m.queue.findIndex((a: any) => a.toString() === props.address)
    return (position !== -1);
  }
  ));
  if (market) {
    return { market, position }
  }
  return undefined;
})

/***************
 * Node Runs   *
 ***************/
const { data: nodeRuns, pending: loadingRuns } = useMyAsyncData(
  "getNodeRuns",
  async () => {
    if (props.address) {
      try {
        // get active runs of node
        return await nosana.value.jobs.getRuns([
          {
            memcmp: {
              offset: 40,
              bytes: props.address,
            },
          },
        ]);
      } catch (e) {
        console.error("Could not get runs", e);
      }
    }
    return null;
  }
);

/*************
 * Node Jobs *
 *************/
const page: Ref<number> = ref(1);
const state: Ref<number | null> = ref(null);
const jobStateMapping: any = {
  0: 'QUEUED',
  1: 'RUNNING',
  2: 'COMPLETED',
  3: 'STOPPED',
};
const limit: Ref<number> = ref(10);
const jobsUrl: ComputedRef<string> = computed(() => { return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ''}${`&node=${props.address}`}` })
const { data: jobs, pending: loadingJobs } = useAPI(jobsUrl, { watch: [jobsUrl] });

const hasRanJobs: ComputedRef<Boolean> = computed(() => {
  return jobs.value && jobs.value.jobs && jobs.value.jobs.length
})

/**********************
* Node Specification *
**********************/
const { data: nodeSpecs, pending: loadingSpecs } = useAPI(`/api/nodes/${props.address}/specs`, {
  // @ts-ignore TODO: add to useAPI opts type
  disableToastonError: true,
});

const isNode: ComputedRef<Boolean> = computed(() => {
  return !!((nodeRuns.value && nodeRuns.value.length) || hasRanJobs.value || nodeSpecs.value || queueInfo.value)
})

/*************
 * Node Info *
 *************/
const { data: nodeInfo, pending: loadingInfo, execute: getNodeInfo } = useAPI(`https://${props.address}.${useRuntimeConfig().public.nodeDomain}/node/info`,
  {
    immediate: false,
    // @ts-ignore TODO: add to useAPI opts type
    disableToastonError: true,
  });

/*********************
 * Node Benchmarking *
 *********************/
const { data: genericBenchmarkResponse, execute: getNodeBenchmarks } = useAPI(
  `/api/benchmarks/generic-benchmark-data?node=${props.address}`,
  { immediate: false }
);

if (isNode.value) {
  // When we determined that we are a node, retrieve benchmarking info
  getNodeBenchmarks();
  getNodeInfo();
}

watch(isNode, (isNodeValue) => {
  if (isNodeValue) {
    console.log('isnode', isNodeValue);
    // When we determined that we are a node, retrieve benchmarking info
    getNodeBenchmarks();
    getNodeInfo();
  }
})

// When specs are loaded, retrieve node ranking
let rankingAPInstance: any = null;
watch(nodeSpecs, (specs) => {
  if (specs?.marketAddress) {
    if (!rankingAPInstance) {
      // TODO: this call is disabled because it is really slow and causes other queries to freeze as well
      // rankingAPInstance = useAPI(`/api/benchmarks/node-ranking?market=${specs.marketAddress}`);
    }
  }
})

interface NodeRanking {
  node: string;
  performanceRank: number;
  stabilityRank: number;
  participationRate: number;
}
const nodeRanking: ComputedRef<NodeRanking | null> = computed(() => {
  if (rankingAPInstance && rankingAPInstance.data && rankingAPInstance.data.value) {
    return rankingAPInstance.data.value.find((ranking: NodeRanking) => {
      return ranking.node === props.address;
    }) || null;
  }
  return null;
});

</script>
