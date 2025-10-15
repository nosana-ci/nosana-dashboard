<template>
  <div class="logs-tab-container">
    <div class="logs-container" ref="logsContainerRef">
      <div class="logs-header" v-if="job.isRunning && isJobPoster && logConnectionEstablished">
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
      </div>
      <div class="logs-content">
        <transition name="logs-fade" mode="out-in">
          <div v-if="job.isRunning" class="logs-running-container" key="logs-running">
            <div v-if="isJobPoster" class="logs-viewers-wrapper">
              <FLogViewer
                :logs="activeLogs || []"
                :isConnecting="isConnecting"
                :progressBars="parallelProgressBars"
                ref="containerLogViewer"
              />
            </div>
            <div v-else class="has-text-centered p-4">Please connect your wallet to view logs.</div>
          </div>
          <div v-else-if="loading" class="has-text-centered p-4" key="loading">Loading logs..</div>
          <div v-else-if="job.isCompleted && !job.results" class="has-text-centered p-4" key="no-results">
            The job was stopped, waiting for host to upload the results.
          </div>
          <div v-else-if="!job.results" class="has-text-centered p-4" key="no-logs">No logs available.</div>
          <div v-else-if="job.results && job.results[0] === 'nos/secret'" class="has-text-centered p-4" key="secret-results">
            Results are secret.
          </div>
          <JobResult
            v-else-if="job.isCompleted"
            :ipfs-result="job.results"
            :ipfs-job="job"
            key="results"
          />
        </transition>
      </div>
    </div>

    <FullscreenModal :isOpen="logModal.isOpen.value" title="System Logs" @close="logModal.close">
      <div class="fullscreen-logs-wrapper">
        <template v-if="job.isRunning">
          <FLogViewer
            v-if="isJobPoster"
            :logs="activeLogs || []"
            :isConnecting="isConnecting"
            :fullscreen="true"
            :progressBars="parallelProgressBars"
            ref="fullscreenLogViewerInstance"
            class="fullscreen-viewer" 
          />
          <div v-else class="has-text-centered p-4">Please connect your wallet to view logs.</div>
        </template>
        <div v-else-if="loading" class="has-text-centered p-4">Loading logs..</div>
        <div v-else-if="job.isCompleted && !job.results" class="has-text-centered p-4">
          The job was stopped, waiting for host to upload the results.
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
      </div>
    </FullscreenModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import JobResult from "../Result.vue";
import FLogViewer from "~/components/Job/FLogViewer.vue";
import FullscreenModal from '~/components/Common/FullscreenModal.vue';
import { useModal } from '~/composables/jobs/useModal';
import type { UseJob } from "~/composables/jobs/useJob";
// Use a relaxed local type for flog viewer compatibility
type AnyLogEntry = { id: number; content: string; timestamp: number; html?: boolean };
import type { LogEntry, ProgressBar } from "~/composables/jobs/logTypes";

interface Props {
  job: UseJob;
  isJobPoster: boolean;
  loading: boolean;
  isConnecting: boolean;
  logConnectionEstablished: boolean;
  systemLogs: LogEntry[];
  containerLogs: LogEntry[];
  progressBars: Map<string, ProgressBar>;
  resourceProgressBars: Map<string, any>;
  // Optional parallel mode props
  activeLogs?: AnyLogEntry[];
  opIds?: string[];
  filters?: any;
  selectOp?: (opId: string | null) => void;
  toggleType?: (type: 'container' | 'info' | 'error') => void;
}

const props = defineProps<Props>();

const logsContainerRef = ref<HTMLElement | null>(null);
const containerLogViewer = ref<any>(null);
const fullscreenLogViewerInstance = ref<any>(null);

const logModal = useModal();
const hasAutoSwitched = ref(false);

const parallelProgressBars = computed(() => props.progressBars);
const selectedOpId = computed<string | null>({
  get: () => props.filters?.value?.opId ?? null,
  set: () => {},
});
const types = computed<Set<'container' | 'info' | 'error'>>({
  get: () => props.filters?.value?.types ?? new Set(['container','info','error']),
  set: () => {},
});

// Legacy mode is removed; controls are always for parallel flogs

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
      if (props.job.isRunning) {
        if (containerLogViewer.value && containerLogViewer.value.scrollToBottom) {
          containerLogViewer.value.scrollToBottom();
        }
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
.logs-fade-enter-active,
.logs-fade-leave-active {
  transition: opacity 0.25s ease;
}

.logs-fade-enter-from,
.logs-fade-leave-to {
  opacity: 0;
}

.logs-running-container, .logs-viewers-wrapper {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
}

.logs-tab-container {
  position: relative;
  padding-top: 0;
}

.logs-container {
  display: flex;
  flex-direction: column;
  position: relative;
  padding-top: 0 !important;
}

.logs-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #363636;
  padding: 0.5rem 1rem;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  top: 0.2rem;
  right: 0.5rem;
  z-index: 10;
  pointer-events: none;
}

.log-type-switcher {
  pointer-events: auto;
  margin-right: 0.5rem;
}

/* 
  New, more specific rules to override Bulma's default toggle-tab styles.
  This ensures the inactive tab has a solid background and the active tab is not green.
*/
.log-type-switcher.tabs.is-toggle a {
  background-color: #f0f0f0; /* Lighter solid gray for inactive tabs */
  border-color: transparent;
  color: #7a7a7a; /* Muted text for inactive tabs */
  transition: all 0.2s ease-in-out;
}
.log-type-switcher.tabs.is-toggle a:hover {
  background-color: #dbdbdb;
  color: #363636;
}
.log-type-switcher.tabs.is-toggle li.is-active a {
  background-color: #dbdbdb; /* Darker solid gray for the active tab */
  color: #363636;
}

html.dark-mode .log-type-switcher.tabs.is-toggle a {
  background-color: #4a4a4a; /* Lighter solid gray for inactive tabs in dark mode */
  color: #b5b5b5; /* Muted text for inactive tabs */
  transition: all 0.2s ease-in-out;
}
html.dark-mode .log-type-switcher.tabs.is-toggle a:hover {
  background-color: #363636;
  color: #ffffff;
}
html.dark-mode .log-type-switcher.tabs.is-toggle li.is-active a {
  background-color: #363636; /* Darker solid gray for active tab */
  color: #ffffff;
}

.fullscreen-logs-button {
  pointer-events: auto;
  position: relative; /* align with chips inside the header */
  background-color: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(4px);
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.95) !important;
  }
}

html.dark-mode .fullscreen-logs-button {
  background-color: rgba(54, 54, 54, 0.8) !important;
  
  &:hover {
    background-color: rgba(54, 54, 54, 0.95) !important;
  }
}

.logs-content {
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-top: 0;

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

.fullscreen-logs-wrapper {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fullscreen-logs-wrapper .logs-content {
  padding-top: 0;
}

.fullscreen-logs-wrapper .logs-header {
  position: absolute;
  top: -2.7rem;
  right: 3.5rem;
  pointer-events: all;
}

.fullscreen-logs-wrapper .fullscreen-logs-button {
  display: none;
}

.parallel-controls .type-chips.subtle {
  display: flex;
  gap: 0.5rem;
}
.type-chips.subtle .chip {
  pointer-events: auto;
  border: none;
  background: rgba(255,255,255,0.2);
  color: #fff;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  transition: all 0.15s ease;
}
.type-chips.subtle .chip.active {
  background: rgba(16, 232, 12, 0.85);
  color: #111;
}
.type-chips.subtle .chip:nth-child(2).active {
  background: rgba(47, 159, 255, 0.9);
  color: #fff;
}
.type-chips.subtle .chip:nth-child(3).active {
  background: rgba(232, 71, 86, 0.9);
  color: #fff;
}
</style>
