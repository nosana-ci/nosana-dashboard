<template>
  <div class="tabs is-boxed job-tabs-condensed">
    <ul>
      <li v-if="isJobPoster" :class="{ 'is-active': activeTab === 'logs' }">
        <a @click.prevent="handleTabClick('logs')">Logs</a>
      </li>
      <li v-if="job.jobResult" :class="{ 'is-active': activeTab === 'result' }">
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
        <a @click.prevent="handleTabClick('chat')">Test-Chat</a>
      </li>
    </ul>
  </div>
  <div v-if="activeTab === 'info'" class="job-definition-container">
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
  <JobLogsView
    v-if="activeTab === 'logs' && isJobPoster"
    :job="job"
    :endpoints="endpoints"
    :jobDefinition="jobDefinition"
    :signMessageError="false"
    :isJobPoster="isJobPoster"
    :loading="false"
    :isConnecting="isConnecting"
    :logs="logs"
    :progressBars="progressBars"
    :resourceProgressBars="resourceProgressBars"
    ref="logsView"
  />
  <JobResultsView v-if="activeTab === 'result'" :job="job" />
  <JobArtifactsView v-if="activeTab === 'artifacts'" :job="job" />
  <JobChatView 
    v-if="activeTab === 'chat' && showChatTab" 
    :job="job" 
    :chatServiceUrl="chatServiceUrl" />
  <div v-if="activeTab === 'details'" class="p-1 py-4 has-background-white">
    <table class="table is-fullwidth">
      <tbody>
        <HostSpecifications v-if="job && job.node && job.node.toString() !== '11111111111111111111111111111111'" :node-address="job.node.toString()" />
        <DeploymentInfo v-if="job && job.node && job.node.toString() !== '11111111111111111111111111111111'" :address="job.address" :node="job.node.toString()" :project="job.project.toString()" :market="job.market.toString()" :usdRewardPerHour="job.usdRewardPerHour || 0" :timeStart="job.timeStart" :timeEnd="job.timeEnd" :timeout="job.timeout" :jobDefinition="jobDefinition" :isCompleted="job.isCompleted" :state="job.state" />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import type { JobDefinition } from "@nosana/sdk";
import JsonEditorVue from 'json-editor-vue';
import { Mode } from 'vanilla-jsoneditor';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';

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
  logs: LogEntry[];
  progressBars: Map<string, ProgressBar>;
  resourceProgressBars: Map<string, any>;
  showChatTab?: boolean;
  chatServiceUrl?: string | null;
  activeTab: string; // Prop for active tab
}

const props = defineProps<Props>();
const emit = defineEmits(['update:activeTab']);

const logsView = ref<any>(null);
const colorMode = useColorMode();

// Expose logsView ref for parent component to call scrollToBottomOnOpen
defineExpose({ logsView });

// Create a reactive model for the job definition
const jobDefinitionModel = computed({
  get: () => props.jobDefinition,
  set: () => {} // Read-only, so no setter needed
});

// Validator function (can be empty for read-only)
const validator = () => [];

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
  ul {
    border-bottom-width: 1px !important;
    
    li {
      a {
        padding: 0.4em 0.8em;
        font-size: 0.9rem;
      }
    }
  }
}

.job-definition-container {
  background-color: #ffffff;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  padding: 0;
  margin-top: 0.2rem;
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
html.dark-mode .job-definition-container {
  background-color: #2c2c2c;
  border-color: #444;
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
