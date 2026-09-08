<template>
  <div v-if="states.length" class="jkey">
    <span v-for="n in states" :key="n" class="jkey-item">
      <JobStatusDot :state="n" />
      {{ getStatusText(n) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import JobStatusDot from "~/components/Deployment/JobStatusDot.vue";
import { getStatusText } from "~/composables/useStatus";

defineProps<{ states: number[] }>();
</script>

<style lang="scss" scoped>
.jkey {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 1rem;
  color: $text-muted;
  font-size: 0.75rem;
}

.jkey-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
