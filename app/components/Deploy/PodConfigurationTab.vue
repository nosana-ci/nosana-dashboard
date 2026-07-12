<template>
  <div class="pod-configuration-tab">
    <div class="field full-height">
      <div class="control full-height json-editor-container">
        <CommonJsonEditor
          ref="jobDefEditor"
          v-model="editingDefinition"
          :validateJobDefinition="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobDefinition } from "@nosana/kit";
import CommonJsonEditor from "~/components/Common/JsonEditor.vue";
import { useJsonEditorValidation } from "~/composables/useJsonEditorValidation";

const props = defineProps<{
  modelValue: JobDefinition | null | string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: JobDefinition | null | string];
}>();

const jobDefEditor = ref<{ hasErrors: boolean } | null>(null);
const { canSave } = useJsonEditorValidation(jobDefEditor);

const editingDefinition = computed({
  get: () => props.modelValue,
  set: (value: JobDefinition | null | string) => emit("update:modelValue", value),
});

defineExpose({ jobDefEditor, canSave });
</script>

<style scoped>
.pod-configuration-tab {
  height: 100%;
}
</style>
