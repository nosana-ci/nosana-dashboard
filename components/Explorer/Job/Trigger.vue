<template>
  <span
    v-if="trigger && typeMap[trigger]"
    class="is-flex is-align-items-center"
  >
    <img style="height: 20px" :src="`/img/icons/trigger/${trigger}.svg`" />
    <span v-if="text" class="ml-2 is-capitalized">{{ typeMap[trigger] }}</span>
  </span>
</template>

<script setup lang="ts">
const props = defineProps({
  ipfs: {
    type: Object,
    required: true,
  },
  text: {
    type: Boolean,
    default: false,
  },
});
const typeMap = {
  gitlab: 'GitLab',
  github: 'GitHub',
  cli: 'CLI',
};

const trigger: ComputedRef<keyof typeof typeMap> = computed(() => {
  let jobtrigger;
  if (props.ipfs.state && props.ipfs.state['nosana/trigger']) {
    jobtrigger = props.ipfs.state['nosana/trigger'];
  } else if (props.ipfs.state && props.ipfs.state['nosana/job-type']) {
    jobtrigger = props.ipfs.state['nosana/job-type'];
  } else if (props.ipfs.state && props.ipfs.state['nosana/type']) {
    jobtrigger = props.ipfs.state['nosana/type'];
  } else if (props.ipfs.type) {
    jobtrigger = props.ipfs.type;
  }

  switch (jobtrigger) {
    case 'Github':
    case 'github-flow':
      return 'github';
    case 'Gitlab':
    case 'gitlab-flow':
      return 'gitlab';
    default:
      return jobtrigger;
  }
});
</script>

<style lang="scss" scoped>
img {
  max-width: none;
  -webkit-filter: grayscale(30%); /* Chrome 19+ & Safari 6+ */
  transition: 0.2s;
}
</style>
<style lang="scss">
.remove-greyscale-on-hover:hover {
  img {
    -webkit-filter: grayscale(0%);
  }
}
</style>
