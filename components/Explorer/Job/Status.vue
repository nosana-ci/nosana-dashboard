<template>
  <div v-if="!imageOnly" class="tag is-outlined is-light" :class="{
    'is-success': statusString === 'COMPLETED',
    'is-info': statusString === 'RUNNING' || statusString === 'PENDING',
    'is-warning': statusString === 'QUEUED',
    'is-danger': statusString === 'FAILED' || statusString === 'YAML_ERROR',
  }">
    <img class="mr-2" :src="`/img/icons/status/${getIcon(statusString as string)}.svg`" />

    <span v-if="!imageOnly">{{ statusString }}</span>
  </div>
  <img v-else :src="`/img/icons/status/${getIcon(statusString as string)}.svg`" />
</template>

<script setup lang="ts">
const props = defineProps({
  status: {
    type: [String, Number],
    required: true,
  },
  imageOnly: {
    type: Boolean,
    default: false,
  },
});
const statusString = computed(() => {
  if (typeof props.status !== 'string') {
    let string = 'STOPPED';
    if (props.status === 0) {
      string = 'QUEUED';
    } else if (props.status === 1) {
      string = 'RUNNING';
    } else if (props.status === 2) {
      string = 'COMPLETED';
    }
    return string;
  }
  return props.status
})

const getIcon = (status: string) => {
  let icon = 'stopped';
  if (status === 'QUEUED') {
    icon = 'queued';
  } else if (status === 'RUNNING') {
    icon = 'running';
  } else if (status === 'COMPLETED') {
    icon = 'done';
  } else if (status === 'FAILED' || status === 'YAML_ERROR') {
    icon = 'failed';
  }
  return icon;
};
</script>

<style lang="scss" scoped>
.tag {
  min-width: max-content;
}

@include until-widescreen {
  .tag {
    background: none !important;
    border: none !important;
    padding: 0 !important;

    img {
      margin: 0 !important;
    }

    span {
      display: none;
    }
  }
}
</style>
