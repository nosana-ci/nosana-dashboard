<template>
  <div class="box has-background-white">
    <div class="py-4 px-5 markdown" v-html="markdown" />
  </div>
</template>
<script lang="ts" setup>
import { marked } from "marked";
const props = defineProps({ rawMarkdown: { type: String, required: true } });

const markdown = computed(() => {
  return marked(props.rawMarkdown);
});
</script>

<style scoped lang="scss">
.box {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.markdown {
  flex: 1;
  overflow-y: auto;

  :deep(p) {
    margin-bottom: 1rem;
    font-size: 0.95rem;
    line-height: 1.5;
    color: $text;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    font-weight: 600;
    margin-bottom: 1rem;
    margin-top: 1.5rem;
    color: $text-strong;
  }

  :deep(h1) {
    font-size: 1.5rem;
    border-bottom: 1px solid $border;
    padding-bottom: 0.5rem;
  }

  :deep(h2) {
    font-size: 1.25rem;
  }

  :deep(h3) {
    font-size: 1.1rem;
  }

  :deep(ul),
  :deep(ol) {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
    list-style: disc outside;
  }

  :deep(ol) {
    list-style: decimal outside;
  }

  :deep(li) {
    margin-bottom: 0.5rem;
    display: list-item;
    list-style-position: outside;
    padding-left: 0.5rem;
  }

  :deep(code) {
    background-color: $scheme-main-ter;
    color: $text;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }

  :deep(pre) {
    background-color: $scheme-main-ter;
    padding: 1rem;
    border-radius: $radius;
    margin-bottom: 1rem;
    overflow-x: auto;

    code {
      background: none;
      padding: 0;
    }
  }

  :deep(blockquote) {
    border-left: 4px solid $border;
    padding-left: 1rem;
    margin-left: 0;
    margin-bottom: 1rem;
    color: $text-light;
  }

  :deep(a) {
    color: $link;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(img) {
    max-width: 100%;
    margin: 1rem 0;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;

    th,
    td {
      border: 1px solid $border;
      padding: 0.5rem;
    }

    th {
      background-color: $scheme-main-ter;
      font-weight: 600;
    }
  }
}

.dark-mode {
  .markdown {
    :deep(p),
    :deep(li) {
      color: $white-ter;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
      color: $white;
    }

    :deep(code) {
      background-color: $black-ter;
      color: $white-ter;
    }

    :deep(pre) {
      background-color: $black-ter;
    }

    :deep(blockquote) {
      color: $grey-light;
    }
  }
}
</style>
