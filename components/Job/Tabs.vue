<template>
  <div class="tabs is-boxed job-tabs-condensed">
    <ul>
      <li
        v-if="canShowGroupsTab"
        :class="{ 'is-active': activeTab === 'groups' }"
      >
        <a @click.prevent="handleTabClick('groups')">Overview</a>
      </li>
      <li v-if="canShowLogsTab" :class="{ 'is-active': activeTab === 'logs' }">
        <a @click.prevent="handleTabClick('logs')">System Logs</a>
      </li>
      
      <li v-if="!props.isConfidential" :class="{ 'is-active': activeTab === 'info' }">
        <a @click.prevent="handleTabClick('info')">Job Definition</a>
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
  <div v-if="activeTab === 'info' && !props.isConfidential" class="job-definition-container">
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
  <div v-if="activeTab === 'logs' && canShowLogsTab" class="logs-wrapper">
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
  <div v-else-if="activeTab === 'logs' && !canShowLogsTab"></div>
  
  <JobArtifactsView v-if="activeTab === 'artifacts'" :job="props.job" />
  <JobChatView 
    v-show="activeTab === 'chat' && showChatTab" 
    :job="props.job" 
    :chatServiceUrl="chatServiceUrl" 
    :chatApiConfig="chatApiConfig" />
  <JobGroups
    v-if="activeTab === 'groups'"
    :job="props.job"
    :isJobPoster="props.isJobPoster"
    :opIds="props.opIds"
    :activeLogs="props.activeLogs"
    :selectOp="props.selectOp"
    :logsByOp="props.logsByOp"
    :systemLogsMap="props.systemLogsMap"
    :jobInfo="props.jobInfo"
  />
</template>

<script setup lang="ts">
import { ref, nextTick, computed, watch, onMounted } from 'vue';
import type { JobDefinition } from "@nosana/sdk";
import JsonEditorVue from 'json-editor-vue';
import { Mode } from 'vanilla-jsoneditor';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
import { useToast } from 'vue-toastification';

import JobLogsView from "./Tabs/SystemLogs.vue";
import JobArtifactsView from "./Tabs/Artifacts.vue";
import JobDefinitionView from "./Tabs/JobDefinition.vue";
import JobChatView from "./Tabs/Chat.vue";
import JobGroups from "./Tabs/Overview.vue";

import type { Endpoints, UseJob } from "~/composables/jobs/useJob";
import type { JobInfo } from "~/composables/jobs/types";
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
  isConfidential?: boolean;
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
  
  // Full log maps from useFLogs
  logsByOp?: Map<string, AnyLogEntry[]>;
  systemLogsMap?: AnyLogEntry[];
  jobInfo?: JobInfo | null;
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

const canShowLogsTab = computed(() => {
  if (props.job.isCompleted) return false;
  
  if (!props.job.isRunning) return false;
  
  if (props.isConfidential && !props.isJobPoster) return false;
  
  return props.isJobPoster && props.logConnectionEstablished;
});

// Groups tab visibility: show for posters always; for non-posters only when
// job is non-confidential and completed (so data is available from IPFS)
const canShowGroupsTab = computed(() => {
  if (props.isJobPoster) return true;
  if (props.isConfidential) return false;
  return Boolean(props.job.isCompleted);
});


// Compute visible tabs in left-to-right order and default to the leftmost
const visibleTabs = computed(() => {
  const tabs: string[] = [];
  if (canShowGroupsTab.value) tabs.push('groups');
  if (canShowLogsTab.value) tabs.push('logs');
  if (!props.isConfidential) tabs.push('info');
  if (props.hasArtifacts) tabs.push('artifacts');
  if (props.showChatTab) tabs.push('chat');
  return tabs;
});

const firstVisibleTab = computed(() => visibleTabs.value[0] || 'info');

const isTabVisible = (tabName: string) => visibleTabs.value.includes(tabName);

// Keep active tab valid and default to the leftmost visible
watch(
  () => [
    canShowLogsTab.value,
    canShowGroupsTab.value,
    props.job.isCompleted,
    props.isConfidential,
    props.isJobPoster,
    props.hasArtifacts,
    props.showChatTab,
    props.activeTab,
  ],
  () => {
    if (!isTabVisible(props.activeTab)) {
      emit('update:activeTab', firstVisibleTab.value);
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (props.activeTab !== firstVisibleTab.value) {
    emit('update:activeTab', firstVisibleTab.value);
  }
});

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

/* Empty state styling (match Groups) */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #7a7a7a;
}

/* Container to match Groups' white card sizing */
.results-groups-like-container {
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 8px;
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

  /* Match Groups dark-mode empty state color */
  .empty-state {
    color: #b0b0b0;
  }

  /* Dark mode for results container to match Groups */
  .results-groups-like-container {
    background: #2c2c2c;
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

div[class*="has-background-white"] {
  padding-top: 0.2rem !important;
  padding-bottom: 0.2rem !important;
}

</style>
