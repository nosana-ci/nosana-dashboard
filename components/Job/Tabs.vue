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
    :chatServiceUrl="chatServiceUrl" />
  <div v-if="activeTab === 'details'">
    <table class="table is-fullwidth">
      <tbody>
        <HostSpecifications v-if="props.job && props.job.node && props.job.node.toString() !== '11111111111111111111111111111111'" :node-address="props.job.node.toString()" />
        <DeploymentInfo v-if="props.job && props.job.node && props.job.node.toString() !== '11111111111111111111111111111111'" :job="props.job" :jobDefinition="props.jobDefinition" />
      </tbody>
    </table>
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
import HostSpecifications from "~/components/Info/HostSpecifications.vue";
import DeploymentInfo from "~/components/Info/DeploymentInfo.vue";

import type { Endpoints, UseJob } from "~/composables/jobs/useJob";
import type { LogEntry, ProgressBar } from "~/composables/jobs/useJobLogs";

interface Props {
  job: UseJob;
  endpoints: Endpoints;
  isJobPoster: boolean;
  jobDefinition: JobDefinition;
  hasArtifacts: boolean;
  isConnecting: boolean;
  logConnectionEstablished: boolean;
  systemLogs: LogEntry[];
  containerLogs: LogEntry[];
  progressBars: Map<string, ProgressBar>;
  resourceProgressBars: Map<string, any>;
  showChatTab?: boolean;
  chatServiceUrl?: string | null;
  activeTab: string; // Prop for active tab
  logsTextForCopy?: string;
  copyToClipboard?: (text: string | undefined, type: string) => Promise<void>;
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
</style>
