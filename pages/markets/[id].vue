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

        <div class="columns is-multiline">
          <div class="column is-12">
            <table class="table is-fullwidth is-striped">
              <tbody>
                <tr>
                  <td>Market Size</td>
                  <td>{{ totalNodes }} hosts</td>
                </tr>
                <tr v-if="testgridMarkets.find(m => m.address === marketId)">
                  <td>Market Address</td>
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
                      :href="'https://explorer.solana.com/address/' + market.authority">
                      {{ market.authority }}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>Job expiration</td>
                  <td>{{ market.jobExpiration / 3600 }} hours</td>
                </tr>
                <tr>
                  <td>Price</td>
                  <td>
                    <span v-if="loadingStats">...</span>
                    <span v-else>
                      {{ market.jobPrice / 1e6 }} NOS/s
                      <span v-if="stats && stats[0] && stats[0].price">
                        (${{ ((stats[0].price * (market.jobPrice / 1e6)) * 3600).toFixed(2) }} / h)
                      </span>
                    </span>
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
                <tr>
                  <td>Minimum Stake</td>
                  <td>{{ market.nodeXnosMinimum / 1e6 }} NOS</td>
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
                      <span class="has-text-weight-medium">All nodes</span>
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
                            <nuxt-link :to="`/nodes/${node}`" class="is-family-monospace">
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
                            <nuxt-link :to="`/nodes/${node}`" class="is-family-monospace">
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
                    <td>{{ queuedNodes.length }}</td>
                    <td class="is-hidden-mobile">
                      <progress class="progress is-warning is-small" :value="queuedNodes.length"
                        :max="totalNodes"></progress>
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
                            <nuxt-link :to="`/nodes/${node}`" class="is-family-monospace">
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
                            <nuxt-link :to="`/nodes/${node}`" class="is-family-monospace">
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
import { type Market } from '@nosana/sdk'

interface TestgridMarket {
  address: string
  name: string
}

const { data: testgridMarkets, pending: loadingTestgridMarkets } = useAPI('/api/markets', {
  default: () => [] as TestgridMarket[],
})
const { params } = useRoute()
const { nosana } = useSDK()

const market = ref<Market | null>(null)
const marketId = ref<string>(String(params.id))
const loading = ref<boolean>(false)

// Add stats API call
const { data: stats, pending: loadingStats } = useAPI('/api/stats')

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
const { data: jobs, pending: loadingJobs } = useAPI(jobsUrl, { watch: [jobsUrl] })

watch(jobsUrl, () => {
  console.log('resetting jobs..')
  jobs.value = null
})

const runningNodesUrl = computed(() => `/api/jobs/running-nodes?market=${marketId.value}`)
const {
  data: runningNodesData,
  pending: loadingRunningNodes
} = useAPI(runningNodesUrl, {
  watch: [runningNodesUrl],
  transform: (data: any) => (data || []) as string[],
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
  transform: (data: any) => (data || []) as string[],
  default: () => [] as string[],
  immediate: true,
  lazy: true
})

const nodesWithAccess = computed(() => nodesWithAccessData.value || [])
const runningNodes = computed(() => {
  // Remove duplicates from running nodes array and ensure string type
  return [...new Set(runningNodesData.value?.map(node => String(node)) || [])]
})

const getMarket = async () => {
  try {
    loading.value = true
    market.value = await nosana.value.jobs.getMarket(marketId.value)
  } catch (e) {
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
    showQueuedNodes.value = false
    showAccessNodes.value = false
  }
}

const toggleQueuedNodes = () => {
  showQueuedNodes.value = !showQueuedNodes.value
  if (showQueuedNodes.value) {
    showRunningNodes.value = false
    showAccessNodes.value = false
  }
}

const toggleAccessNodes = () => {
  showAccessNodes.value = !showAccessNodes.value
  if (showAccessNodes.value) {
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
</script>

<style lang="scss" scoped>
.address {
  word-break: break-all;
}
</style>
