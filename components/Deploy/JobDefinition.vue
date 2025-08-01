<template>
  <div>
    <h2 class="title pt-0 pb-0 mb-3">1. Define your model</h2>
    <div
      class="box has-background-white"
      :style="{ overflowY: 'scroll', border: 'none', height: 'auto' }"
    >
      <div>
        <!-- START: New Template Info Box (above editor) -->
        <div class="px-3 pt-0 pb-2" style="width: 100%; display: flex;">
          <div class="is-flex is-align-items-start is-justify-content-space-between" style="width: 100%;">
            <div v-if="selectedTemplate && selectedTemplate.id !== 'custom'" class="is-flex is-align-items-start">
              <img 
                v-if="selectedTemplate.icon || selectedTemplate.avatar_url"
                :src="selectedTemplate.icon || selectedTemplate.avatar_url"
                alt="Template Icon"
                class="mr-2" 
                style="height: 24px; width: 24px; border-radius: 4px; object-fit: contain; flex-shrink: 0; margin-top: 7px;"
              />
              <div>
                <h3 class="is-size-5 has-text-weight-semibold has-text-black mb-0">
                  {{ computedJobTitle }}
                </h3>
                <p v-if="computedDockerImage" class="is-size-7 has-text-grey" style="line-height: 1; margin-top: 0; margin-bottom: 4px;">
                  {{ computedDockerImage }}
                </p>
                <button
                    v-if="selectedTemplate && selectedTemplate.readme"
                    class="button is-light is-small readme-button"
                    @click="openReadmeModal(selectedTemplate.readme!)"
                    title="View template documentation"
                    style="margin-top: 2px;"
                >
                    <span class="icon is-small">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="currentColor"/>
                      </svg>
                    </span>
                    <span>README</span>
                </button>
              </div>
            </div>
            <div v-else>
              <h3 class="is-size-5 has-text-weight-semibold has-text-black mb-0">
                {{ computedJobTitle }}
              </h3>
              <p v-if="computedDockerImage" class="is-size-7 has-text-grey" style="line-height: 1; margin-top: 0; margin-bottom: 4px;">
                {{ computedDockerImage }}
              </p>
               <p v-else class="is-size-7 has-text-grey" style="line-height: 1; margin-top: 0;">
                Configure job in editor
              </p>
            </div>
            <div class="is-flex is-align-items-start" style="margin-top: 6px;">
              <!-- Select Template Button -->
              <button
                  class="button is-light is-small action-button mr-2" 
                  @click="$emit('showTemplateModal')"
                  title="Select a template"
              >
                  <span class="icon is-small">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                    </svg>
                  </span>
                  <span>Select Template</span>
              </button>
              <!-- New Collapse Button: Only shown when editor is EXPANDED -->
              <button
                  v-if="!isEditorCollapsed"
                  class="button is-outlined is-small action-button"
                  @click="isEditorCollapsed = true"
                  title="Collapse job definition" 
              >
                  <span class="icon is-small">
                    <img src="~/assets/img/icons/arrow-collapse.svg" alt="Collapse" style="height: 16px; width: 16px;" />
                  </span>
                  <span>Collapse</span>
              </button>
            </div>
          </div>
        </div>
        <!-- END: New Template Info Box -->

        <div class="columns builder-columns" style="margin-top: 0;">
          <div class="column is-12">
            <div
              class="field full-height editor-wrapper"
              @click="isEditorCollapsed ? (isEditorCollapsed = false) : undefined"
              :class="{ 'is-clickable-to-expand': isEditorCollapsed }"
            >
              <div class="control full-height">
                <JsonEditorVue 
                    :validator="validator" 
                    :class="{ 
                      'jse-theme-dark': $colorMode.value === 'dark',
                      'editor-collapsed': isEditorCollapsed
                    }" 
                    v-model="jobDefinition" 
                    :mode="Mode.text" 
                    :mainMenuBar="false" 
                    :statusBar="false" 
                    :stringified="false" 
                    class="full-height-editor" 
                    :style="{ height: isEditorCollapsed ? '150px' : 'auto' }" />
              </div>
              <div v-if="isEditorCollapsed" class="expand-indicator">
                <span>Expand</span>
                <img src="~/assets/img/icons/arrow-expand.svg" alt="Expand" style="height: 16px; width: 16px;" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Mode } from 'vanilla-jsoneditor';
import JsonEditorVue from 'json-editor-vue';
import type { JobDefinition } from '@nosana/sdk';
import type { Template } from '~/composables/useTemplates';

// Define props
interface Props {
  selectedTemplate: Template | null;
  jobDefinition: JobDefinition;
  isEditorCollapsed: boolean;
  validator: any;
}

// Define emits
const emit = defineEmits<{
  showTemplateModal: [];
  'update:isEditorCollapsed': [value: boolean];
  'update:jobDefinition': [value: JobDefinition];
  openReadme: [readme: string];
}>();

// Get props
const props = defineProps<Props>();

// Create reactive refs for two-way binding
const isEditorCollapsed = computed({
  get: () => props.isEditorCollapsed,
  set: (value: boolean) => emit('update:isEditorCollapsed', value)
});

const jobDefinition = computed({
  get: () => props.jobDefinition,
  set: (value: JobDefinition) => emit('update:jobDefinition', value)
});

// Computed properties for template info
const computedJobTitle = computed(() => {
  if (props.selectedTemplate?.name) {
    return props.selectedTemplate.name;
  }
  if (props.jobDefinition?.ops?.[0]?.args) {
    const args = props.jobDefinition.ops[0].args as any;
    if (args.image) {
      const image = args.image;
      const parts = image.split('/');
      return parts[parts.length - 1].split(':')[0];
    }
  }
  return 'Custom Configuration';
});

const computedDockerImage = computed(() => {
  if (props.jobDefinition?.ops?.[0]?.args) {
    const args = props.jobDefinition.ops[0].args as any;
    if (args.image) {
      return args.image;
    }
  }
  return '';
});

// Methods
const openReadmeModal = (readme: string) => {

  emit('openReadme', readme);
};
</script>

<style lang="scss" scoped>
.readme-button.button.is-light {
  background-color: #f5f5f5;
  border: 1px solid #dbdbdb;
  color: #363636;
}

.readme-button.button.is-light:hover {
  background-color: #eeeeee;
  border-color: #b5b5b5;
}

.action-button {
  background-color: #f5f5f5;
  border: 1px solid #dbdbdb;
  color: #363636;
}

.action-button:hover {
  background-color: #eeeeee;
  border-color: #b5b5b5;
}

.editor-wrapper {
  position: relative;
  min-height: 200px;
}

.editor-wrapper.is-clickable-to-expand {
  cursor: pointer;
}

.full-height-editor {
  min-height: 200px;
  height: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.builder-columns {
  margin-bottom: 0;
  height: auto;
}

.full-height {
  height: 100%;
}

:deep(.jse) {
  height: 100% !important;
}

/* JSON Editor collapse styles */
.editor-collapsed {
  overflow: hidden !important;
  position: relative;
  
  &::after {
    content: ''; // Default gradient, implying expand (up arrow)
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30px;
    background: linear-gradient(transparent, rgba(255, 255, 255, 0.9));
    pointer-events: none;
    z-index: 1;
  }
}

:deep(.editor-collapsed .jse) {
  height: 150px !important;
  overflow: hidden !important;
}

/* Inserted CSS for expand-indicator starts here */
.expand-indicator {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #363636;
  font-size: 0.9rem;
  z-index: 2;
  pointer-events: none;
}

.expand-indicator span {
  line-height: 1;
}

.expand-indicator img {
  margin-left: 5px;
}
/* Inserted CSS for expand-indicator ends here */

.dark-mode {
  .editor-collapsed::after {
    background: linear-gradient(transparent, rgba(18, 18, 18, 0.95) 70%);
  }

  .readme-button.button.is-light {
    background-color: rgba(255, 255, 255, 0.1) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    color: rgba(255, 255, 255, 0.9) !important;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.15) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
      color: white !important;
    }
  }
  
  .action-button.button.is-outlined {
    border-color: rgba(255, 255, 255, 0.3) !important;
    color: rgba(255, 255, 255, 0.9) !important;
    background-color: transparent !important;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1) !important;
      border-color: rgba(255, 255, 255, 0.5) !important;
      color: white !important;
    }
  }

  .expand-indicator {
    color: #ccc;
  }
}
</style>