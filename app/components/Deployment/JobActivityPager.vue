<template>
  <div class="jpager">
    <button
      class="jpg-btn"
      :disabled="!hasPrev || loading"
      aria-label="Previous"
      @click="$emit('prev')"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
    <button
      class="jpg-btn"
      :disabled="!hasNext || loading"
      aria-label="Next"
      @click="$emit('next')"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
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
/* Sits alone in the card footer, which owns the padding and decides whether
   there is anything to page through at all. */
.jpager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-left: auto;
}

.jpg-btn {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 0;
  background: $white-ter;
  color: $grey-dark;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;

  &:hover:not(:disabled) {
    color: $text;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  svg {
    width: 15px;
    height: 15px;
  }
}

html.dark-mode .jpg-btn {
  background: rgba($white, 0.06);
  color: $grey-light;

  &:hover:not(:disabled) {
    color: $white;
  }
}
</style>
