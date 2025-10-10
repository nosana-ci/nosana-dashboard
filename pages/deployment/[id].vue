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
      <!-- Sticky header + tabs -->
      <div class="box sticky-subheader">
        <div class="level mb-2">
          <div
            class="level-left is-flex is-flex-direction-column is-align-items-flex-start"
          >
            <div class="has-text-weight-semibold is-size-3">
              {{ deployment.name }}
            </div>
            <div class="is-flex is-align-items-center is-flex-wrap-wrap gap-2">
              <span class="is-family-monospace is-size-7 mr-2">{{ deployment.id }}</span>
              <span class="sep">•</span>
              <span class="is-flex is-align-items-center ml-2">
                <span class="status-dot" :class="statusDotClass"></span>
                <span class="ml-1">{{ deployment.status }}</span>
              </span>
            </div>
          </div>
          <div class="level-right">
            <div class="buttons">
              <button
                class="button"
                :class="[activeTab === 'overview' ? 'is-dark' : 'is-outlined']"
                @click="activeTab = 'overview'"
              >
                Overview
              </button>
              <button
                class="button"
                :class="[activeTab === 'events' ? 'is-dark' : 'is-outlined']"
                @click="activeTab = 'events'"
              >
                Events
              </button>
              <button
                class="button"
                :class="[
                  activeTab === 'job-definition' ? 'is-dark' : 'is-outlined',
                ]"
                @click="activeTab = 'job-definition'"
              >
                Job Definition
              </button>
              <button
                class="button"
                :class="[activeTab === 'actions' ? 'is-dark' : 'is-outlined']"
                @click="activeTab = 'actions'"
              >
                Actions
              </button>
            </div>
          </div>
        </div>
        <div class="py-1 mb-3">
          <hr />
        </div>
      </div>
      
      <!-- Tab Content -->
      <div class="box">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">
          <h2 class="title is-4 mb-4">Overview</h2>

          <div class="columns is-multiline">
            <div class="column is-4">
              <div class="field">
                <label class="label">Name</label>
                <p class="content">{{ deployment.name }}</p>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">Status</label>
                <span class="tag" :class="statusClass(deployment.status)">
                  {{ deployment.status }}
                </span>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">Balance</label>
                <p class="content">
                  <!-- {{ deployment.balance.NOS }} NOS,
                  {{ deployment.balance.SOL }} SOL -->
                </p>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">Strategy</label>
                <p class="content">{{ deployment.strategy }}</p>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">Replicas</label>
                <p class="content">{{ deployment.replicas }}</p>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">Timeout</label>
                <p class="content">
                  {{ Math.floor(deployment.timeout / 3600) }} hours
                </p>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">Market</label>
                <p class="content">
                  <span v-if="marketData">
                    {{ marketData.name }}
                  </span>
                  <span v-else-if="loadingMarket" class="has-text-grey">
                    Loading market...
                  </span>
                  <span v-else class="is-family-monospace is-size-7">
                    {{ deployment.market }}
                  </span>
                </p>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">Created</label>
                <p class="content">{{ formatDate(deployment.created_at) }}</p>
              </div>
            </div>
            <div class="column is-4">
              <div class="field">
                <label class="label">Updated</label>
                <p class="content">{{ formatDate(deployment.updated_at) }}</p>
              </div>
            </div>
          </div>

          <!-- Deployment Endpoints Section -->
          <div class="mt-5" v-if="deploymentEndpoints.length > 0">
            <h3 class="title is-5 mb-4">Deployment Endpoints</h3>
            <div class="table-container">
              <table class="table is-fullwidth is-striped">
                <thead>
                  <tr>
                    <th>Operation ID</th>
                    <th>Port</th>
                    <th>Endpoint</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="endpoint in deploymentEndpoints" :key="`${endpoint.opId}-${endpoint.port}`">
                    <td class="is-family-monospace is-size-7">{{ endpoint.opId }}</td>
                    <td>{{ endpoint.port }}</td>
                    <td>
                      <a :href="endpoint.url" target="_blank" class="is-size-7">
                        {{ endpoint.url }}
                      </a>
                    </td>
                    <td>
                      <span class="tag is-small" :class="endpoint.statusClass">
                        {{ endpoint.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Job Activity Section -->
          <div class="mt-5">
            <h3 class="title is-5 mb-4">Job Activity</h3>
            
            <div class="tabs is-boxed">
              <ul>
                <li :class="{ 'is-active': jobActivityTab === 'active' }">
                  <a @click="jobActivityTab = 'active'">
                    Active ({{ activeJobs.length }})
                  </a>
                </li>
                <li :class="{ 'is-active': jobActivityTab === 'history' }">
                  <a @click="jobActivityTab = 'history'">
                    History ({{ historicalJobs.length }})
                  </a>
                </li>
              </ul>
            </div>

            <!-- Active Jobs -->
            <div v-if="jobActivityTab === 'active'">
              <div v-if="activeJobs.length === 0" class="notification is-light">
                <div class="has-text-centered py-4">
                  <span class="icon is-large has-text-grey-light">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                  </span>
                  <p class="has-text-grey mt-3">
                    <strong>No active jobs</strong>
                  </p>
                  <p class="has-text-grey-light is-size-7">
                    <span v-if="deployment.status === 'DRAFT'">
                      Start the deployment to begin running jobs
                    </span>
                    <span v-else-if="deployment.status === 'STOPPED'">
                      This deployment is currently stopped
                    </span>
                    <span v-else>
                      Jobs will appear here once they start running
                    </span>
                  </p>
                </div>
              </div>
              <div v-else class="table-container">
                <table class="table is-fullwidth is-striped is-hoverable">
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>Status</th>
                      <th>Transaction</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="job in activeJobs" :key="job.job" class="is-clickable" @click="$router.push(`/jobs/${job.job}`)">
                      <td class="is-family-monospace is-size-7">{{ job.job }}</td>
                      <td>
                        <span class="tag is-info is-small">Active</span>
                      </td>
                      <td>
                        <a :href="`https://solscan.io/tx/${job.tx}`" target="_blank" class="is-family-monospace is-size-7" @click.stop>
                          {{ job.tx.slice(0, 8) }}...{{ job.tx.slice(-8) }}
                        </a>
                      </td>
                      <td class="is-size-7">{{ formatDate(job.created_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Historical Jobs -->
            <div v-if="jobActivityTab === 'history'">
              <div v-if="historicalJobs.length === 0" class="notification is-light">
                <div class="has-text-centered py-4">
                  <span class="icon is-large has-text-grey-light">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                  </span>
                  <p class="has-text-grey mt-3">
                    <strong>No job history yet</strong>
                  </p>
                  <p class="has-text-grey-light is-size-7">
                    Completed and stopped jobs will appear here
                  </p>
                </div>
              </div>
              <div v-else class="table-container">
                <table class="table is-fullwidth is-striped is-hoverable">
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>Status</th>
                      <th>Transaction</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="job in historicalJobs" :key="job.job" class="is-clickable" @click="$router.push(`/jobs/${job.job}`)">
                      <td class="is-family-monospace is-size-7">{{ job.job }}</td>
                      <td>
                        <span class="tag is-dark is-small">Completed</span>
                      </td>
                      <td>
                        <a :href="`https://solscan.io/tx/${job.tx}`" target="_blank" class="is-family-monospace is-size-7" @click.stop>
                          {{ job.tx.slice(0, 8) }}...{{ job.tx.slice(-8) }}
                        </a>
                      </td>
                      <td class="is-size-7">{{ formatDate(job.created_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Events Tab -->
        <div v-if="activeTab === 'events'">
          <h2 class="title is-4 mb-4">Deployment Events</h2>

          <!-- Queued Events Section -->
          <div class="mb-6">
            <h3 class="title is-5 mb-3">
              Queued Events ({{ queuedEvents.length }})
            </h3>
            <div v-if="queuedEvents.length === 0" class="notification is-light">
              <div class="has-text-centered py-3">
                <span class="icon has-text-grey-light">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  </svg>
                </span>
                <p class="has-text-grey mt-2">
                  <strong>No queued events</strong>
                </p>
                <p class="has-text-grey-light is-size-7">
                  Events will appear here when scheduled
                </p>
              </div>
            </div>
            <div v-else class="table-container">
              <table class="table is-fullwidth is-striped">
                <thead>
                  <tr>
                    <th>Event Type</th>
                    <th>Scheduled For</th>
                    <th>Replica Count</th>
                    <th>Market</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="event in queuedEvents" :key="event.id">
                    <td>
                      <span class="tag is-info is-light">{{ event.type }}</span>
                    </td>
                    <td class="is-size-7">{{ formatDate(event.scheduled_at) }}</td>
                    <td>{{ event.replicas }}</td>
                    <td class="is-family-monospace is-size-7">{{ event.market }}</td>
                    <td>
                      <span class="tag is-warning is-small">Queued</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Historical Events Section -->
          <div>
            <h3 class="title is-5 mb-3">
              Historical Events ({{ historicalEvents.length }})
            </h3>
            <div v-if="historicalEvents.length === 0" class="notification is-light">
              <div class="has-text-centered py-3">
                <span class="icon has-text-grey-light">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  </svg>
                </span>
                <p class="has-text-grey mt-2">
                  <strong>No historical events</strong>
                </p>
                <p class="has-text-grey-light is-size-7">
                  Past deployment and job events will appear here
                </p>
              </div>
            </div>
            <div v-else class="events-container">
              <div
                v-for="event in historicalEvents"
                :key="event.id || (event.created_at + event.type)"
                class="box mb-3"
                :class="{ 'event-error': event.type.includes('ERROR') }"
              >
                <div class="level mb-2">
                  <div class="level-left">
                    <div class="level-item">
                      <span class="tag" :class="eventTypeClass(event.type)">
                        {{ event.type }}
                      </span>
                    </div>
                    <div class="level-item">
                      <span class="tag is-small" :class="event.source === 'deployment' ? 'is-primary' : 'is-info'">
                        {{ event.source || event.category }}
                      </span>
                    </div>
                  </div>
                  <div class="level-right">
                    <div class="level-item">
                      <span class="has-text-grey is-size-7">
                        {{ formatDate(event.created_at || event.timestamp || '') }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="content">
                  <p>{{ event.message || event.details }}</p>

                  <div v-if="event.tx" class="mt-2">
                    <label class="label is-small">Transaction:</label>
                    <a :href="`https://solscan.io/tx/${event.tx}`" target="_blank" class="is-family-monospace is-size-7">
                      {{ event.tx }}
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
          <h2 class="title is-4 mb-4">Deployment Actions</h2>

          <!-- Deployment Control -->
          <div class="field">
            <label class="label">Deployment Control</label>
            <div class="buttons">
              <button
                v-if="canStart"
                class="button is-success"
                @click="startDeployment"
                :class="{ 'is-loading': actionLoading }"
                :disabled="actionLoading"
              >
                <span class="icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5v14l11-7z" fill="currentColor"/>
                  </svg>
                </span>
                <span>Start Deployment</span>
              </button>

              <button
                v-if="canStop"
                class="button is-warning"
                @click="stopDeployment"
                :class="{ 'is-loading': actionLoading }"
                :disabled="actionLoading"
              >
                <span class="icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6h12v12H6V6z" fill="currentColor"/>
                  </svg>
                </span>
                <span>Stop Deployment</span>
              </button>

              <button
                v-if="canArchive"
                class="button is-danger"
                @click="archiveDeployment"
                :class="{ 'is-loading': actionLoading }"
                :disabled="actionLoading"
              >
                <span class="icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3h18v4H3V3zm2 6h14v12H5V9z" fill="currentColor"/>
                  </svg>
                </span>
                <span>Archive Deployment</span>
              </button>
            </div>
            <p class="help">{{ statusHelpText }}</p>
          </div>

          <!-- Deployment Info -->
          <div class="notification is-info is-light mt-5">
            <p class="mb-2"><strong>Current Status:</strong> {{ deployment.status }}</p>
            <p class="mb-2"><strong>Strategy:</strong> {{ deployment.strategy }}</p>
            <p class="mb-2"><strong>Replicas:</strong> {{ deployment.replicas }}</p>
            <p><strong>Active Jobs:</strong> {{ deployment.jobs?.length || 0 }}</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";
import type { Deployment, JobDefinition } from "@nosana/sdk";
import { Mode, ValidationSeverity } from "vanilla-jsoneditor";
import JsonEditorVue from "json-editor-vue";
import { useToast } from "vue-toastification";

// Types
interface DeploymentJob {
  job: string;
  tx: string;
  created_at: string;
}

interface QueuedEvent {
  id: string;
  type: string;
  scheduled_at: string;
  replicas: number;
  market: string;
}

interface HistoricalEvent {
  id?: string;
  type: string;
  source?: string;
  category?: string;
  timestamp?: string;
  created_at?: string;
  message?: string;
  details?: string;
  tx?: string;
}

// Composables
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { connected } = useWallet();
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
const jobActivityTab = ref<'active' | 'history'>('active');
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
      return "is-success";
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

const loadDeployment = async () => {
  if (!connected.value) {
    error.value = "Please connect your wallet first";
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const deploymentId = route.params.id as string;
    console.log("Loading deployment:", deploymentId);

    const result = await nosana.value.deployments.get(deploymentId);
    console.log("Deployment loaded:", result);

    let vaultBalance = { SOL: 0, NOS: 0 };
    if (result.vault) {
      try {
        const balance = await result.vault.getBalance();
        console.log("Vault balance:", balance);
        vaultBalance = balance;
      } catch (balanceError) {
        console.error("Error fetching vault balance:", balanceError);
      }
    }

    deployment.value = result as Deployment;

    if (result.market) {
      await loadMarket(result.market.toString());
    }

    // Load job definition
    await loadJobDefinition();
  } catch (err: any) {
    console.error("Error loading deployment:", err);
    error.value = `Failed to load deployment: ${err.message}`;
  } finally {
    loading.value = false;
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
const activeJobs = computed((): DeploymentJob[] => {
  // For now, treat all jobs as active since we don't have job status
  // In the future, filter by job.status === 'RUNNING' || 'QUEUED'
  return (deployment.value?.jobs as DeploymentJob[]) || [];
});

const historicalJobs = computed((): DeploymentJob[] => {
  // For now, empty since we don't have job status
  // In the future, filter by job.status === 'COMPLETED' || 'STOPPED'
  return [];
});

// Deployment endpoints
const deploymentEndpoints = computed(() => {
  if (!deployment.value?.id || !jobDefinitionModel.value?.ops) return [];
  
  const endpoints: Array<{
    opId: string;
    port: number;
    url: string;
    status: string;
    statusClass: string;
  }> = [];
  
  const deploymentId = deployment.value.id;
  const config = useRuntimeConfig();
  
  jobDefinitionModel.value.ops.forEach((op: any) => {
    if (op.type === 'container/run' && op.args?.expose) {
      const exposeArray = Array.isArray(op.args.expose) ? op.args.expose : [op.args.expose];
      
      exposeArray.forEach((expose: any) => {
        const port = typeof expose === 'number' ? expose : expose?.port;
        if (port) {
          endpoints.push({
            opId: op.id || 'main',
            port,
            url: `https://${deploymentId}.${config.public.nodeDomain}:${port}`,
            status: deployment.value?.status === 'RUNNING' ? 'Online' : 'Offline',
            statusClass: deployment.value?.status === 'RUNNING' ? 'is-success' : 'is-light'
          });
        }
      });
    }
  });
  
  return endpoints;
});

// Events split: queued vs historical
const queuedEvents = computed((): QueuedEvent[] => {
  // Queued events have a unique shape with scheduled_at, replicas, market
  // They are future events that haven't been executed yet
  if (!deployment.value?.schedule) return [];
  
  // For SCHEDULED deployments, parse schedule and generate queued events
  // This is a placeholder - actual implementation would parse cron schedule
  return [];
});

const historicalEvents = computed((): HistoricalEvent[] => {
  // Historical events are past events from both deployment and jobs
  // They share the same object shape with type, timestamp/created_at, message/details
  return (deployment.value?.events as HistoricalEvent[]) || [];
});

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
    await action();
    toast.success(successMessage);
    
    if (shouldRedirect) {
      setTimeout(() => router.push("/deployment"), 2000);
    } else {
      await loadDeployment();
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
