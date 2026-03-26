<template>
  <span class="job-badge" :style="{ color: jobColor(index) }">
    {{ jobId.slice(0, 6) }}…{{ jobId.slice(-3) }}
  </span>
</template>

<script setup lang="ts">
import { jobColor } from '~/composables/jobs/logCollectorUtils';

defineProps<{
  jobId: string;
  index: number;
}>();
</script>

<style lang="scss" scoped>
.job-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-family: "JetBrains Mono", monospace;
  line-height: 1.4;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
