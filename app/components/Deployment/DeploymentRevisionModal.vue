<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div
      class="modal-background"
      @click="$emit('update:modelValue', false)"
    ></div>
    <div class="modal-card modal-card-wide">
      <header class="modal-card-head">
        <p class="modal-card-title">Create New Revision</p>
        <button
          class="delete"
          @click="$emit('update:modelValue', false)"
        ></button>
      </header>
      <section class="modal-card-body has-min-height-500">
        <div class="field full-height">
          <div class="control full-height">
            <CommonJsonEditor
              ref="editorRef"
              v-model="localDefinition"
              :validateJobDefinition="true"
              class="has-height-500"
            />
          </div>
        </div>
      </section>
      <footer class="modal-card-foot is-justify-content-flex-end">
        <button class="button" @click="$emit('update:modelValue', false)">
          Cancel
        </button>
        <button
          class="button is-success"
          @click="$emit('confirm')"
          :class="{ 'is-loading': actionLoading }"
          :disabled="actionLoading"
        >
          Create Revision
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobDefinition } from "@nosana/kit";

const editorRef = ref<{ hasErrors: boolean } | null>(null);

const localDefinition = defineModel<JobDefinition | null>("definition");

defineProps<{
  modelValue: boolean;
  actionLoading: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();

defineExpose({ editorRef });
</script>
