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
            </template>
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
                  Performance Rank 
                  <span 
                    class="icon is-small tooltip is-tooltip-right" 
                    data-tooltip="Ranking based on the node's computational performance compared to other nodes in the market. Lower number means better performance.">
                    <i class="fas fa-info-circle"></i>
                  </span>
                </td>
                <td v-if="!nodeRanking">Unknown</td>
                <td v-else>{{ nodeRanking.performanceRank }}</td>
              </tr>
              <tr>
                <td>
                  Stability Rank
                  <span 
                    class="icon is-small tooltip is-tooltip-right" 
                    data-tooltip="Ranking based on the node's reliability and uptime. Lower number indicates better stability and consistent availability.">
                    <i class="fas fa-info-circle"></i>
                  </span>
                </td>
                <td v-if="!nodeRanking">Unknown</td>
                <td v-else>{{ nodeRanking.stabilityRank }}</td>
              </tr>
              <tr>
                <td>Average Download Speed</td>
                <td v-if="!genericBenchmarkResponse || !genericBenchmarkResponse.data.length">Unknown</td>
                <td v-else>{{ genericBenchmarkResponse.data[0]?.metrics.internetSpeedDownload }} mbps</td>
              </tr>
              <tr>
                <td>AverageUpload Speed</td>
                <td v-if="!genericBenchmarkResponse || !genericBenchmarkResponse.data.length">Unknown</td>
                <td v-else>{{ genericBenchmarkResponse.data[0]?.metrics.internetSpeedUpload }} mbps</td>
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
                  <div class="columns">
                    <div class="column is-6">
                      <NodeBenchmarkHistogram 
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
                      <NodeBenchmarkHistogram 
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
      stddevTokensPerSecond?: number;
    };
  }
  
  interface ImageGenBenchmarkData {
    framework: string;
    model: string;
    batchSize: string; 
    metrics: {
      imagesPerSecond: number; 
      stddevImagesPerSecond?: number;
    };
  }
  
  interface NodeRanking {
    node: string;
    performanceRank: number;
    stabilityRank: number;
    participationRate: number;
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
      yValue: benchmark.metrics.averageTokensPerSecond,
      stddevYValue: benchmark.metrics.stddevTokensPerSecond
    })
  };
  
  const imageGenConfig: BenchmarkConfig = {
    endpoint: '/api/benchmarks/image-gen-benchmark-data',
    formatData: (benchmark: ImageGenBenchmarkData) => ({
      framework: benchmark.framework,
      model: benchmark.model,
      xValue: parseInt(benchmark.batchSize),
      yValue: benchmark.metrics.imagesPerSecond,
      stddevYValue: benchmark.metrics.stddevImagesPerSecond
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
  
  
  const genericBenchmarkUrl = computed(() => `/api/benchmarks/generic-benchmark-data?node=${params.id}`);
  const { data: genericBenchmarkResponse } = useAPI(genericBenchmarkUrl, { 
    watch: [genericBenchmarkUrl],
    default: () => ({ data: [] })
  });
  
  // Log the response to check its structure
  watch(genericBenchmarkResponse, (newData) => {
    console.log('Benchmark Response:', newData);
  });
  
  const nodeRanking: Ref<NodeRanking | null> = ref(null);
  
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
  
    if (nodeRuns.value && nodeRuns.value.length) {
      nodeStatus.value = 'RUNNING';
    }
  
    if (nodeSpecs?.value?.marketAddress) {
      const { data } = await useAPI(`/api/benchmarks/node-ranking?market=${nodeSpecs?.value?.marketAddress}`);
      nodeRanking.value = data.value.find((ranking: NodeRanking) => {
        return ranking.node === address.value;
      }) || null;
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
  