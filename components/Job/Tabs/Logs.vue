<template>
  <div class="logs-tab-container">
    <div class="p-0 py-0 logs-container" ref="logsContainerRef">
      <div class="logs-header">
        <span class="logs-title"><!-- Can be empty or hold a title --></span>
      </div>
      <button
        v-if="job.isRunning && isJobPoster"
        class="button is-small is-text fullscreen-logs-button"
        @click="logModal.open"
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

    <FullscreenModal :isOpen="logModal.isOpen.value" title="Logs" @close="logModal.close">
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
    </FullscreenModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import JobLogViewer from "../LogViewer.vue";
import JobResult from "../Result.vue";
import FullscreenModal from '~/components/Common/FullscreenModal.vue';
import { useModal } from '~/composables/jobs/useModal';
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

const props = defineProps<Props>();

const logsContainerRef = ref<HTMLElement | null>(null);
const logViewer = ref<any>(null);
const fullscreenLogViewerInstance = ref<any>(null);

const logModal = useModal();

const scrollToContentBottom = (isModal: boolean) => {
  nextTick(() => {
    if (isModal) {
      if (props.job.isRunning && fullscreenLogViewerInstance.value && fullscreenLogViewerInstance.value.scrollToBottom) {
        fullscreenLogViewerInstance.value.scrollToBottom(true);
      } else if (props.job.isCompleted) {
        const modalResultEl = document.querySelector('.fullscreen-modal-body .job-result-container.fullscreen-viewer');
        if (modalResultEl) modalResultEl.scrollTop = modalResultEl.scrollHeight;
      }
    } else {
      if (props.job.isRunning && logViewer.value && logViewer.value.scrollToBottom) {
        logViewer.value.scrollToBottom();
      } else if (props.job.isCompleted && logsContainerRef.value) {
        const inlineResultEl = logsContainerRef.value.querySelector('.logs-content .job-result-container');
        if (inlineResultEl) inlineResultEl.scrollTop = inlineResultEl.scrollHeight;
      }
    }
  });
};

watch(logModal.isOpen, (isOpen) => {
  if (isOpen) {
    scrollToContentBottom(true);
  }
});

const scrollToBottomOnOpen = () => {
  scrollToContentBottom(false);
};

watch(() => props.job.isCompleted, (isCompleted) => {
  if (isCompleted) {
    scrollToContentBottom(logModal.isOpen.value);
  }
});

defineExpose({
  scrollToBottomOnOpen
});
</script>

<style lang="scss" scoped>
.logs-tab-container {
  position: relative;
}

.logs-container {
  display: flex;
  flex-direction: column;
  position: relative;
}

.logs-header {
  display: flex;
  justify-content: space-between;
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
  top: 1rem;
  right: 0.2rem;
  z-index: 10;
  background-color: #ffffff !important;
  border: 1px solid #e8e8e8 !important;
  padding: 0.4rem 0.6rem !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
  line-height: 1;

  .icon img {
    width: 16px;
    height: 16px;
    display: block;
  }

  &:hover {
    background-color: #f5f5f5 !important;
    border-color: #dadada !important;
  }
}

html.dark-mode .fullscreen-logs-button {
  background-color: #363636 !important;
  border-color: #4d4d4d !important;
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

html.dark-mode .logs-container {
  background-color: #2c2c2c;
}

html.dark-mode .logs-content .has-text-centered {
  color: #ffffff;
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

.has-text-centered {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

:deep(.fullscreen-modal-body .fullscreen-viewer) {
  height: 100%;
  min-height: 100%;
  overflow-y: auto;
}
</style>
