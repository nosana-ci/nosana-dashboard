<template>
  <div class="pod-configuration-tab jdb-json">
    <button class="copy-float" type="button" title="Copy JSON" aria-label="Copy JSON" @click="copyJson">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></svg>
    </button>
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
import { useToast } from "vue-toastification";
import CommonJsonEditor from "~/components/Common/JsonEditor.vue";
import { useJsonEditorValidation } from "~/composables/useJsonEditorValidation";

const props = defineProps<{
  modelValue: JobDefinition | null | string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: JobDefinition | null | string];
  "update:valid": [value: boolean];
}>();

const toast = useToast();

const jobDefEditor = ref<{ hasErrors: boolean } | null>(null);
const { canSave } = useJsonEditorValidation(jobDefEditor);

const editingDefinition = computed({
  get: () => props.modelValue,
  set: (value: JobDefinition | null | string) => emit("update:modelValue", value),
});

// Live validity (a string/undefined model means a JSON syntax error). Surfaced
// to the parent so the modal footer can show the Valid/Invalid indicator.
const isValid = computed(() => !jobDefEditor.value?.hasErrors);
watch(isValid, (v) => emit("update:valid", v), { immediate: true });

const copyJson = async () => {
  const text =
    typeof props.modelValue === "string"
      ? props.modelValue
      : JSON.stringify(props.modelValue, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied job-definition.json");
  } catch {
    toast.error("Copy blocked by the browser");
  }
};

defineExpose({ jobDefEditor, canSave });
</script>

<style lang="scss" scoped>
/* The editor frames itself (Common/JsonEditor.vue); this wrapper just anchors
   the floating copy button over its top-right corner. */
.pod-configuration-tab.jdb-json {
  position: relative;
  height: 100%;
  display: flex;
}

.field.full-height { margin: 0; }

/* Copy button floating on the editor's top-right */
.copy-float {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  width: 30px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  border: 1px solid #e3e7df;
  background: rgba(255, 255, 255, 0.85);
  color: #586155;
  cursor: pointer;
  backdrop-filter: blur(2px);
  transition: background 0.15s, color 0.15s;

  svg { width: 14px; height: 14px; }
  &:hover { color: #0a8f06; background: #ffffff; }
}

html.dark-mode .copy-float {
  border-color: #1e241e;
  background: rgba(12, 14, 12, 0.7);
  color: #c9d3c6;
  &:hover { color: #8bf58f; background: rgba(12, 14, 12, 0.92); }
}
</style>
