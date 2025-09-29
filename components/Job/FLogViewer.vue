<template>
  <div class="log-viewer" ref="logContainer" @scroll="handleScroll">
    <div v-if="isConnecting" class="connecting-message">Loading logs...</div>
    <div class="log-content">
      <div v-for="(log, idx) in logs" :key="log.id || idx" class="log-entry" v-html="log.content"></div>

      <!-- Active multi-process progress bars (from flog) -->
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
          {{ bar.status }} | {{ bar.id }} | {{ bar.currentDisplay }}{{ bar.currentFormat }}/{{ bar.totalDisplay }}{{ bar.totalFormat }}
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

      <div class="log-bottom-spacer"></div>
    </div>
  </div>
  </template>
  
  <script setup lang="ts">
  import { ref, watch, nextTick, computed } from 'vue';
  import type { ProgressBar } from '~/composables/jobs/logTypes';
  
  // Narrow local interface to accept both FLogEntry and legacy LogEntry
  interface LogEntry { id: number; content: string; timestamp: number; html?: boolean }
  
  interface Props {
    isConnecting: boolean;
    logs: LogEntry[];
    fullscreen?: boolean;
    progressBars?: Map<string, ProgressBar>;
  }
  
  const props = defineProps<Props>();
  const logContainer = ref<HTMLElement | null>(null);
  const shouldAutoScroll = ref(true);

  const activeProgressBars = computed(() =>
    Array.from((props.progressBars || new Map()).values()).filter((b) => !b.completed)
  );
  
  function scrollToBottom(force: boolean = false) {
    if ((shouldAutoScroll.value || force) && logContainer.value) {
      nextTick(() => {
        const container = logContainer.value!;
        container.scrollTop = container.scrollHeight;
      });
    }
  }
  
  watch([
    () => props.logs.length,
    () => activeProgressBars.value.length,
  ], () => scrollToBottom());
  
  function handleScroll() {
    if (!logContainer.value) return;
    const container = logContainer.value;
    const { scrollTop, scrollHeight, clientHeight } = container;
    shouldAutoScroll.value = scrollHeight - (scrollTop + clientHeight) < 50;
  }
  
  defineExpose({ scrollToBottom });
  </script>
  
  <style lang="scss" scoped>
  .log-viewer {
    font-family: "JetBrains Mono", monospace;
    background-color: #000000;
    color: #c9d1d9;
    padding: 1rem;
    border-radius: 4px;
    height: 40vh;
    overflow-y: auto;
    min-height: 200px;
    display: flex;
    flex-direction: column;
  }
  .log-content { white-space: pre-wrap; word-wrap: break-word; flex-grow: 1; min-height: 0; }
  .log-entry { line-height: 1.35; margin-bottom: 0.25rem; font-size: 0.9rem; }
  .log-bottom-spacer { height: 1rem; flex-shrink: 0; }
  .connecting-message { color: #ffffff; text-align: center; padding: 0.5rem; font-size: 0.9rem; }
  :deep(.timestamp) { color: #9ca3af; }
  :deep(.download-status) { color: #4ade80; font-weight: 500; }
  :deep(.ansi-black-fg) { color: #484f58; }
  :deep(.ansi-red-fg) { color: inherit; }
  :deep(.ansi-green-fg) { color: #4ade80; }
  :deep(.ansi-yellow-fg) { color: #ffdd4a; }
  :deep(.ansi-blue-fg) { color: #2f9fff; }
  :deep(.ansi-magenta-fg) { color: #ff44ff; }
  :deep(.ansi-cyan-fg) { color: #00ffff; }
  :deep(.ansi-white-fg) { color: #ffffff; }
  :deep(.ansi-bright-black-fg) { color: #6e7681; }
  :deep(.ansi-bright-red-fg) { color: inherit; }
  :deep(.ansi-bright-green-fg) { color: #4dffb5; }
  :deep(.ansi-bright-yellow-fg) { color: #ffe66d; }
  :deep(.ansi-bright-blue-fg) { color: #5cb3ff; }
  :deep(.ansi-bright-magenta-fg) { color: #ff77ff; }
  :deep(.ansi-bright-cyan-fg) { color: #60ffff; }
  :deep(.ansi-bright-white-fg) { color: #ffffff; }
  :deep(.ansi-bold) { font-weight: bold; }

  .progress-bar-container { background: rgba(110, 118, 129, 0.1); padding: 0.75rem; border-radius: 4px; margin-top: 0.5rem; }
  .progress-text { margin-bottom: 0.5rem; font-size: 0.85rem; }
  .progress-text.is-primary { color: #00d1b2; }
  .progress-text.is-info { color: #3e8ed0; }
  .progress-text.is-warning { color: #ffe08a; }
  .progress-text.is-success { color: #48c78e; }
  .progress { height: 0.5rem; }
  .progress.is-primary::-webkit-progress-value { background-color: #00d1b2; }
  .progress.is-primary::-moz-progress-bar { background-color: #00d1b2; }
  .progress.is-info::-webkit-progress-value { background-color: #3e8ed0; }
  .progress.is-info::-moz-progress-bar { background-color: #3e8ed0; }
  .progress.is-warning::-webkit-progress-value { background-color: #ffe08a; }
  .progress.is-warning::-moz-progress-bar { background-color: #ffe08a; }
  .progress.is-success::-webkit-progress-value { background-color: #48c78e; }
  .progress.is-success::-moz-progress-bar { background-color: #48c78e; }
  </style>


