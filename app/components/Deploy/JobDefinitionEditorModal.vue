<template>
  <!-- Job Definition Editor Modal -->
  <div class="modal" :class="{ 'is-active': isOpen }">
    <div class="modal-background" @click="cancel"></div>
    <div class="modal-card is-app-modal is-large jobdef-modal">
      <header class="modal-card-head">
        <div
          class="is-flex is-align-items-center is-gap-2"
          style="min-width: 0"
        >
          <span class="app-modal-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
            </svg>
          </span>
          <div style="min-width: 0">
            <p class="modal-card-title title is-5 mb-0">Job definition</p>
          </div>
        </div>
        <div
          class="seg-tabs jobdef-seg"
          role="tablist"
          aria-label="Editor mode"
        >
          <button
            type="button"
            :class="{ 'is-active': editorMode === 'builder' }"
            role="tab"
            :aria-selected="editorMode === 'builder'"
            @click="editorMode = 'builder'"
          >
            Builder
          </button>
          <button
            type="button"
            :class="{ 'is-active': editorMode === 'json' }"
            role="tab"
            :aria-selected="editorMode === 'json'"
            @click="editorMode = 'json'"
          >
            JSON
          </button>
        </div>
        <button class="delete" aria-label="close" @click="cancel"></button>
      </header>
      <section class="modal-card-body jobdef-body">
        <DeployJobDefinitionBuilder
          v-if="editorMode === 'builder'"
          ref="builderTab"
          v-model="editingJobDefinition"
        />
        <PodConfigurationTab
          v-else
          ref="podTab"
          v-model="editingJobDefinition"
          @update:valid="jsonValid = $event"
        />
      </section>
      <footer class="modal-card-foot">
        <p
          class="has-text-grey is-size-7 jobdef-foot"
          style="flex: 1; min-width: 0"
        >
          <span
            >Changes apply when you save.
            {{
              editorMode === "json"
                ? "Invalid JSON is blocked."
                : "Required fields are checked."
            }}</span
          >
          <span
            v-if="editorMode === 'json'"
            class="jobdef-valid"
            :class="jsonValid ? 'is-ok' : 'is-bad'"
          >
            <svg
              v-if="jsonValid"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 9v4M12 17h.01" />
              <path
                d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
              />
            </svg>
            {{ jsonValid ? "Valid" : "Invalid" }}
          </span>
        </p>
        <div class="buttons mb-0">
          <button class="button" @click="cancel">Cancel</button>
          <button class="button is-success" @click="save">Save changes</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobDefinition } from "@nosana/kit";
import PodConfigurationTab from "./PodConfigurationTab.vue";
import DeployJobDefinitionBuilder from "./JobDefinitionBuilder.vue";

const props = defineProps<{
  modelValue: JobDefinition | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: JobDefinition | null];
}>();

// Modal state
const isOpen = ref(false);

// Editor mode: schema-driven form builder (default) or raw JSON escape hatch
const editorMode = ref<"builder" | "json">("builder");
const builderTab = ref<{ canSave: () => boolean } | null>(null);
const podTab = ref<{ canSave: () => boolean } | null>(null);
// JSON validity, surfaced by PodConfigurationTab for the footer indicator.
const jsonValid = ref(true);

// The editing copy, plus the original so cancel can restore it. The editors
// hand back a string while the JSON has a syntax error.
const editingJobDefinition = ref<JobDefinition | null | string>(null);

// Open the modal on a snapshot of the current job definition, in the
// builder unless asked for the JSON.
function open(mode: "builder" | "json" = "builder") {
  editingJobDefinition.value = JSON.parse(JSON.stringify(props.modelValue));
  editorMode.value = mode;
  isOpen.value = true;
}

// Save with validation (gate depends on the active editor)
function save() {
  const activeEditor =
    editorMode.value === "builder" ? builderTab.value : podTab.value;
  if (!activeEditor?.canSave?.()) return;
  // A string copy means a JSON syntax error, which canSave already rejects.
  const edited = editingJobDefinition.value;
  if (typeof edited === "string") return;
  emit("update:modelValue", edited);
  isOpen.value = false;
}

// Cancel - restore original state
// The edits live on a snapshot that the next open replaces, so closing drops them.
function cancel() {
  isOpen.value = false;
}

defineExpose({ open });
</script>

<style lang="scss" scoped>
/* ---------- Job definition modal (editor sizing) ---------- */
/* The is-app-modal global styles the shell; here we just make the JSON
   editor fill the scrollable body. */
/* Compact header now that it's a single "Job definition" title (the shared
   is-app-modal head top-aligns for a two-line eyebrow+title we no longer use). */
.jobdef-modal .modal-card-head {
  align-items: center;
  padding-top: 0.9rem;
  padding-bottom: 0.9rem;
}
.jobdef-modal .app-modal-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
}
.jobdef-modal .app-modal-icon svg {
  width: 18px;
  height: 18px;
}
.jobdef-modal .modal-card-title {
  font-size: 1.05rem;
}

.jobdef-body {
  display: flex;
  overflow: hidden;
  min-height: 60vh;
}

/* The form builder fills the scrollable body like the JSON editor does */
.jobdef-body :deep(.jdb) {
  flex: 1;
  min-width: 0;
}

/* Builder / JSON toggle uses the shared .seg-tabs; just position it in the head */
.jobdef-seg {
  margin-left: auto;
  margin-right: 0.85rem;
  flex: none;
}

/* Footer validity indicator (JSON mode) */
.jobdef-foot {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.jobdef-valid {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: $title-family;
  font-weight: 600;
  font-size: 0.7rem;
  padding: 3px 9px;
  border-radius: 999px;

  svg {
    width: 11px;
    height: 11px;
  }
  &.is-ok {
    color: #0a8f06;
    background: rgba($secondary, 0.1);
    border: 1px solid rgba($secondary, 0.4);
  }
  &.is-bad {
    color: #e5484d;
    background: rgba(#e5484d, 0.1);
    border: 1px solid rgba(#e5484d, 0.4);
  }
}
html.dark-mode .jobdef-valid.is-ok {
  color: #8bf58f;
}

.jobdef-body :deep(.pod-configuration-tab),
.jobdef-body :deep(.field.full-height),
.jobdef-body :deep(.json-editor-container) {
  flex: 1;
  display: flex;
  min-width: 0;
  min-height: 0;
  margin: 0;
}

.jobdef-body :deep(.json-editor) {
  flex: 1;
  min-width: 0;
}

.jobdef-body :deep(.jse-main) {
  min-height: 100%;
}
</style>
