<template>
  <button
    type="button"
    class="icon-button copy-button"
    :class="{ 'is-copied': copied }"
    :aria-label="copied ? 'Copied' : label"
    :title="copied ? 'Copied' : label"
    @click="copy(text)"
  >
    <CheckIcon v-if="copied" aria-hidden="true" />
    <CopyIcon v-else aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import CheckIcon from "@/assets/img/icons/check.svg?component";
import CopyIcon from "@/assets/img/icons/copy.svg?component";

/** An icon button that copies `text` and shows a tick for a moment afterwards. */
withDefaults(
  defineProps<{
    text: string;
    /** What the button copies, for its tooltip and screen readers. */
    label?: string;
  }>(),
  { label: "Copy" },
);

const { copy, copied } = useClipboard({ copiedDuring: 1600 });
</script>

<style scoped lang="scss">
.copy-button {
  flex: none;

  // The copy glyph carries no fill of its own, so it would paint black.
  svg {
    fill: currentColor;
  }

  &.is-copied {
    color: $secondary;
  }
}
</style>
