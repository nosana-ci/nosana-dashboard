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
    class="json-editor jse-theme-dark"
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

const emit = defineEmits(['update:modelValue']);

const model = computed({
  get: () => props.modelValue,
  set: (val) => {
    // Track if value is a string or undefined (indicates JSON parse error)
    // When there's a syntax error, the editor returns the text content as a string
    hasSyntaxError.value = typeof val === 'string' || val === undefined;
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
/* Shared dark theme for the JSON code editor — used across the deploy and
   configuration views so every instance looks the same. */
$jse-bg: #0c0e0c;
$jse-panel: #121612;
$jse-border: #1e241e;
$jse-text: #c9d3c6;
$jse-key: #8bf58f;
$jse-gutter: #4a554a;

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

/* Palette (text mode maps these vars into the CodeMirror highlight) */
.json-editor.jse-theme-dark {
  --jse-background-color: #{$jse-bg};
  --jse-panel-background: #{$jse-panel};
  --jse-panel-border: #{$jse-border};
  --jse-panel-color: #{$jse-text};
  --jse-panel-color-readonly: #{$jse-gutter};
  --jse-main-border: #{$jse-border};
  --jse-text-color: #{$jse-text};
  --jse-value-color: #{$jse-text};
  --jse-key-color: #{$jse-key};
  --jse-value-color-string: #d7e7c8;
  --jse-value-color-number: #7fd4ff;
  --jse-value-color-boolean: #f5c36b;
  --jse-value-color-null: #f5c36b;
  --jse-value-color-url: #7fd4ff;
  --jse-delimiter-color: #6e7a6c;
  --jse-selection-background-color: rgba(16, 232, 12, 0.18);
  --jse-active-line-background-color: rgba(255, 255, 255, 0.03);
  --jse-input-background: #{$jse-panel};
  border: 1px solid #{$jse-border};
  border-radius: 10px;
  overflow: hidden;
}

/* Dark ground on every editor surface */
.json-editor .jse-text-mode,
.json-editor .cm-editor,
.json-editor .cm-scroller,
.json-editor .cm-content {
  background: #{$jse-bg};
}
.json-editor .cm-cursor {
  border-left-color: $secondary;
}

/* Line-number gutter */
.json-editor .cm-gutters {
  display: flex !important;
  background: #{$jse-bg};
  border-right: 1px solid #{$jse-border};
  color: #{$jse-gutter};
}
.json-editor .cm-lineNumbers .cm-gutterElement {
  color: #{$jse-gutter};
  font-variant-numeric: tabular-nums;
}
.json-editor .cm-foldGutter {
  display: none !important;
}
.json-editor .cm-activeLineGutter {
  background: rgba(255, 255, 255, 0.03);
  color: #{$jse-text};
}
</style>

