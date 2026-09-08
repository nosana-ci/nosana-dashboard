<template>
  <div class="mb-5">
    <div
      class="is-flex is-justify-content-space-between is-align-items-center mb-3"
    >
      <h2 class="title is-5 mb-0">Current Job Configuration</h2>
      <div class="cfg-actions">
        <template v-if="hasDefinitionChanged">
          <button @click="$emit('reset')" class="cfg-btn ghost" type="button">
            Reset
          </button>
          <button
            @click="$emit('makeRevision')"
            class="cfg-btn primary"
            type="button"
          >
            Save
          </button>
        </template>
      </div>
    </div>
    <div class="dep-card">
      <div
        v-if="loadingJobDefinition"
        class="has-text-grey has-text-centered py-5"
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
      <div v-else class="has-text-grey has-text-centered py-5">
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

<style lang="scss" scoped>
.dep-card {
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 14px;
  overflow: hidden;
}
html.dark-mode .dep-card {
  background: $black-ter;
  border-color: rgba($white, 0.08);
}

.cfg-actions {
  display: inline-flex;
  gap: 0.5rem;
}

.cfg-btn {
  font-family: $title-family;
  font-weight: 500;
  font-size: 0.85rem;
  border-radius: 9px;
  padding: 0.45rem 0.95rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.cfg-btn.ghost {
  background: $white-ter;
  border-color: $grey-lighter;
  color: $text;

  &:hover {
    background: $grey-lightest;
    border-color: $grey-light;
  }
}

.cfg-btn.primary {
  background: $primary;
  color: $white;

  &:hover {
    background: $grey-darker;
  }
}

html.dark-mode .cfg-btn.ghost {
  background: rgba($white, 0.06);
  border-color: rgba($white, 0.12);
  color: $white;

  &:hover {
    background: rgba($white, 0.1);
  }
}

html.dark-mode .cfg-btn.primary {
  background: $white;
  color: $black;

  &:hover {
    background: $grey-lighter;
  }
}
</style>
