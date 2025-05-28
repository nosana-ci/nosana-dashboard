<template>
  <div class="modal" :class="{ 'is-active': isOpen }">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card fullscreen-modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ title }}</p>
        <button class="delete" aria-label="close" @click="close"></button>
      </header>
      <section class="modal-card-body fullscreen-modal-body">
        <slot></slot>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean;
  title: string;
}
defineProps<Props>();
const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};
</script>

<style lang="scss" scoped>
.fullscreen-modal-card {
  width: 90vw;
  height: 90vh;
  max-width: 1600px;
  display: flex;
  flex-direction: column;
}

.fullscreen-modal-body {
  padding: 0 !important;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* The parent hides overflow, direct child of slot handles scrolling */
  min-height: 0; /* Important for flex context */

  /* Ensures the direct child slotted content can grow and scroll if needed */
  :deep(> *) {
    flex-grow: 1;
    min-height: 0;
    /* The slotted component itself should handle its overflow, e.g., with overflow-y: auto */
  }
}

/* Bulma's default dark mode for modal-card-head should apply.
   If more specific dark mode styling is needed, it can be added here.
   For example, if the global dark mode for modals isn't sufficient:
html.dark-mode {
  .fullscreen-modal-card {
    .modal-card-head {
      background-color: $black-bis; // Or your specific dark color
      border-bottom-color: $grey-darker;
      .modal-card-title {
        color: $white;
      }
    }
    .modal-card-body {
      background-color: $black-bis; // Or your specific dark color
    }
  }
}
*/
</style> 