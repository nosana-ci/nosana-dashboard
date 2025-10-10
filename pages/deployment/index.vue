<template>
  <div>
    <TopBar title="Deployments Overview" subtitle="Find information about your deployments here" />
    
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

      <table class="table is-fullwidth is-striped deployment-table">
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
          <tr v-else-if="errorMessage">
            <td colspan="4" class="has-text-centered has-text-danger">{{ errorMessage }}</td>
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
              <div>
                <div class="has-text-weight-semibold">{{ deployment.name }}</div>
                <div class="is-size-7 has-text-grey is-family-monospace">{{ deployment.id }}</div>
              </div>
            </td>
            <td class="is-vcentered">
              <span class="tag" :class="statusClass(deployment.status)">{{ deployment.status }}</span>
            </td>
            <td class="is-vcentered">{{ deployment.jobs?.length || 0 }} Jobs</td>
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
import { useWallet } from 'solana-wallets-vue'

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
const loading = ref(true)

const { connected } = useWallet()
const { nosana } = useSDK()

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

const errorMessage = ref('')

const loadDeployments = async () => {
  if (!connected.value) {
    errorMessage.value = 'Please connect your wallet first'
    loading.value = false
    return
  }
  
  try {
    loading.value = true
    errorMessage.value = ''
    console.log('Loading deployments...')
    
    // Use SDK method which handles auth internally
    const list = await nosana.value.deployments.list()
    console.log('Deployments loaded:', list)
    
    // Fetch vault balances for each deployment
    const deploymentsWithBalances = await Promise.all(
      list.map(async (d) => {
        let balance = { SOL: 0, NOS: 0 }
        if (d.vault) {
          try {
            balance = await d.vault.getBalance()
          } catch (err) {
            console.warn(`Failed to fetch balance for deployment ${d.id}:`, err)
          }
        }
        return {
          id: d.id,
          name: d.name,
          status: d.status,
          jobs: d.jobs,
          balance
        }
      })
    )
    
    deployments.value = deploymentsWithBalances
    console.log('Processed deployments:', deployments.value)
  } catch (error: any) {
    console.error('Error loading deployments:', error)
    errorMessage.value = `Failed to load deployments: ${error.message}`
  } finally {
    loading.value = false
  }
}

watch(connected, (newConnected) => {
  if (newConnected) loadDeployments()
  else deployments.value = []
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
</style>

