<template>
  <div class="box mt-4 has-text-left">
    <div class="columns is-multiline">
      <div class="column is-12">
        <div class="is-flex is-align-items-center is-justify-content-space-between is-flex-wrap-nowrap mb-4">
          <div class="deployment-tabs">
            <button 
              class="tab-button" 
              :class="{ 'is-active': activeTab === 'deployments' }"
              @click="activeTab = 'deployments'"
            >
              Deployments
            </button>
            <button 
              class="tab-button" 
              :class="{ 'is-active': activeTab === 'jobs' }"
              @click="activeTab = 'jobs'"
            >
              Jobs
            </button>
          </div>
          <div class="select status-select ml-auto">
            <select v-model="currentState">
              <option v-for="filterState in getFilterStates" 
                :key="filterState.value === null ? 'null' : filterState.value" 
                :value="filterState.value"
              >
                {{ filterState.label }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="activeTab === 'deployments'" :class="{'min-height-container': !hasLoadedOnce && loading}">
          <div class="table-container">
            <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr>
                <th>Deployment</th>
                <th>Status</th>
                <th>Active Jobs</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!hasLoadedOnce && loading">
                <td colspan="4" class="has-text-centered py-6">Loading deployments...</td>
              </tr>
              <tr v-else-if="deploymentsError">
                <td colspan="4" class="has-text-centered has-text-danger">Failed to load deployments: {{ deploymentsError }}</td>
              </tr>
              <tr v-else-if="!displayedDeployments.length">
                <td colspan="4" class="has-text-centered">No deployments found</td>
              </tr>
              <template v-else>
                <tr v-for="deployment in displayedDeployments" :key="deployment.id" class="clickable-row">
                  <td>
                    <NuxtLink :to="deploymentLink(deployment.id)" class="clickable-row-link">
                      <div class="clickable-row-cell-content">
                        <div class="deployment-name">{{ deployment.name }}</div>
                        <div class="is-size-7 is-family-monospace has-text-grey">{{ deployment.id }}</div>
                      </div>
                    </NuxtLink>
                  </td>
                  <td>
                    <div class="clickable-row-cell-content">
                      <StatusTag :status="deployment.status" :outlined="true" :show-label="true" />
                    </div>
                  </td>
                  <td>
                    <span class="clickable-row-cell-content">{{ (Array.isArray(deployment.jobs) ? deployment.jobs.length : 0) }} Jobs</span>
                  </td>
                  <td>
                    <span class="clickable-row-cell-content">
                      <span v-if="deployment.updated_at">{{ formatDate(deployment.updated_at) }}</span>
                      <span v-else>-</span>
                    </span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          </div>
        </div>

        <div v-else>
          <JobList 
            :items-per-page="itemsPerPageForJobs"
            job-type="combined"
            :status-filter="currentState"
            class="mb-2"
          />
        </div>

        <Pagination
            v-if="showPagination && totalPages > 1"
            v-model="currentPage"
            class="pagination is-centered mt-4"
            :total-page="totalPages"
            :max-page="6"
        />
        <div v-if="!showPagination && hasMore" class="has-text-right mt-2">
          <nuxt-link to="/deployments" class="button is-text">
            <span>See all</span>
            <span class="icon"> &#8250; </span>
          </nuxt-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusTag from '@/components/Common/StatusTag.vue';
import JobList from '~/components/List/JobList.vue';
import { useWallet } from 'solana-wallets-vue';
import { useSDK } from '~/composables/useSDK';
import type { Deployment } from '@nosana/sdk';

// Props
const props = withDefaults(defineProps<{
  itemsPerPage?: number
  searchQuery?: string
  limit?: number
  showPagination?: boolean
}>(), {
  itemsPerPage: 10,
  searchQuery: '',
  limit: undefined,
  showPagination: true
})

// Emits
const emit = defineEmits<{
  'update:total-deployments': [count: number]
}>()

// Reactive data
const deployments = ref<Deployment[]>([])
const currentPage = ref(1)
const currentState = ref<string | null>(null)
const hasLoadedOnce = ref(false)
const activeTab = ref<'deployments' | 'jobs'>('deployments')
const itemsPerPageForJobs = computed(() => props.itemsPerPage)

// Filter states for deployment status
const filterStates = [
  { label: 'All', value: null as null },
  { label: 'Running', value: 'RUNNING' as string },
  { label: 'Stopped', value: 'STOPPED' as string },
  { label: 'Starting', value: 'STARTING' as string },
  { label: 'Stopping', value: 'STOPPING' as string },
  { label: 'Draft', value: 'DRAFT' as string },
  { label: 'Error', value: 'ERROR' as string },
  { label: 'Archived', value: 'ARCHIVED' as string }
]

// Filter states for job status
const jobFilterStates = [
  { label: 'All', value: null as null },
  { label: 'Completed', value: '2' as string },
  { label: 'Running', value: '1' as string },
  { label: 'Queued', value: '0' as string },
  { label: 'Stopped', value: '3' as string }
]

// Get appropriate filter states based on active tab
const getFilterStates = computed(() => {
  return activeTab.value === 'deployments' ? filterStates : jobFilterStates
})


const { status, token } = useAuth()
const { connected } = useWallet()
const router = useRouter()
const route = useRoute()

const isAuthenticated = computed(() => {
  return status.value === 'authenticated' && token.value
})

const isWalletMode = computed(() => {
  return connected.value && !token.value
})

const hasAnyAuth = computed(() => {
  return isAuthenticated.value || isWalletMode.value
})

const { nosana } = useSDK()
const loading = ref(false)
const deploymentsError = ref<string | null>(null)

const refreshDeployments = async () => {
  try {
    deploymentsError.value = null
    loading.value = true
    const items = await nosana.value.deployments.list()
    deployments.value = items || []
  } catch (e: any) {
    deploymentsError.value = e?.message || 'Failed to load deployments'
    deployments.value = []
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

// Computed properties
const filteredDeployments = computed(() => {
  let filtered = deployments.value
  
  // Apply status filter
  if (currentState.value) {
    filtered = filtered.filter(d => d.status === currentState.value)
  }
  
  // Apply search filter
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase()
    filtered = filtered.filter(d => 
      d.name.toLowerCase().includes(query) || 
      d.id.toLowerCase().includes(query)
    )
  }

  const toTime = (d: any) => {
    const updated = (d as any)?.updated_at ?? (d as any)?.updatedAt
    const created = (d as any)?.created_at ?? (d as any)?.createdAt
    return updated ? new Date(updated).getTime() : created ? new Date(created).getTime() : 0
  }

  return filtered
})

// Create a computed property for the deployments actually displayed in the table
const displayedDeployments = computed(() => {
  // Compact mode: show only first N and hide pagination
  if (!props.showPagination) {
    const max = props.limit ?? props.itemsPerPage
    return filteredDeployments.value.slice(0, max)
  }

  // Paginated mode
  const start = (currentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return filteredDeployments.value.slice(start, end)
})

const totalDeployments = computed(() => filteredDeployments.value.length)

const totalPages = computed(() => Math.ceil(totalDeployments.value / props.itemsPerPage))

// More indicator for compact mode
const hasMore = computed(() => {
  if (props.showPagination) return false
  const max = props.limit ?? props.itemsPerPage
  return filteredDeployments.value.length > max
})

// Build nuxt-link target with origin marker
const deploymentLink = (id: string) => {
  const from = route.path.startsWith('/account') ? 'account' : 'deployments'
  return { path: `/deployments/${id}`, query: { from } }
}



// Debounced redirect to prevent flicker during session refresh
let redirectTimer: NodeJS.Timeout | null = null
watch(status, (authStatus) => {
  if (redirectTimer) {
    clearTimeout(redirectTimer)
  }
  
  if (authStatus === 'unauthenticated' && !connected.value) {
    // Add small delay to prevent redirect during quick session refresh
    redirectTimer = setTimeout(() => {
      if (status.value === 'unauthenticated' && !connected.value) {
        router.push('/account/deployer')
      }
    }, 500)
  }
}, { immediate: true })


const formatDate = (date: string | Date) => {
  if (!date) return 'N/A'
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleString()
}

// onMounted removed - watcher with immediate: true handles initial load

watch([status, connected], () => {
  if (hasAnyAuth.value) {
    refreshDeployments()
  } else if (status.value === 'unauthenticated' && !connected.value) {
    // Only clear deployments when actually unauthenticated and not wallet connected
    deployments.value = []
  }
  // Do nothing during 'loading' state to prevent flicker
}, { immediate: true })



// Emit total deployments count
watch(totalDeployments, (count) => {
  emit('update:total-deployments', count)
}, { immediate: true })

// Add watcher for status filter changes
watch(() => currentState.value, () => {
  // Reset to first page when filter changes
  currentPage.value = 1
}, { immediate: false })

// Add watcher for page changes
watch(() => currentPage.value, () => {
  // Refresh the data when page changes (if needed for server-side pagination)
  // For now we're doing client-side filtering so no refresh needed
}, { immediate: false })

// Reset status filter when switching tabs
watch(() => activeTab.value, () => {
  currentState.value = null
  currentPage.value = 1
}, { immediate: false })
</script>

<style scoped>
.address {
  font-family: monospace;
  font-size: 0.9em;
}

.table td {
  vertical-align: middle;
}

.tag {
  min-width: 80px;
  justify-content: center;
}

.pagination-previous.is-disabled,
.pagination-next.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

@media screen and (max-width: 768px) {
  .address {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
  }
}

.deployment-name {
  color: inherit;
  font-weight: 500;
}

.min-height-container {
  min-height: 430px;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row-link {
  color: inherit;
  text-decoration: none;
}

.clickable-row-cell-content {
  display: block;
  width: 100%;
  height: 100%;
}

/* Fix for option key type error */
select option {
  value: any;
}

/* Match deployment detail page responsive tab styling */
@media screen and (max-width: 768px) {
  .tab-button {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
}

@media screen and (max-width: 480px) {
  .deployment-tabs {
    gap: 0.25rem;
  }
  
  .tab-button {
    font-size: 0.75rem;
    padding: 0.375rem 0.5rem;
  }
}
</style>