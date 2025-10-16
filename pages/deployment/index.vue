<template>
  <div>
    <TopBar title="Deployments" subtitle="Find information about your deployments here" />
    
    <div class="box">
      <div class="level mb-4">
        <div class="level-left">
          <div class="level-item">
            <div class="control has-icons-left">
              <input class="input" type="text" placeholder="Search deployments" v-model="searchQuery" />
              <span class="icon is-small is-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <button class="button is-dark" @click="$router.push('/deployment/create')">Create new Deployment</button>
          </div>
        </div>
      </div>

      <table class="table is-fullwidth deployment-table">
        <thead>
          <tr>
            <th>Deployment</th>
            <th>Status</th>
            <th>Active Jobs</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="has-text-centered">
              <progress class="progress is-small" max="100"></progress>
              <div class="mt-2 has-text-grey">Loading deployments...</div>
            </td>
          </tr>
          <tr v-else-if="deploymentsError">
            <td colspan="4" class="has-text-centered has-text-danger">Failed to load deployments: {{ deploymentsError }}</td>
          </tr>
          <tr v-else-if="!deployments.length">
            <td colspan="4" class="has-text-centered has-text-grey">No deployments found</td>
          </tr>
          <tr 
            v-else 
            v-for="deployment in filteredDeployments" 
            :key="deployment.id" 
            class="is-clickable"
            @click="$router.push(`/deployment/${deployment.id}`)"
          >
            <td>
              {{ deployment.name }}
            </td>
            <td>
              <span class="tag" :class="statusClass(deployment.status)">{{ deployment.status }}</span>
            </td>
            <td>{{ deployment.jobs?.length || 0 }} Jobs</td>
            <td>
              <div>{{ (deployment.balance?.NOS || 0).toFixed(2) }} NOS</div>
              <div class="is-size-7 has-text-grey">{{ (deployment.balance?.SOL || 0).toFixed(2) }} SOL</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">

// Types
interface DeploymentJob {
  deployment: string
  job: string
  tx: string
  created_at: string
}

interface Deployment {
  id: string
  name: string
  status: 'DRAFT' | 'ERROR' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'INSUFFICIENT_FUNDS' | 'ARCHIVED'
  jobs: DeploymentJob[]
  balance: {
    NOS: number
    SOL: number
  }
}

const searchQuery = ref('')
const deployments = ref<Deployment[]>([])

const { status, token } = useAuth()
const router = useRouter()

const isAuthenticated = computed(() => {
  return status.value === 'authenticated' && token.value
})

// Use useAPI at top level for reactive fetching
const { data: deploymentsData, error: deploymentsError, refresh: refreshDeployments, pending: loading } = await useAPI('/api/deployments', { 
  auth: true,
  default: () => []
})

watch(status, (authStatus) => {
  if (authStatus === 'unauthenticated') {
    router.push('/account/deployer')
  }
}, { immediate: true })

const filteredDeployments = computed(() => {
  if (!searchQuery.value) return deployments.value
  const query = searchQuery.value.toLowerCase()
  return deployments.value.filter(d => 
    d.name.toLowerCase().includes(query) || 
    d.id.toLowerCase().includes(query)
  )
})

const statusClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'RUNNING': return 'is-success'
    case 'ERROR': return 'is-danger'
    case 'STOPPED': return 'is-dark'
    case 'DRAFT': return 'is-light'
    case 'STARTING': return 'is-info'
    case 'STOPPING': return 'is-warning'
    case 'INSUFFICIENT_FUNDS': return 'is-danger'
    case 'ARCHIVED': return 'is-grey'
    default: return 'is-light'
  }
}

watch(deploymentsData, (data) => {
  if (data) {
    deployments.value = data.map((d: Deployment) => ({
      id: d.id,
      name: d.name,
      status: d.status,
      jobs: d.jobs,
      balance: d.balance || { SOL: 0, NOS: 0 }
    }))
  }
}, { immediate: true })

watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    refreshDeployments()
  } else {
    deployments.value = []
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.deployment-table {
  margin-left: 0 !important;
  
  .is-vcentered {
    vertical-align: middle;
  }
  
  tr.is-clickable {
    cursor: pointer;
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: $white-ter;
    }
  }
}

.dark-mode .deployment-table tr.is-clickable:hover {
  background-color: $grey-darker;
}

.box {
  .table {
    margin-left: 0;
  }
}

.deployment-table {
  td, th {
    padding: 0.3rem 0.3rem !important;
    vertical-align: middle;
  }
}
</style>

