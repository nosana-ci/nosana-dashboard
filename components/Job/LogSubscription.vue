<template></template>
<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';

interface Props {
  initLogs: () => void;
  closeLogs: () => void;
  isJobPoster: boolean;
}

const { initLogs, closeLogs, isJobPoster } = defineProps<Props>();

let hasInitialized = false;

// Watch for isJobPoster changes and only init logs when it becomes true
watch(() => isJobPoster, (newValue, oldValue) => {
  if (newValue && !hasInitialized) {
    hasInitialized = true;
    initLogs();
  }
  // Don't call closeLogs when isJobPoster becomes false temporarily during auth refresh
}, { immediate: true });

onMounted(() => {
  // Component mounted
});

onUnmounted(() => {
  closeLogs();
});
</script>
