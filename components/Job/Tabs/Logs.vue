<template>
  <div class="logs-tab-container">
    <div class="logs-container" ref="logsContainerRef">
      <div class="logs-header" v-if="job.isRunning && isJobPoster && logConnectionEstablished">
        <div class="tabs is-toggle is-small is-rounded log-type-switcher">
          <ul>
            <li :class="{ 'is-active': activeLogTab === 'container' }">
              <a @click="activeLogTab = 'container'">
                <span>Container</span>
              </a>
            </li>
            <li :class="{ 'is-active': activeLogTab === 'system' }">
              <a @click="activeLogTab = 'system'">
                <span>System</span>
              </a>
            </li>
          </ul>
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
      </div>
      <div class="logs-content">
        <transition name="logs-fade" mode="out-in">
          <div v-if="job.isRunning" class="logs-running-container" key="logs-running">
            <div v-if="isJobPoster" class="logs-viewers-wrapper">
              <JobLogViewer
                v-show="activeLogTab === 'container'"
                :logs="containerLogs"
                :isConnecting="isConnecting"
                :progressBars="new Map()"
                :resourceProgressBars="new Map()"
                ref="containerLogViewer"
                empty-message="No container logs yet. Waiting for the host to download and start the container..."
              />
              <JobLogViewer
                v-show="activeLogTab === 'system'"
                :logs="systemLogs"
                :isConnecting="isConnecting"
                :progressBars="progressBars"
                :resourceProgressBars="resourceProgressBars"
                ref="systemLogViewer"
              />
            </div>
            <div v-else class="has-text-centered p-4">Please connect your wallet to view logs.</div>
          </div>
          <div v-else-if="loading" class="has-text-centered p-4" key="loading">Loading logs..</div>
          <div v-else-if="job.isCompleted && !job.results" class="has-text-centered p-4" key="no-results">
            The job was prematurely stopped so no logs are available.
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

    <FullscreenModal :isOpen="logModal.isOpen.value" title="Logs" @close="logModal.close">
      <div class="fullscreen-logs-wrapper">
        <div class="logs-header">
          <div class="tabs is-toggle is-small is-rounded log-type-switcher">
            <ul>
              <li :class="{ 'is-active': activeLogTab === 'container' }">
                <a @click="activeLogTab = 'container'">
                  <span>Container</span>
                </a>
              </li>
              <li :class="{ 'is-active': activeLogTab === 'system' }">
                <a @click="activeLogTab = 'system'">
                  <span>System</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <template v-if="job.isRunning">
          <JobLogViewer
            v-if="isJobPoster"
            :logs="activeLogTab === 'container' ? containerLogs : systemLogs"
            :isConnecting="isConnecting"
            :progressBars="activeLogTab === 'system' ? progressBars : new Map()"
            :resourceProgressBars="activeLogTab === 'system' ? resourceProgressBars : new Map()"
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
      </div>
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
  logConnectionEstablished: boolean;
  systemLogs: LogEntry[];
  containerLogs: LogEntry[];
  progressBars: Map<string, ProgressBar>;
  resourceProgressBars: Map<string, any>;
}

const props = defineProps<Props>();

const activeLogTab = ref<'container' | 'system'>('system');
const logsContainerRef = ref<HTMLElement | null>(null);
const containerLogViewer = ref<any>(null);
const systemLogViewer = ref<any>(null);
const fullscreenLogViewerInstance = ref<any>(null);

const logModal = useModal();
const hasAutoSwitched = ref(false);

// Set initial tab state
if (props.containerLogs.length > 0) {
  activeLogTab.value = 'container';
  hasAutoSwitched.value = true;
} else if (props.systemLogs.length > 0) {
  activeLogTab.value = 'system';
}

// Logic to auto-switch to container logs ONCE.
watch(() => props.containerLogs.length, (newLength) => {
  if (newLength > 0 && !hasAutoSwitched.value) {
    activeLogTab.value = 'container';
    hasAutoSwitched.value = true;
  }
});

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
        if (activeLogTab.value === 'container' && containerLogViewer.value && containerLogViewer.value.scrollToBottom) {
          containerLogViewer.value.scrollToBottom();
        } else if (activeLogTab.value === 'system' && systemLogViewer.value && systemLogViewer.value.scrollToBottom) {
          systemLogViewer.value.scrollToBottom();
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

.logs-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  position: absolute;
  top: 1.2rem;
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
  position: relative; /* Use relative to allow nudging */
  top: -11px; /* Nudge up slightly for perfect alignment */
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
  padding-top: 1rem;

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
</style>
