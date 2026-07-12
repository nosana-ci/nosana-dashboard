<template>
  <div v-if="activeProgressBars.length > 0 || activeResourceBars.length > 0" class="progress-section">
    <div
      v-for="bar in activeProgressBars"
      :key="bar.id"
      class="progress-bar-container"
    >
      <div
        class="progress-text"
        :class="statusClass(bar.status)"
      >
        {{ bar.status }} | {{ bar.id }} | {{ bar.currentDisplay }}{{ bar.currentFormat }}/{{ bar.totalDisplay }}{{ bar.totalFormat }}
      </div>
      <progress
        class="progress"
        :class="statusClass(bar.status)"
        :value="bar.current"
        :max="bar.total"
      >
        {{ ((bar.current / bar.total) * 100).toFixed(0) }}%
      </progress>
    </div>

    <div
      v-for="bar in activeResourceBars"
      :key="bar.id as string"
      class="progress-bar-container"
    >
      <div class="progress-text is-success">
        {{ bar.status }} | {{ (bar.current as number).toFixed(2) }} GB / {{ (bar.total as number).toFixed(2) }} GB
        <span v-if="bar.metadata && (bar.metadata as Record<string, unknown>).totalFiles">
          | {{ (bar.metadata as Record<string, unknown>).totalFiles }}
          {{ (bar.metadata as Record<string, unknown>).totalFiles === 1 ? 'file' : 'files' }}
        </span>
      </div>
      <progress
        class="progress is-success"
        :value="bar.current as number"
        :max="bar.total as number"
      >
        {{ (((bar.current as number) / (bar.total as number)) * 100).toFixed(0) }}%
      </progress>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProgressBar } from '~/composables/jobs/logTypes';

const props = defineProps<{
  progressBars: Map<string, ProgressBar>;
  resourceProgressBars: Map<string, Record<string, unknown>>;
}>();

const activeProgressBars = computed(() =>
  Array.from(props.progressBars.values()).filter((b) => !b.completed),
);

const activeResourceBars = computed(() =>
  Array.from(props.resourceProgressBars.values()).filter(
    (b) => !(b as Record<string, unknown>).completed,
  ),
);

const STATUS_CLASSES: Record<string, string> = {
  'Downloading': 'is-primary',
  'Pulling fs layer': 'is-info',
  'Extracting': 'is-warning',
  'Resource': 'is-success',
};

function statusClass(status: string): string {
  return STATUS_CLASSES[status] || '';
}
</script>

<style lang="scss" scoped>
.progress-section {
  position: sticky;
  bottom: 0;
  background: rgba(#0d1117, 0.95);
  padding: 0.5rem 0.6rem;
}

@import "~/assets/styles/_ansi-colors.scss";
@include log-progress-bars;
</style>
