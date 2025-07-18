<template>
  <div>
    <div v-if="!isNode">
      <div v-if="loadingJobs || loadingSpecs || loadingMarkets || loadingRuns">
        Checking if account is host..
      </div>
      <div v-else>
        <!-- Not a node-->
      </div>
    </div>
    <div v-else>
      <table class="table is-fullwidth two-column-labels">
        <tbody>
          <tr>
            <td colspan="2" class="has-background-light">
              <h4 class="title is-5">Host Info</h4>
            </td>
          </tr>
          <tr>
            <td>Deployments ran</td>
            <td v-if="loadingJobs">...</td>
            <td v-else-if="jobs">
              <span>{{ jobs.totalJobs }}</span>
            </td>
            <td v-else class="has-text-danger">
              Could not retrieve deployments
            </td>
          </tr>
          <tr>
            <td>Status</td>
            <td v-if="!queueInfo">
              <span v-if="loadingMarkets || loadingRuns">...</span>
              <span v-else>
                <div
                  v-if="nodeRuns && nodeRuns.length"
                  data-tooltip="Host is running a deployment"
                  style="width: fit-content"
                  class="is-flex"
                >
                  <JobStatus :status="'RUNNING'"></JobStatus>
                </div>
                <div v-else>
                  <span v-if="nodeInfo">(Re)starting</span>
                  <span v-else-if="loadingInfo">...</span>
                  <span v-else>Offline</span>
                </div>
              </span>
            </td>
            <td v-else style="vertical-align: middle">
              <div
                data-tooltip="Host is queued in market"
                style="width: fit-content"
                class="is-flex"
              >
                <JobStatus :status="'QUEUED'"></JobStatus>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <span class="is-flex-inline">
                <span>Availability</span>
                <span
                  class="has-tooltip-arrow ml-1"
                  style="vertical-align: middle"
                  data-tooltip="The percentage of time this host has been available to process deployments while in queue"
                >
                  <img src="~/assets/img/icons/info.svg" />
                </span>
              </span>
            </td>
            <td
              v-if="
                !nodeRanking ||
                typeof nodeRanking.uptimePercentage === 'undefined'
              "
            >
              <span
                class="has-tooltip-arrow"
                data-tooltip="This host hasn't been online long enough to calculate availibily"
              >
                unknown
              </span>
            </td>
            <td v-else>{{ nodeRanking.uptimePercentage.toFixed(1) }}%</td>
          </tr>
          <tr v-if="nodeRuns && nodeRuns.length > 0">
            <td>Running deployment</td>
            <td>
              <nuxt-link
                :to="`/jobs/${nodeRuns[0].account.job}`"
                class="address is-family-monospace"
                >{{ nodeRuns[0].account.job }}</nuxt-link
              >
            </td>
          </tr>
          <tr>
            <td>Host pool</td>
            <td v-if="queueInfo">
              <span>
                <nuxt-link
                  :to="`/markets/${queueInfo.market.address.toString()}`"
                  class="address is-family-monospace"
                >
                  <span
                    v-if="
                      testgridMarkets &&
                      testgridMarkets.find(
                        (tgm: any) =>
                          tgm.address === queueInfo!.market.address.toString()
                      )
                    "
                  >
                    {{
                      testgridMarkets.find(
                        (tgm: any) =>
                          tgm.address === queueInfo!.market.address.toString()
                      ).name
                    }}
                  </span>
                  <span v-else>{{ queueInfo.market.address.toString() }}</span>
                </nuxt-link>
              </span>
            </td>
            <td v-else>
              <span v-if="nodeSpecs">
                <template v-if="nodeSpecs.marketAddress">
                  <nuxt-link
                    :to="`/markets/${nodeSpecs.marketAddress}`"
                    class="address is-family-monospace"
                  >
                    <span
                      v-if="
                        testgridMarkets &&
                        testgridMarkets.find(
                          (tgm: any) => tgm.address === nodeSpecs.marketAddress
                        )
                      "
                    >
                      {{
                        testgridMarkets.find(
                          (tgm: any) => tgm.address === nodeSpecs.marketAddress
                        ).name
                      }}
                    </span>
                    <span v-else>{{ nodeSpecs.marketAddress }}</span>
                  </nuxt-link>
                </template>
                <template v-else>
                  <span>-</span>
                </template>
              </span>
              <span v-else-if="loadingMarkets || loadingSpecs">...</span>
              <span v-else>-</span>
            </td>
          </tr>
          <tr>
            <td>CLI Version</td>
            <td v-if="combinedSpecs && combinedSpecs.nodeVersion">
              v{{ combinedSpecs.nodeVersion }}
            </td>
            <td v-else-if="loadingInfo || loadingSpecs">...</td>
            <td v-else>Offline</td>
          </tr>
          <tr>
            <td>Host API Status</td>
            <td>
              <span v-if="nodeInfo">Online</span>
              <span v-else-if="loadingInfo">...</span>
              <span v-else>Offline</span>
            </td>
          </tr>
          <HostSpecifications
            v-if="combinedSpecs"
            :specs="combinedSpecs"
            :node-ranking="nodeRanking"
            :generic-benchmark-response="genericBenchmarkResponse"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type Market } from "@nosana/sdk";
import HostSpecifications from "~/components/Info/HostSpecifications.vue";
import JobStatus from "~/components/Job/Status.vue";
import { useGenericBenchmark } from "~/composables/useBenchmarkData";
const { nosana } = useSDK();
const { data: testgridMarkets, pending: loadingTestgridMarkets } =
  useAPI("/api/markets");

interface Props {
  address: string;
}
const props = defineProps<Props>();

/***************
 * Node Queue  *
 ***************/
const { markets, getMarkets, loadingMarkets } = useMarkets();
if (!markets.value) {
  getMarkets();
}
const queueInfo: ComputedRef<{ market: Market; position: number } | undefined> =
  computed(() => {
    let position = -1;
    const market = markets.value?.find((m) => {
      position = m.queue.findIndex((a: any) => a.toString() === props.address);
      return position !== -1;
    });
    if (market) {
      return { market, position };
    }
    return undefined;
  });

console.log(queueInfo.value?.market.address.toString());

/***************
 * Node Runs   *
 ***************/
const { data: nodeRuns, pending: loadingRuns } = useMyAsyncData(
  "getNodeRuns",
  async () => {
    if (props.address) {
      try {
        return await nosana.value.jobs.getRuns([
          {
            memcmp: {
              offset: 40,
              bytes: props.address,
            },
          },
        ]);
      } catch (e) {
        // Silent error handling - expected for offline nodes
        return null;
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
const jobStateMapping: Record<number, string> = {
  0: "QUEUED",
  1: "RUNNING",
  2: "COMPLETED",
  3: "STOPPED",
};
const limit: Ref<number> = ref(10);
const jobsUrl: ComputedRef<string> = computed(() => {
  return `/api/jobs?limit=${limit.value}&offset=${
    (page.value - 1) * limit.value
  }${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ""}${
    "&node=" + props.address
  }`;
});

interface JobsResponse {
  totalJobs: number;
  jobs: any[];
}

const { data: jobs, pending: loadingJobs } = useAPI(jobsUrl, {
  watch: [jobsUrl],
});

const hasRanJobs: ComputedRef<Boolean> = computed(() => {
  return Boolean(jobs?.value?.jobs?.length);
});

/**********************
 * Node Specification *
 **********************/
const { data: nodeSpecs, pending: loadingSpecs } = useAPI(
  `/api/nodes/${props.address}/specs`,
  {
    // @ts-ignore
    disableToastOnError: true,
  }
);

const isNode: ComputedRef<Boolean> = computed(() => {
  // If nodeSpecs exists or queueInfo says this is queued, or we found any runs or jobs, consider it a node
  return (
    (nodeRuns.value && nodeRuns.value.length) ||
    hasRanJobs.value ||
    nodeSpecs.value?.marketAddress ||
    queueInfo.value
  );
});

/*************
 * Node Info *
 *************/
const {
  data: nodeInfo,
  pending: loadingInfo,
  execute: getNodeInfo,
} = useAPI(
  `https://${props.address}.${useRuntimeConfig().public.nodeDomain}/node/info`,
  {
    immediate: false,
    // @ts-ignore
    disableToastOnError: true,
    // Handle backend/fetch errors silently
    onRequestError: () => ({ info: null }),
    onResponseError: () => ({ info: null }),
    // @ts-ignore
    options: {
      retry: 0,
    },
  }
);

/*************
 * Fallback Node Specs *
 *************/
const combinedSpecs = computed(() => {
  if (!nodeSpecs.value) return null;

  const nodeInfoData = nodeInfo.value?.info;

  // First check if node api data is available, otherwise use the database as fallback

  return {
    nodeAddress: props.address,
    marketAddress: nodeSpecs.value.marketAddress,
    ram: nodeInfoData?.ram_mb
      ? Math.round(nodeInfoData.ram_mb)
      : Math.round(Number(nodeSpecs.value.ram)),
    diskSpace: nodeInfoData?.disk_gb
      ? Math.round(Number(nodeInfoData.disk_gb))
      : Math.round(Number(nodeSpecs.value.diskSpace)),
    cpu: nodeInfoData?.cpu?.model ?? nodeSpecs.value.cpu,
    country: nodeInfoData?.country ?? nodeSpecs.value.country,
    bandwidth:
      nodeInfoData?.network?.download_mbps ?? nodeSpecs.value.bandwidth,
    gpus: nodeInfoData?.gpus?.devices
      ? nodeInfoData.gpus.devices.map((gpu: any) => ({
          gpu: gpu.name,
          memory: gpu.memory?.total_mb,
          architecture: `${gpu.network_architecture?.major}.${gpu.network_architecture?.minor}`,
        }))
      : nodeSpecs.value.gpus,
    cudaVersion:
      nodeInfoData?.gpus?.cuda_driver_version ?? nodeSpecs.value.cudaVersion,
    nvmlVersion:
      nodeInfoData?.gpus?.nvml_driver_version ?? nodeSpecs.value.nvmlVersion,
    nodeVersion: nodeInfoData?.version ?? nodeSpecs.value.nodeVersion,
    systemEnvironment: nodeInfoData?.system_environment
      ? nodeInfoData.system_environment.toLowerCase().includes("wsl")
        ? "WSL"
        : nodeInfoData.system_environment
          ? "Linux"
          : null
      : nodeSpecs.value.systemEnvironment
        ? nodeSpecs.value.systemEnvironment.toLowerCase().includes("wsl")
          ? "WSL"
          : "Linux"
        : null,
  };
});

/*********************
 * Node Benchmarking *
 *********************/
const { data: allBenchmarkData, execute: getNodeBenchmarks } = useAPI(
  `/api/benchmarks/generic-benchmark-data?node=${props.address}&benchVersion=v1.0.3`,
  {
    immediate: false,
    // @ts-ignore
    disableToastOnError: true,
    // Handle API errors silently
    onRequestError: () => ({ data: [] }),
    onResponseError: () => ({ data: [] }),
    // @ts-ignore
    options: {
      retry: 0,
    },
  }
);

const { processedBenchmarkResponse: genericBenchmarkResponse } =
  useGenericBenchmark(allBenchmarkData);

// Safely call node info + benchmark if it's actually (or likely) a node
function fetchAdditionalNodeData() {
  // Use try-catch for both API calls
  try {
    getNodeBenchmarks();
    getNodeInfo();
  } catch (err) {
    // Silent error handling - expected for offline nodes
    console.log("Could not fetch node data. Possibly offline host.");
  }
}

// If isNode is truthy, try fetching everything
if (isNode.value) {
  fetchAdditionalNodeData();
}

// Also watch if it changes, e.g. after specs load
watch(isNode, (val) => {
  if (val) {
    fetchAdditionalNodeData();
  }
});

// When specs are loaded, retrieve node ranking
let rankingAPInstance: any = null;
watch(
  nodeSpecs,
  (specs) => {
    if (specs?.marketAddress) {
      if (!rankingAPInstance) {
        // Create new instance with data and execute it
        rankingAPInstance = useAPI(
          `/api/benchmarks/node-report?node=${props.address}`,
          {
            // @ts-ignore
            disableToastOnError: true,
          }
        );
      }
    }
  },
  { immediate: true }
);

interface NodeRanking {
  node: string;
  participationRate: number;
  uptimePercentage: number;
}

const nodeRanking: ComputedRef<NodeRanking | null> = computed(() => {
  if (rankingAPInstance?.data?.value) {
    if (rankingAPInstance.data.value.node === props.address) {
      return rankingAPInstance.data.value;
    }
  }
  return null;
});

const totalJobs = computed(() => {
  return jobs.value?.totalJobs ?? undefined;
});

// Create a ref to store the market relation result.
const marketRelationId = ref<string | null>(null);

// Define a function to fetch the market relation
async function fetchMarketRelation() {
  if (
    nodeSpecs.value?.status === "ONBOARDED" &&
    nodeSpecs.value.marketAddress
  ) {
    try {
      const { data } = await useAPI(
        `/api/nodes/market-relation?market=${nodeSpecs.value.marketAddress}`,
        {
          // @ts-ignore
          disableToastOnError: true,
        }
      );
      if (data && data.value) {
        marketRelationId.value = data.value;
      } else {
        marketRelationId.value = null;
      }
    } catch (err) {
      // Silent error handling
      marketRelationId.value = null;
    }
  }
}

watch(
  nodeSpecs,
  (newSpecs) => {
    if (newSpecs && newSpecs.status === "ONBOARDED" && newSpecs.marketAddress) {
      fetchMarketRelation();
    }
  },
  { immediate: true }
);

const benchmarkMarketId = computed(() => {
  if (!nodeSpecs.value || !nodeSpecs.value.marketAddress) {
    return undefined;
  }
  if (nodeSpecs.value.status === "ONBOARDED") {
    if (!marketRelationId.value) {
      return undefined;
    }
    return marketRelationId.value;
  }
  return nodeSpecs.value.marketAddress;
});
</script>
