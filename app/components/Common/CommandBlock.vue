<template>
  <div class="is-relative">
    <pre class="command-block has-radius"><code>{{ command }}</code></pre>
    <button
      type="button"
      class="button is-small is-quiet copy-button"
      :aria-label="copyLabel"
      @click="copyCommand"
    >
      {{ copyLabel }}
    </button>
    <span class="is-sr-only" aria-live="polite">{{ announcement }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  command: string;
}>();

const { copy, copied } = useClipboard({ copiedDuring: 1800 });
const failed = ref(false);
const { start: clearFailure } = useTimeoutFn(
  () => {
    failed.value = false;
  },
  1800,
  { immediate: false },
);

const copyCommand = async () => {
  failed.value = false;
  try {
    await copy(props.command);
  } catch {
    failed.value = true;
    clearFailure();
  }
};

const copyLabel = computed(() => {
  if (copied.value) return "Copied";
  if (failed.value) return "Copy failed";
  return "Copy";
});
const announcement = computed(() => {
  if (copied.value) return "Command copied to clipboard.";
  if (failed.value) return "Could not copy the command.";
  return "";
});
</script>

<style scoped lang="scss">
.command-block {
  padding-right: 5.5rem;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.8rem;
}

.copy-button {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
}

html.dark-mode .command-block {
  background: $black-ter;
  color: $white;
}
</style>
