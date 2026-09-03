<template>
  <JsonEditorVue
    :mode="Mode.text"
    :mainMenuBar="false"
    :statusBar="validateJobDefinition || !!validator"
    :stringified="false"
    :askToFormat="false"
    :validator="internalValidator"
    v-model="model"
    v-bind="$attrs"
    :class="['json-editor', { 'jse-theme-dark': isDark }]"
  />
</template>

<script setup lang="ts">
import { Mode, ValidationSeverity } from 'vanilla-jsoneditor';
import JsonEditorVue from 'json-editor-vue';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';

interface ValidationError {
  path: (string | number)[];
  message: string;
  severity: ValidationSeverity;
}

interface Props {
  modelValue: any;
  validator?: (json: any) => ValidationError[];
  /** Enable built-in job definition validation */
  validateJobDefinition?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  validator: undefined,
  validateJobDefinition: false,
});

// The editor follows the app theme: dark uses vanilla-jsoneditor's dark base
// theme (so CodeMirror renders dark), light uses its default light base theme.
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

const emit = defineEmits(['update:modelValue']);

// Serialize for cheap content comparison; fall back to "not equal" on error so
// we never silently swallow a real update.
function sameContent(a: any, b: any): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

// The editor is fed through an internal buffer rather than binding props.modelValue
// directly. json-editor-vue watches the bound model and, on any external change,
// rebuilds the whole CodeMirror document via `.set()` — which clears any text the
// user is currently selecting. Pages that live-poll (job definitions, deployment
// streams) hand us a fresh object reference with identical content on every tick,
// so without this buffer the user can never hold a selection long enough to copy.
const internalModel = ref<any>(props.modelValue);

watch(
  () => props.modelValue,
  (next) => {
    // Skip no-op updates (same content, new reference) so the document — and the
    // user's selection — is left intact. Real content changes still flow through.
    if (sameContent(next, internalModel.value)) return;
    internalModel.value = next;
  },
);

const model = computed({
  get: () => internalModel.value,
  set: (val) => {
    // Track if value is a string or undefined (indicates JSON parse error)
    // When there's a syntax error, the editor returns the text content as a string
    hasSyntaxError.value = typeof val === 'string' || val === undefined;
    internalModel.value = val;
    emit('update:modelValue', val);
  },
});

// Track validation errors
const validationErrors = ref<ValidationError[]>([]);

// Track JSON syntax errors
const hasSyntaxError = ref(false);

// Expose whether there are any errors (validation OR syntax)
const hasErrors = computed(() => validationErrors.value.length > 0 || hasSyntaxError.value);

/**
 * Built-in job definition validator
 */
function jobDefinitionValidator(json: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!json || typeof json !== 'object') {
    errors.push({ path: [], message: 'Job definition must be an object', severity: ValidationSeverity.error });
    return errors;
  }

  // Check version
  if (!json.version) {
    errors.push({ path: ['version'], message: 'Missing required field: version', severity: ValidationSeverity.error });
  }

  // Check type
  if (!json.type) {
    errors.push({ path: ['type'], message: 'Missing required field: type', severity: ValidationSeverity.error });
  } else if (json.type !== 'container') {
    errors.push({ path: ['type'], message: 'Type must be "container"', severity: ValidationSeverity.error });
  }

  // Check ops
  if (!json.ops) {
    errors.push({ path: ['ops'], message: 'Missing required field: ops', severity: ValidationSeverity.error });
  } else if (!Array.isArray(json.ops)) {
    errors.push({ path: ['ops'], message: 'ops must be an array', severity: ValidationSeverity.error });
  } else if (json.ops.length === 0) {
    errors.push({ path: ['ops'], message: 'ops must contain at least one operation', severity: ValidationSeverity.error });
  } else {
    // Validate each operation
    json.ops.forEach((op: any, index: number) => {
      if (!op.type) {
        errors.push({ path: ['ops', index, 'type'], message: `Operation ${index + 1}: missing type`, severity: ValidationSeverity.error });
      }
      if (!op.id && op.id !== '') {
        errors.push({ path: ['ops', index, 'id'], message: `Operation ${index + 1}: missing id`, severity: ValidationSeverity.error });
      }
      if (op.type === 'container/run' && op.args) {
        if (!op.args.image) {
          errors.push({ path: ['ops', index, 'args', 'image'], message: `Operation ${index + 1}: missing image`, severity: ValidationSeverity.error });
        }
      }
    });
  }

  return errors;
}

// Wrapper validator that tracks errors
const wrappedValidator = (json: any): ValidationError[] => {
  // Validator only called when JSON is valid (not a parse error)
  if (typeof json !== 'object' || json === null) {
    validationErrors.value = [];
    return [];
  }
  
  const errors = props.validateJobDefinition 
    ? jobDefinitionValidator(json)
    : props.validator?.(json) ?? [];
  
  validationErrors.value = errors;
  return errors;
};

// Use wrapped validator
const internalValidator = computed(() => wrappedValidator);

// Expose hasErrors to parent components
defineExpose({
  hasErrors,
});
</script>

<style lang="scss">
/* Shared theme for the JSON code editor — used across the deploy and
   configuration views. Follows the app's light/dark mode: the `jse-theme-dark`
   class (toggled in the component) selects the palette. */

/* Hide only repair buttons - keep error messages visible */
.jse-actions button,
.jse-repair,
.jse-repair-button,
button[class*="repair"],
.cm-diagnosticAction {
  display: none !important;
}

/* Hide the "Line / Column" status bar at the bottom */
.json-editor .jse-status-bar {
  display: none !important;
}

/* --- structural (both themes) --- */
.json-editor {
  border-radius: 10px;
  overflow: hidden;
}
.json-editor .cm-gutters {
  display: none !important;
}
.json-editor .cm-cursor {
  border-left-color: $secondary;
}

/* --- DARK --- */
.json-editor.jse-theme-dark {
  --jse-background-color: #0c0e0c;
  --jse-panel-background: #121612;
  --jse-panel-border: #1e241e;
  --jse-panel-color: #c9d3c6;
  --jse-panel-color-readonly: #4a554a;
  --jse-main-border: #1e241e;
  --jse-text-color: #c9d3c6;
  --jse-value-color: #c9d3c6;
  --jse-key-color: #8bf58f;
  --jse-value-color-string: #d7e7c8;
  --jse-value-color-number: #7fd4ff;
  --jse-value-color-boolean: #f5c36b;
  --jse-value-color-null: #f5c36b;
  --jse-value-color-url: #7fd4ff;
  --jse-delimiter-color: #6e7a6c;
  --jse-selection-background-color: rgba(52, 235, 74, 0.45);
  --jse-selection-background-inactive-color: rgba(52, 235, 74, 0.28);
  --jse-active-line-background-color: rgba(255, 255, 255, 0.03);
  --jse-input-background: #121612;
  border: 1px solid #1e241e;
}
/* Paint the dark background on the editor container only — NOT on .cm-content.
   CodeMirror draws the text selection in a layer at z-index -2 (behind the
   content), so an opaque .cm-content background sits on top of it and hides the
   selection highlight entirely. Keeping .cm-content transparent lets the
   selection show through while the container still provides the dark surface. */
.json-editor.jse-theme-dark .jse-text-mode,
.json-editor.jse-theme-dark .cm-editor,
.json-editor.jse-theme-dark .cm-scroller {
  background: #0c0e0c;
}
.json-editor.jse-theme-dark .cm-content {
  background: transparent;
}

/* --- LIGHT (default) --- */
.json-editor:not(.jse-theme-dark) {
  --jse-text-color: #1a1a1a;
  --jse-value-color: #1a1a1a;
  --jse-key-color: #0a8f06;
  --jse-value-color-string: #2e7d32;
  --jse-value-color-number: #0b66c3;
  --jse-value-color-boolean: #b5680a;
  --jse-value-color-null: #b5680a;
  --jse-value-color-url: #0b66c3;
  --jse-delimiter-color: #8a938a;
  --jse-selection-background-color: rgba(16, 232, 12, 0.32);
  --jse-selection-background-inactive-color: rgba(16, 232, 12, 0.22);
  --jse-active-line-background-color: rgba(0, 0, 0, 0.03);
  border: 1px solid #e3e7df;
}
/* Same reasoning as dark mode: keep .cm-content transparent so the selection
   layer (z-index -2) remains visible; paint the surface on the container. */
.json-editor:not(.jse-theme-dark) .jse-text-mode,
.json-editor:not(.jse-theme-dark) .cm-editor,
.json-editor:not(.jse-theme-dark) .cm-scroller {
  background: #ffffff;
}
.json-editor:not(.jse-theme-dark) .cm-content {
  background: transparent;
}
</style>

