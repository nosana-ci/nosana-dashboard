<template>
  <div class="box">
    <div v-if="loading && !market">Loading market..</div>
    <div v-else>
      <div v-if="market">
        <h3 class="title mt-3">
          {{
            testgridMarkets.find((m: any) => m.address === marketId)?.name
              || marketId
          }}
        </h3>

        <div class="columns is-multiline">
          <div class="column is-12">
            <table class="table is-fullwidth is-striped">
              <tbody>
                <tr>
                  <td>GPU size</td>
                  <td>{{ totalNodes }} hosts</td>
                </tr>
                <tr>
                  <td>GPU address</td>
                  <td>
                    <a target="_blank" class="address is-family-monospace"
                      :href="'https://explorer.solana.com/address/' + marketId">
                      {{ marketId }}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>Authority</td>
                  <td>
                    <a target="_blank" class="address is-family-monospace"
                      :href="'https://explorer.solana.com/address/' + market.authority.toString()">
                      {{ market.authority.toString() }}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>Price</td>
                  <td>
                    <CurrentMarketPrice 
                      :marketAddressOrData="market" 
                      :marketsData="testgridMarkets"
                      :decimalPlaces="3" />
                  </td>
                </tr>
                <tr>
                  <td>Host payment</td>
                  <td>
                    <span v-if="nosRatePerHour !== null">
                      {{ nosRatePerHour.toFixed(3) }} NOS/h
                      <span v-if="hostPaymentUsd">
                        (${{ hostPaymentUsd.toFixed(3) }}/h)
                      </span>
                    </span>
                    <span v-else-if="loading">...</span>
                    <span v-else>N/A</span>
                  </td>
                </tr>
                <tr>
                  <td>Access key</td>
                  <td>
                    <a target="_blank" class="address is-family-monospace"
                      :href="'https://explorer.solana.com/address/' + market.nodeAccessKey.toString()">
                      {{ market.nodeAccessKey.toString() }}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="py-5">
          <div class="level mb-4">
            <div class="level-left">
              <h2 class="title is-5 mb-0">Hosts Overview</h2>
            </div>
          </div>

          <div class="card">
            <div class="card-content p-0">
              <table class="table is-fullwidth">
                <thead>
                  <tr>
                    <th style="width: 200px;">Status</th>
                    <th style="width: 100px;">Count</th>
                    <th class="is-hidden-mobile"></th>
                    <th style="width: 120px;"></th>
                  </tr>
                </thead>
                <tbody>
                  <!-- All Nodes -->
                  <tr>
                    <td>
                      <span class="icon has-text-success">
                        <i class="fas fa-users"></i>
                      </span>
                      <span class="has-text-weight-medium">All hosts</span>
                    </td>
                    <td>{{ totalNodes }}</td>
                    <td class="is-hidden-mobile">
                      <progress class="progress is-success is-small" :value="totalNodes" :max="totalNodes"></progress>
                    </td>
                    <td>
                      <button class="button is-small" @click="toggleAllNodes" :disabled="!totalNodes">
                        {{ showAllNodes ? 'Hide' : 'Show' }}
                      </button>
                    </td>
                  </tr>
                  <tr v-show="showAllNodes && totalNodes">
                    <td colspan="4" class="has-background-white-ter">
                      <div class="p-3">
                        <ol class="ml-4">
                          <li v-for="node in allNodes" :key="node">
                            <nuxt-link :to="`/host/${node}`" class="is-family-monospace">
                              {{ node }}
                            </nuxt-link>
                          </li>
                        </ol>
                      </div>
                    </td>
                  </tr>

                  <!-- Running Nodes -->
                  <tr>
                    <td>
                      <span class="icon has-text-info">
                        <i class="fas fa-play"></i>
                      </span>
                      <span class="has-text-weight-medium">Running</span>
                    </td>
                    <td>{{ runningNodes.length }}</td>
                    <td class="is-hidden-mobile">
                      <progress class="progress is-info is-small" :value="runningNodes.length"
                        :max="totalNodes"></progress>
                    </td>
                    <td>
                      <button class="button is-small" @click="toggleRunningNodes" :disabled="!runningNodes.length">
                        {{ showRunningNodes ? 'Hide' : 'Show' }}
                      </button>
                    </td>
                  </tr>
                  <tr v-show="showRunningNodes && runningNodes.length">
                    <td colspan="4" class="has-background-white-ter">
                      <div class="p-3">
                        <ol class="ml-4">
                          <li v-for="node in runningNodes" :key="node">
                            <nuxt-link :to="`/host/${node}`" class="is-family-monospace">
                              {{ node }}
                            </nuxt-link>
                          </li>
                        </ol>
                      </div>
                    </td>
                  </tr>

                  <!-- Queued Nodes -->
                  <tr>
                    <td>
                      <span class="icon has-text-warning">
                        <i class="fas fa-clock"></i>
                      </span>
                      <span class="has-text-weight-medium">Queued</span>
                    </td>
                    <td>
                      <template v-if="market?.queueType === 0">
                        0
                      </template>
                      <template v-else>
                        {{ queuedNodes.length }}
                      </template>
                    </td>
                    <td class="is-hidden-mobile">
                      <template v-if="market?.queueType === 1">
                        <progress class="progress is-warning is-small" :value="queuedNodes.length"
                          :max="totalNodes"></progress>
                      </template>
                    </td>
                    <td>
                      <button class="button is-small" @click="toggleQueuedNodes" :disabled="!queuedNodes.length">
                        {{ showQueuedNodes ? 'Hide' : 'Show' }}
                      </button>
                    </td>
                  </tr>
                  <tr v-show="showQueuedNodes && queuedNodes.length">
                    <td colspan="4" class="has-background-white-ter">
                      <div class="p-3">
                        <ol class="ml-4">
                          <li v-for="node in queuedNodes" :key="node">
                            <nuxt-link :to="`/host/${node}`" class="is-family-monospace">
                              {{ node }}
                            </nuxt-link>
                          </li>
                        </ol>
                      </div>
                    </td>
                  </tr>

                  <!-- Access to join Nodes -->
                  <tr>
                    <td>
                      <span class="icon">
                        <i class="fas fa-key"></i>
                      </span>
                      <span class="has-text-weight-medium">Access to join</span>
                    </td>
                    <td>{{ availableNodesWithAccess.length }}</td>
                    <td class="is-hidden-mobile">
                      <progress class="progress is-dark is-small" :value="availableNodesWithAccess.length"
                        :max="totalNodes"></progress>
                    </td>
                    <td>
                      <button class="button is-small" :disabled="!availableNodesWithAccess.length"
                        @click="toggleAccessNodes">
                        {{ showAccessNodes ? 'Hide' : 'Show' }}
                      </button>
                    </td>
                  </tr>
                  <tr v-show="showAccessNodes && availableNodesWithAccess.length">
                    <td colspan="4" class="has-background-white-ter">
                      <div class="p-3">
                        <ol class="ml-4">
                          <li v-for="node in availableNodesWithAccess" :key="node">
                            <nuxt-link :to="`/host/${node}`" class="is-family-monospace">
                              {{ node }}
                            </nuxt-link>
                          </li>
                        </ol>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DeploymentList :per-page="limit" :total-jobs="jobs ? jobs.totalJobs : null" v-model:page="page"
          v-model:state="state" :loading-jobs="loadingJobs" title="All Deployments for this GPU"
          :jobs="jobs ? jobs.jobs : []">
        </DeploymentList>
      </div>
      <div v-else-if="loading">Loading market...</div>
      <div v-else>Market not found for {{ marketId }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Market } from '@nosana/sdk'
import DeploymentList from "~/components/List/DeploymentList.vue";
import CurrentMarketPrice from "~/components/Market/CurrentPrice.vue";
import type { Ref } from 'vue';

// Define the interface for the market data
interface TestgridMarket {
  address: string;
  name: string;
}

// Use the specific interface for the API call
const { data: testgridMarkets } = useAPI('/api/markets', {
  default: () => [] as TestgridMarket[], 
})
const { params } = useRoute()
const { nosana } = useSDK()

const market = ref<Market | null>(null)
const marketId = ref<string>(String(params.id))
const loading = ref<boolean>(false)

const { data: stats, pending: loadingStats } = useAPI('/api/stats')

// Calculate host payment using centralized pricing system
const marketAddress = computed(() => market.value?.address.toString() || null);
const { usdPricePerHour } = useMarketUsdPrice(marketAddress, computed(() => testgridMarkets.value));
const { nosRatePerHour } = useHostNosRate(computed(() => market.value));

// Host payment in USD (base rate without network fee since this is what hosts receive)
const hostPaymentUsd = computed(() => {
  return usdPricePerHour.value ? usdPricePerHour.value / 1.1 : null;
});

const page = ref<number>(1)
const state = ref<number | null>(null)
const jobStateMapping: Record<number, string> = {
  0: 'QUEUED',
  1: 'RUNNING',
  2: 'COMPLETED',
  3: 'STOPPED',
}
const limit = ref<number>(10)

const jobsUrl = computed(() => {
  const stateStr = state.value !== null ? `&state=${jobStateMapping[state.value]}` : ''
  return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${stateStr}&market=${marketId.value}`
})
interface JobInfo { address: string; usdRewardPerHour?: number | null; timeStart?: number; timeEnd?: number; timeout?: number; state?: number | string; node?: string; }
interface JobsApiResponse { jobs: JobInfo[]; totalJobs: number; }
const { data: jobs, pending: loadingJobs } = useAPI(jobsUrl, {
  watch: [jobsUrl],
  default: () => ({ jobs: [], totalJobs: 0 }) as JobsApiResponse
})

watch(jobsUrl, () => {
  // Resetting jobs data might be needed depending on UX requirements
  // jobs.value = null;
})

const getMarket = async () => {
  try {
    loading.value = true
    market.value = await nosana.value.jobs.getMarket(marketId.value)
  } catch (e) {
    console.error("Error fetching market from SDK:", e)
    market.value = null
  }
  loading.value = false
}

getMarket()

const showRunningNodes = ref(false)
const showQueuedNodes = ref(false)
const showAccessNodes = ref(false)

const toggleRunningNodes = () => {
  showRunningNodes.value = !showRunningNodes.value
  if (showRunningNodes.value) {
    showAllNodes.value = false
    showQueuedNodes.value = false
    showAccessNodes.value = false
  }
}

const toggleQueuedNodes = () => {
  showQueuedNodes.value = !showQueuedNodes.value
  if (showQueuedNodes.value) {
    showAllNodes.value = false
    showRunningNodes.value = false
    showAccessNodes.value = false
  }
}

const toggleAccessNodes = () => {
  showAccessNodes.value = !showAccessNodes.value
  if (showAccessNodes.value) {
    showAllNodes.value = false
    showRunningNodes.value = false
    showQueuedNodes.value = false
  }
}

interface NodeLike {
  toString(): string;
}

interface Job {
  totalJobs: number | null;
  jobs: any[];
}

interface Node {
  toString(): string;
}

const queuedNodes = computed(() => {
  // If it's not a node queue market, return empty array
  if (market.value?.queueType !== 1) {
    return []
  }

  const runningNodeSet = new Set(runningNodes.value)
  // Filter out nodes that are already running from the queue and ensure string type
  const filteredQueue = (market.value?.queue || []).filter((node: any) => {
    const nodeStr = typeof node === 'string' ? node : node.toString()
    return !runningNodeSet.has(nodeStr)
  })

  return filteredQueue.map((node: any) => 
    typeof node === 'string' ? node : node.toString()
  )
})

const totalNodes = computed(() => {
  const runningSet = new Set(runningNodes.value)
  const queuedSet = new Set(queuedNodes.value.map((node: NodeLike | string) =>
    typeof node === 'string' ? node : node.toString()
  ))
  const accessSet = new Set(nodesWithAccess.value.map((node: NodeLike | string) =>
    typeof node === 'string' ? node : node.toString()
  ))

  // Combine all sets
  const allNodesSet = new Set([
    ...runningSet,
    ...queuedSet,
    ...accessSet
  ])

  return allNodesSet.size
})

const allNodes = computed(() => {
  // Combine all nodes and ensure they're strings
  return [...new Set([
    ...runningNodes.value,
    ...queuedNodes.value,
    ...nodesWithAccess.value.map((node: any) => node.toString())
  ])].sort()
})

const availableNodesWithAccess = computed(() => {
  const runningNodeSet = new Set(runningNodes.value)
  const queuedNodeSet = new Set(queuedNodes.value.map((node: NodeLike | string) =>
    typeof node === 'string' ? node : node.toString()
  ))

  return nodesWithAccess.value.filter((node: NodeLike | string) => {
    const nodeStr = typeof node === 'string' ? node : node.toString()
    return !runningNodeSet.has(nodeStr) && !queuedNodeSet.has(nodeStr)
  })
})

const showAllNodes = ref(false)

const toggleAllNodes = () => {
  showAllNodes.value = !showAllNodes.value
  if (showAllNodes.value) {
    showRunningNodes.value = false
    showQueuedNodes.value = false
    showAccessNodes.value = false
  }
}

const runningNodesUrl = computed(() => `/api/jobs/running-nodes?market=${marketId.value}`)
const {
  data: runningNodesData,
  pending: loadingRunningNodes
} = useAPI(runningNodesUrl, {
  watch: [runningNodesUrl],
  default: () => [] as string[],
  immediate: true,
  lazy: true
})

const nodesWithAccessUrl = computed(() => `/api/nodes/with-access?marketAddress=${marketId.value}`)
const {
  data: nodesWithAccessData,
  pending: loadingNodesWithAccess
} = useAPI(nodesWithAccessUrl, {
  watch: [nodesWithAccessUrl],
  default: () => [] as string[],
  immediate: true,
  lazy: true
})

const nodesWithAccess = computed(() => nodesWithAccessData.value || [])
const runningNodes = computed(() => {
  // Ensure map callback has type
  return [...new Set(runningNodesData.value?.map((node: string) => String(node)) || [])]
})

onMounted(() => {
  getMarket(); // Fetch market data via SDK on mount
})
</script>

<style lang="scss" scoped>
.address {
  word-break: break-all;
}
</style>
