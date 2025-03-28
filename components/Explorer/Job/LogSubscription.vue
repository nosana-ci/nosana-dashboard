<template></template>
<script setup lang="ts">
interface Props {
  initLogs: () => void;
  closeLogs: () => void;
}

const { initLogs, closeLogs } = defineProps<Props>();

onMounted(() => {
  initLogs();
});

onUnmounted(() => {
  closeLogs();
});
</script>
