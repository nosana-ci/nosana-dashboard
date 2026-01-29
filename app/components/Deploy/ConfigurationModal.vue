<template>
  <div>
    <div
      class="box"
      :style="{ overflowY: 'scroll', border: 'none', height: 'auto' }"
    >
      <div>
          <h2 class="title is-5 mb-4">{{ title || 'Configure job definition' }}</h2>
          <div class="field mb-3">
            <p class="section-header">Deployment name</p>
            <div class="control">
              <input
                class="input is-small is-size-6"
                :class="{ 'has-text-grey-light': !deploymentNameLocal }"
                type="text"
                v-model="displayName"
                placeholder="Enter deployment name"
                @input="handleNameInput"
                @focus="handleNameFocus"
                @blur="handleNameBlur"
              />
            </div>
          </div>
        <!-- START: New Template Info Box (above editor) -->
        <div style="width: 100%;">
          <div class="field mb-3">
            <p class="section-header">Deployment template</p>
            <div class="control">
              <div class="is-flex is-justify-content-space-between align-items-stretch is-flex-direction-column-mobile" style="width: 100%; gap:0.75rem;">
                <div class="action-group is-flex" style="gap: 0.5rem;">
                <button
                  class="action-btn is-medium"
                  @click="openEditorModal"
                  title="Configure job definition"
                >
                  <span class="icon is-small">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                    </svg>
                  </span>
                  <span>Configure</span>
                </button>
                <button
                  class="action-btn is-medium"
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
              </div>
              <div class="is-flex is-align-items-center" style="gap: 0.75rem;">
                <div v-if="selectedTemplate && selectedTemplate.readme">
                  <button
                    class="action-btn is-medium"
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
                <div class="template-meta is-flex is-align-items-center" style="gap: 0.5rem;">
                  <div v-if="selectedTemplate && selectedTemplate.id !== 'custom'" class="template-icon-wrap">
                    <img 
                      v-if="selectedTemplate.icon || (selectedTemplate as any).avatar_url"
                      :src="selectedTemplate.icon || (selectedTemplate as any).avatar_url"
                      alt="Template Icon"
                      class="template-icon"
                    />
                  </div>
                  <div>
                    <p class="is-size-6 has-text-weight-semibold mb-0">{{ computedJobTitle }}</p>
                    <p v-if="computedDockerImage" class="is-size-7 has-text-grey mb-0">{{ computedDockerImage }}</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
        <!-- END: New Template Info Box -->
      </div>
    </div>

      <!-- GPU Selection Section (only shown when markets prop is provided) -->
      <div v-if="markets !== undefined" class="box" style="border: none; margin-top: 1.5rem;">
        <h2 class="title is-5 mb-3">Select your GPU</h2>
      <div class="nav-tabs is-flex">
        <div
          class="nav-tabs-item p-3 px-5 mr-3"
          :class="{ 'is-active': gpuTab === 'simple' }"
          @click="gpuTab = 'simple'"
        >
          Device
        </div>
        <div
          class="nav-tabs-item p-3 px-5 mr-3"
          :class="{ 'is-active': gpuTab === 'advanced' }"
          @click="gpuTab = 'advanced'"
        >
          Advanced Search
        </div>
      </div>
      <div class="box" style="border: none; margin-top: 0;">
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
      <div class="modal-background" @click="handleCancel"></div>
      <div class="modal-card" style="width: 90%; max-width: 1200px;">
        <header class="modal-card-head deployment-header p-5">
          <div class="deployment-tabs">
            <button
              type="button"
              class="tab-button"
              :class="{ 'is-active': modalTab === 'definition' }"
              @click="modalTab = 'definition'"
            >
              Job Configuration
            </button>
            <button
              type="button"
              class="tab-button"
              :class="{ 'is-active': modalTab === 'configuration' }"
              @click="modalTab = 'configuration'"
            >
              Deployment Configuration
            </button>
          </div>
          <button class="delete" aria-label="close" @click="handleCancel"></button>
        </header>
        <section class="modal-card-body">

          <div class="tab-panel-wrapper" :style="tabWrapperStyle">
            <div
              v-if="modalTab === 'definition'"
              class="tab-panel tab-panel--definition"
              ref="podPanelRef"
            >
              <PodConfigurationTab ref="podTab" v-model="editingJobDefinition" />
            </div>

            <div
              v-else
              class="tab-panel tab-panel--configuration"
            >
            <DeploymentConfigurationTab
              :strategy="strategyLocal"
              :schedule="scheduleLocal"
              :replicas="replicasLocal"
              :timeout="timeoutLocal"
              :isWalletMode="props.isWalletMode"
              @update:strategy="strategyLocal = $event"
              @update:schedule="scheduleLocal = $event"
              @update:replicas="replicasLocal = $event"
              @update:timeout="timeoutLocal = $event"
              @update:modalSelectedVault="handleVaultSelect"
            />
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button 
            class="button is-success" 
            @click="handleSaveChanges"
          >
            Save changes
          </button>
          <button class="button" @click="handleCancel">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { JobDefinition, Market } from '@nosana/kit';
  import { DeploymentStrategy } from '@nosana/kit';
  import type { Template } from '~/composables/useTemplates';
  import DeploySimpleGpuSelection from './SimpleGpuSelection.vue';
  import DeployAdvancedGpuSelection from './AdvancedGpuSelection.vue';
  import PodConfigurationTab from './PodConfigurationTab.vue';
  import DeploymentConfigurationTab from './DeploymentConfigurationTab.vue';

// Define props
interface Props {
  selectedTemplate: Template | null;
  jobDefinition: JobDefinition | null | string;
  isEditorCollapsed: boolean;
  title?: string; // Optional title for the section
  strategy: DeploymentStrategy;
  schedule: string;
  replicas: number;
  timeout: number;
  isWalletMode: boolean;
  deploymentName: string;
  modalSelectedVault: string | null;
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
    // Advanced deployment emits
    'update:strategy': [strategy: DeploymentStrategy];
    'update:schedule': [schedule: string];
    'update:replicas': [replicas: number];
    'update:timeout': [timeout: number];
    'update:deploymentName': [name: string];
    'update:modalSelectedVault': [vault: string | null | undefined];
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
const modalTab = ref<'definition' | 'configuration'>('definition');

// Store original job definition for cancel functionality
const originalJobDefinition = ref<JobDefinition | null | string>(null);
const editingJobDefinition = ref<JobDefinition | null | string>(null);

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

const strategyLocal = computed({
  get: () => props.strategy,
  set: (value: DeploymentStrategy) => emit('update:strategy', value),
});

const scheduleLocal = computed({
  get: () => props.schedule,
  set: (value: string) => emit('update:schedule', value),
});

const deploymentNameLocal = computed({
  get: () => props.deploymentName,
  set: (value: string) => emit('update:deploymentName', value),
});

const clampNumber = (value: number, min: number, max: number) => {
  const num = Number(value);
  if (Number.isNaN(num)) return min;
  return Math.min(max, Math.max(min, num));
};

const replicasLocal = computed({
  get: () => props.replicas,
  set: (value: number) =>
    emit('update:replicas', clampNumber(value, 1, 100)),
});

const timeoutLocal = computed({
  get: () => props.timeout,
  set: (value: number) =>
    emit('update:timeout', clampNumber(value, MIN_TIMEOUT_HOURS, MAX_TIMEOUT_HOURS)),
});

const handleVaultSelect = (vault: string | undefined | null) => {
  emit('update:modalSelectedVault', vault ?? null);
};

const podPanelRef = ref<HTMLElement | null>(null);
const tabMinHeight = ref(0);
const tabWrapperStyle = computed(() =>
  tabMinHeight.value ? { minHeight: `${tabMinHeight.value}px` } : {}
);
let heightObserver: ResizeObserver | null = null;

const updateTabMinHeight = () => {
  if (!podPanelRef.value) return;
  const height = podPanelRef.value.offsetHeight;
  if (height > tabMinHeight.value) {
    tabMinHeight.value = height;
  }
};

const startHeightObserver = () => {
  if (typeof window === 'undefined' || !podPanelRef.value) return;
  if ('ResizeObserver' in window) {
    heightObserver?.disconnect();
    heightObserver = new ResizeObserver(() => {
      updateTabMinHeight();
    });
    heightObserver.observe(podPanelRef.value);
  }
  updateTabMinHeight();
};

const stopHeightObserver = () => {
  heightObserver?.disconnect();
  heightObserver = null;
};

watch(
  () => modalTab.value,
  (value) => {
    if (value === 'definition') {
      nextTick(() => {
        startHeightObserver();
      });
    } else {
      stopHeightObserver();
    }
  }
);

onMounted(() => {
  nextTick(() => {
    startHeightObserver();
  });
});

onBeforeUnmount(() => {
  stopHeightObserver();
});

// Computed properties for template info
const computedJobTitle = computed(() => {
  if (props.selectedTemplate?.name) {
    return props.selectedTemplate.name;
  }
  if (typeof props.jobDefinition !== "string" && props.jobDefinition?.ops?.[0]?.args) {
    const args = props.jobDefinition.ops[0].args as any;
    if (args.image) {
      const image = args.image;
      const parts = image.split("/");
      return parts[parts.length - 1].split(":")[0];
    }
  }
  return "Custom Configuration";
});

const isNameFocused = ref(false);
const displayName = ref(deploymentNameLocal.value || computedJobTitle.value);

const handleNameInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  deploymentNameLocal.value = target.value;
  displayName.value = target.value;
};

const handleNameFocus = () => {
  isNameFocused.value = true;
  displayName.value = deploymentNameLocal.value || "";
};

const handleNameBlur = () => {
  isNameFocused.value = false;
  if (!deploymentNameLocal.value) {
    displayName.value = computedJobTitle.value;
  }
};

watch(
  () => deploymentNameLocal.value,
  (value) => {
    if (value) {
      displayName.value = value;
    } else if (!isNameFocused.value) {
      displayName.value = computedJobTitle.value;
    }
  }
);

watch(
  computedJobTitle,
  (value) => {
    if (!deploymentNameLocal.value && !isNameFocused.value) {
      displayName.value = value;
    }
  }
);

const computedDockerImage = computed(() => {
  if ((props.jobDefinition as any)?.ops?.[0]?.args) {
    const args = (props.jobDefinition as any).ops[0].args as any;
    if (args.image) {
      return args.image;
    }
  }
  return "";
});

// Methods
const openReadmeModal = (readme: string) => {
  emit('openReadme', readme);
};

// Open modal and store original state
const openEditorModal = () => {
  originalJobDefinition.value = JSON.parse(JSON.stringify(props.jobDefinition));
  editingJobDefinition.value = JSON.parse(JSON.stringify(props.jobDefinition));
  showEditorModal.value = true;
};

// Handle save with validation
const podTab = ref<{ canSave: () => boolean } | null>(null);
const handleSaveChanges = () => {
  if (!podTab.value?.canSave?.()) return;
  emit('update:jobDefinition', editingJobDefinition.value as JobDefinition);
  showEditorModal.value = false;
};

// Handle cancel - restore original state
const handleCancel = () => {
  // Restore original job definition
  editingJobDefinition.value = originalJobDefinition.value;
  showEditorModal.value = false;
};
</script>

<style lang="scss" scoped>

.modal-card-head.deployment-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-card-head.deployment-header .deployment-tabs {
  flex: 1;
}

.nav-tabs-item {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  color: #7a7a7a;
  cursor: pointer;
  border: none;
  border-bottom: 0px;
  
  &.is-active {
    color: $text;
    background-color: $white;
    border: none;
    border-bottom: 1px solid $white;
    margin-bottom: -1px;
  }
  
  &:hover {
    background-color: $grey-lightest;
  }
}

// Dark mode for nav tabs
html.dark-mode {
  .nav-tabs-item {
    color: $grey-light;
    
    &.is-active {
      color: $white;
      background-color: $black-ter;
      border-bottom: 1px solid $black-ter;
    }
    
    &:hover {
      background-color: $grey-dark;
    }
  }
}


.tab-panel-wrapper {
  min-height: 520px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-panel--configuration {
  justify-content: flex-start;
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


  .expand-indicator {
    color: #ccc;
  }
}

.template-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $white;
}

.template-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: inherit;
}
</style>