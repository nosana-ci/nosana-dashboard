<template>
  <div v-if="hasPrev || hasNext" class="pagination-buttons mt-4">
    <button
      class="button"
      :class="{ 'is-disabled': !hasPrev }"
      :disabled="!hasPrev || loading"
      @click="$emit('prev')"
    >
      <span class="icon"><span>&#8249;</span></span>
      <span>Previous</span>
    </button>
    <button
      class="button"
      :class="{ 'is-disabled': !hasNext }"
      :disabled="!hasNext || loading"
      @click="$emit('next')"
    >
      <span>Next</span>
      <span class="icon"><span>&#8250;</span></span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hasPrev: boolean;
  hasNext: boolean;
  loading: boolean;
}>();

defineEmits<{
  prev: [];
  next: [];
}>();
</script>

<style lang="scss" scoped>
.pagination-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;

  .button {
    cursor: pointer;

    &.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
