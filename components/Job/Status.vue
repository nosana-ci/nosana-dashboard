<template>
  <StatusTag :status="status" :fallbackState="fallbackState" :imageOnly="imageOnly" />
</template>

<script setup lang="ts">
import StatusTag from "~/components/Common/StatusTag.vue";
const props = defineProps({
  status: {
    type: [String, Number],
    required: true,
  },
  fallbackState: {
    type: [String, Number],
    required: false,
    default: undefined,
  },
  imageOnly: {
    type: Boolean,
    default: false,
  },
});

// Wrapper proxies to Common/StatusTag
</script>

<style lang="scss" scoped>
.tag {
  min-width: max-content;
}

// Animation styles are defined globally in assets/styles/global.scss

@include until-widescreen {
  .tag {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;

    img {
      margin: 0 !important;
    }

    span:not(.status-icon-wrap) {
      display: none;
    }
    
    // Preserve color inheritance for status icons
    &.status-tag {
      svg {
        color: inherit !important;
      }
    }
  }
}
</style>
