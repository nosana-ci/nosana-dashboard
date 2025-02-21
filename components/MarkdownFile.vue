<template>
  <div class="box has-background-white">
    <div class="py-4 px-5 markdown" v-html="markdown" />
  </div>
</template>
<script lang="ts" setup>
import { marked } from 'marked';
const props = defineProps({
  rawMarkdown: {
    type: String,
    required: true
  }
});

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

  ::v-deep p {
    margin-bottom: 1rem;
    font-size: 0.95rem;
    line-height: 1.5;
    color: $text;
  }

  ::v-deep h1,
  h2,
  h3,
  h4 {
    font-weight: 600;
    margin-bottom: 1rem;
    margin-top: 1.5rem;
    color: $text-strong;
  }

  ::v-deep h1 {
    font-size: 1.5rem;
    border-bottom: 1px solid $border;
    padding-bottom: 0.5rem;
  }

  ::v-deep h2 {
    font-size: 1.25rem;
  }

  ::v-deep h3 {
    font-size: 1.1rem;
  }

  ::v-deep ul, ::v-deep ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
    list-style: disc outside;
  }

  ::v-deep ol {
    list-style: decimal outside;
  }

  ::v-deep li {
    margin-bottom: 0.5rem;
    display: list-item;
    list-style-position: outside;
    padding-left: 0.5rem;
  }

  ::v-deep code {
    background-color: $scheme-main-ter;
    color: $text;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }

  ::v-deep pre {
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

  ::v-deep blockquote {
    border-left: 4px solid $border;
    padding-left: 1rem;
    margin-left: 0;
    margin-bottom: 1rem;
    color: $text-light;
  }

  ::v-deep a {
    color: $link;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  ::v-deep img {
    max-width: 100%;
    margin: 1rem 0;
  }

  ::v-deep table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;

    th, td {
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
    ::v-deep p,
    ::v-deep li {
      color: $white-ter;
    }

    ::v-deep h1,
    ::v-deep h2,
    ::v-deep h3,
    ::v-deep h4 {
      color: $white;
    }

    ::v-deep code {
      background-color: $black-ter;
      color: $white-ter;
    }

    ::v-deep pre {
      background-color: $black-ter;
    }

    ::v-deep blockquote {
      color: $grey-light;
    }
  }
}
</style>