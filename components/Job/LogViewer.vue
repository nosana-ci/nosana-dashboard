<template>
  <div class="log-viewer" ref="logContainer" @scroll="handleScroll">
    <div v-if="signMessageError">Failed to sign message. Please try again.</div>

    <!-- Regular Log View -->
    <template v-else>
      <!-- Connection Status -->
      <div v-if="isConnecting" class="connecting-message">
        <span class="icon-text">
          <span class="icon">
            <i class="fas fa-sync fa-spin"></i>
          </span>
          <span>Loading logs...</span>
        </span>
      </div>

      <!-- Log Entries and Progress Bars -->
      <div class="log-content">
        <template v-for="log in logs" :key="log.id">
          <div
            class="log-entry"
            :class="{ 'container-log': log.isContainerLog }"
            v-html="formatContainerLog(log.content, log.isContainerLog)"
          ></div>
        </template>

        <!-- Active Progress Bars -->
        <div
          v-for="bar in activeProgressBars"
          :key="bar.id"
          class="progress-bar-container mb-4"
        >
          <div
            class="progress-text"
            :class="{
              'is-primary': bar.status === 'Downloading',
              'is-info': bar.status === 'Pulling fs layer',
              'is-warning': bar.status === 'Extracting',
              'is-success': bar.status === 'Resource',
            }"
          >
            {{ bar.status }} | {{ bar.id }} | {{ bar.currentDisplay
            }}{{ bar.currentFormat }}/{{ bar.totalDisplay
            }}{{ bar.totalFormat }}
          </div>
          <progress
            class="progress"
            :class="{
              'is-primary': bar.status === 'Downloading',
              'is-info': bar.status === 'Pulling fs layer',
              'is-warning': bar.status === 'Extracting',
              'is-success': bar.status === 'Resource',
            }"
            :value="bar.current"
            :max="bar.total"
          >
            {{ ((bar.current / bar.total) * 100).toFixed(0) }}%
          </progress>
        </div>

        <!-- New resource progress bar(s) -->
        <div
          v-for="resBar in activeResourceProgressBars"
          :key="resBar.id"
          class="progress-bar-container mb-4"
        >
          <div class="progress-text is-link">
            {{ resBar.status }} | {{ resBar.id }} |
            {{ resBar.current.toFixed(2) }}/{{ resBar.total.toFixed(2) }} (GB)
          </div>
          <progress
            class="progress is-link"
            :value="resBar.current"
            :max="resBar.total"
          >
            {{ ((resBar.current / resBar.total) * 100).toFixed(0) }}%
          </progress>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";

import type { LogEntry, ProgressBar } from "~/composables/jobs/useJobLogs";

interface Props {
  isConnecting: boolean;
  logs: LogEntry[];
  progressBars: Map<string, ProgressBar>;
  resourceProgressBars: Map<string, any>;
}

const { isConnecting, logs, progressBars, resourceProgressBars } =
  defineProps<Props>();

// TODO: MOVE TO HOOKS
const signMessageError = ref(false);

const logContainer = ref<HTMLElement | null>(null);
const shouldAutoScroll = ref(true);

// Format container logs to highlight timestamps and handle ANSI codes
function formatContainerLog(
  content: string,
  isContainerLog: boolean | undefined
) {
  if (!content) return "";

  let formattedContent = content;

  if (!isContainerLog) {
    // Add color to download status lines
    if (
      content.startsWith("Download complete:") ||
      content.startsWith("Already exists:") ||
      content.startsWith("Pull complete:")
    ) {
      return `<span class="download-status">${content}</span>`;
    }
  } else {
    // Replace timestamp with styled version for container logs
    formattedContent = content.replace(
      /^\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2},\d{3})\]/,
      '<span class="timestamp">[$1]</span>'
    );
  }

  // Process ANSI color codes
  formattedContent = formattedContent
    // Bold
    .replace(/\u001b\[1m/g, '<span class="ansi-bold">')
    // Colors
    .replace(/\u001b\[30m/g, '<span class="ansi-black-fg">')
    .replace(/\u001b\[31m/g, '<span class="ansi-red-fg">')
    .replace(/\u001b\[32m/g, '<span class="ansi-green-fg">')
    .replace(/\u001b\[33m/g, '<span class="ansi-yellow-fg">')
    .replace(/\u001b\[34m/g, '<span class="ansi-blue-fg">')
    .replace(/\u001b\[35m/g, '<span class="ansi-magenta-fg">')
    .replace(/\u001b\[36m/g, '<span class="ansi-cyan-fg">')
    .replace(/\u001b\[37m/g, '<span class="ansi-white-fg">')
    // Bright colors
    .replace(/\u001b\[90m/g, '<span class="ansi-bright-black-fg">')
    .replace(/\u001b\[91m/g, '<span class="ansi-bright-red-fg">')
    .replace(/\u001b\[92m/g, '<span class="ansi-bright-green-fg">')
    .replace(/\u001b\[93m/g, '<span class="ansi-bright-yellow-fg">')
    .replace(/\u001b\[94m/g, '<span class="ansi-bright-blue-fg">')
    .replace(/\u001b\[95m/g, '<span class="ansi-bright-magenta-fg">')
    .replace(/\u001b\[96m/g, '<span class="ansi-bright-cyan-fg">')
    .replace(/\u001b\[97m/g, '<span class="ansi-bright-white-fg">')
    // Reset
    .replace(/\u001b\[0m/g, "</span>")
    // Close any unclosed spans
    .replace(/\u001b\[\d+m/g, "");

  return formattedContent;
}

// A computed array of in-progress resource bars
const activeResourceProgressBars = computed(() =>
  Array.from(resourceProgressBars.values()).filter((b) => !b.completed)
);

// Likewise, your existing multi-process container bars
const activeProgressBars = computed(() =>
  Array.from(progressBars.values()).filter((b) => !b.completed)
);

function scrollToBottom() {
  if (shouldAutoScroll.value && logContainer.value) {
    nextTick(() => {
      const container = logContainer.value!;
      container.scrollTop = container.scrollHeight;
    });
  }
}

// // Auto-scroll to bottom when new logs arrive or progress bars update
watch(
  [
    () => logs.length,
    () => activeProgressBars.value.length,
    () => activeResourceProgressBars.value.length,
  ],
  () => {
    scrollToBottom();
  }
);

// Handle manual scrolling
function handleScroll() {
  if (!logContainer.value) return;

  const container = logContainer.value;
  const { scrollTop, scrollHeight, clientHeight } = container;

  // If we're near the bottom (within 50px), enable auto-scroll
  shouldAutoScroll.value = scrollHeight - (scrollTop + clientHeight) < 50;
}
</script>

<style lang="scss" scoped>
.log-viewer {
  font-family: "JetBrains Mono", monospace;
  background-color: #000000;
  color: #c9d1d9;
  padding: 1rem;
  border-radius: 4px;
  height: 100%;
  overflow-y: auto;
  min-height: 300px;
  max-height: 600px;
}

.log-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.log-entry {
  line-height: 1.4;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;

  &.container-log {
    color: #e5e7eb;
    font-size: 0.85rem;

    :deep(.timestamp) {
      color: #9ca3af;
      font-weight: normal;
    }
  }

  :deep(.download-status) {
    color: #4ade80;
    font-weight: 500;
  }

  :deep(.ansi-black-fg) {
    color: #484f58;
  }
  :deep(.ansi-red-fg) {
    color: #ff4444;
  }
  :deep(.ansi-green-fg) {
    color: #4ade80;
  }
  :deep(.ansi-yellow-fg) {
    color: #ffdd4a;
  }
  :deep(.ansi-blue-fg) {
    color: #2f9fff;
  }
  :deep(.ansi-magenta-fg) {
    color: #ff44ff;
  }
  :deep(.ansi-cyan-fg) {
    color: #00ffff;
  }
  :deep(.ansi-white-fg) {
    color: #ffffff;
  }

  :deep(.ansi-bright-black-fg) {
    color: #6e7681;
  }
  :deep(.ansi-bright-red-fg) {
    color: #ff6b6b;
  }
  :deep(.ansi-bright-green-fg) {
    color: #4dffb5;
  }
  :deep(.ansi-bright-yellow-fg) {
    color: #ffe66d;
  }
  :deep(.ansi-bright-blue-fg) {
    color: #5cb3ff;
  }
  :deep(.ansi-bright-magenta-fg) {
    color: #ff77ff;
  }
  :deep(.ansi-bright-cyan-fg) {
    color: #60ffff;
  }
  :deep(.ansi-bright-white-fg) {
    color: #ffffff;
  }

  :deep(.ansi-bold) {
    font-weight: bold;
  }
}

.progress-bar-container {
  background: rgba(110, 118, 129, 0.1);
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.progress-text {
  margin-bottom: 0.5rem;
  font-size: 0.85rem;

  &.is-primary {
    color: #00d1b2;
  }
  &.is-info {
    color: #3e8ed0;
  }
  &.is-warning {
    color: #ffe08a;
  }
  &.is-success {
    color: #48c78e;
  }
}

.progress {
  height: 0.5rem;
  &::-webkit-progress-bar {
    background-color: rgba(110, 118, 129, 0.1);
  }

  &.is-primary::-webkit-progress-value {
    background-color: #00d1b2;
  }
  &.is-primary::-moz-progress-bar {
    background-color: #00d1b2;
  }

  &.is-info::-webkit-progress-value {
    background-color: #3e8ed0;
  }
  &.is-info::-moz-progress-bar {
    background-color: #3e8ed0;
  }

  &.is-warning::-webkit-progress-value {
    background-color: #ffe08a;
  }
  &.is-warning::-moz-progress-bar {
    background-color: #ffe08a;
  }

  &.is-success::-webkit-progress-value {
    background-color: #48c78e;
  }
  &.is-success::-moz-progress-bar {
    background-color: #48c78e;
  }
}

.no-access {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: #8b949e;
  text-align: center;
  padding: 2rem;

  .icon {
    font-size: 2rem;
    margin-bottom: 1rem;
    opacity: 0.7;
  }

  h3 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #c9d1d9;
  }

  p {
    font-size: 0.9rem;
    max-width: 300px;
    line-height: 1.4;
  }
}

.connecting-message {
  color: #ffffff;
  text-align: center;
  padding: 1rem;
  font-size: 0.9rem;
  .icon {
    margin-right: 0.5rem;
  }
}
</style>
