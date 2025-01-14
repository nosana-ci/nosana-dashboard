<template>
  <div class="log-viewer" ref="logContainer" @scroll="handleScroll">
    <!-- Not Job Poster Message -->
    <div v-if="!isJobPoster" class="no-access">
      <div class="icon">
        <i class="fas fa-lock"></i>
      </div>
      <h3>No Logs Available</h3>
    </div>

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
            v-if="log.html" 
            v-html="formatContainerLog(log.content, log.isContainerLog)">
          </div>
          <div 
            class="log-entry"
            :class="{ 'container-log': log.isContainerLog }"
            v-else>
            {{ formatContainerLog(log.content, log.isContainerLog) }}
          </div>
        </template>

        <!-- Active Progress Bars -->
        <div v-for="bar in activeProgressBars" :key="bar.id" class="progress-bar-container mb-4">
          <div class="progress-text">
            {{ bar.status }} | {{ bar.id }} | {{ bar.current }}{{ bar.format }}/{{ bar.total }}{{ bar.format }}
          </div>
          <progress 
            class="progress is-primary" 
            :value="bar.current" 
            :max="bar.total"
          >
            {{ (bar.current / bar.total * 100).toFixed(0) }}%
          </progress>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import { useJobLogs } from '~/composables/useJobLogs';

const props = defineProps<{
  isJobPoster: boolean;
}>();

const logContainer = ref<HTMLElement | null>(null);
const shouldAutoScroll = ref(true);

const {
  logs,
  progressBars,
  isConnecting,
  handleWebSocketMessage,
  clearLogs
} = useJobLogs();

// Format container logs to highlight timestamps
function formatContainerLog(content: string, isContainerLog: boolean | undefined) {
  if (!isContainerLog) {
    // Add color to download status lines
    if (content.startsWith('Download complete:') || 
        content.startsWith('Already exists:') || 
        content.startsWith('Pull complete:')) {
      return `<span class="download-status">${content}</span>`;
    }
    return content;
  }
  
  // Replace timestamp with styled version
  return content.replace(
    /^\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2},\d{3})\]/,
    '<span class="timestamp">[$1]</span>'
  );
}

// Only show active (non-completed) progress bars
const activeProgressBars = computed(() => {
  return Array.from(progressBars.value.values())
    .filter(bar => !bar.completed)
    .sort((a, b) => a.id.localeCompare(b.id));
});

function scrollToBottom() {
  if (shouldAutoScroll.value && logContainer.value) {
    nextTick(() => {
      const container = logContainer.value!;
      container.scrollTop = container.scrollHeight;
    });
  }
}

// Auto-scroll to bottom when new logs arrive
watch([() => logs.value.length, () => activeProgressBars.value.length], () => {
  scrollToBottom();
});

// Handle manual scrolling
function handleScroll() {
  if (!logContainer.value) return;
  
  const container = logContainer.value;
  const { scrollTop, scrollHeight, clientHeight } = container;
  
  // If we're near the bottom (within 50px), enable auto-scroll
  shouldAutoScroll.value = scrollHeight - (scrollTop + clientHeight) < 50;
}

// Initial scroll to bottom
onMounted(() => {
  scrollToBottom();
});

defineExpose({
  handleWebSocketMessage,
  clearLogs
});
</script>

<style lang="scss" scoped>
.log-viewer {
  font-family: 'JetBrains Mono', monospace;
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

  :deep(.ansi-black-fg) { color: #484f58; }
  :deep(.ansi-red-fg) { color: #ff4444; }
  :deep(.ansi-green-fg) { color: #4ade80; }
  :deep(.ansi-yellow-fg) { color: #ffdd4a; }
  :deep(.ansi-blue-fg) { color: #2f9fff; }
  :deep(.ansi-magenta-fg) { color: #ff44ff; }
  :deep(.ansi-cyan-fg) { color: #00ffff; }
  :deep(.ansi-white-fg) { color: #ffffff; }

  :deep(.ansi-bright-black-fg) { color: #6e7681; }
  :deep(.ansi-bright-red-fg) { color: #ff6b6b; }
  :deep(.ansi-bright-green-fg) { color: #4dffb5; }
  :deep(.ansi-bright-yellow-fg) { color: #ffe66d; }
  :deep(.ansi-bright-blue-fg) { color: #5cb3ff; }
  :deep(.ansi-bright-magenta-fg) { color: #ff77ff; }
  :deep(.ansi-bright-cyan-fg) { color: #60ffff; }
  :deep(.ansi-bright-white-fg) { color: #ffffff; }

  :deep(.ansi-bold) { font-weight: bold; }
}

.progress-bar-container {
  background: rgba(110, 118, 129, 0.1);
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.progress-text {
  color: #7ee787;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.progress.is-primary {
  height: 0.5rem;
  &::-webkit-progress-bar {
    background-color: rgba(110, 118, 129, 0.1);
  }
  &::-webkit-progress-value {
    background-color: #7ee787;
  }
  &::-moz-progress-bar {
    background-color: #7ee787;
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