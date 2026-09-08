<template>
  <div class="seg-tabs" role="tablist" :aria-label="label">
    <button
      v-for="tab in tabs"
      :id="`${idPrefix}-${tab.id}`"
      :key="tab.id"
      type="button"
      role="tab"
      :class="{ 'is-active': modelValue === tab.id }"
      :aria-selected="modelValue === tab.id"
      :aria-controls="`${idPrefix}-panel`"
      :tabindex="modelValue === tab.id ? 0 : -1"
      @click="emit('update:modelValue', tab.id)"
      @keydown="onKeydown($event, tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
const props = defineProps<{
  tabs: Array<{ id: T; label: string }>;
  modelValue: T;
  idPrefix: string;
  label?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [id: T] }>();

/** The tab a navigation key moves to, or -1 for any other key. */
function nextTabIndex(key: string, index: number, count: number): number {
  switch (key) {
    case "ArrowRight":
      return (index + 1) % count;
    case "ArrowLeft":
      return (index - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return -1;
  }
}

// Roving focus: arrows and Home/End move between tabs, as in the WAI-ARIA tabs pattern.
function onKeydown(event: KeyboardEvent, id: T) {
  const count = props.tabs.length;
  const index = props.tabs.findIndex((tab) => tab.id === id);
  const next = nextTabIndex(event.key, index, count);
  if (next < 0) return;
  event.preventDefault();
  emit("update:modelValue", props.tabs[next]!.id);
  (event.currentTarget as HTMLElement)
    .closest('[role="tablist"]')
    ?.querySelectorAll<HTMLElement>('[role="tab"]')
    [next]?.focus();
}
</script>
