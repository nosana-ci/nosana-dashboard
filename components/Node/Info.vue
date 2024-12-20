<template>
  <div class="box">
    <div v-if="loading">Loading..</div>
    <div v-else>
      <div v-if="address">
        <h2 class="title is-4 mb-4">Node Information</h2>

        <table class="table is-fullwidth mt-5 mb-6">
          <tbody>
            <!-- General Section -->
            <tr>
              <td colspan="2" class="has-background-light">
                <h4 class="title is-5 mb-0">General</h4>
              </td>
            </tr>
            <tr>
              <td>Node</td>
              <td>
                {{ address }}
              </td>
            </tr>
            <tr>
              <td>NOS Balance</td>
              <td>
                <!-- <span v-if="balance"
                  >{{ balance.uiAmount.toFixed(2) }} NOS</span
                > -->
                <span v-if="balance">100 NOS</span>
                <span v-else>-</span>
              </td>
            </tr>
            <tr>
              <td>NOS Staked</td>
              <td>
                <!-- <span v-if="nosStaked && nosStaked.amount"
                  >{{ (nosStaked.amount / 1e6).toFixed(2) }} NOS</span
                > -->
                <span v-if="nosStaked && nosStaked.amount">1000 NOS</span>
                <span v-else>-</span>
              </td>
            </tr>
            <tr>
              <td>SOL Balance</td>
              <td>
                <span v-if="solBalance">{{
                  (solBalance / 1e9).toFixed(2)
                }}</span>
                SOL
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
                <div
                  v-if="nodeStatus === 'QUEUED'"
                  data-tooltip="Node is queued in market"
                  style="width: fit-content"
                  class="is-flex"
                >
                  <ExplorerJobStatus
                    :status="'QUEUED'"
                    image-only
                  ></ExplorerJobStatus>
                </div>
                <div
                  v-else-if="nodeStatus === 'RUNNING'"
                  data-tooltip="Node is running a job"
                  style="width: fit-content"
                  class="is-flex"
                >
                  <ExplorerJobStatus
                    image-only
                    :status="'RUNNING'"
                  ></ExplorerJobStatus>
                </div>
                <span v-else>-</span>
              </td>
            </tr>
            <tr
              v-if="
                nodeStatus === 'QUEUED' && nodeMarket && nodeMarket.length > 0
              "
            >
              <td>Market</td>
              <td>
                <nuxt-link
                  :to="`/markets/${nodeMarket[0].address.toString()}`"
                  class="address is-family-monospace"
                  >{{ nodeMarket[0].address.toString() }}</nuxt-link
                >
              </td>
            </tr>
            <tr
              v-if="nodeStatus === 'RUNNING' && nodeRuns && nodeRuns.length > 0"
            >
              <td>Running job</td>
              <td>
                <nuxt-link
                  :to="`/jobs/${nodeRuns[0].account.job}`"
                  class="address is-family-monospace"
                  >{{ nodeRuns[0].account.job }}</nuxt-link
                >
              </td>
            </tr>
            <!-- <template v-if="nodeStatus || (jobs && jobs.length)">
              <tr>
                <td>Node Uptime</td>
                <td v-if="!nodeInfo || !nodeInfo.uptime">Offline</td>
                <td v-else>
                  {{ (nodeInfo.uptime / (3600 * 1000)).toFixed(1) }} hours
                </td>
              </tr>
            </template> -->
            <tr>
              <td colspan="2" class="has-background-light">
                <h4 class="title is-5 mb-0">Specifications</h4>
              </td>
            </tr>
            <tr>
              <td>GPU</td>
              <td v-if="!nodeSpecs">Unknown</td>
              <td v-else>{{ nodeSpecs.gpus[0]?.gpu }}</td>
            </tr>
            <tr>
              <td>CPU</td>
              <td v-if="!nodeSpecs">Unknown</td>
              <td v-else>{{ nodeSpecs.cpu }}</td>
            </tr>
            <tr>
              <td>RAM</td>
              <td v-if="!nodeSpecs">Unknown</td>
              <td v-else>{{ nodeSpecs.ram }} GB</td>
            </tr>
            <tr>
              <td>Disk Space</td>
              <td v-if="!nodeSpecs">Unknown</td>
              <td v-else>{{ nodeSpecs.diskSpace }} GB</td>
            </tr>
            <tr>
              <td>Country</td>
              <td v-if="!nodeSpecs">Unknown</td>
              <td v-else>{{ nodeSpecs.country }}</td>
            </tr>
            <tr>
              <td colspan="2" class="has-background-light">
                <h4 class="title is-5 mb-0">Performance</h4>
              </td>
            </tr>
            <tr>
              <td>
                <div style="display: flex" class="tooltip">
                  <p>Performance Rank</p>
                  <span
                    style="
                      width: 20px;
                      height: 20px;
                      background-image: url(&quot;https://www.systemuicons.com/images/icons/info_circle.svg&quot;);
                    "
                  >
                  </span>
                  <div class="tooltip-text">
                    <p>Example text</p>
                  </div>
                </div>
              </td>
              <td v-if="!nodeRanking">3</td>
              <td v-else>{{ nodeRanking.performanceRank }}</td>
            </tr>
            <tr>
              <td>
                <div style="display: flex" class="tooltip">
                  <p>Stability Rank</p>
                  <span
                    style="
                      width: 20px;
                      height: 20px;
                      background-image: url(&quot;https://www.systemuicons.com/images/icons/info_circle.svg&quot;);
                    "
                  >
                  </span>
                  <div class="tooltip-text">
                    <p>Example text</p>
                  </div>
                </div>
              </td>
              <td v-if="!nodeRanking">8</td>
              <td v-else>{{ nodeRanking.performanceRank }}</td>
            </tr>
            <tr>
              <td>Average Download Speed</td>
              <td
                v-if="
                  !genericBenchmarkResponse ||
                  !genericBenchmarkResponse.data.length
                "
              >
                Unknown
              </td>
              <td v-else>
                {{
                  genericBenchmarkResponse.data[0]?.metrics
                    .internetSpeedDownload
                }}
                mbps
              </td>
            </tr>
            <tr>
              <td>Average Upload Speed</td>
              <td
                v-if="
                  !genericBenchmarkResponse ||
                  !genericBenchmarkResponse.data.length
                "
              >
                Unknown
              </td>
              <td v-else>
                {{
                  genericBenchmarkResponse.data[0]?.metrics.internetSpeedUpload
                }}
                mbps
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
            <tr>
              <td colspan="2">
                <div class="charts-container">
                  <!-- LLM Chart Section -->
                  <div class="chart-section">
                    <div class="box">
                      <h3 class="title is-5 mb-4">LLM Performance</h3>
                      <div class="filters mb-4">
                        <div class="field">
                          <label class="label">Model</label>
                          <div class="control">
                            <div class="select is-fullwidth">
                              <select v-model="selectedModel">
                                <option
                                  v-for="model in llmFilters?.models"
                                  :key="model"
                                  :value="model"
                                >
                                  {{ model }}
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div class="field">
                          <label class="label">Framework</label>
                          <div class="control">
                            <div class="select is-fullwidth">
                              <select v-model="selectedFramework">
                                <option
                                  v-for="framework in llmFilters?.frameworks"
                                  :key="framework"
                                  :value="framework"
                                >
                                  {{ framework }}
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="chart-wrapper">
                        <div v-if="!llmBenchmarkData?.data">
                          Loading benchmark data...
                        </div>
                        <Bar
                          v-else
                          :data="chartData"
                          :options="chartOptions"
                          :height="300"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Image Gen Chart Section -->
                  <div class="chart-section">
                    <div class="box">
                      <h3 class="title is-5 mb-4">
                        Image Generation Performance
                      </h3>
                      <div class="filters mb-4">
                        <div class="field">
                          <label class="label">Model</label>
                          <div class="control">
                            <div class="select is-fullwidth">
                              <select v-model="selectedImageGenModel">
                                <option
                                  v-for="model in imageGenFilters?.models"
                                  :key="model"
                                  :value="model"
                                >
                                  {{ model }}
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div class="field">
                          <label class="label">Framework</label>
                          <div class="control">
                            <div class="select is-fullwidth">
                              <select v-model="selectedImageGenFramework">
                                <option
                                  v-for="framework in imageGenFilters?.frameworks"
                                  :key="framework"
                                  :value="framework"
                                >
                                  {{ framework }}
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="chart-wrapper">
                        <div v-if="!imageGenBenchmarkData?.data">
                          Loading benchmark data...
                        </div>
                        <Bar
                          v-else
                          :data="imageGenChartData"
                          :options="imageGenChartOptions"
                          :height="300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="jobs && jobs.jobs">
          <ExplorerJobList
            :per-page="limit"
            :total-jobs="jobs ? jobs.totalJobs : null"
            v-model:page="page"
            v-model:state="state"
            :loading-jobs="loadingJobs"
            :jobs="jobs ? jobs.jobs : null"
          >
          </ExplorerJobList>
        </div>
      </div>
      <div v-else>Address not found</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PublicKey } from "@solana/web3.js";
import { ref, computed, onMounted, watch, onActivated } from "vue";
import { Chart, registerables } from "chart.js";
import { Bar } from "vue-chartjs";

Chart.register(...registerables);

const route = useRoute();

const { params } = useRoute();

const nodeSpecsUrl = computed(() => `/api/nodes/${params.id}/specs`);
const { data: nodeSpecs } = useAPI(nodeSpecsUrl, {
  watch: [nodeSpecsUrl],
  default: () => null,
});

interface NodeRanking {
  node: string;
  performanceRank: number;
  stabilityRank: number;
  participationRate: number;
}

const { data: testgridMarkets, pending: loadingTestgridMarkets } = useAPI(
  "/api/markets",
  { default: () => [] }
);
const { data: nodeInfo, pending: loadingNode } = useFetch(
  `https://${String(params.id)}.node.k8s.dev.nos.ci/node/info`
);
const { nosana } = useSDK();
const { markets, getMarkets, loadingMarkets } = useMarkets();

if (!markets.value) {
  getMarkets();
}
const address: Ref<string | null> = ref(null);
const balance: Ref<any | null> = ref(null);
const solBalance: Ref<any | null> = ref(null);
const nosStaked: Ref<any | null> = ref(null);
const nodeStatus: Ref<any | null> = ref(null);
const nodeMarket: Ref<any> = ref(null);
const nodeRuns: Ref<any> = ref(null);
const loading: Ref<boolean> = ref(false);
const page: Ref<number> = ref(1);
const state: Ref<number | null> = ref(null);
const jobStateMapping: any = {
  0: "QUEUED",
  1: "RUNNING",
  2: "COMPLETED",
  3: "STOPPED",
};
const limit: Ref<number> = ref(10);
const jobsUrl = computed(() => {
  return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ""}${`&node=6ShbR37z2PCDxo2xcUfqg96adcAJApuiJi3ZhoPaSe81`}`;
});
const {
  data: jobs,
  pending: loadingJobs,
  refresh: refreshJobs,
} = useAPI(jobsUrl, { watch: [jobsUrl] });

const genericBenchmarkUrl = computed(
  () =>
    `/api/benchmarks/generic-benchmark-data?node=6ShbR37z2PCDxo2xcUfqg96adcAJApuiJi3ZhoPaSe81`
);
const { data: genericBenchmarkResponse } = useAPI(genericBenchmarkUrl, {
  watch: [genericBenchmarkUrl],
  default: () => ({ data: [] }),
});

const nodeRanking: Ref<NodeRanking | null> = ref(null);

const getAddress = async () => {
  loading.value = false;
  try {
    const pk = new PublicKey(String(params.id));
    address.value = pk.toString();
    try {
      balance.value = await nosana.value.solana.getNosBalance(address.value);
      solBalance.value = await nosana.value.solana.getSolBalance(address.value);
      try {
        nosStaked.value = await nosana.value.stake.get(address.value);
      } catch (error) {
        console.error("cant fetch stake", error);
      }
    } catch (e) {
      console.error("cant get balance", e);
    }
  } catch (error) {
    console.error("not a valid address", error);
    address.value = null;
  }

  const nodesInMarkets = markets?.value?.flatMap((market) => {
    return market.queueType === 1
      ? market.queue.map((data: any) => data.toString())
      : [];
  });

  if (nodesInMarkets?.includes(address.value)) {
    nodeStatus.value = "QUEUED";
    nodeMarket.value = markets?.value?.filter((m) =>
      m.queue.find((a: any) => a.toString() === address.value?.toString())
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

  if (nodeRuns.value && nodeRuns.value.length) {
    nodeStatus.value = "RUNNING";
  }

  if (nodeSpecs?.value?.marketAddress) {
    const { data } = await useAPI(
      `/api/benchmarks/node-ranking?market=${nodeSpecs?.value?.marketAddress}`
    );
    nodeRanking.value =
      data.value.find((ranking: NodeRanking) => {
        return ranking.node === address.value;
      }) || null;
  }

  loading.value = false;
};

watch(loadingTestgridMarkets, (newLoading) => {
  if (!newLoading) {
    getAddress();
  }
});
watch(loadingMarkets, (newLoading) => {
  if (!newLoading) {
    getAddress();
  }
});

// useIntervalFn(getMarkets, 30000);

// Add these refs and computed properties before the existing ones
const selectedFramework: Ref<string | null> = ref(null);
const selectedModel: Ref<string | null> = ref(null);

const llmFiltersUrl = computed(() => "/api/benchmarks/llm-filters");
const { data: llmFilters } = useAPI(llmFiltersUrl, {
  watch: [llmFiltersUrl],
  default: () => ({ frameworks: [], models: [] }),
});

const llmBenchmarkUrl = computed(() => {
  return `/api/benchmarks/llm-benchmark-data?node=C49tmP2PeNLmP2sKe6WiXWMTVbeb9KbqaA1azCwBjfyK&framework=${selectedFramework.value}&model=${selectedModel.value}`;
});

// Update the API call with explicit typing
const { data: llmBenchmarkData } = useAPI(llmBenchmarkUrl, {
  watch: [llmBenchmarkUrl],
  default: () => ({ data: [], total: 0 }),
  immediate: false,
  server: false,
  transform: (response) => response || { data: [], total: 0 },
});

// Add new API call for market data
const marketBenchmarkUrl = computed(() => {
  return `/api/benchmarks/llm-benchmark-data?level=market&market=Crop49jpc7prcgAcS82WbWyGHwbN5GgDym3uFbxxCTZg&framework=${selectedFramework.value}&model=${selectedModel.value}`;
});

const { data: marketBenchmarkData } = useAPI(marketBenchmarkUrl, {
  watch: [marketBenchmarkUrl],
  default: () => ({ data: [], total: 0 }),
  immediate: false,
  server: false,
  transform: (response) => response || { data: [], total: 0 },
});

// Add these refs before the existing ones
const selectedImageGenFramework: Ref<string | null> = ref(null);
const selectedImageGenModel: Ref<string | null> = ref(null);

const imageGenFiltersUrl = computed(() => "/api/benchmarks/image-gen-filters");
const { data: imageGenFilters } = useAPI(imageGenFiltersUrl, {
  watch: [imageGenFiltersUrl],
  default: () => ({ frameworks: [], models: [] }),
});

const imageGenBenchmarkUrl = computed(() => {
  return `/api/benchmarks/image-gen-benchmark-data?node=C49tmP2PeNLmP2sKe6WiXWMTVbeb9KbqaA1azCwBjfyK&framework=${selectedImageGenFramework.value}&model=${selectedImageGenModel.value}`;
});

const { data: imageGenBenchmarkData } = useAPI(imageGenBenchmarkUrl, {
  watch: [imageGenBenchmarkUrl],
  default: () => ({ data: [], total: 0 }),
  immediate: false,
  server: false,
  transform: (response) => response || { data: [], total: 0 },
});

// Add new API call for market image gen data
const marketImageGenBenchmarkUrl = computed(() => {
  return `/api/benchmarks/image-gen-benchmark-data?level=market&market=Crop49jpc7prcgAcS82WbWyGHwbN5GgDym3uFbxxCTZg&framework=${selectedImageGenFramework.value}&model=${selectedImageGenModel.value}`;
});

const { data: marketImageGenBenchmarkData } = useAPI(
  marketImageGenBenchmarkUrl,
  {
    watch: [marketImageGenBenchmarkUrl],
    default: () => ({ data: [], total: 0 }),
    immediate: false,
    server: false,
    transform: (response) => response || { data: [], total: 0 },
  }
);

// Add to the existing onMounted and onActivated hooks
onMounted(() => {
  if (llmFilters.value) {
    selectedModel.value = llmFilters.value.models[0];
    selectedFramework.value = llmFilters.value.frameworks[0];
  }
  if (imageGenFilters.value) {
    selectedImageGenModel.value = imageGenFilters.value.models[0];
    selectedImageGenFramework.value = imageGenFilters.value.frameworks[0];
  }
});

// Add new computed for image gen chart data
const imageGenChartData = computed(() => {
  // Log raw data
  console.log("Raw Image Gen Data:", imageGenBenchmarkData.value);
  console.log("Raw Market Image Gen Data:", marketImageGenBenchmarkData.value);

  if (!imageGenBenchmarkData.value?.data) {
    console.log("No node image gen benchmark data available");
    return {
      labels: [],
      datasets: [],
    };
  }

  // Sort both datasets by batchSize
  const sortedNodeData = [...imageGenBenchmarkData.value.data].sort(
    (a, b) => a.batchSize - b.batchSize
  );
  const sortedMarketData = marketImageGenBenchmarkData.value?.data
    ? [...marketImageGenBenchmarkData.value.data].sort(
        (a, b) => a.batchSize - b.batchSize
      )
    : [];

  // Get all unique batchSizes from both datasets
  const allBatchSizes = [
    ...new Set([
      ...sortedNodeData.map((item) => item.batchSize),
      ...sortedMarketData.map((item) => item.batchSize),
    ]),
  ].sort((a, b) => a - b);

  const result = {
    labels: allBatchSizes.map((size) => size.toString()),
    datasets: [
      {
        label: "Node Performance",
        data: allBatchSizes.map((batchSize) => {
          const dataPoint = sortedNodeData.find(
            (item) => item.batchSize === batchSize
          );
          const value = dataPoint
            ? parseFloat(dataPoint.metrics.imagesPerSecond)
            : null;

          return value;
        }),
        backgroundColor: "#0066ff",
        borderWidth: 1,
      },
    ],
  };

  // Only add market data if available
  if (sortedMarketData.length > 0) {
    result.datasets.push({
      label: "Market Average",
      data: allBatchSizes.map((batchSize) => {
        const dataPoint = sortedMarketData.find(
          (item) => item.batchSize === batchSize
        );
        return dataPoint ? parseFloat(dataPoint.metrics.imagesPerSecond) : null;
      }),
      backgroundColor: "#10E80C",
      borderWidth: 1,
    });
  }

  // Log final chart data
  console.log("Final Chart Data:", result);
  return result;
});

const imageGenChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: {
        display: true,
        text: "Batch Size",
      },
    },
    y: {
      title: {
        display: true,
        text: "Images / Second",
      },
      beginAtZero: true,
    },
  },
}));

const chartData = computed(() => {
  if (!llmBenchmarkData.value?.data) {
    console.log("No node benchmark data available");
    return {
      labels: [],
      datasets: [],
    };
  }

  // Sort both datasets by cuCount
  const sortedNodeData = [...llmBenchmarkData.value.data].sort(
    (a, b) => a.cuCount - b.cuCount
  );
  const sortedMarketData = marketBenchmarkData.value?.data
    ? [...marketBenchmarkData.value.data].sort((a, b) => a.cuCount - b.cuCount)
    : [];

  // Get all unique cuCounts from both datasets
  const allCuCounts = [
    ...new Set([
      ...sortedNodeData.map((item) => item.cuCount),
      ...sortedMarketData.map((item) => item.cuCount),
    ]),
  ].sort((a, b) => a - b);

  const result = {
    labels: allCuCounts.map((count) => count.toString()),
    datasets: [
      {
        label: "Node Performance",
        data: allCuCounts.map((cuCount) => {
          const dataPoint = sortedNodeData.find(
            (item) => item.cuCount === cuCount
          );
          return dataPoint ? dataPoint.metrics.averageTokensPerSecond : null;
        }),
        backgroundColor: "#0066ff",
        borderWidth: 1,
      },
    ],
  };

  console.log("Node Data:", sortedNodeData);
  console.log("Market Data:", sortedMarketData);

  // Only add market data if available
  if (sortedMarketData.length > 0) {
    result.datasets.push({
      label: "Market Average",
      data: allCuCounts.map((cuCount) => {
        const dataPoint = sortedMarketData.find(
          (item) => item.cuCount === cuCount
        );
        return dataPoint ? dataPoint.metrics.averageTokensPerSecond : null;
      }),
      backgroundColor: "#10E80C",
      borderWidth: 1,
    });
  }

  return result;
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: {
        display: true,
        text: "Concurrent Users",
      },
    },
    y: {
      title: {
        display: true,
        text: "Tokens / Second",
      },
      beginAtZero: true,
    },
  },
}));

// Update the watchers to handle both LLM and Image Gen filters
watch(
  [llmFilters, imageGenFilters],
  ([newLLMFilters, newImageGenFilters]) => {
    // Handle LLM filters
    if (
      newLLMFilters &&
      newLLMFilters.frameworks.length &&
      newLLMFilters.models.length
    ) {
      if (!selectedFramework.value) {
        selectedFramework.value = newLLMFilters.frameworks[0];
      }
      if (!selectedModel.value) {
        selectedModel.value = newLLMFilters.models[0];
      }
    }

    // Handle Image Gen filters
    if (
      newImageGenFilters &&
      newImageGenFilters.frameworks.length &&
      newImageGenFilters.models.length
    ) {
      if (!selectedImageGenFramework.value) {
        selectedImageGenFramework.value = newImageGenFilters.frameworks[0];
      }
      if (!selectedImageGenModel.value) {
        selectedImageGenModel.value = newImageGenFilters.models[0];
      }
    }
  },
  { immediate: true }
);

// Update the route watcher to handle both sets of filters
watch(
  () => route.path,
  () => {
    if (llmFilters.value) {
      selectedFramework.value = llmFilters.value.frameworks[0];
      selectedModel.value = llmFilters.value.models[0];
    }
    if (imageGenFilters.value) {
      selectedImageGenFramework.value = imageGenFilters.value.frameworks[0];
      selectedImageGenModel.value = imageGenFilters.value.models[0];
    }
  }
);
</script>
<style lang="scss" scoped>
.label {
  display: inline-block;
  font-size: 0.9rem;
  font-weight: 600;
}

.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
  margin: 20px 0;
}

.filters {
  display: flex;
  gap: 1rem;
}

.field {
  flex: 1;
}

.chart-wrapper {
  height: 400px;
  position: relative;
}

.charts-container {
  display: flex;
  gap: 2rem;
  margin: 1rem 0;
}

.chart-section {
  flex: 1;
  min-width: 0; // This prevents flex items from overflowing
}

.filters {
  display: flex;
  gap: 1rem;
}

.field {
  flex: 1;
}

.chart-wrapper {
  height: 400px;
  position: relative;
}
</style>
