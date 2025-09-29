<template>
  <div class="tabs is-boxed job-tabs-condensed">
    <ul>
      <li v-if="!job.isRunning || (isJobPoster && logConnectionEstablished)" :class="{ 'is-active': activeTab === 'logs' }">
        <a @click.prevent="handleTabClick('logs')">Logs</a>
      </li>
      <li v-if="hasResultsSection" :class="{ 'is-active': activeTab === 'result' }">
        <a @click.prevent="handleTabClick('result')">Result</a>
      </li>
      <li :class="{ 'is-active': activeTab === 'info' }">
        <a @click.prevent="handleTabClick('info')">Job Definition</a>
      </li>
      <li :class="{ 'is-active': activeTab === 'details' }">
        <a @click.prevent="handleTabClick('details')">More Details</a>
      </li>
      <li
        v-if="hasArtifacts"
        :class="{ 'is-active': activeTab === 'artifacts' }"
      >
        <a @click.prevent="handleTabClick('artifacts')">Artifacts</a>
      </li>
      <li
        v-if="showChatTab" 
        :class="{ 'is-active': activeTab === 'chat' }"
      >
        <a @click.prevent="handleTabClick('chat')">Test Chat</a>
      </li>
    </ul>
  </div>
  <div v-if="activeTab === 'info'" class="job-definition-container">
    <button 
      class="button is-small is-light copy-button"
      @click="copyToClipboard(JSON.stringify(jobDefinitionModel, null, 2), 'Job Definition')"
    >
      <span class="icon is-small">
        <img src="~/assets/img/icons/copy.svg" alt="Copy" />
      </span>
    </button>
    <JsonEditorVue 
      :validator="validator" 
      :class="{ 
        'jse-theme-dark': colorMode.value === 'dark'
      }" 
      v-model="jobDefinitionModel" 
      :mode="Mode.text" 
      :mainMenuBar="false" 
      :statusBar="false" 
      :stringified="false" 
      :readOnly="true"
      class="job-definition-editor" 
  />
  </div>
  <div v-if="activeTab === 'logs'" class="logs-wrapper">
  <JobLogsView
    :job="props.job"
    :endpoints="props.endpoints"
    :jobDefinition="props.jobDefinition"
    :signMessageError="false"
    :isJobPoster="props.isJobPoster"
    :loading="false"
    :isConnecting="props.isConnecting"
    :logConnectionEstablished="props.logConnectionEstablished"
    :systemLogs="props.systemLogs"
    :containerLogs="props.containerLogs"
    :progressBars="props.progressBars"
    :resourceProgressBars="props.resourceProgressBars"
    :activeLogs="props.activeLogs"
    :opIds="props.opIds"
    :filters="props.filters"
    :selectOp="props.selectOp"
    :toggleType="props.toggleType"
      :logsTextForCopy="logsTextForCopy"
      :copyToClipboard="copyToClipboard"
    ref="logsView"
  />
  </div>
  <div v-else-if="activeTab === 'logs' && !props.isJobPoster">
    <!-- Placeholder or message if logs are not available for non-posters -->
  </div>
  <div v-if="activeTab === 'result' && props.job.results" class="job-definition-container">
    <button 
      class="button is-small is-light copy-button"
      @click="copyToClipboard(JSON.stringify(structuredResults, null, 2), 'Results')"
    >
      <span class="icon is-small">
        <img src="~/assets/img/icons/copy.svg" alt="Copy" />
      </span>
    </button>
    <JsonEditorVue 
      :validator="validator" 
      :class="{ 
        'jse-theme-dark': colorMode.value === 'dark'
      }" 
      v-model="structuredResults" 
      :mode="Mode.text" 
      :mainMenuBar="false" 
      :statusBar="false" 
      :stringified="false" 
      :readOnly="true"
      class="job-definition-editor"
    />
  </div>
  <div v-else-if="activeTab === 'result' && !props.job.results">
    <p class="p-4 has-text-centered">No results available for this job.</p>
  </div>
  <JobArtifactsView v-if="activeTab === 'artifacts'" :job="props.job" />
  <JobChatView 
    v-show="activeTab === 'chat' && showChatTab" 
    :job="props.job" 
    :chatServiceUrl="chatServiceUrl" 
    :chatApiConfig="chatApiConfig" />
  <div v-if="activeTab === 'details'" class="details-tab-content">
    <div class="columns is-multiline">
      <!-- Started -->
      <div v-if="props.job && props.job.timeStart" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Started</span>
          <span class="quick-detail-value">
            {{ formatStartTime(props.job.timeStart) }}
            <span class="has-text-grey is-size-7"> ({{ formatTimeAgo(props.job.timeStart) }})</span>
          </span>
        </div>
      </div>

      <!-- NVIDIA Driver -->
      <div v-if="hostSpecs && hostSpecs.nvmlVersion" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">NVIDIA Driver</span>
          <span class="quick-detail-value">{{ hostSpecs.nvmlVersion }}</span>
        </div>
      </div>

      <!-- CUDA Version -->
      <div v-if="hostSpecs && hostSpecs.cudaVersion" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">CUDA Version</span>
          <span class="quick-detail-value">{{ hostSpecs.cudaVersion }}</span>
        </div>
      </div>

      <!-- System Environment -->
      <div v-if="hostSpecs && hostSpecs.systemEnvironment" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">System Environment</span>
          <span class="quick-detail-value">{{ hostSpecs.systemEnvironment }}</span>
        </div>
      </div>

      <!-- Solana address -->
      <div v-if="props.job" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Solana address</span>
          <span class="quick-detail-value">
            <a :href="`https://solscan.io/account/${props.job.address}`" target="_blank" class="address is-family-monospace">
              {{ props.job.address }}
            </a>
          </span>
        </div>
      </div>

      <!-- Host address -->
      <div v-if="props.job && props.job.node && props.job.node.toString() !== '11111111111111111111111111111111'" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Host address</span>
          <span class="quick-detail-value">
            <nuxt-link class="address is-family-monospace" :to="`/host/${props.job.node}`">
              {{ props.job.node }}
            </nuxt-link>
          </span>
        </div>
      </div>

      <!-- Deployer address -->
      <div v-if="props.job" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">Deployer address</span>
          <span class="quick-detail-value">
            <nuxt-link class="address is-family-monospace" :to="`/deployer/${props.job.project}`">
              {{ props.job.project }}
            </nuxt-link>
          </span>
        </div>
      </div>

      <!-- GPU pool -->
      <div v-if="props.job" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">GPU pool</span>
          <span class="quick-detail-value">
            <nuxt-link class="address is-family-monospace" :to="`/markets/${props.job.market}`">
              <span v-if="apiMarkets && apiMarkets.find((tgm: any) => tgm.address === props.job.market)">
                {{ apiMarkets.find((tgm: any) => tgm.address === props.job.market)?.name || props.job.market }}
              </span>
              <span v-else>{{ props.job.market }}</span>
            </nuxt-link>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, watch } from 'vue';
import type { JobDefinition } from "@nosana/sdk";
import JsonEditorVue from 'json-editor-vue';
import { Mode } from 'vanilla-jsoneditor';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
import { useToast } from 'vue-toastification';

import JobLogsView from "./Tabs/Logs.vue";
import JobResultsView from "./Tabs/Results.vue";
import JobArtifactsView from "./Tabs/Artifacts.vue";
import JobDefinitionView from "./Tabs/JobDefinition.vue";
import JobChatView from "./Tabs/Chat.vue";
// Note: Info components no longer needed for simplified More Details tab

import type { Endpoints, UseJob } from "~/composables/jobs/useJob";
// Relax log entry typing to support flog entries
type AnyLogEntry = { id: number; content: string; timestamp: number; html?: boolean };
import type { ProgressBar } from "~/composables/jobs/useJobLogs";

// Define NodeReport interface if not already globally available
interface NodeReportData {
  node: string;
  participationRate: number;
  uptimePercentage: number;
}

interface Props {
  job: UseJob;
  endpoints: Endpoints;
  isJobPoster: boolean;
  jobDefinition: JobDefinition;
  hasArtifacts: boolean;
  isConnecting: boolean;
  logConnectionEstablished: boolean;
  systemLogs: AnyLogEntry[];
  containerLogs: AnyLogEntry[];
  progressBars: Map<string, ProgressBar>;
  resourceProgressBars: Map<string, any>;
  showChatTab?: boolean;
  chatServiceUrl?: string | null;
  chatApiConfig?: {
    path: string;
    model: string;
    headers?: Record<string, string>;
  } | null;
  activeTab: string; // Prop for active tab
  logsTextForCopy?: string;
  copyToClipboard?: (text: string | undefined, type: string) => Promise<void>;
  // Optional parallel logs props forwarded to child
  activeLogs?: AnyLogEntry[];
  opIds?: string[];
  filters?: any;
  selectOp?: (opId: string | null) => void;
  toggleType?: (type: 'container' | 'info' | 'error') => void;

  // Props for HostSpecifications (to be passed from Job.vue)
  jobCombinedSpecs: any | null;
  jobNodeReport: NodeReportData | null;
  loadingJobNodeSpecs: boolean;
  isQueuedJob: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:activeTab']);

const localJobDefinition = ref(props.jobDefinition);
watch(() => props.job.address, (newAddress, oldAddress) => {
  if (newAddress !== oldAddress) {
    localJobDefinition.value = props.jobDefinition;
  }
});

const logsView = ref<any>(null);
const colorMode = useColorMode();

watch(() => [props.job.isRunning, props.logConnectionEstablished, props.activeTab], () => {
  const logsTabVisible = !props.job.isRunning || (props.isJobPoster && props.logConnectionEstablished);
  if (props.activeTab === 'logs' && !logsTabVisible) {
    // Logs tab is not visible, but it's the active one.
    // Switch to another tab, in this case 'info' (Job Definition).
    emit('update:activeTab', 'info');
  }
}, { immediate: true });

// Expose logsView ref for parent component to call scrollToBottomOnOpen
defineExpose({ logsView });

// Host specifications data
const { data: nodeSpecs } = useAPI(`/api/nodes/${props.job.node}/specs`, {
  // @ts-ignore
  disableToastOnError: true,
});

const { data: nodeInfo } = useAPI(
  `https://${props.job.node}.${useRuntimeConfig().public.nodeDomain}/node/info`,
  {
    // @ts-ignore
    disableToastOnError: true,
  }
);

const hostSpecs = computed(() => {
  if (!nodeSpecs.value) return null;
  const nodeInfoData = nodeInfo.value?.info;

  return {
    gpus: nodeInfoData?.gpus?.devices
      ? nodeInfoData.gpus.devices.map((gpu: any) => ({
          gpu: gpu.name,
          memory: gpu.memory?.total_mb,
          architecture: `${gpu.network_architecture?.major}.${gpu.network_architecture?.minor}`,
        }))
      : nodeSpecs.value.gpus,
    cpu: nodeInfoData?.cpu?.model ?? nodeSpecs.value.cpu,
    ram: nodeInfoData?.ram_mb
      ? Math.round(nodeInfoData.ram_mb)
      : Math.round(Number(nodeSpecs.value.ram)),
    diskSpace: nodeInfoData?.disk_gb
      ? Math.round(Number(nodeInfoData.disk_gb))
      : Math.round(Number(nodeSpecs.value.diskSpace)),
    country: nodeInfoData?.country ?? nodeSpecs.value.country,
    cudaVersion: nodeInfoData?.gpus?.cuda_driver_version ?? nodeSpecs.value.cudaVersion,
    nvmlVersion: nodeInfoData?.gpus?.nvml_driver_version ?? nodeSpecs.value.nvmlVersion,
    nodeVersion: nodeInfoData?.version ?? nodeSpecs.value.nodeVersion,
    systemEnvironment: nodeInfoData?.system_environment
      ? nodeInfoData.system_environment.toLowerCase().includes("wsl")
        ? "WSL"
        : nodeInfoData.system_environment
          ? "Linux"
          : null
      : nodeSpecs.value.systemEnvironment
        ? nodeSpecs.value.systemEnvironment.toLowerCase().includes("wsl")
          ? "WSL"
          : "Linux"
        : null,
  };
});

// Get market data for GPU pool names
const { data: apiMarkets } = useAPI("/api/markets");

// Format start time
const formatStartTime = (timeStart: number) => {
  const date = new Date(timeStart * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

// Format time ago
const formatTimeAgo = (timeStart: number) => {
  const now = Date.now();
  const startTime = timeStart * 1000;
  const diffMs = now - startTime;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// Create a reactive model for the job definition
const jobDefinitionModel = computed({
  get: () => localJobDefinition.value,
  set: () => {} // Read-only, so no setter needed
});

// Create a reactive model for the job results
const jobResultsModel = computed({
  get: () => props.job.results,
  set: () => {} // Read-only, so no setter needed
});

// Validator function (can be empty for read-only)
const validator = () => [];

const toast = useToast(); // Correctly get toast functions

const copyToClipboard = async (text: string | undefined, type: string) => {
  if (text === undefined || text === null) {
    console.error(`${type} content is not available to copy.`);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
  }
};

const logsTextForCopy = computed(() => {
  // You might want to decide which logs to copy here, or add another button.
  // For now, let's copy container logs if available, otherwise system logs.
  const logsToCopy = props.containerLogs.length > 0 ? props.containerLogs : props.systemLogs;
  return logsToCopy.map(log => log.content).join('\n');
});

const handleTabClick = (tabName: string) => {
  emit('update:activeTab', tabName);
  
  // If switching to logs tab, auto-scroll to bottom
  if (tabName === 'logs') {
    nextTick(() => {
      if (logsView.value && logsView.value.scrollToBottomOnOpen) {
        logsView.value.scrollToBottomOnOpen();
      }
    });
  }
};

const hasResultsSection = computed(() => {
  if (!props.jobDefinition?.ops) return false;
  return props.jobDefinition.ops.some(op => op.results && Object.keys(op.results).length > 0);
});

// Extract structured results without logs
const structuredResults = computed(() => {
  if (!props.job.results?.opStates) return {};
  
  const results: any = {
    status: props.job.results.status,
    startTime: props.job.results.startTime,
    endTime: props.job.results.endTime,
    opStates: []
  };
  
  for (const opState of props.job.results.opStates) {
    if (opState.results && Object.keys(opState.results).length > 0) {
      results.opStates.push({
        operationId: opState.operationId,
        status: opState.status,
        startTime: opState.startTime,
        endTime: opState.endTime,
        exitCode: opState.exitCode,
        results: opState.results
      });
    }
  }
  
  return results;
});

</script>

<style lang="scss" scoped>
.job-tabs-condensed {
  background-color: #ffffff;
  border-radius: 4px 4px 0 0;
  margin-bottom: 0 !important;
  
  ul {
    border-bottom-width: 1px !important;
    background-color: transparent;
    
    li {
      a {
        padding: 0.4em 0.8em;
        font-size: 0.95rem; /* Increased font size */
        background-color: transparent;
      }
    }
  }
}

.job-definition-container {
  background-color: #ffffff;
  border-radius: 4px;
  padding: 0;
  margin-top: 0.2rem;
  position: relative; /* For copy button positioning */
}

.logs-wrapper {
  position: relative; /* For copy button positioning */
  margin-top: 0.2rem;
}

.copy-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
}

.job-definition-editor {
  min-height: 300px;
  border: none;
  border-radius: 4px;
  
  :deep(.jse-main) {
    border: none;
  }
  
  :deep(.jse-contents) {
    border-radius: 4px;
  }
}

// Dark mode styling for job definition
html.dark-mode {
  .job-tabs-condensed {
    background-color: #2c2c2c;
    
    ul {
      border-bottom-color: #444;
      
      li {
        a {
          color: #ffffff;
          font-size: 0.95rem; /* Increased font size */
          
          &:hover {
            background-color: #363636;
          }
        }
        
        &.is-active a {
          background-color: #2c2c2c;
          border-bottom-color: #444;
          color: #ffffff;
        }
      }
    }
  }
  
  .job-definition-container {
  background-color: #2c2c2c;
  border-color: #444;
    position: relative; /* For copy button positioning */
  }

  // Update table background in dark mode
  .table {
    background-color: #2c2c2c;
    color: #ffffff;

    thead th {
      color: #ffffff;
      border-color: #444;
    }

    td {
      border-color: #444;
      color: #ffffff;
    }
  }
}

// Add styles to remove extra spacing
.tabs {
  margin-bottom: 0.2rem !important;
}

.tabs + div {
  margin-top: 0.2rem !important;
}

// Remove padding from details tab
div[class*="has-background-white"] {
  padding-top: 0.2rem !important;
  padding-bottom: 0.2rem !important;
}

// Add proper spacing for details tab content
.details-tab-content {
  margin-top: 1.5rem;
  padding: 0 0.75rem;
  
  .quick-detail-item {
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    height: 100%;

    .quick-detail-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #7a7a7a;
      text-transform: uppercase;
      margin-bottom: 0.1rem;
    }

    .quick-detail-value {
      font-size: 0.85rem;
      font-weight: 500;
      color: #363636;
      word-break: break-word;
      
      .address {
        word-break: break-all;
        white-space: normal;
        display: inline-block;
        line-height: 1.3;
        font-size: 0.8rem;
      }

      .has-text-grey {
        font-size: 0.75rem;
      }
    }
  }
  
  .no-padding {
    padding: 0 !important;
  }
}

// Dark mode styling for quick detail items
html.dark-mode {
  .details-tab-content .quick-detail-item {
    .quick-detail-label {
      color: #b0b0b0;
    }
    
    .quick-detail-value,
    .quick-detail-value .address,
    .quick-detail-value .has-text-grey {
      color: #ffffff;
    }
    
    .quick-detail-value a,
    .quick-detail-value nuxt-link,
    .quick-detail-value .address {
      color: #10E80C !important; // Nosana green for links in dark mode
    }
    
    .quick-detail-value a:hover,
    .quick-detail-value nuxt-link:hover {
      color: #33ff33 !important; // Lighter green on hover
    }
  }
}
</style>
