<template>
  <div class="box mt-4 has-text-left">
    <div class="columns is-multiline">
      <div class="column is-12">
        <div class="is-flex is-justify-content-flex-start is-align-items-center mb-4">
          <div class="select status-select">
            <select v-model="currentState">
              <option v-for="filterState in filterStates" 
                :key="filterState.value === null ? 'null' : filterState.value" 
                :value="filterState.value"
              >
                {{ filterState.label }}
              </option>
            </select>
          </div>
        </div>

        <div :class="{'min-height-container': !hasLoadedOnce && loading}">
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
                      <div class="tag is-outlined status-tag" :class="getStatusClass(deployment.status)">
                        <component class="mr-2 status-icon" :is="getStatusIcon(deployment.status)" />
                        <span>{{ deployment.status }}</span>
                      </div>
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
import RunningIcon from '@/assets/img/icons/status/running.svg?component';
import StoppedIcon from '@/assets/img/icons/status/stopped.svg?component';
import FailedIcon from '@/assets/img/icons/status/failed.svg?component';
import QueuedIcon from '@/assets/img/icons/status/queued.svg?component';
import DoneIcon from '@/assets/img/icons/status/done.svg?component';
import ArchiveIcon from '@/assets/img/icons/archive.svg?component';
import { useStatus } from '~/composables/useStatus';
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

// Debug instrumentation for deployment list icons
const iconRefs: Record<string, HTMLElement | null> = reactive({}) as any

const attachSmilDebugListeners = (svgEl: SVGElement, label: string) => {
  try {
    const animations = svgEl.querySelectorAll('animateTransform')
    animations.forEach((anim: any) => {
      if (anim.__dbg) return
      anim.__dbg = true

      // Force restart animation by manipulating the dur attribute
      const originalDur = anim.getAttribute('dur') || '5s'
      anim.setAttribute('dur', '0.001s')
      
      // Use multiple approaches to ensure animation starts
      requestAnimationFrame(() => {
        try {
          anim.setAttribute('dur', originalDur)
          anim.beginElement()
        } catch {}
        
        // Backup approach: restart animation
        setTimeout(() => {
          try {
            anim.endElement()
            anim.beginElement()
          } catch {}
        }, 10)
      })
    })
  } catch {}
}

const instrumentRowIcon = (dep: Deployment) => {
  const host = iconRefs[dep.id]
  const svg = host?.querySelector('svg') as SVGElement | null
  if (!svg) return
  
  // Force immediate visibility calculation
  try { 
    svg.getBoundingClientRect()
    // Force layout/paint
    svg.style.transform = 'translateZ(0)'
  } catch {}

  // Try multiple times to ensure animation starts
  let attempts = 0
  const tryStartAnimation = () => {
    attempts++
    attachSmilDebugListeners(svg, `dep=${dep.id} status=${dep.status}-attempt-${attempts}`)
    
    if (attempts < 3) {
      setTimeout(tryStartAnimation, 50 * attempts)
    }
  }
  
  // Start immediately and with delays
  tryStartAnimation()
}

const { status, token } = useAuth()
const router = useRouter()
const route = useRoute()

const isAuthenticated = computed(() => {
  return status.value === 'authenticated' && token.value
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

  return [...filtered].sort((a, b) => toTime(b) - toTime(a))
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


// Watch for changes
watch(filteredDeployments, (list) => {
  nextTick(() => list.forEach(instrumentRowIcon))
}, { immediate: true, deep: true })

// Debounced redirect to prevent flicker during session refresh
let redirectTimer: NodeJS.Timeout | null = null
watch(status, (authStatus) => {
  if (redirectTimer) {
    clearTimeout(redirectTimer)
  }
  
  if (authStatus === 'unauthenticated') {
    // Add small delay to prevent redirect during quick session refresh
    redirectTimer = setTimeout(() => {
      if (status.value === 'unauthenticated') {
        router.push('/account/deployer')
      }
    }, 500)
  }
}, { immediate: true })

// Use global status system  
const { getStatusClass: globalStatusClass } = useStatus()

const getStatusClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'RUNNING':
    case 'STARTING':
      return 'is-info';
    case 'STOPPED':
    case 'STOPPING':
    case 'ARCHIVED':
      return 'is-dark';
    case 'ERROR':
    case 'INSUFFICIENT_FUNDS':
      return 'is-danger';
    case 'DRAFT':
      return 'is-warning';
    default:
      return 'is-light';
  }
}

const getStatusIcon = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'RUNNING':
    case 'STARTING':
      return RunningIcon;
    case 'STOPPED':
    case 'STOPPING':
      return StoppedIcon;
    case 'ERROR':
    case 'INSUFFICIENT_FUNDS':
      return FailedIcon;
    case 'DRAFT':
      return QueuedIcon;
    case 'COMPLETED':
      return DoneIcon;
    case 'ARCHIVED':
      return ArchiveIcon;
    default:
      return StoppedIcon;
  }
}

const formatDate = (date: string | Date) => {
  if (!date) return 'N/A'
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleString()
}

// onMounted removed - watcher with immediate: true handles initial load

watch(status, (authStatus) => {
  if (authStatus === 'authenticated' && token.value) {
    refreshDeployments()
  } else if (authStatus === 'unauthenticated') {
    // Only clear deployments when actually unauthenticated, not during loading
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
</style>