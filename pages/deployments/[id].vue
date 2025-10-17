<template>
  <div>
    <TopBar
      title="Deployment Overview"
      subtitle="Find information about and manage your deployment here."
    />

    <Loader v-if="loading" />
    <div v-else-if="error" class="box">
      <div class="notification is-danger">
        <p>{{ error }}</p>
      </div>
    </div>

    <div v-else-if="deployment">
      <!-- Unified Card -->
      <div class="box" style="padding: 0; overflow: visible;">
        <!-- Header Section -->
        <div style="padding: 1.5rem; border-bottom: 1px solid #dbdbdb;">
          <div class="is-flex is-justify-content-space-between is-align-items-center">
            <div class="is-flex is-align-items-center">
              <NuxtLink to="/deployments" class="button is-ghost back-button" style="padding: 0.5rem 1rem; margin-right: 1rem;">
                <span class="icon is-small">
                  <img src="/assets/img/icons/arrow-up.svg" style="width: 16px; height: 16px; transform: rotate(-90deg);" />
                </span>
              </NuxtLink>
              <div>
                <h1 class="title is-4" style="font-weight: 400; margin: 0;">{{ deployment.name }}</h1>
              </div>
              <div class="tag is-outlined is-light" style="margin-left: 2rem;" :class="statusClass(deployment.status)">
                <img class="mr-2" :src="`/img/icons/status/${getStatusIcon(deployment.status)}.svg`" />
                <span>{{ deployment.status }}</span>
              </div>
            </div>
            <div class="deployment-tabs">
              <button 
                v-for="tab in ['overview', 'logs', 'events', 'job-definition']"
                :key="tab"
                @click="activeTab = tab"
                :class="{ 'is-active': activeTab === tab }"
                class="tab-button"
              >
                {{ tab === 'job-definition' ? 'Definition' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
              </button>
              <!-- Actions Dropdown -->
              <div class="dropdown is-right" :class="{ 'is-active': isActionsDropdownOpen }" ref="actionsDropdown">
                <div class="dropdown-trigger">
                  <button 
                    class="tab-button actions-button" 
                    @click="isActionsDropdownOpen = !isActionsDropdownOpen"
                    :class="{ 'is-loading': actionLoading }"
                  >
                    <span>Actions</span>
                    <span class="icon is-small dropdown-arrow" :class="{ 'is-rotated': isActionsDropdownOpen }" style="margin-left: 0.25rem;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                  </button>
                </div>
                <div class="dropdown-menu">
                  <div class="dropdown-content">
                    <!-- Start Action -->
                    <a 
                      v-if="canStart"
                      class="dropdown-item"
                      @click="startDeployment(); isActionsDropdownOpen = false"
                      :disabled="actionLoading"
                    >
                      <span class="icon is-small mr-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M8 5v14l11-7z" fill="currentColor"/>
                        </svg>
                      </span>
                      <span>Start</span>
                    </a>
                    
                    <!-- Stop Action -->
                    <a 
                      v-if="canStop"
                      class="dropdown-item"
                      @click="stopDeployment(); isActionsDropdownOpen = false"
                      :disabled="actionLoading"
                    >
                      <span class="icon is-small mr-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M6 6h12v12H6V6z" fill="currentColor"/>
                        </svg>
                      </span>
                      <span>Stop Deployment</span>
                    </a>

                    <!-- Archive Action -->
                    <a 
                      v-if="canArchive"
                      class="dropdown-item"
                      @click="archiveDeployment(); isActionsDropdownOpen = false"
                      :disabled="actionLoading"
                    >
                      <span class="icon is-small mr-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M3 3h18v4H3V3zm2 6h14v12H5V9z" fill="currentColor"/>
                        </svg>
                      </span>
                      <span>Archive</span>
                    </a>

                    <hr class="dropdown-divider" v-if="(canStart || canStop || canArchive) && deployment.status !== 'ARCHIVED'">

                    <!-- Update Replicas Action -->
                    <a 
                      v-if="deployment.status !== 'ARCHIVED'"
                      class="dropdown-item"
                      @click="showReplicasModal = true; isActionsDropdownOpen = false"
                      :disabled="actionLoading"
                    >
                      <span class="icon is-small mr-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="3" width="7" height="7" stroke-width="2"/>
                          <rect x="14" y="3" width="7" height="7" stroke-width="2"/>
                          <rect x="3" y="14" width="7" height="7" stroke-width="2"/>
                          <rect x="14" y="14" width="7" height="7" stroke-width="2"/>
                        </svg>
                      </span>
                      <span>Update Replicas</span>
                    </a>

                    <!-- Update Timeout Action -->
                    <a 
                      v-if="deployment.status !== 'ARCHIVED'"
                      class="dropdown-item"
                      @click="showTimeoutModal = true; isActionsDropdownOpen = false"
                      :disabled="actionLoading"
                    >
                      <span class="icon is-small mr-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" stroke-width="2"/>
                          <path d="M12 6v6l4 2" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </span>
                      <span>Update Timeout</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tab Content -->
        <div style="padding: 1.5rem;">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">
          
          <!-- Deployment Details Section -->
          <div class="mb-5">
            <h2 class="title is-5 mb-3">Deployment details</h2>
            <div class="box" style="padding: 0;">
              <table class="table is-fullwidth" style="margin: 0;">
                <tbody>
                  <tr>
                    <td style="width: 250px;">Deployment strategy</td>
                    <td>{{ deployment.strategy }}</td>
                  </tr>
                  <tr>
                    <td>Replicas count</td>
                    <td>{{ deployment.replicas }}</td>
                  </tr>
                  
                  <tr>
                    <td>Container creation timeout</td>
                    <td>{{ Math.floor(deployment.timeout / 3600) }} hours</td>
                  </tr>
                  <tr>
                    <td>Created on</td>
                    <td>{{ formatDate(deployment.created_at) }}</td>
                  </tr>
                  <tr>
                    <td>Last updated on</td>
                    <td>{{ formatDate(deployment.updated_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Endpoints Section -->
          <div v-if="deploymentEndpoints.length > 0" class="mb-5">
            <h2 class="title is-5 mb-3">Endpoints</h2>
            <div class="box" style="padding: 0;">
              <table class="table is-fullwidth" style="margin: 0;">
                <thead>
                  <tr>
                    <th>Operation</th>
                    <th>Port</th>
                    <th>URL</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="endpoint in deploymentEndpoints" :key="`${endpoint.opId}-${endpoint.port}`">
                    <td>{{ endpoint.opId }}</td>
                    <td>{{ endpoint.port }}</td>
                    <td>
                      <a :href="endpoint.url" target="_blank" class="has-text-link">{{ endpoint.url }} ↗</a>
                    </td>
                    <td>
                      <span class="tag is-small" :class="endpoint.statusClass">{{ endpoint.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Job Activity Section -->
          <div>
            <h2 class="title is-5 mb-3">Job activity</h2>
            
            <!-- Job Activity Tabs -->
            <div class="mb-3" style="display: flex; gap: 8px; margin-left: 1rem;">
              <button 
                @click="jobActivityTab = 'running'"
                class="tab-button"
                :class="{ 'is-active': jobActivityTab === 'running' }"
              >
                Running
              </button>
              <button 
                @click="jobActivityTab = 'history'"
                class="tab-button"
                :class="{ 'is-active': jobActivityTab === 'history' }"
              >
                History
              </button>
            </div>
            
            <!-- Running Jobs -->
            <div v-if="jobActivityTab === 'running'">
              <div v-if="activeJobs.length === 0" class="box has-text-centered" style="padding: 2rem;">
                <p class="has-text-grey">
                  <span v-if="deployment.status === 'DRAFT'">Start deployment to create jobs</span>
                  <span v-else>No running jobs</span>
                </p>
              </div>
              
              <div v-else class="box" style="padding: 0;">
                <table class="table is-fullwidth" style="margin: 0;">
                  <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Revisions</th>
                    <th>Created on</th>
                    <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="job in activeJobs"
                      :key="job.job"
                    >
                      <td>
                        <span class="is-family-monospace is-size-7">{{ job.job }}</span>
                      </td>
                      <td>
                        <JobStatus :status="job.state || 0" />
                      </td>
                      <td>0</td>
                      <td>{{ formatDate(job.created_at) }}</td>
                      <td>
                        <a
                          :href="`/jobs/${job.job}`"
                          target="_blank"
                          style="color: #1967D2; text-decoration: none;"
                        >
                          View job ↗
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Historical Jobs -->
            <div v-if="jobActivityTab === 'history'">
              <div v-if="historicalJobs.length === 0" class="box has-text-centered" style="padding: 2rem;">
                <p class="has-text-grey">No completed jobs yet</p>
              </div>
              
              <div v-else class="box" style="padding: 0;">
                <table class="table is-fullwidth" style="margin: 0;">
                  <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Revisions</th>
                    <th>Created on</th>
                    <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="job in historicalJobs"
                      :key="job.job"
                    >
                      <td>
                        <span class="is-family-monospace is-size-7">{{ job.job }}</span>
                      </td>
                      <td>
                        <JobStatus :status="job.state || 0" />
                      </td>
                      <td>0</td>
                      <td>{{ formatDate(job.created_at) }}</td>
                      <td>
                        <a
                          :href="`/jobs/${job.job}`"
                          target="_blank"
                          style="color: #1967D2; text-decoration: none;"
                        >
                          View job ↗
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Events Tab -->
        <div v-if="activeTab === 'events'">
          <!-- Upcoming Tasks -->
          <div class="mb-5">
            <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
              <h2 class="title is-5 mb-0">Upcoming Tasks <span class="tag is-light">{{ tasks.length }}</span></h2>
              <button 
                class="button is-small" 
                @click="loadTasks"
                :class="{ 'is-loading': tasksLoading }"
                :disabled="tasksLoading"
                data-tooltip="Refresh upcoming tasks"
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

          <!-- History -->
          <div>
            <h2 class="title is-5 mb-3">History <span class="tag is-light">{{ deploymentEvents.length }}</span></h2>
            
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

        <!-- Logs Tab -->
        <div v-if="activeTab === 'logs'">
          <div class="notification is-light has-text-centered">
            <p class="has-text-grey">Deployment logs will be displayed here</p>
          </div>
        </div>

        <!-- Job Definition Tab -->
        <div v-if="activeTab === 'job-definition'">

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

        </div>
      </div>
    </div>

    <!-- Update Replicas Modal -->
    <div v-if="deployment" class="modal" :class="{ 'is-active': showReplicasModal }">
      <div class="modal-background" @click="showReplicasModal = false"></div>
      <div class="modal-card" style="max-width: 400px;">
        <header class="modal-card-head">
          <p class="modal-card-title">Update Replicas</p>
          <button class="delete" @click="showReplicasModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">
              Replica Count
              <span class="icon is-small has-tooltip-arrow" data-tooltip="Number of parallel job instances">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" stroke-width="2"/>
                  <path d="M12 16v-4m0-4h.01" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
            </label>
            <div class="control">
              <input
                type="number"
                class="input"
                v-model.number="newReplicaCount"
                min="1"
                max="100"
                :placeholder="deployment.replicas.toString()"
              />
            </div>
            <p class="help">Current: {{ deployment.replicas }}</p>
          </div>
        </section>
        <footer class="modal-card-foot" style="justify-content: flex-end;">
          <button class="button" @click="showReplicasModal = false">Cancel</button>
          <button 
            class="button is-success"
            @click="updateReplicas(); showReplicasModal = false"
            :class="{ 'is-loading': actionLoading }"
            :disabled="actionLoading || !newReplicaCount || newReplicaCount < 1"
          >
            Update
          </button>
        </footer>
      </div>
    </div>

    <!-- Update Timeout Modal -->
    <div v-if="deployment" class="modal" :class="{ 'is-active': showTimeoutModal }">
      <div class="modal-background" @click="showTimeoutModal = false"></div>
      <div class="modal-card" style="max-width: 400px;">
        <header class="modal-card-head">
          <p class="modal-card-title">Update Timeout</p>
          <button class="delete" @click="showTimeoutModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">
              Timeout (hours)
              <span class="icon is-small has-tooltip-arrow" data-tooltip="Maximum runtime before auto-shutdown">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" stroke-width="2"/>
                  <path d="M12 16v-4m0-4h.01" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
            </label>
            <div class="control">
              <input
                type="number"
                class="input"
                v-model.number="newTimeoutHours"
                min="0.0167"
                step="0.1"
                :placeholder="(deployment.timeout / 3600).toFixed(2)"
              />
            </div>
            <p class="help">Current: {{ (deployment.timeout / 3600).toFixed(2) }}h</p>
          </div>
        </section>
        <footer class="modal-card-foot" style="justify-content: flex-end;">
          <button class="button" @click="showTimeoutModal = false">Cancel</button>
          <button 
            class="button is-success"
            @click="updateJobTimeout(); showTimeoutModal = false"
            :class="{ 'is-loading': actionLoading }"
            :disabled="actionLoading || !newTimeoutHours || newTimeoutHours < 0.0167"
          >
            Update
          </button>
        </footer>
      </div>
    </div>
  </div>

  
</template>

<script setup lang="ts">
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
const { status, token } = useAuth();
const isAuthenticated = computed(() => status.value === 'authenticated' && token.value)
const { getIpfs } = useIpfs();

// State
const deployment = ref<Deployment | null>(null);
const marketData = ref<any>(null);
const loadingMarket = ref(false);
const loading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref("overview");
const jobActivityTab = ref("running");
const actionLoading = ref(false);
const newReplicaCount = ref<number | null>(null);
const newTimeoutHours = ref<number | null>(null);
const authHeader = ref<string>('');
const showTopupModal = ref(false);
const userNosBalance = ref<number>(0);
const userSolBalance = ref<number>(0);
const tasks = ref<any[]>([]);
const tasksLoading = ref(false);
const isActionsDropdownOpen = ref(false);
const showReplicasModal = ref(false);
const showTimeoutModal = ref(false);
const actionsDropdown = ref<HTMLElement | null>(null);
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
      return "is-stopped";
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
  if (!isAuthenticated.value) {
    error.value = "Please log in to view deployments";
    if (!silent) loading.value = false;
    return;
  }

  try {
    if (!silent) loading.value = true;
    error.value = null;

    const deploymentId = route.params.id as string;
    const data = await useApiFetch<Deployment>(`/api/deployments/${deploymentId}`, {
      method: 'GET',
      auth: true,
    });

    deployment.value = data as Deployment;

    if (deployment.value.market) {
      await loadMarket(deployment.value.market.toString());
    }

    await loadJobDefinition();

    if (deployment.value.jobs && deployment.value.jobs.length > 0) {
      for (const job of deployment.value.jobs) {
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
  const enrichedJobs = jobs.map(job => ({
    ...job,
    state: jobStates.value[job.job] ?? 0
  })).reverse();
  
  // Filter for running jobs (states: QUEUED=0, RUNNING=1)
  return enrichedJobs.filter(job => job.state === 0 || job.state === 1);
});

const historicalJobs = computed((): DeploymentJob[] => {
  const jobs = (deployment.value?.jobs as DeploymentJob[]) || [];
  // Enrich jobs with fetched states and reverse to show most recent first
  const enrichedJobs = jobs.map(job => ({
    ...job,
    state: jobStates.value[job.job] ?? 0
  })).reverse();
  
  // Filter for completed/stopped jobs (states: DONE=2, STOPPED=3, TIMEOUT=4, ERROR=5)
  return enrichedJobs.filter(job => job.state >= 2);
});

// Deployment endpoints - use API-provided endpoints when available
const deploymentEndpoints = computed(() => {
  if (!deployment.value?.endpoints) return [];
  const isRunning = deployment.value.status === 'RUNNING';
  return deployment.value.endpoints.map((endpoint: any) => ({
    opId: endpoint.opId,
    port: endpoint.port,
    url: endpoint.url,
    status: isRunning ? 'Online' : 'Offline',
    statusClass: isRunning ? 'is-success' : 'is-light'
  }));
});

// All deployment events
const deploymentEvents = computed((): DeploymentEvent[] => {
  const events = (deployment.value?.events as DeploymentEvent[]) || [];
  // Reverse to show most recent first
  return [...events].reverse();
});

// No vault actions in API mode

// Generic deployment action handler
const executeDeploymentAction = async (
  actionUrl: string,
  successMessage: string,
  shouldRedirect = false
) => {
  if (!deployment.value || !isAuthenticated.value) {
    toast.error("Please log in to perform this action");
    return;
  }

  try {
    actionLoading.value = true;
    await useApiFetch(actionUrl, { method: 'POST', auth: true });
    toast.success(successMessage);

    if (shouldRedirect) {
      setTimeout(() => router.push("/deployment"), 2000);
    } else {
      await loadDeployment(true);
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
  `/api/deployments/${deployment.value!.id}/start`,
  "Deployment started successfully"
);

const stopDeployment = () => executeDeploymentAction(
  `/api/deployments/${deployment.value!.id}/stop`,
  "Deployment stopped successfully"
);

const archiveDeployment = async () => {
  if (!confirm("Are you sure you want to archive this deployment? This action cannot be undone.")) {
    return;
  }
  
  await executeDeploymentAction(
    `/api/deployments/${deployment.value!.id}/archive`,
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
    `/api/deployments/${deployment.value!.id}/replicas`,
    `Replica count updated to ${newReplicaCount.value}`
  );
  
  newReplicaCount.value = null;
};

const updateJobTimeout = async () => {
  if (!newTimeoutHours.value || newTimeoutHours.value < 0.0167) {
    toast.error("Timeout must be at least 1 minute (0.0167 hours)");
    return;
  }

  await executeDeploymentAction(
    `/api/deployments/${deployment.value!.id}/timeout`,
    `Job timeout updated to ${newTimeoutHours.value} hours`
  );
  
  newTimeoutHours.value = null;
};

// Vault functionality removed in API mode

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

// Click outside handler to close dropdown
const handleClickOutside = (event: MouseEvent) => {
  if (actionsDropdown.value && !actionsDropdown.value.contains(event.target as Node)) {
    isActionsDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Watchers
watch(
  isAuthenticated,
  (authed) => {
    if (authed) {
      loadDeployment();
    } else {
      error.value = "Please log in to view deployments";
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

.deployment-tabs {
  display: flex;
  gap: 8px;
}

.tag.is-stopped {
  background-color: #f8f9fa !important;
  border-color: #dee2e6 !important;
  color: #6c757d !important;
  
  img {
    width: 12px !important;
    height: 12px !important;
  }
}

.dark-mode .tag.is-stopped {
  background-color: #2c2c2c !important;
  border-color: #3a3a3a !important;
  color: #9e9e9e !important;
  
  img {
    width: 12px !important;
    height: 12px !important;
  }
}

.dropdown-arrow {
  transition: transform 0.2s ease;
  transform: rotate(90deg);
  
  &.is-rotated {
    transform: rotate(0deg);
  }
}

.back-button.is-ghost {
  border: none !important;
  
  &:hover,
  &:focus,
  &:active {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
}

</style>
