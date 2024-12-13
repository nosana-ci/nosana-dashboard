<template>
    <div class="box">
      <div v-if="loading">Loading..</div>
      <div v-else>
        <div v-if="address">
          <h2 class="title is-4 mb-4">Node Information</h2>
  
          <table class="table is-fullwidth is-striped mt-5 mb-6">
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
                  <span v-if="balance">{{ balance.uiAmount.toFixed(2) }} NOS</span>
                  <span v-else>-</span>
                </td>
              </tr>
              <tr>
                <td>NOS Staked</td>
                <td>
                  <span v-if="nosStaked && nosStaked.amount">{{ (nosStaked.amount/1e6).toFixed(2) }} NOS</span>
                  <span v-else>-</span>
                </td>
              </tr>
              <tr>
                <td>SOL Balance</td>
                <td>
                  <span v-if="solBalance">{{ (solBalance / 1e9).toFixed(2) }}</span> SOL
                </td>
              </tr>
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
                <td>Location</td>
                <td v-if="!nodeSpecs">Unknown</td>
                <td v-else>{{ nodeSpecs.country }}</td>
              </tr>
              <tr>
                <td colspan="2" class="has-background-light">
                  <h4 class="title is-5 mb-0">Performance</h4>
                </td>
              </tr>
              <tr>
                <td>Download Speed</td>
                <td v-if="!nodeSpecs">Unknown</td>
                <td v-else>{{ nodeSpecs.downloadSpeed }} mbps</td>
              </tr>
              <tr>
                <td>Upload Speed</td>
                <td v-if="!nodeSpecs">Unknown</td>
                <td v-else>{{ nodeSpecs.uploadSpeed }} mbps</td>
              </tr>
              <template v-if="nodeStatus || (jobs && jobs.length)">
                <tr>
                  <td>Node Uptime</td>
                  <td v-if="!nodeInfo || !nodeInfo.uptime">Offline</td>
                  <td v-else>{{ (nodeInfo.uptime / (3600 * 1000)).toFixed(1) }} hours</td>
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
              <tr>
                <td colspan="2">
                  <div class="columns">
                    <div class="column is-6">
                      <BenchmarkHistogram 
                        :benchmark-data="llmBenchmarkData"
                        :market-benchmark-data="llmMarketBenchmarkData"
                        :default-model="defaultLLMModel"
                        :default-framework="defaultLLMFramework"
                        title="LLM Performance"
                        x-axis-label="Concurrent Users"
                        y-axis-label="Tokens/sec"
                      />
                    </div>
                    <div class="column is-6">
                      <BenchmarkHistogram 
                        :benchmark-data="imageGenBenchmarkData"
                        :market-benchmark-data="imageGenMarketBenchmarkData"
                        :default-model="defaultImageGenModel"
                        :default-framework="defaultImageGenFramework"
                        title="Image Generation Performance"
                        x-axis-label="Batch Size"
                        y-axis-label="Images/sec"
                      />
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
              :jobs="jobs ? jobs.jobs : null">
            </ExplorerJobList>
          </div>
        </div>
        <div v-else>Address not found</div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { PublicKey } from '@solana/web3.js';
  import BenchmarkHistogram from '~/components/Node/BenchmarkHistogram.vue';
  import { useBenchmarkData } from '~/composables/useBenchmarkData';
  
  const { params } = useRoute();
  
  interface BenchmarkConfig {
    endpoint: string;
    formatData: (data: any) => {
      framework: string;
      model: string;
      xValue: number;
      yValue: number;
    };
  }
  
  const nodeSpecsUrl = computed(() => `/api/nodes/${params.id}/specs`);
  const { data: nodeSpecs } = useAPI(nodeSpecsUrl, { 
    watch: [nodeSpecsUrl],
    default: () => null
  });
  
  interface BenchmarkData {
    framework: string;
    model: string;
    cuCount: string;
    metrics: {
      averageTokensPerSecond: number;
    };
  }
  
  interface ImageGenBenchmarkData {
    framework: string;
    model: string;
    batchSize: string; 
    metrics: {
      imagesPerSecond: number; 
    };
  }
  
  const { data: testgridMarkets, pending: loadingTestgridMarkets } = useAPI('/api/markets', { default: () => [] });
  const { data: nodeInfo, pending: loadingNode } = useFetch(`https://${String(params.id)}.node.k8s.prd.nos.ci/node/info`);
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
    0: 'QUEUED',
    1: 'RUNNING',
    2: 'COMPLETED',
    3: 'STOPPED',
  };
  const limit: Ref<number> = ref(10);
  const jobsUrl = computed(() => { return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ''}${`&node=${params.id}`}` })
  const { data: jobs, pending: loadingJobs, refresh: refreshJobs } = useAPI(jobsUrl, { watch: [jobsUrl] });
  
  const llmConfig: BenchmarkConfig = {
    endpoint: '/api/benchmarks/llm-benchmark-data',
    formatData: (benchmark: BenchmarkData) => ({
      framework: benchmark.framework,
      model: benchmark.model,
      xValue: parseInt(benchmark.cuCount),
      yValue: benchmark.metrics.averageTokensPerSecond
    })
  };
  
  const imageGenConfig: BenchmarkConfig = {
    endpoint: '/api/benchmarks/image-gen-benchmark-data',
    formatData: (benchmark: ImageGenBenchmarkData) => ({
      framework: benchmark.framework,
      model: benchmark.model,
      xValue: parseInt(benchmark.batchSize),
      yValue: benchmark.metrics.imagesPerSecond
    })
  };
  
  const { 
    formattedBenchmarkData: llmBenchmarkData,
    formattedMarketBenchmarkData: llmMarketBenchmarkData,
    defaultModel: defaultLLMModel,
    defaultFramework: defaultLLMFramework
  } = useBenchmarkData(llmConfig, nodeSpecs);
  
  const { 
    formattedBenchmarkData: imageGenBenchmarkData,
    formattedMarketBenchmarkData: imageGenMarketBenchmarkData,
    defaultModel: defaultImageGenModel,
    defaultFramework: defaultImageGenFramework
  } = useBenchmarkData(imageGenConfig, nodeSpecs);
  
  const getAddress = async () => {
    loading.value = true;
    try {
      const pk = new PublicKey(String(params.id));
      address.value = pk.toString();
  
      try {
        balance.value = await nosana.value.solana.getNosBalance(address.value);
        solBalance.value = await nosana.value.solana.getSolBalance(address.value);
        try {
          nosStaked.value = await nosana.value.stake.get(address.value);
        } catch (error) {
          console.error('cant fetch stake', error)
        }
      } catch (e) {
        console.error('cant get balance', e);
      }
    } catch (error) {
      console.error('not a valid address', error);
      address.value = null;
    }
  
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
  