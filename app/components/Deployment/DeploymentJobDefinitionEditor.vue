<template>
  <div class="mb-5">
    <div
      class="is-flex is-justify-content-space-between is-align-items-center mb-3"
    >
      <h2 class="title is-5 mb-0">Current Job Configuration</h2>
      <div class="buttons" v-if="hasDefinitionChanged">
        <button @click="$emit('reset')" class="button is-small is-light">
          Reset
        </button>
        <button
          @click="$emit('makeRevision')"
          class="button is-small is-primary"
        >
          Make Revision
        </button>
      </div>
    </div>
    <div class="box is-borderless">
      <div
        v-if="loadingJobDefinition"
        class="has-text-grey has-text-centered py-4"
      >
        Loading job definition...
      </div>
      <div v-else-if="jobDefinitionModel" class="json-editor-container">
        <CommonJsonEditor
          ref="editorRef"
          :modelValue="jobDefinitionModel"
          :readOnly="false"
          :validateJobDefinition="true"
          @update:modelValue="
            (value: unknown) => {
              if (value && typeof value === 'object') {
                $emit('update:jobDefinitionModel', value as JobDefinition);
              }
            }
          "
        />
      </div>
      <div v-else class="has-text-grey has-text-centered py-4">
        No job definition found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobDefinition } from "@nosana/kit";

const editorRef = ref<{ hasErrors: boolean } | null>(null);

const props = defineProps<{
  jobDefinitionModel: JobDefinition | null;
  loadingJobDefinition: boolean;
  hasDefinitionChanged: boolean;
}>();

defineEmits<{
  "update:jobDefinitionModel": [value: JobDefinition];
  reset: [];
  makeRevision: [];
}>();

// Expose editor ref so parent can wire it up for validation
defineExpose({ editorRef });
</script>
