<template>
  <div class="p-1 py-4 has-background-white-bis logs-container" ref="logsContainer">
    <template v-if="job.isRunning">
      <JobLogViewer
        v-if="isJobPoster"
        :logs="logs"
        :isConnecting="isConnecting"
        :progressBars="progressBars"
        :resourceProgressBars="resourceProgressBars"
        ref="logViewer"
      />
      <div v-else>Please connect your wallet to view logs</div>
    </template>
    <div v-else-if="loading">Loading logs..</div>
    <div v-else-if="job.isCompleted && !job.results">
      The job was prematurely stopped so no logs are available
    </div>
    <div v-else-if="!job.results">No logs</div>
    <div v-else-if="job.results && job.results[0] === 'nos/secret'">
      Results are secret
    </div>
    <JobResult
      v-else-if="job.isCompleted"
      :ipfs-result="job.results"
      :ipfs-job="job"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import JobLogViewer from "../LogViewer.vue";
import JobResult from "../Result.vue";
import type { UseJob } from "~/composables/jobs/useJob";
import type { LogEntry, ProgressBar } from "~/composables/jobs/useJobLogs";

interface Props {
  job: UseJob;
  isJobPoster: boolean;
  loading: boolean;
  isConnecting: boolean;
  logs: LogEntry[];
  progressBars: Map<string, ProgressBar>;
  resourceProgressBars: Map<string, any>;
}

const {
  job,
  isJobPoster,
  isConnecting,
  loading,
  logs,
  progressBars,
  resourceProgressBars,
} = defineProps<Props>();

const logsContainer = ref<HTMLElement | null>(null);
const logViewer = ref<any>(null);

// Auto-scroll when logs tab becomes visible
const scrollToBottomOnOpen = () => {
  nextTick(() => {
    if (logViewer.value && logViewer.value.scrollToBottom) {
      logViewer.value.scrollToBottom();
    }
  });
};

// Expose the scroll function for parent component
defineExpose({
  scrollToBottomOnOpen
});
</script>

<style lang="scss" scoped>
.logs-container {
  // Remove max-height and overflow to prevent double scrollbar
  // The LogViewer component will handle its own scrolling
}

.progress.is-primary::-webkit-progress-bar {
  background-color: #dbdbdb;
}

.progress.is-primary::-webkit-progress-value {
  background-color: #00d1b2;
}

.progress.is-primary::-moz-progress-bar {
  background-color: #00d1b2;
}

.progress-text {
  margin-bottom: 0.5rem;
  font-family: monospace;
}

.progress.is-primary {
  margin-bottom: 1rem;
}
</style>
