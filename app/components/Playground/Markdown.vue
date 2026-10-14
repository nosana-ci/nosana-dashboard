<template>
  <!-- eslint-disable-next-line vue/no-v-html -- sanitised by renderChatMarkdown -->
  <div class="content pg-markdown" :class="{ 'is-streaming': streaming }" v-html="html" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { renderChatMarkdown } from "~/utils/chatMarkdown";

const props = defineProps<{ text: string; streaming?: boolean }>();

// Rendered as the deployment pages' chat renders replies, in Bulma's `.content`.
const html = computed(() => renderChatMarkdown(props.text));
</script>

<style scoped lang="scss">
.pg-markdown {
  overflow-wrap: anywhere;

  :deep(> :last-child) {
    margin-bottom: 0;
  }

  :deep(pre) {
    font-size: 0.82rem;
    border-radius: 8px;
  }

  // Words in a table break only at spaces, so a column is never squeezed to a letter
  // per line; a table wider than the reply scrolls sideways instead.
  :deep(table) {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    overflow-wrap: normal;
  }

  :deep(th) {
    white-space: nowrap;
  }

  // A long formula scrolls sideways rather than widening the reply.
  :deep(.katex-display) {
    overflow-x: auto;
    overflow-y: hidden;
  }

  // A caret after the last word while the reply streams in.
  &.is-streaming > :deep(:last-child)::after {
    content: "▍";
    margin-left: 1px;
    color: $secondary;
    animation: pg-caret 1s steps(2) infinite;
  }
}

@keyframes pg-caret {
  50% {
    opacity: 0;
  }
}
</style>
