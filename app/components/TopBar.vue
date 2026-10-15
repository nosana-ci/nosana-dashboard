<template>
  <!-- The page heading. The account menu lives at the foot of the sidebar. -->
  <div v-if="title || subtitle" class="mb-5">
    <h2 v-if="title" class="title">{{ title }}</h2>
    <h3 v-if="subtitle" class="subtitle mb-2">
      {{ subtitle }}
    </h3>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  subtitle: {
    type: String,
    required: false,
  },
});
</script>
