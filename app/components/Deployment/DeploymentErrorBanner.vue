<template>
  <div v-if="hasErrorInLastEvent" class="notification is-danger mb-5 is-light">
    <div class="is-flex is-align-items-center is-justify-content-space-between">
      <div>
        <strong>Deployment Error Detected</strong>
        <p class="mt-1">
          An error occurred with this deployment. View the Events tab for more
          details.
        </p>
      </div>
      <button
        @click="$emit('viewEvents')"
        class="button is-danger is-outlined ml-4"
      >
        View Events
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hasErrorInLastEvent: boolean;
}>();

defineEmits<{
  viewEvents: [];
}>();
</script>
