<template>
  <span v-if="type" class="is-flex is-align-items-center">
    <img style="height: 20px" :src="`/img/icons/type/${type}.svg`" />
    <span v-if="text" class="ml-2 is-capitalized">{{
      typeMap[type as keyof typeof typeMap]
    }}</span>
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
  docker: 'Docker',
  wasm: 'WebAssembly',
};

const type = computed(() => {
  let jobtype;
  if (props.ipfs.state && props.ipfs.state['nosana/job-type']) {
    jobtype = props.ipfs.state['nosana/job-type'];
  } else if (props.ipfs.state && props.ipfs.state['nosana/type']) {
    jobtype = props.ipfs.state['nosana/type'];
  } else if (props.ipfs.type) {
    jobtype = props.ipfs.type;
  }

  switch (jobtype) {
    case 'Github':
    case 'github-flow':
      return 'docker';
    case 'Gitlab':
    case 'gitlab-flow':
      return 'docker';
    case 'container':
      return 'docker';
    default:
      return jobtype;
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
