<template>
  <span class="runs-on">
    <span>
      <span
        class="runs-on-main"
        :class="{ 'has-title': value.title }"
        :title="value.title"
        >{{ value.main }}</span
      >
      <span v-if="value.tag" class="runs-on-tag">{{ value.tag }}</span>
    </span>
    <span class="runs-on-sub">{{ value.sub }}</span>
  </span>
</template>

<script setup lang="ts">
import type { RunsOn } from "~/composables/useNodeRequirements";

/** A deployment's "Runs on" cell: the market, its GPUs or "Any GPU", with its other requirements (or "No requirements") under it. */
defineProps<{ value: RunsOn }>();
</script>

<style lang="scss" scoped>
.runs-on {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.runs-on-main {
  font-weight: 600;
  white-space: nowrap;

  &.has-title {
    text-decoration: underline dotted;
    text-underline-offset: 3px;
    cursor: help;
  }
}

.runs-on-tag {
  margin-left: 6px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba($grey, 0.12);
  color: $text-muted;
  font-size: 11px;
  font-weight: 600;
}

.runs-on-sub {
  font-size: 12.5px;
  color: $text-muted;
}
</style>
