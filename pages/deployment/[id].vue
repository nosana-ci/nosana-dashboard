<template>
  <div>
    <TopBar
      title="Deployment Overview"
      subtitle="Find information about and manage your deployment here."
    />

    <NuxtLink
      to="/deployment"
      class="mt-3 mb-5 has-text-dark is-flex is-align-items-center"
    >
      <span class="icon is-small mr-1" aria-hidden="true">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span>Back</span>
    </NuxtLink>
    <Loader v-if="loading" />
    <div v-else-if="error" class="box">
      <div class="notification is-danger">
        <p>{{ error }}</p>
      </div>
    </div>

    <div v-else-if="deployment">
      <!-- Unified Card -->
      <div class="box" style="padding: 0; overflow: hidden;">
        <!-- Header Section -->
        <div style="padding: 1.5rem; border-bottom: 1px solid #dbdbdb;">
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-4">
          <div>
            <h1 class="title is-3 mb-2">{{ deployment.name }}</h1>
            <p class="is-size-7 has-text-grey is-family-monospace">{{ deployment.id }}</p>
          </div>
          <div class="tag is-outlined is-light" :class="statusClass(deployment.status)">
            <img class="mr-2" :src="`/img/icons/status/${getStatusIcon(deployment.status)}.svg`" />
            <span>{{ deployment.status }}</span>
          </div>
        </div>

          <!-- Quick Stats -->
          <div class="columns is-mobile mb-0">
            <div class="column">
              <p class="heading">Vault Balance</p>
              <p class="title is-6">{{ vaultBalance.NOS.toFixed(2) }} NOS</p>
            </div>
            <div class="column">
              <p class="heading">Vault Balance (SOL)</p>
              <p class="title is-6">{{ vaultBalance.SOL.toFixed(4) }} SOL</p>
            </div>
            <div class="column">
              <p class="heading">Strategy</p>
              <p class="title is-6">{{ deployment.strategy }}</p>
            </div>
            <div class="column">
              <p class="heading">Replicas</p>
              <p class="title is-6">{{ deployment.replicas }}</p>
            </div>
            <div class="column">
              <p class="heading">Timeout</p>
              <p class="title is-6">{{ Math.floor(deployment.timeout / 3600) }}h</p>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs" style="margin-bottom: 0;">
          <ul>
            <li :class="{ 'is-active': activeTab === 'overview' }">
              <a @click="activeTab = 'overview'">Overview</a>
            </li>
            <li :class="{ 'is-active': activeTab === 'actions' }">
              <a @click="activeTab = 'actions'">Control</a>
            </li>
            <li :class="{ 'is-active': activeTab === 'events' }">
              <a @click="activeTab = 'events'">Events</a>
            </li>
            <li :class="{ 'is-active': activeTab === 'job-definition' }">
              <a @click="activeTab = 'job-definition'">Definition</a>
            </li>
          </ul>
        </div>
        
        <!-- Tab Content -->
        <div style="padding: 1.5rem;">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">

          <!-- Endpoints -->
          <div v-if="deploymentEndpoints.length > 0" class="mb-5">
            <h2 class="title is-5 mb-3">Endpoints</h2>
            <div v-for="endpoint in deploymentEndpoints" :key="`${endpoint.opId}-${endpoint.port}`" class="notification is-light">
              <div class="is-flex is-justify-content-space-between is-align-items-center">
                <div>
                  <p class="has-text-weight-semibold mb-1">{{ endpoint.opId }} <span class="tag is-white is-small ml-2">Port {{ endpoint.port }}</span></p>
                  <a :href="endpoint.url" target="_blank" class="is-size-7 has-text-link">
                    {{ endpoint.url }} ↗
                  </a>
                </div>
                <span class="tag" :class="endpoint.statusClass">{{ endpoint.status }}</span>
              </div>
            </div>
          </div>

          <!-- Jobs -->
          <div>
            <h2 class="title is-5 mb-3">Jobs <span class="tag is-light">{{ activeJobs.length }}</span></h2>
            
            <div v-if="activeJobs.length === 0" class="notification is-light has-text-centered">
              <p class="has-text-grey">
                <span v-if="deployment.status === 'DRAFT'">Start deployment to create jobs</span>
                <span v-else>No jobs yet</span>
              </p>
            </div>
            
            <div v-else>
              <div 
                v-for="job in activeJobs" 
                :key="job.job" 
                class="notification is-light is-clickable mb-2"
                @click="navigateToJob(job.job)"
                style="cursor: pointer;"
              >
                <div class="is-flex is-justify-content-space-between is-align-items-center">
                  <div class="is-flex-grow-1">
                    <div class="is-flex is-align-items-center mb-2">
                      <JobStatus :status="job.state || 0" class="mr-2" />
                      <p class="is-family-monospace is-size-7 has-text-grey">{{ job.job }}</p>
                    </div>
                    <p class="is-size-7">{{ formatDate(job.created_at) }}</p>
                  </div>
                  <a
                    :href="`https://solscan.io/tx/${job.tx}`"
                    target="_blank"
                    class="button is-small is-white"
                    @click.stop
                    title="View transaction"
                  >
                    TX ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Events Tab -->
        <div v-if="activeTab === 'events'">
          <h2 class="title is-4 mb-4">Deployment Events & Tasks</h2>

          <!-- Tasks -->
          <div class="mb-5">
            <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
              <h2 class="title is-5 mb-0">Tasks <span class="tag is-light">{{ tasks.length }}</span></h2>
              <button 
                class="button is-small" 
                @click="loadTasks"
                :class="{ 'is-loading': tasksLoading }"
                :disabled="tasksLoading"
              >
                <span class="icon is-small">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </button>
            </div>
            
            <div v-if="tasks.length === 0 && !tasksLoading" class="notification is-light has-text-centered">
              <p class="has-text-grey">No tasks yet</p>
            </div>
            
            <div v-else-if="tasks.length > 0">
              <div v-for="task in tasks" :key="task.id" class="notification is-light mb-2">
                <div class="is-flex is-justify-content-space-between is-align-items-center">
                  <div class="is-flex-grow-1">
                    <div class="is-flex is-align-items-center mb-2">
                      <span class="tag" :class="getTaskStatusClass(task.status)">{{ task.status || 'PENDING' }}</span>
                      <span class="tag is-white is-small ml-2">{{ task.type || 'Job' }}</span>
                    </div>
                    <p class="is-family-monospace is-size-7 has-text-grey">{{ task.id }}</p>
                  </div>
                  <div style="min-width: 140px; text-align: right;">
                    <p class="is-size-7 has-text-grey">{{ formatDate(task.updated_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Events -->
          <div>
            <h2 class="title is-5 mb-3">Events <span class="tag is-light">{{ deploymentEvents.length }}</span></h2>
            
            <div v-if="deploymentEvents.length === 0" class="notification is-light has-text-centered">
              <p class="has-text-grey">No events yet</p>
            </div>
            
            <div v-else>
              <div
                v-for="(event, index) in deploymentEvents"
                :key="index"
                class="notification is-light mb-2"
              >
                <div class="is-flex is-justify-content-space-between is-align-items-start">
                  <div class="is-flex-grow-1">
                    <div class="is-flex is-align-items-center mb-2">
                      <span class="tag" :class="eventTypeClass(event.type)">{{ event.type }}</span>
                      <span class="tag is-white is-small ml-2">{{ event.category }}</span>
                    </div>
                    <p class="is-size-7" :class="{ 'is-family-monospace': event.message.length > 200 }" style="white-space: pre-wrap; word-break: break-word;">{{ event.message }}</p>
                  </div>
                  <div class="ml-3" style="min-width: 140px; text-align: right;">
                    <p class="is-size-7 has-text-grey">{{ formatDate(event.created_at) }}</p>
                    <a
                      v-if="event.tx"
                      :href="`https://solscan.io/tx/${event.tx}`"
                      target="_blank"
                      class="button is-small is-white mt-2"
                      title="View transaction"
                    >
                      TX ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Job Definition Tab -->
        <div v-if="activeTab === 'job-definition'">
          <h2 class="title is-4 mb-4">Job Definition</h2>

          <div v-if="deployment.schedule" class="field">
            <label class="label">Schedule</label>
            <p class="content is-family-monospace is-size-7">
              {{ deployment.schedule }}
            </p>
          </div>

          <div v-if="loadingJobDefinition" class="has-text-grey has-text-centered py-4">
            Loading job definition...
          </div>
          <div v-else-if="jobDefinitionModel">
            <JsonEditorVue
              :validator="validator"
              v-model="jobDefinitionModel"
              :mode="Mode.text"
              :mainMenuBar="false"
              :statusBar="false"
              :stringified="false"
              :readOnly="true"
              class="job-definition-editor"
            />
          </div>
          <div v-else class="has-text-grey has-text-centered py-4">
            No job definition found
          </div>
        </div>

        <!-- Actions Tab -->
        <div v-if="activeTab === 'actions'">
          <!-- All Actions in One Row -->
          <div class="columns">
            <!-- Deployment Control -->
            <div class="column is-narrow">
              <label class="label is-small">Deployment</label>
              <div class="field is-grouped">
                <p class="control" v-if="canStart">
                  <button
                    class="button is-success"
                    @click="startDeployment"
                    :class="{ 'is-loading': actionLoading }"
                    :disabled="actionLoading"
                  >
                    <span class="icon is-small"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>
                    <span>Start</span>
                  </button>
                </p>

                <p class="control" v-if="canStop">
                  <button
                    class="button is-warning"
                    @click="stopDeployment"
                    :class="{ 'is-loading': actionLoading }"
                    :disabled="actionLoading"
                  >
                    <span class="icon is-small"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6h12v12H6V6z" fill="currentColor"/></svg></span>
                    <span>Stop</span>
                  </button>
                </p>

                <p class="control" v-if="canArchive">
                  <button
                    class="button is-danger"
                    @click="archiveDeployment"
                    :class="{ 'is-loading': actionLoading }"
                    :disabled="actionLoading"
                  >
                    <span class="icon is-small"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 3h18v4H3V3zm2 6h14v12H5V9z" fill="currentColor"/></svg></span>
                    <span>Archive</span>
                  </button>
                </p>
              </div>
            </div>

            <!-- Replicas -->
            <div class="column">
              <label class="label is-small">Replicas</label>
              <div class="field has-addons">
                <div class="control is-expanded">
                  <input
                    type="number"
                    class="input"
                    v-model.number="newReplicaCount"
                    min="1"
                    max="100"
                    :placeholder="deployment.replicas.toString()"
                    :disabled="actionLoading || deployment.status === 'ARCHIVED'"
                  />
                </div>
                <div class="control">
                  <button
                    class="button is-info"
                    @click="updateReplicas"
                    :class="{ 'is-loading': actionLoading }"
                    :disabled="actionLoading || !newReplicaCount || newReplicaCount < 1 || deployment.status === 'ARCHIVED'"
                  >
                    Update
                  </button>
                </div>
              </div>
              <p class="help">Current: {{ deployment.replicas }}</p>
            </div>

            <!-- Timeout -->
            <div class="column">
              <label class="label is-small">Timeout (hours)</label>
              <div class="field has-addons">
                <div class="control is-expanded">
                  <input
                    type="number"
                    class="input"
                    v-model.number="newTimeoutHours"
                    min="0.0167"
                    step="0.1"
                    :placeholder="(deployment.timeout / 3600).toFixed(2)"
                    :disabled="actionLoading || deployment.status === 'ARCHIVED'"
                  />
                </div>
                <div class="control">
                  <button
                    class="button is-info"
                    @click="updateJobTimeout"
                    :class="{ 'is-loading': actionLoading }"
                    :disabled="actionLoading || !newTimeoutHours || newTimeoutHours < 0.0167 || deployment.status === 'ARCHIVED'"
                  >
                    Update
                  </button>
                </div>
              </div>
              <p class="help">Current: {{ (deployment.timeout / 3600).toFixed(2) }}h</p>
            </div>

            <!-- Vault -->
            <div class="column">
              <label class="label is-small">Vault</label>
              <div class="field is-grouped">
                <p class="control">
                  <button
                    class="button is-success"
                    @click="showTopupModal = true"
                    :disabled="actionLoading || deployment.status === 'ARCHIVED'"
                  >
                    <span class="icon is-small"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14m7-7H5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
                    <span>Top Up</span>
                  </button>
                </p>

                <p class="control">
                  <button
                    class="button"
                    @click="withdrawFromVault"
                    :class="{ 'is-loading': actionLoading }"
                    :disabled="actionLoading || deployment.status === 'ARCHIVED' || (vaultBalance.NOS === 0 && vaultBalance.SOL === 0)"
                  >
                    <span>Withdraw</span>
                  </button>
                </p>
              </div>
              <p class="help">{{ vaultBalance.NOS.toFixed(2) }} NOS · {{ vaultBalance.SOL.toFixed(4) }} SOL</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Top-up Modal -->
  <div class="modal" :class="{ 'is-active': showTopupModal }">
    <div class="modal-background" @click="showTopupModal = false"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Top Up Vault</p>
        <button class="delete" aria-label="close" @click="showTopupModal = false"></button>
      </header>
      <section class="modal-card-body">
        <div class="columns">
          <div class="column">
            <div class="field">
              <label class="label">Current Vault Balance</label>
              <p class="content mb-2">
                <strong>{{ vaultBalance.NOS.toFixed(2) }} NOS</strong>
              </p>
              <p class="content">
                <strong>{{ vaultBalance.SOL.toFixed(4) }} SOL</strong>
              </p>
            </div>
          </div>
          <div class="column">
            <div class="field">
              <label class="label">Your Wallet Balance</label>
              <p class="content mb-2">
                <strong>{{ userNosBalance.toFixed(2) }} NOS</strong>
              </p>
              <p class="content">
                <strong>{{ userSolBalance.toFixed(4) }} SOL</strong>
              </p>
            </div>
          </div>
        </div>

        <!-- NOS Input -->
        <div class="field">
          <label class="label">NOS Amount to Add</label>
          <div class="field has-addons">
            <div class="control is-expanded">
              <input
                v-model.number="topupNosAmount"
                class="input"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                :max="userNosBalance"
              />
            </div>
            <div class="control">
              <button 
                class="button"
                @click="topupNosAmount = Math.floor(userNosBalance / 2 * 100) / 100"
                :disabled="userNosBalance <= 0"
              >
                HALF
              </button>
            </div>
            <div class="control">
              <button 
                class="button"
                @click="topupNosAmount = Math.floor(userNosBalance * 100) / 100"
                :disabled="userNosBalance <= 0"
              >
                MAX
              </button>
            </div>
          </div>
        </div>

        <!-- SOL Input -->
        <div class="field">
          <label class="label">SOL Amount to Add</label>
          <div class="field has-addons">
            <div class="control is-expanded">
              <input
                v-model.number="topupSolAmount"
                class="input"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.001"
                :max="userSolBalance"
              />
            </div>
            <div class="control">
              <button 
                class="button"
                @click="topupSolAmount = Math.floor(userSolBalance / 2 * 10000) / 10000"
                :disabled="userSolBalance <= 0"
              >
                HALF
              </button>
            </div>
            <div class="control">
              <button 
                class="button"
                @click="topupSolAmount = Math.floor(userSolBalance * 10000) / 10000"
                :disabled="userSolBalance <= 0"
              >
                MAX
              </button>
            </div>
          </div>
        </div>

        <div class="notification is-info is-light">
          <p class="is-size-7">
            <strong>Note:</strong> This will transfer tokens from your wallet to the deployment vault.
            The vault is used to pay for compute resources. You can add NOS, SOL, or both.
          </p>
        </div>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-primary"
          @click="topupVault"
          :class="{ 'is-loading': topupLoading }"
          :disabled="topupLoading || ((!topupNosAmount || topupNosAmount <= 0) && (!topupSolAmount || topupSolAmount <= 0))"
        >
          <span v-if="topupNosAmount > 0 && topupSolAmount > 0">
            Top Up {{ topupNosAmount }} NOS + {{ topupSolAmount }} SOL
          </span>
          <span v-else-if="topupNosAmount > 0">
            Top Up {{ topupNosAmount }} NOS
          </span>
          <span v-else-if="topupSolAmount > 0">
            Top Up {{ topupSolAmount }} SOL
          </span>
          <span v-else>
            Top Up Vault
          </span>
        </button>
        <button
          class="button"
          @click="showTopupModal = false"
          :disabled="topupLoading"
        >
          Cancel
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";
import type { Deployment, JobDefinition } from "@nosana/sdk";
import { Mode, ValidationSeverity } from "vanilla-jsoneditor";
import JsonEditorVue from "json-editor-vue";
import { useToast } from "vue-toastification";
import JobStatus from "~/components/Job/Status.vue";

// Types
interface DeploymentJob {
  job: string;
  tx: string;
  created_at: string;
  state?: number;
  market?: string;
}

interface DeploymentEvent {
  type: string;
  category: string;
  message: string;
  created_at: string;
  deploymentId: string;
  tx?: string;
}

// Composables
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { connected, wallet, publicKey } = useWallet();
const { nosana } = useSDK();
const { getIpfs } = useIpfs();

// State
const deployment = ref<Deployment | null>(null);
const marketData = ref<any>(null);
const loadingMarket = ref(false);
const loading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref("overview");
const actionLoading = ref(false);
const vaultBalance = ref<{ SOL: number; NOS: number }>({ SOL: 0, NOS: 0 });
const topupNosAmount = ref<number>(0);
const topupSolAmount = ref<number>(0);
const topupLoading = ref(false);
const newReplicaCount = ref<number | null>(null);
const newTimeoutHours = ref<number | null>(null);
const authHeader = ref<string>('');
const showTopupModal = ref(false);
const userNosBalance = ref<number>(0);
const userSolBalance = ref<number>(0);
const tasks = ref<any[]>([]);
const tasksLoading = ref(false);
// Status dot helper
const statusDotClass = computed(() => {
  switch (deployment.value?.status?.toUpperCase()) {
    case 'RUNNING':
      return 'status-running';
    case 'ERROR':
      return 'status-error';
    case 'STOPPED':
      return 'status-stopped';
    case 'DRAFT':
      return 'status-draft';
    case 'STARTING':
      return 'status-starting';
    case 'STOPPING':
      return 'status-stopping';
    case 'INSUFFICIENT_FUNDS':
      return 'status-insufficient';
    case 'ARCHIVED':
      return 'status-archived';
    default:
      return 'status-unknown';
  }
});

// Methods
const statusClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case "RUNNING":
      return "is-info";
    case "ERROR":
      return "is-danger";
    case "STOPPED":
      return "is-dark";
    case "DRAFT":
      return "is-light";
    case "STARTING":
      return "is-info";
    case "STOPPING":
      return "is-warning";
    case "INSUFFICIENT_FUNDS":
      return "is-danger";
    case "ARCHIVED":
      return "is-grey";
    default:
      return "is-light";
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toUpperCase()) {
    case "RUNNING":
    case "STARTING":
      return "running";
    case "STOPPED":
    case "STOPPING":
      return "stopped";
    case "ERROR":
    case "INSUFFICIENT_FUNDS":
      return "failed";
    case "DRAFT":
      return "queued";
    default:
      return "stopped";
  }
};

const formatDate = (dateString: string | Date) => {
  return new Date(dateString).toLocaleString();
};

const validator = (json: any) => {
  const errors: {
    path: string[];
    message: string;
    severity: ValidationSeverity;
  }[] = [];
  return errors;
};

const jobDefinitionModel = ref<any>(null);
const loadingJobDefinition = ref(false);

const loadJobDefinition = async () => {
  if (!deployment.value?.ipfs_definition_hash) {
    jobDefinitionModel.value = null;
    return;
  }

  try {
    loadingJobDefinition.value = true;
    const definition = await getIpfs(deployment.value.ipfs_definition_hash);
    jobDefinitionModel.value = definition;
  } catch (err: any) {
    console.error("Error loading job definition:", err);
    jobDefinitionModel.value = null;
  } finally {
    loadingJobDefinition.value = false;
  }
};

const loadMarket = async (marketId: string) => {
  if (!marketId) return;

  try {
    loadingMarket.value = true;
    const { data } = await useAPI(`/api/markets/${marketId}/`);
    marketData.value = data.value;
  } catch (err: any) {
    console.error("Error loading market:", err);
    // Keep marketData as null to show fallback
  } finally {
    loadingMarket.value = false;
  }
};

const loadDeployment = async (silent = false) => {
  if (!connected.value) {
    error.value = "Please connect your wallet first";
    if (!silent) loading.value = false;
    return;
  }

  try {
    if (!silent) loading.value = true;
    error.value = null;

    const deploymentId = route.params.id as string;
    console.log('=== LOADING DEPLOYMENT ===');
    console.log('Deployment ID:', deploymentId);
    
    const result = await nosana.value.deployments.get(deploymentId);
    console.log('Full deployment object:', result);
    console.log('Deployment properties:', {
      id: result.id,
      name: result.name,
      status: result.status,
      strategy: result.strategy,
      replicas: result.replicas,
      timeout: result.timeout,
      market: result.market,
      ipfs_definition_hash: result.ipfs_definition_hash,
      jobs: result.jobs,
      events: result.events,
      endpoints: result.endpoints,
      created_at: result.created_at,
      updated_at: result.updated_at,
    });
    
    if (result.vault) {
      try {
        const balance = await result.vault.getBalance();
        vaultBalance.value = balance;
      } catch (balanceError) {
        console.error("Error fetching vault balance:", balanceError);
      }
    }

    // Fetch user's NOS and SOL balance
    try {
      const nosBalance = await nosana.value.solana.getNosBalance();
      userNosBalance.value = nosBalance?.uiAmount ?? 0;
      
      const solBalance = await nosana.value.solana.getSolBalance();
      userSolBalance.value = solBalance / 1e9;
    } catch (balanceError) {
      console.error("Error fetching user balances:", balanceError);
    }

    deployment.value = result as Deployment;

    if (result.market) {
      await loadMarket(result.market.toString());
    }

    await loadJobDefinition();
    
    // Load job states
    if (result.jobs && result.jobs.length > 0) {
      for (const job of result.jobs) {
        try {
          const { data } = await useAPI(`/api/jobs/${job.job}`);
          if (data.value?.state !== undefined) {
            jobStates.value[job.job] = data.value.state;
          }
        } catch (err) {
          console.warn(`Failed to fetch state for job ${job.job}`);
        }
      }
    }
  } catch (err: any) {
    console.error("Error loading deployment:", err);
    error.value = `Failed to load deployment: ${err.message}`;
  } finally {
    if (!silent) loading.value = false;
  }
};


const eventTypeClass = (type: string) => {
  if (type.includes("ERROR")) {
    return "is-danger";
  } else if (type.includes("SUCCESS") || type.includes("COMPLETED")) {
    return "is-success";
  } else if (type.includes("WARNING") || type.includes("WARN")) {
    return "is-warning";
  } else if (type.includes("INFO") || type.includes("START")) {
    return "is-info";
  } else {
    return "is-light";
  }
};

// Action button visibility
const deploymentStatus = computed(() => deployment.value?.status?.toUpperCase());

const canStart = computed(() => {
  const status = deploymentStatus.value;
  return status === 'DRAFT' || status === 'STOPPED' || status === 'ERROR';
});

const canStop = computed(() => {
  const status = deploymentStatus.value;
  return status === 'RUNNING' || status === 'STARTING';
});

const canArchive = computed(() => deploymentStatus.value !== 'ARCHIVED');

const statusHelpText = computed(() => {
  switch (deploymentStatus.value) {
    case 'DRAFT':
      return 'Start the deployment to begin running jobs.';
    case 'RUNNING':
      return 'Stop the deployment to halt all running jobs.';
    case 'STOPPED':
      return 'You can start the deployment again or archive it.';
    case 'ERROR':
      return 'Fix any issues and restart the deployment.';
    case 'ARCHIVED':
      return 'This deployment is archived and cannot be modified.';
    default:
      return '';
  }
});

// Job activity split
// Note: Deployment jobs don't include state info, so we show all jobs
// Users can click through to see individual job details
const jobStates = ref<Record<string, number>>({});

const activeJobs = computed((): DeploymentJob[] => {
  const jobs = (deployment.value?.jobs as DeploymentJob[]) || [];
  // Enrich jobs with fetched states and reverse to show most recent first
  return jobs.map(job => ({
    ...job,
    state: jobStates.value[job.job] ?? 0
  })).reverse();
});

const historicalJobs = computed((): DeploymentJob[] => {
  // Historical jobs would need to be fetched separately or filtered by date
  // For now, empty since deployment.jobs doesn't include state
  return [];
});

// Deployment endpoints - use API-provided endpoints
const deploymentEndpoints = computed(() => {
  if (!deployment.value?.endpoints) {
    console.log('deploymentEndpoints: No endpoints from API');
    return [];
  }
  
  console.log('=== DEPLOYMENT ENDPOINTS ===');
  console.log('Using endpoints from API:', deployment.value.endpoints);
  
  // Check if deployment is running
  const isRunning = deployment.value.status === 'RUNNING';
  console.log('Deployment status:', deployment.value.status, 'isRunning:', isRunning);
  
  // Map API endpoints to our format with status
  const endpoints = deployment.value.endpoints.map((endpoint: any) => ({
    opId: endpoint.opId,
    port: endpoint.port,
    url: endpoint.url,
    status: isRunning ? 'Online' : 'Offline',
    statusClass: isRunning ? 'is-success' : 'is-light'
  }));
  
  console.log('Final endpoints with status:', endpoints);
  
  return endpoints;
});

// All deployment events
const deploymentEvents = computed((): DeploymentEvent[] => {
  const events = (deployment.value?.events as DeploymentEvent[]) || [];
  // Reverse to show most recent first
  return [...events].reverse();
});

// Vault top-up function
const topupVault = async () => {
  if (!deployment.value || !connected.value) {
    toast.error("Please connect your wallet first");
    return;
  }

  if ((!topupNosAmount.value || topupNosAmount.value <= 0) && 
      (!topupSolAmount.value || topupSolAmount.value <= 0)) {
    toast.error("Please enter a valid amount for NOS or SOL");
    return;
  }

  if (!deployment.value.vault) {
    toast.error("No vault found for this deployment");
    return;
  }

  try {
    topupLoading.value = true;
    
    await deployment.value.vault.topup({ 
      NOS: topupNosAmount.value || 0,
      SOL: topupSolAmount.value || 0
    });
    
    const amounts = [];
    if (topupNosAmount.value > 0) amounts.push(`${topupNosAmount.value} NOS`);
    if (topupSolAmount.value > 0) amounts.push(`${topupSolAmount.value} SOL`);
    
    toast.success(`Successfully topped up vault with ${amounts.join(' and ')}`);
    
    // Reset and refresh
    topupNosAmount.value = 0;
    topupSolAmount.value = 0;
    showTopupModal.value = false;
    
    await loadDeployment();
  } catch (err: any) {
    console.error("Vault topup error:", err);
    toast.error(`Failed to top up vault: ${err.message || err.toString()}`);
  } finally {
    topupLoading.value = false;
  }
};

// Generic deployment action handler
const executeDeploymentAction = async (
  action: () => Promise<void>,
  successMessage: string,
  shouldRedirect = false
) => {
  if (!deployment.value || !connected.value) {
    toast.error("Please connect your wallet first");
    return;
  }

  try {
    actionLoading.value = true;
    const previousStatus = deployment.value.status;
    await action();
    toast.success(successMessage);

    if (shouldRedirect) {
      setTimeout(() => router.push("/deployment"), 2000);
    } else {
      // Poll for status change (max 10 seconds)
      let attempts = 0;
      const maxAttempts = 20;
      const transitionalStates = ['STARTING', 'STOPPING'];
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadDeployment(true); // Silent reload during polling
        
        // Stop polling if we reach a final state
        if (deployment.value && !transitionalStates.includes(deployment.value.status)) {
          break;
        }
        attempts++;
      }
    }
  } catch (err: any) {
    console.error("Deployment action error:", err);
    toast.error(`Failed: ${err.message || err.toString()}`);
  } finally {
    if (!shouldRedirect) {
      actionLoading.value = false;
    }
  }
};

// Deployment action methods
const startDeployment = () => executeDeploymentAction(
  () => deployment.value!.start(),
  "Deployment started successfully"
);

const stopDeployment = () => executeDeploymentAction(
  () => deployment.value!.stop(),
  "Deployment stopped successfully"
);

const archiveDeployment = async () => {
  if (!confirm("Are you sure you want to archive this deployment? This action cannot be undone.")) {
    return;
  }
  
  await executeDeploymentAction(
    () => deployment.value!.archive(),
    "Deployment archived successfully",
    true
  );
};

const updateReplicas = async () => {
  if (!newReplicaCount.value || newReplicaCount.value < 1) {
    toast.error("Replica count must be at least 1");
    return;
  }

  await executeDeploymentAction(
    () => deployment.value!.updateReplicaCount(newReplicaCount.value!),
    `Replica count updated to ${newReplicaCount.value}`
  );
  
  newReplicaCount.value = null;
};

const updateJobTimeout = async () => {
  if (!newTimeoutHours.value || newTimeoutHours.value < 0.0167) {
    toast.error("Timeout must be at least 1 minute (0.0167 hours)");
    return;
  }

  const timeoutSeconds = Math.floor(newTimeoutHours.value * 3600);
  
  await executeDeploymentAction(
    () => deployment.value!.updateTimeout(timeoutSeconds),
    `Job timeout updated to ${newTimeoutHours.value} hours`
  );
  
  newTimeoutHours.value = null;
};

const withdrawFromVault = async () => {
  if (!confirm("Withdraw all funds from the vault? This will return all SOL and NOS to your wallet.")) {
    return;
  }

  actionLoading.value = true;
  try {
    await deployment.value!.vault.withdraw();
    toast.success("Funds withdrawn successfully");
    
    // Reload vault balance
    vaultBalance.value = await deployment.value!.vault.getBalance();
    
    // Reload user balances
    const { nosana } = useSDK();
    if (nosana.value) {
      const nosBalance = await nosana.value.solana.getNosBalance();
      const solBalance = await nosana.value.solana.getSolBalance();
      userNosBalance.value = typeof nosBalance === 'number' ? nosBalance : 0;
      userSolBalance.value = typeof solBalance === 'number' ? solBalance : 0;
    }
  } catch (err: any) {
    console.error("Vault withdrawal error:", err);
    toast.error(`Failed to withdraw from vault: ${err.message}`);
  } finally {
    actionLoading.value = false;
  }
};

const generateAuth = async () => {
  actionLoading.value = true;
  try {
    const header = await deployment.value!.generateAuthHeader();
    authHeader.value = header;
    toast.success("Authentication header generated successfully");
  } catch (err: any) {
    console.error("Generate auth error:", err);
    toast.error(`Failed to generate auth header: ${err.message}`);
  } finally {
    actionLoading.value = false;
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch (err) {
    toast.error("Failed to copy to clipboard");
  }
};

const navigateToJob = (jobId: string) => {
  router.push(`/jobs/${jobId}`);
};

const getJobStateText = (state: number): string => {
  switch (state) {
    case 0: return 'QUEUED';
    case 1: return 'RUNNING';
    case 2: return 'COMPLETED';
    case 3: return 'STOPPED';
    default: return 'UNKNOWN';
  }
};

const getJobStateClass = (state: number): string => {
  switch (state) {
    case 0: return 'is-info'; // QUEUED
    case 1: return 'is-success'; // RUNNING
    case 2: return 'is-dark'; // COMPLETED
    case 3: return 'is-warning'; // STOPPED
    default: return 'is-light'; // UNKNOWN
  }
};

const getTaskStatusClass = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'PENDING': return 'is-info';
    case 'RUNNING': return 'is-success';
    case 'COMPLETED': return 'is-dark';
    case 'FAILED': return 'is-danger';
    case 'CANCELLED': return 'is-warning';
    default: return 'is-light';
  }
};

const loadTasks = async () => {
  if (!deployment.value) {
    console.log('loadTasks: No deployment loaded');
    return;
  }
  
  console.log('=== LOADING TASKS ===');
  console.log('Deployment ID:', deployment.value.id);
  
  tasksLoading.value = true;
  try {
    const result = await deployment.value.getTasks();
    console.log('Tasks API response:', result);
    console.log('Number of tasks:', result.length);
    if (result.length > 0) {
      console.log('First task example:', result[0]);
    }
    tasks.value = result;
  } catch (err: any) {
    console.error("Load tasks error:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      response: err.response,
    });
    toast.error(`Failed to load tasks: ${err.message}`);
    tasks.value = [];
  } finally {
    tasksLoading.value = false;
  }
};

// Watchers
watch(
  connected,
  (newConnected) => {
    if (newConnected) {
      loadDeployment();
    } else {
      error.value = "Please connect your wallet first";
      deployment.value = null;
    }
  },
  { immediate: true }
);

// Head
useHead({
  title: computed(() =>
    deployment.value
      ? `${deployment.value.name} - Deployment`
      : "Loading Deployment"
  ),
});
</script>

<style lang="scss" scoped>
.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 0.4rem;
}

.status-running { background-color: #22c55e; }
.status-starting { background-color: #3b82f6; }
.status-draft { background-color: #9ca3af; }
.status-stopped { background-color: #6b7280; }
.status-stopping { background-color: #f59e0b; }
.status-error { background-color: #ef4444; }
.status-insufficient { background-color: #f59e0b; }
.status-archived { background-color: #d1d5db; }
.status-unknown { background-color: #cbd5e1; }

.sep {
  opacity: 0.6;
}

.gap-2 {
  gap: 0.5rem;
}

.sticky-subheader {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
}

.dark-mode .sticky-subheader {
  background: #1a1a1a;
}

.events-container {
  .event-error {
    border-left: 4px solid $danger;
  }

  .box {
    border-left: 4px solid transparent;
  }
}
</style>
