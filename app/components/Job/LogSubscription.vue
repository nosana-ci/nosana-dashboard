<template></template>
<script setup lang="ts">
import { onUnmounted } from 'vue';

interface Props {
  initLogs: () => void;
  closeLogs: () => void;
  isJobPoster: boolean;
}

const { initLogs, closeLogs } = defineProps<Props>();

onUnmounted(() => {
  closeLogs();
});
</script>
