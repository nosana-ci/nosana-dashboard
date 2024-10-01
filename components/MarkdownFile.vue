<template>
  <div class="box has-background-white">
    <span v-if="name" class="is-size-7 has-text-grey pb-5">{{ name }}</span><br>
    <div class="py-4 px-5 markdown" :class="{ 'expanded': expand }" v-html="markdown" />
    <div class="fade has-text-centered" :class="{ 'expanded': expand }">
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
});
const expand: Ref<boolean> = ref(false);
const markdown = computed(() => {
  return marked(props.rawMarkdown);
});
</script>

<style scoped lang="scss">
.markdown {
  max-height: 200px;
  overflow: hidden;

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
  border-radius: 15px;
  transition: all 0.2 ease;
  background: linear-gradient(0deg, rgba(252, 252, 252, 1) 10%, rgba(10, 10, 10, 0) 100%);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 15px;

  span {
    font-size: .9rem;
    cursor: pointer;

    i {
      font-size: .8rem;
    }
  }

  &.expanded {
    position: relative;
    background: none;
    height: auto;
    padding-bottom: 0px;
  }
}
</style>