<template>
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="ICON_MARKUP[icon]"
  />
</template>

<script setup lang="ts">
import type { CategoryIconName } from "~/composables/useNodeRequirements";

defineProps<{ icon: CategoryIconName }>();

const ICON_MARKUP: Record<CategoryIconName, string> = {
  gpu: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h4M7 14h2"/>',
  compute:
    '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  network:
    '<path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 14 0M1.5 9.4a15 15 0 0 1 21 0"/>',
  storage:
    '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};
</script>
