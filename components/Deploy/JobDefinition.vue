<template>
  <div>
    <div
      class="box has-background-white"
      :style="{ overflowY: 'scroll', border: 'none', height: 'auto', marginTop: '1.5rem' }"
    >
      <div>
          <h2 class="title is-5 mb-4" style="color: #202124;">{{ title || 'Configure job definition' }}</h2>
        <!-- START: New Template Info Box (above editor) -->
        <div class="px-3 pt-0 pb-2" style="width: 100%; display: flex;">
          <div class="is-flex is-align-items-start is-justify-content-space-between" style="width: 100%;">
            <!-- Left side: Icon + Title + README button grouped together -->
            <div class="is-flex is-align-items-start" style="gap: 0.5rem;">
              <div v-if="selectedTemplate && selectedTemplate.id !== 'custom'" class="is-flex is-align-items-start">
                <img 
                  v-if="selectedTemplate.icon || (selectedTemplate as any).avatar_url"
                  :src="selectedTemplate.icon || (selectedTemplate as any).avatar_url"
                  alt="Template Icon"
                  class="mr-2" 
                  style="height: 24px; width: 24px; border-radius: 4px; object-fit: contain; flex-shrink: 0; margin-top: 7px;"
                />
                <div>
                  <div class="is-flex is-align-items-center">
                    <h3 class="is-size-5 has-text-weight-semibold has-text-black mb-0">
                      {{ computedJobTitle }}
                    </h3>
                  </div>
                  <p v-if="computedDockerImage" class="is-size-7 has-text-grey" style="line-height: 1; margin-top: 0; margin-bottom: 4px;">
                    {{ computedDockerImage }}
                  </p>
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
              <!-- README button placed next to title, vertically centered -->
              <div
                v-if="selectedTemplate && selectedTemplate.readme"
                style="align-self: center;"
              >
                <button
                  class="button is-light is-small readme-button"
                  @click="openReadmeModal(selectedTemplate.readme!)"
                  title="View template documentation"
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
            <div class="is-flex is-align-items-start" style="margin-top: 6px;">
              <!-- Select Template Button -->
              <button
                  class="button is-light is-small action-button mr-2" 
                  @click="$emit('showTemplateModal')"
                  title="Select a template"
              >
                  <span class="icon is-small">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                    </svg>
                  </span>
                  <span>Select Template</span>
              </button>
              <!-- Edit Job Definition Button -->
              <button
                  class="button is-outlined is-small action-button"
                  @click="showEditorModal = true"
                  title="Edit job definition" 
              >
                  <span class="icon is-small">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                    </svg>
                  </span>
                  <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
        <!-- END: New Template Info Box -->
      </div>
    </div>

      <!-- GPU Selection Section (only shown when markets prop is provided) -->
      <div v-if="markets !== undefined" class="box has-background-white" style="border: none; margin-top: 1.5rem;">
        <h2 class="title is-5 mb-3" style="color: #202124;">Select your GPU</h2>
      <div class="nav-tabs is-flex">
        <div
          class="nav-tabs-item p-3 px-5 mr-3"
          :class="{ 'is-active has-background-white': gpuTab === 'simple' }"
          @click="gpuTab = 'simple'"
        >
          Device
        </div>
        <div
          class="nav-tabs-item p-3 px-5 mr-3"
          :class="{ 'is-active has-background-white': gpuTab === 'advanced' }"
          @click="gpuTab = 'advanced'"
        >
          Advanced Search
        </div>
      </div>
      <div class="box has-background-white" style="border: none; margin-top: 0;">
        <DeploySimpleGpuSelection
            v-if="gpuTab === 'simple'"
            :markets="markets ?? null"
            :testgridMarkets="testgridMarkets ?? []"
            :loadingMarkets="loadingMarkets ?? false"
            :gpuTypeCheckbox="gpuTypeCheckbox ?? []"
            :activeFilter="activeFilter ?? 'ALL'"
            :jobDefinition="(typeof jobDefinition === 'string' || !jobDefinition ? null : jobDefinition) as JobDefinition | null"
            :skipAutoSelection="skipAutoSelection ?? false"
            :selectedMarket="selectedMarket ?? null"
            :activeFilterKey="activeFilterKey ?? ''"
            @selectedMarket="$emit('selectedMarket', $event)"
            @update:activeFilter="$emit('update:activeFilter', $event)"
            @update:gpuTypeCheckbox="$emit('update:gpuTypeCheckbox', $event)"
          />
          <DeployAdvancedGpuSelection
            v-else
            :gpuFilters="gpuFilters ?? null"
            :selectedGpuGroup="selectedGpuGroup ?? 'all'"
            :filterValues="filterValues ?? {}"
            :availableHosts="availableHosts ?? []"
            :loadingHosts="loadingHosts ?? false"
            :selectedHostAddress="selectedHostAddress ?? null"
            :forceUpdateCounter="forceUpdateCounter ?? 0"
            :marketsData="markets ?? null"
            @update:selectedGpuGroup="$emit('update:selectedGpuGroup', $event)"
            @update:filterValues="$emit('update:filterValues', $event)"
            @update:selectedHostAddress="$emit('update:selectedHostAddress', $event)"
            @update:forceUpdateCounter="$emit('update:forceUpdateCounter', $event)"
            @selectedMarket="$emit('selectedMarket', $event)"
            @searchGpus="$emit('searchGpus')"
          />
      </div>
    </div>
    
    <!-- Job Definition Editor Modal -->
    <div class="modal" :class="{ 'is-active': showEditorModal }">
      <div class="modal-background" @click="showEditorModal = false"></div>
      <div class="modal-card" style="width: 90%; max-width: 1200px;">
        <header class="modal-card-head">
          <p class="modal-card-title">Edit Job Definition</p>
          <button class="delete" aria-label="close" @click="showEditorModal = false"></button>
        </header>
        <section class="modal-card-body" style="min-height: 500px;">
          <div class="field full-height">
            <div class="control full-height">
              <JsonEditorVue 
                  :validator="validator" 
                  :class="{ 'jse-theme-dark': $colorMode.value === 'dark' }" 
                  v-model="jobDefinition" 
                  :mode="Mode.text" 
                  :mainMenuBar="false" 
                  :statusBar="false" 
                  :stringified="false" 
                  style="height: 500px;" />
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-success" @click="showEditorModal = false">Save changes</button>
          <button class="button" @click="showEditorModal = false">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Mode } from 'vanilla-jsoneditor';
  import JsonEditorVue from 'json-editor-vue';
  import type { JobDefinition, Market } from '@nosana/sdk';
  import type { Template } from '~/composables/useTemplates';
  import DeploySimpleGpuSelection from './SimpleGpuSelection.vue';
  import DeployAdvancedGpuSelection from './AdvancedGpuSelection.vue';

// Define props
interface Props {
  selectedTemplate: Template | null;
  jobDefinition: JobDefinition | null | string;
  isEditorCollapsed: boolean;
  validator: any;
  title?: string; // Optional title for the section
    // GPU Selection props (optional - only for /deploy page)
    markets?: Market[] | null;
    testgridMarkets?: any;
    loadingMarkets?: boolean;
    gpuTypeCheckbox?: string[];
    activeFilter?: string;
    skipAutoSelection?: boolean;
    selectedMarket?: Market | null;
    activeFilterKey?: string;
    // Advanced GPU Selection props (optional - only for /deploy page)
    gpuFilters?: any;
    selectedGpuGroup?: string;
    filterValues?: any;
    availableHosts?: any[];
    loadingHosts?: boolean;
    selectedHostAddress?: string | null;
    forceUpdateCounter?: number;
}

// Define emits
const emit = defineEmits<{
  showTemplateModal: [];
  'update:isEditorCollapsed': [value: boolean];
  'update:jobDefinition': [value: JobDefinition | null];
  openReadme: [readme: string];
    // GPU Selection emits
    selectedMarket: [market: Market | null];
    'update:activeFilter': [filter: string];
    'update:gpuTypeCheckbox': [types: string[]];
    // Advanced GPU Selection emits
    'update:selectedGpuGroup': [value: string];
    'update:filterValues': [value: any];
    'update:selectedHostAddress': [value: string | null];
    'update:forceUpdateCounter': [value: number];
    searchGpus: [];
}>();

// Get props
const props = defineProps<Props>();

// Modal state
const showEditorModal = ref(false);

// GPU Tab state
const gpuTab = ref<"simple" | "advanced">("simple");

// Create reactive refs for two-way binding
const isEditorCollapsed = computed({
  get: () => props.isEditorCollapsed,
  set: (value: boolean) => emit('update:isEditorCollapsed', value)
});

const jobDefinition = computed({
  get: () => (props.jobDefinition === null ? {} : props.jobDefinition),
  set: (value: any) => {
    if (typeof value === 'string' || value === undefined) {
      // Don't emit for string or undefined values - this causes loading state
      // The JSON editor will handle invalid JSON display
      return;
    } else {
      emit('update:jobDefinition', value as JobDefinition);
    }
  }
});

// Computed properties for template info
const computedJobTitle = computed(() => {
  if (props.selectedTemplate?.name) {
    return props.selectedTemplate.name;
  }
  if (typeof props.jobDefinition !== 'string' && props.jobDefinition?.ops?.[0]?.args) {
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
  if ((props.jobDefinition as any)?.ops?.[0]?.args) {
    const args = (props.jobDefinition as any).ops[0].args as any;
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

.nav-tabs-item {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  color: #7a7a7a;
  cursor: pointer;
  border: none;
  border-bottom: 0px;
  
  &.is-active {
    color: #363636;
    border: none;
    border-bottom: 1px solid white;
    margin-bottom: -1px;
  }
  
  &:hover {
    background-color: #fafafa;
  }
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