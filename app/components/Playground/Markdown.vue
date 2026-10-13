<template>
  <ComarkMarkdown
    :value="text"
    :streaming="streaming"
    :plugins="plugins"
    :caret="streaming"
    class="content pg-markdown"
  />
</template>

<script setup lang="ts">
import shiki from "@comark/nuxt/plugins/shiki";
import alert from "@comark/nuxt/plugins/alert";
import taskList from "@comark/nuxt/plugins/task-list";
import footnotes from "@comark/nuxt/plugins/footnotes";
import math from "@comark/nuxt/plugins/math";
import "katex/dist/katex.min.css";
import { Markdown as ComarkMarkdown } from "@comark/vue";

defineProps<{ text: string; streaming?: boolean }>();

// Streaming markdown with highlighted code, maths, GitHub alerts, task lists and
// footnotes. Comark renders tokens as they arrive and keeps the reading position.
const plugins = [shiki(), alert(), taskList(), footnotes(), math()];
</script>

<style scoped lang="scss">
// Bulma's `.content` sizes the prose; a chat line is a touch tighter than a page.
.pg-markdown {
  font-size: 0.95rem;
  line-height: 1.55;

  :deep(> :last-child) {
    margin-bottom: 0;
  }

  :deep(pre) {
    font-size: 0.8rem;
    border-radius: 8px;
    padding: 0.9rem 1.1rem;
  }

  :deep(.katex-display) {
    overflow-x: auto;
    padding: 0.25rem 0;
  }
}
</style>
