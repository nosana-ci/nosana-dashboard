<template>
  <div class="box has-background-white">
    <span v-if="name" class="is-size-7 has-text-grey pb-5">{{ name }}</span><br>
    <div class="py-4 px-5 markdown" :class="{ 'expanded': expand }" v-html="markdown" />
    <div class="fade has-text-centered" :class="{ 'expanded': expand, 'dark-mode': $colorMode.value === 'dark' }">
      <span v-if="!expand" @click="expand = !expand">Expand <i class="fa-solid fa-chevron-down" /></span>
      <span v-else @click="expand = !expand">Collapse <i class="fa-solid fa-chevron-up" /></span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { marked } from 'marked';
const props = defineProps({
  name: {
    type: String,
    required: false
  },
  rawMarkdown: {
    type: String,
    required: true
  },
  view: {
    type: String,
    default: 'json'
  }
});
const expand: Ref<boolean> = ref(false);
const markdown = computed(() => {
  return marked(props.rawMarkdown);
});
</script>

<style scoped lang="scss">
.box {
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.markdown {
  overflow: hidden;
  transition: max-height 0.5s ease-out;
  position: relative;
  flex: 1;
  max-height: v-bind('view === "json" ? "250px" : "600px"');

  &.expanded {
    max-height: none;
  }

  ::v-deep p {
    margin-bottom: .5rem;
    font-size: .9rem;
  }

  ::v-deep h1,
  h2,
  h3,
  h4 {
    font-weight: bold;
  }

  ::v-deep h1 {
    font-size: 1.5rem;
    border-bottom: $dark solid 1px;
    margin-bottom: .8rem;
    padding-bottom: .5rem;
  }
}

.fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 15px;
  background: linear-gradient(180deg, rgba($white, 0) 0%, $white 100%);
  transition: opacity 0.2s ease;
  pointer-events: none;

  &.dark-mode {
    background: linear-gradient(180deg, rgba($black-bis, 0) 0%, $black-bis 100%);
  }

  span {
    font-size: .9rem;
    cursor: pointer;
    z-index: 1;
    background: $white;
    padding: 4px 12px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    pointer-events: auto;

    .dark-mode & {
      background: $black-bis;
    }

    i {
      font-size: .8rem;
    }
  }

  &.expanded {
    background: none;
    
    span {
      position: relative;
      top: 20px;
    }
  }
}
</style>