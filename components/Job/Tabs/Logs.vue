<template>
  <div class="logs-tab-container">
    <div class="p-1 py-4 logs-container" ref="logsContainer">
      <div class="logs-header">
        <span class="logs-title"><!-- Can be empty or hold a title --></span>
        <!-- Fullscreen button moved out of header for easier absolute positioning relative to logs-container -->
      </div>
      <button
        v-if="job.isRunning && isJobPoster"
        class="button is-small is-text fullscreen-logs-button"
        @click="openLogFullscreenModal"
        title="Fullscreen Logs"
      >
        <span class="icon is-small">
          <img src="~/assets/img/icons/fullscreen.svg" alt="Fullscreen" />
        </span>
      </button>
      <div class="logs-content">
        <template v-if="job.isRunning">
          <JobLogViewer
            v-if="isJobPoster"
            :logs="logs"
            :isConnecting="isConnecting"
            :progressBars="progressBars"
            :resourceProgressBars="resourceProgressBars"
            ref="logViewer"
          />
          <div v-else class="has-text-centered p-4">Please connect your wallet to view logs.</div>
        </template>
        <div v-else-if="loading" class="has-text-centered p-4">Loading logs..</div>
        <div v-else-if="job.isCompleted && !job.results" class="has-text-centered p-4">
          The job was prematurely stopped so no logs are available.
        </div>
        <div v-else-if="!job.results" class="has-text-centered p-4">No logs available.</div>
        <div v-else-if="job.results && job.results[0] === 'nos/secret'" class="has-text-centered p-4">
          Results are secret.
        </div>
        <JobResult
          v-else-if="job.isCompleted"
          :ipfs-result="job.results"
          :ipfs-job="job"
        />
      </div>
    </div>

    <!-- Fullscreen Modal -->
    <div class="modal" :class="{ 'is-active': isLogFullscreenModalActive }">
      <div class="modal-background" @click="closeLogFullscreenModal"></div>
      <div class="modal-card log-fullscreen-modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Logs</p>
          <button class="delete" aria-label="close" @click="closeLogFullscreenModal"></button>
        </header>
        <section class="modal-card-body log-fullscreen-modal-body">
          <template v-if="job.isRunning">
            <JobLogViewer
              v-if="isJobPoster"
              :logs="logs"
              :isConnecting="isConnecting"
              :progressBars="progressBars"
              :resourceProgressBars="resourceProgressBars"
              :fullscreen="true"
              ref="fullscreenLogViewerInstance"
              class="fullscreen-viewer"
            />
            <div v-else class="has-text-centered p-4">Please connect your wallet to view logs.</div>
          </template>
          <div v-else-if="loading" class="has-text-centered p-4">Loading logs..</div>
          <div v-else-if="job.isCompleted && !job.results" class="has-text-centered p-4">
            The job was prematurely stopped so no logs are available.
          </div>
          <div v-else-if="!job.results" class="has-text-centered p-4">No logs available.</div>
          <div v-else-if="job.results && job.results[0] === 'nos/secret'" class="has-text-centered p-4">
            Results are secret.
          </div>
          <JobResult
            v-else-if="job.isCompleted"
            :ipfs-result="job.results"
            :ipfs-job="job"
            class="fullscreen-viewer"
          />
        </section>
      </div>
    </div>
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
  loading: boolean; // Renamed from 'isLoading' if it was that, to match usage
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
const logViewer = ref<any>(null); // Inline log viewer
const fullscreenLogViewerInstance = ref<any>(null); // Log viewer in modal

const isLogFullscreenModalActive = ref(false);

const openLogFullscreenModal = () => {
  isLogFullscreenModalActive.value = true;
  nextTick(() => {
    if (fullscreenLogViewerInstance.value && fullscreenLogViewerInstance.value.scrollToBottom) {
      fullscreenLogViewerInstance.value.scrollToBottom(true);
    } else {
      // For JobResult or other content in modal
      const modalBody = document.querySelector('.log-fullscreen-modal-body .fullscreen-viewer');
      if (modalBody) {
        modalBody.scrollTop = modalBody.scrollHeight;
      }
    }
  });
};

const closeLogFullscreenModal = () => {
  isLogFullscreenModalActive.value = false;
};

// Auto-scroll when logs tab becomes visible or job completes (for inline view)
const scrollToBottomOnOpen = () => {
  nextTick(() => {
    if (logViewer.value && logViewer.value.scrollToBottom) {
      logViewer.value.scrollToBottom();
    } else if (logsContainer.value) {
      const logsContentDiv = logsContainer.value.querySelector('.logs-content > *:last-child'); // Target JobResult or other content
      if (logsContentDiv) {
        logsContentDiv.scrollTop = logsContentDiv.scrollHeight;
      }
    }
  });
};

// Watch for job completion and auto-scroll
watch(() => job.isCompleted, (isCompleted) => {
  if (isCompleted) {
    nextTick(() => {
      if (isLogFullscreenModalActive.value) {
        const modalContent = document.querySelector('.log-fullscreen-modal-body .fullscreen-viewer');
        if (modalContent) {
          modalContent.scrollTop = modalContent.scrollHeight;
        }
      } else {
        scrollToBottomOnOpen(); // Original behavior for inline view
      }
    });
  }
});

// Expose the scroll function for parent component
defineExpose({
  scrollToBottomOnOpen
});
</script>

<style lang="scss" scoped>
.logs-tab-container {
  position: relative; // For absolute positioning of the fullscreen button
}

.logs-container {
  background-color: #ffffff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  position: relative; // Context for the fullscreen button
}

.logs-header {
  display: flex;
  justify-content: space-between; // Title will take space, button is separate
  align-items: center;
  padding-bottom: 0.5rem;
  margin: -0.25rem; 
  margin-bottom: 0.5rem;
  padding: 0.25rem;
}

.logs-title {
  flex-grow: 1;
}

.fullscreen-logs-button {
  position: absolute;
  top: 2rem; // Increased top value to lower the button
  right: 0.5rem;
  z-index: 10;
  background-color: #ffffff !important;
  border: 1px solid #e8e8e8 !important;
  padding: 0.4rem 0.6rem !important; // Increased padding to make background wider
  box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
  line-height: 1; // Ensure icon is centered with new padding

  .icon img {
    width: 16px;
    height: 16px;
    display: block; // Helps with centering if padding is uneven
  }

  &:hover {
    background-color: #f5f5f5 !important;
    border-color: #dadada !important;
  }
}

html.dark-mode .fullscreen-logs-button {
  background-color: #363636 !important; // Dark mode background
  border-color: #4d4d4d !important; // Dark mode border
  box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;

  &:hover {
    background-color: #444444 !important;
    border-color: #5a5a5a !important;
  }
  .icon img {
    filter: invert(1);
  }
}

.logs-content {
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  & > * {
    flex-grow: 1;
    min-height: 0;
  }
}

// Dark mode styling
html.dark-mode .logs-container {
  background-color: #2c2c2c;
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

// Modal Styles
.log-fullscreen-modal-card {
  width: 90vw;
  height: 90vh;
  max-width: 1600px; 
  display: flex;
  flex-direction: column;
}

.log-fullscreen-modal-body {
  padding: 0 !important;
  flex-grow: 1; 
  display: flex; 
  flex-direction: column;
  overflow: hidden; // Parent hides overflow, child handles scrolling
  min-height: 0; // Important for flex context
}

.fullscreen-viewer { // Applied to JobLogViewer or JobResult in modal
  flex-grow: 1;
  min-height: 0; // Allows the component to shrink and then scroll its own content
  // The JobLogViewer component itself will manage its height (100% via .is-fullscreen) 
  // and scrolling (overflow-y: auto via .log-viewer class).
  // JobResult, if used here, would also need to manage its internal scrolling if its content overflows.
}

// Centering for messages in modal
.has-text-centered {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
