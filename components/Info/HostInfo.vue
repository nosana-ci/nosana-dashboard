<template>
  <template v-if="!isNode">
    <div class="column is-full" v-if="loadingJobs || loadingSpecs || loadingMarkets || loadingRuns">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Status</span>
        <span class="quick-detail-value">Checking if account is host..</span>
      </div>
    </div>
    <div class="column is-full" v-else>
      <div class="quick-detail-item">
        <span class="quick-detail-label">Host Status</span>
        <span class="quick-detail-value">Not a node</span>
      </div>
    </div>
  </template>
  <template v-else>
      <!-- Deployments ran -->
      <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Deployments ran</span>
          <span class="quick-detail-value">
            <span v-if="loadingJobs">...</span>
            <span v-else-if="jobs">{{ jobs.totalJobs }}</span>
            <span v-else class="has-text-danger">Could not retrieve deployments</span>
          </span>
        </div>
      </div>

      <!-- Status -->
      <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Status</span>
          <span class="quick-detail-value">
            <span v-if="!queueInfo">
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
            </span>
            <div v-else style="width: fit-content" class="is-flex">
              <div
                data-tooltip="Host is queued in market"
                style="width: fit-content"
                class="is-flex"
              >
                <JobStatus :status="'QUEUED'"></JobStatus>
              </div>
            </div>
          </span>
        </div>
      </div>

      <!-- Availability -->
      <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">
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
          </span>
          <span class="quick-detail-value">
            <span v-if="loadingRanking || !nodeSpecs?.marketAddress">...</span>
            <span v-else-if="!nodeRanking || typeof nodeRanking.uptimePercentage === 'undefined'">
              <span
                class="has-tooltip-arrow"
                data-tooltip="This host hasn't been online long enough to calculate availibily"
              >
                unknown
              </span>
            </span>
            <span v-else>{{ nodeRanking.uptimePercentage.toFixed(1) }}%</span>
          </span>
        </div>
      </div>

      <!-- Running deployment -->
      <div v-if="nodeRuns && nodeRuns.length > 0" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Running deployment</span>
          <span class="quick-detail-value">
            <nuxt-link
              :to="`/jobs/${nodeRuns[0].account.job}`"
              class="address is-family-monospace"
            >{{ nodeRuns[0].account.job }}</nuxt-link>
          </span>
        </div>
      </div>

      <!-- Host pool -->
      <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Host pool</span>
          <span class="quick-detail-value">
            <span v-if="queueInfo">
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
            <span v-else>
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
            </span>
          </span>
        </div>
      </div>

      <!-- CLI Version -->
      <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">CLI Version</span>
          <span class="quick-detail-value">
            <span v-if="combinedSpecs && combinedSpecs.nodeVersion">
              v{{ combinedSpecs.nodeVersion }}
            </span>
            <span v-else-if="loadingInfo || loadingSpecs">...</span>
            <span v-else>Offline</span>
          </span>
        </div>
      </div>

      <!-- Host API Status -->
      <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Host API Status</span>
          <span class="quick-detail-value">
            <span v-if="nodeInfo">Online</span>
            <span v-else-if="loadingInfo">...</span>
            <span v-else>Offline</span>
          </span>
        </div>
      </div>

      <!-- Total Jobs -->
      <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Total Jobs</span>
          <span class="quick-detail-value">
            <span v-if="loadingJobs">...</span>
            <span v-else-if="jobs">{{ jobs.totalJobs }}</span>
            <span v-else>-</span>
          </span>
        </div>
      </div>

      <!-- Node Address -->
      <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Node Address</span>
          <span class="quick-detail-value">
            <span class="address is-family-monospace">{{ props.address }}</span>
          </span>
        </div>
      </div>

      <!-- Performance Score -->
      <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Performance Score</span>
          <span class="quick-detail-value">
            <span v-if="nodeRanking && nodeRanking.participationRate">{{ nodeRanking.participationRate.toFixed(1) }}%</span>
            <span v-else>-</span>
          </span>
        </div>
      </div>

      <!-- Host Specifications -->
      <HostSpecifications
        v-if="combinedSpecs"
        :specs="combinedSpecs"
        :node-ranking="nodeRanking"
      />
    </template>
</template>

<script lang="ts" setup>
import { type Market } from "@nosana/sdk";
import JobStatus from "~/components/Job/Status.vue";
import HostSpecifications from "~/components/Info/HostSpecifications.vue";
const { nosana } = useSDK();
const { data: testgridMarkets, pending: loadingTestgridMarkets } =
  useAPI("/api/markets");

const props = defineProps<{
  address: string;
  nodeSpecs?: any; 
  nodeInfo?: any;  
  nodeRanking?: any; 
  loadingNodeSpecs?: boolean;
  loadingNodeInfo?: boolean;
  loadingNodeRanking?: boolean;
}>();

const getMarketNameFromList = (marketAddress: string): string => {
  if (testgridMarkets.value && Array.isArray(testgridMarkets.value)) {
    const market = testgridMarkets.value.find((tgm: any) => tgm.address === marketAddress);
    return market?.name || marketAddress;
  }
  return marketAddress;
};

const { markets, getMarkets, loadingMarkets } = useMarkets();
if (!markets.value) {
  getMarkets();
}
const queueInfo: ComputedRef<{ market: Market; position: number } | undefined> = computed(() => {
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
        return null;
      }
    }
    return null;
  }
);

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
  return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ""}${"&node=" + props.address}`;
});

const { data: jobs, pending: loadingJobs } = useAPI(jobsUrl, { watch: [jobsUrl] });

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
  return (
    (nodeRuns.value && nodeRuns.value.length) ||
    hasRanJobs.value ||
    (props.nodeSpecs && props.nodeSpecs.marketAddress) ||
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
    download: nodeSpecs.value.avgDownload10,
    upload: nodeSpecs.value.avgUpload10,
    ping: nodeSpecs.value.avgPing10,
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

// Safely call node info + benchmark if it's actually (or likely) a node
function fetchAdditionalNodeData() {
  // Use try-catch for both API calls
  try {
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
const { data: rankingData, pending: loadingRanking } = useAPI(
  () => 
    nodeSpecs.value?.marketAddress 
      ? `/api/benchmarks/node-report?node=${props.address}` 
      : '',
  {
    // @ts-ignore
    disableToastOnError: true,
    watch: [() => props.address, nodeSpecs]
  }
);

interface NodeRanking {
  node: string;
  participationRate: number;
  uptimePercentage: number;
}

const nodeRanking: ComputedRef<NodeRanking | null> = computed(() => {
  if (rankingData?.value) {
    if (rankingData.value.node === props.address) {
      return {
        ...rankingData.value,
        participationRate: rankingData.value.antiSpoofSuccessRate || 0
      };
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

const cliVersion = computed(() => {
  if (!combinedSpecs.value && !nodeInfo.value?.info) return null;
  return nodeInfo.value?.info?.version ?? combinedSpecs.value?.nodeVersion;
});


</script>

<style lang="scss" scoped>
.address {
  word-break: break-all;
  white-space: normal;
  display: inline-block;
  line-height: 1.3;
}

.quick-detail-item {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .quick-detail-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #7a7a7a;
    text-transform: uppercase;
    margin-bottom: 0.1rem;
    display: inline-flex; 
    align-items: center;
  }

  .quick-detail-value {
    font-size: 0.85rem;
    font-weight: 500;
    color: #363636;
    word-break: break-word;

    .icon-text {
      color: #363636;
    }
    .address {
        font-size: 0.8rem; 
    }
    .tag {
        font-size: 0.75rem; 
        padding: 0.2em 0.5em;
        height: auto;
        line-height: 1.2;
        vertical-align: middle;
    }
  }
}

.no-padding {
  padding: 0 !important;
}

html.dark-mode {
  .quick-detail-item {
    .quick-detail-label {
      color: #b0b0b0;
    }

    .quick-detail-value,
    .quick-detail-value .icon-text,
    .quick-detail-value .address {
      color: #ffffff;
    }
    
    .quick-detail-value a,
    .quick-detail-value nuxt-link,
    .quick-detail-value .address {
      color: #10E80C !important; // Nosana green for links in dark mode
    }
    
    .quick-detail-value a:hover,
    .quick-detail-value nuxt-link:hover {
      color: #33ff33 !important; // Lighter green on hover
    }
  }
}
</style>
