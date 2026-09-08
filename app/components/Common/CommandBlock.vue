<template>
  <div class="command-wrap">
    <pre class="command-block"><code>{{ command }}</code></pre>
    <button
      type="button"
      class="icon-button copy-button"
      :class="{ 'is-copied': copied }"
      :aria-label="copyLabel"
      :title="copyLabel"
      @click="copyCommand"
    >
      <CheckIcon v-if="copied" aria-hidden="true" />
      <CopyIcon v-else aria-hidden="true" />
    </button>
    <span class="is-sr-only" aria-live="polite">{{ announcement }}</span>
    <!-- A note under the command, aligned with its first character -->
    <p v-if="$slots.default" class="command-note"><slot /></p>
  </div>
</template>

<script setup lang="ts">
import CheckIcon from "@/assets/img/icons/check.svg?component";
import CopyIcon from "@/assets/img/icons/copy.svg?component";

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
  return "Copy command";
});
const announcement = computed(() => {
  if (copied.value) return "Command copied to clipboard.";
  if (failed.value) return "Could not copy the command.";
  return "";
});
</script>

<style scoped lang="scss">
$command-padding-x: 1rem;

.command-wrap {
  position: relative;
}

.command-block {
  margin: 0;
  padding: 0.85rem 3.25rem 0.85rem $command-padding-x;
  border: 1px solid $grey-lighter;
  border-radius: 10px;
  background: $white-ter;
  color: $text;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.8rem;
  line-height: 1.6;
}

.copy-button {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  color: $grey;

  // The copy glyph carries no fill of its own, so it would paint black.
  svg {
    fill: currentColor;
  }

  &.is-copied {
    color: $secondary;
  }
}

.command-note {
  margin: 0.5rem 0 0;
  padding: 0 $command-padding-x;
  font-size: 0.78rem;
  color: $grey;

  :deep(code) {
    font-size: 0.75rem;
  }
}

html.dark-mode {
  .command-block {
    background: $body-background-color-dark;
    border-color: rgba($white, 0.08);
    color: $white;
  }

  .copy-button {
    color: $grey-light;

    &:hover,
    &:focus-visible {
      color: $white;
    }

    &.is-copied {
      color: $secondary;
    }
  }

  .command-note {
    color: rgba($white, 0.45);
  }
}
</style>
