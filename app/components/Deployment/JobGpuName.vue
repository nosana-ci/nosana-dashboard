<template>{{ gpuName || fallback }}</template>

<script setup lang="ts">
/**
 * What a job is running on: the node's own GPU once it reports one, and the
 * market's name until then.
 *
 * The market names the hardware only on mainnet — a devnet market is called
 * something like "Devnet Premium Market" — so the node's report is the real
 * answer, and it does not exist before a node has taken the job. Both places
 * that name a job use this, so they can never disagree.
 */
const props = defineProps<{
  node?: string | null;
  /** Shown while the job has no node, or before its metrics arrive. */
  fallback: string;
}>();

const { gpuName } = useNodeGpu(() => props.node);
</script>
