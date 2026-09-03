<template>
  <div class="pod-configuration-tab jdb-json">
    <div class="jdb-json-head">
      <span class="dot" aria-hidden="true"></span>
      <span class="fname">job-definition.json</span>
      <span class="status" :class="isValid ? 'ok' : 'bad'">
        <svg v-if="isValid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg>
        {{ isValid ? 'Valid' : 'Invalid' }}
      </span>
      <button class="copy" type="button" title="Copy JSON" aria-label="Copy JSON" @click="copyJson">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></svg>
      </button>
    </div>
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
}>();

const toast = useToast();

const jobDefEditor = ref<{ hasErrors: boolean } | null>(null);
const { canSave } = useJsonEditorValidation(jobDefEditor);

const editingDefinition = computed({
  get: () => props.modelValue,
  set: (value: JobDefinition | null | string) => emit("update:modelValue", value),
});

// Live validity for the header pill (a string/undefined model means a JSON syntax error)
const isValid = computed(() => !jobDefEditor.value?.hasErrors);

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
$jse-bg: #0c0e0c;
$jse-border: #1e241e;
$jse-text: #c9d3c6;
$jse-key: #8bf58f;

.pod-configuration-tab.jdb-json {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $jse-bg;
  border: 1px solid $jse-border;
  border-radius: 12px;
  overflow: hidden;
}

/* Header bar — mirrors the builder's live-preview panel */
.jdb-json-head {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: none;
  padding: 11px 13px;
  border-bottom: 1px solid $jse-border;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $secondary;
    box-shadow: 0 0 9px rgba($secondary, 0.5);
  }
  .fname {
    font-family: monospace;
    font-size: 0.75rem;
    color: $jse-text;
  }
  .status {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: $title-family;
    font-weight: 600;
    font-size: 0.68rem;
    padding: 3px 9px;
    border-radius: 999px;
    svg { width: 11px; height: 11px; }
    &.ok { color: $jse-key; background: rgba($secondary, 0.1); border: 1px solid rgba($secondary, 0.4); }
    &.bad { color: #f2686c; background: rgba(#f2686c, 0.12); border: 1px solid rgba(#f2686c, 0.4); }
  }
  .copy {
    border: 1px solid $jse-border;
    background: transparent;
    color: $jse-text;
    border-radius: 7px;
    width: 28px;
    height: 25px;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: background 0.15s;
    svg { width: 13px; height: 13px; }
    &:hover { background: rgba(255, 255, 255, 0.05); }
  }
}

.field.full-height { margin: 0; }

/* The editor theme is shared (Common/JsonEditor.vue); this card is its frame,
   so drop the editor's own border/radius to avoid doubling up. */
.jdb-json :deep(.json-editor) {
  border: 0 !important;
  border-radius: 0 !important;
}
</style>
