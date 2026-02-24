<template>
  <div v-if="revision" class="modal" :class="{ 'is-active': modelValue }">
    <div
      class="modal-background"
      @click="$emit('update:modelValue', false)"
    ></div>
    <div class="modal-card modal-card-wide">
      <header class="modal-card-head">
        <p class="modal-card-title">
          Revision {{ revision.revision }} - Job Configuration
        </p>
        <button
          class="delete"
          @click="$emit('update:modelValue', false)"
        ></button>
      </header>
      <section class="modal-card-body has-min-height-500">
        <div v-if="revision.job_definition" class="json-editor-container">
          <CommonJsonEditor
            v-model="revision.job_definition"
            :readOnly="true"
          />
        </div>
        <div v-else class="has-text-grey has-text-centered py-4">
          No job definition found for this revision
        </div>
      </section>
      <footer class="modal-card-foot is-justify-content-flex-end">
        <button class="button" @click="$emit('update:modelValue', false)">
          Close
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  revision: any;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
}>();
</script>
