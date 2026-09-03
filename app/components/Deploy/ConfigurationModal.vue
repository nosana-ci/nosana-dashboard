<template>
  <div>
    <!-- Deployment banner: the selected template shown as a launch-ready
         artifact, with the deployment name and settings inline. -->
    <section class="deploy-banner" :class="{ 'is-expanded': isConfigOpen }">
      <span class="banner-grid" aria-hidden="true"></span>

      <div class="banner-content">
        <div class="banner-top">
          <div class="banner-identity">
            <div
              class="template-avatar"
              :class="{ 'is-brand': !templateIcon }"
            >
              <img v-if="templateIcon" :src="templateIcon" alt="Template icon" />
              <NosanaMark v-else class="brand-mark" />
            </div>

            <div class="banner-text">
              <h2 class="banner-title">{{ computedJobTitle }}</h2>
              <p v-if="computedDockerImage" class="banner-image">
                {{ computedDockerImage }}
              </p>
              <p v-if="selectedTemplate?.description" class="banner-desc">
                {{ selectedTemplate.description }}
              </p>
            </div>
          </div>

          <div class="banner-actions">
            <button
              type="button"
              class="banner-btn"
              @click="$emit('showTemplateModal')"
              title="Browse and select a template"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>Change template</span>
            </button>
          </div>
        </div>

        <!-- Template documentation: inline, minimized to a peek, expandable -->
        <div v-if="selectedTemplate?.readme" class="banner-readme">
          <div
            class="readme-body markdown"
            :class="{ 'is-collapsed': !isReadmeOpen }"
            v-html="renderedReadme"
          />
          <button
            type="button"
            class="readme-toggle"
            :class="{ 'is-open': isReadmeOpen }"
            :aria-expanded="isReadmeOpen"
            @click="isReadmeOpen = !isReadmeOpen"
          >
            <span>{{ isReadmeOpen ? "Show less" : "Read more" }}</span>
            <svg
              class="chevron"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        <div class="banner-config-bar">
          <label class="banner-name">
            <span class="banner-name-label">Deployment name</span>
            <span class="banner-name-field">
              <svg
                class="banner-name-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"
                />
                <path d="M7 7h.01" />
              </svg>
              <input
                type="text"
                v-model="displayName"
                placeholder="Enter deployment name"
                @input="handleNameInput"
                @focus="handleNameFocus"
                @blur="handleNameBlur"
              />
            </span>
          </label>

          <div class="banner-config-actions">
            <button
              type="button"
              class="edit-def-btn"
              @click="openEditorModal"
              title="Edit the raw job definition"
            >
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
              <span>Edit job definition</span>
            </button>

            <button
              v-if="hasDeploymentConfig"
              type="button"
              class="configure-btn"
              :class="{ 'is-open': isConfigOpen }"
              :aria-expanded="isConfigOpen"
              @click="isConfigOpen = !isConfigOpen"
            >
              <svg
                class="configure-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
                <circle cx="15" cy="6" r="2" />
                <circle cx="9" cy="12" r="2" />
                <circle cx="17" cy="18" r="2" />
              </svg>
              <span>Settings</span>
              <svg
                class="chevron"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Expandable settings drawer (grid-rows trick animates height) -->
        <div v-if="hasDeploymentConfig" class="banner-config">
          <div class="banner-config-inner">
            <p class="config-eyebrow">Deployment settings</p>
            <DeploymentConfigurationTab
              :strategy="strategyLocal"
              :schedule="scheduleLocal"
              :replicas="replicasLocal"
              :timeout="timeoutLocal"
              @update:strategy="strategyLocal = $event"
              @update:schedule="scheduleLocal = $event"
              @update:replicas="replicasLocal = $event"
              @update:timeout="timeoutLocal = $event"
            />
          </div>
        </div>

      </div>
    </section>

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
      <div class="modal-card is-app-modal is-large jobdef-modal">
        <header class="modal-card-head">
          <div class="is-flex is-align-items-center is-gap-2" style="min-width: 0">
            <span class="app-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
              </svg>
            </span>
            <div style="min-width: 0">
              <p class="modal-card-title title is-5 mb-0">Job definition</p>
            </div>
          </div>
          <div class="seg-tabs jobdef-seg" role="tablist" aria-label="Editor mode">
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
          <button class="delete" aria-label="close" @click="handleCancel"></button>
        </header>
        <section class="modal-card-body jobdef-body">
          <DeployJobDefinitionBuilder
            v-if="editorMode === 'builder'"
            ref="builderTab"
            v-model="editingJobDefinition"
          />
          <PodConfigurationTab v-else ref="podTab" v-model="editingJobDefinition" />
        </section>
        <footer class="modal-card-foot">
          <p class="has-text-grey is-size-7" style="flex: 1; min-width: 0">
            Changes apply when you save.
            {{ editorMode === 'json' ? 'Invalid JSON is blocked.' : 'Required fields are checked.' }}
          </p>
          <div class="buttons mb-0">
            <button class="button" @click="handleCancel">Cancel</button>
            <button class="button is-secondary" @click="handleSaveChanges">
              Save changes
            </button>
          </div>
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
  import DeployJobDefinitionBuilder from './JobDefinitionBuilder.vue';
  import DeploymentConfigurationTab from './DeploymentConfigurationTab.vue';
  import NosanaMark from '@/assets/img/icon.svg?component';
  import { marked } from 'marked';
  import { MIN_INFINITE_TIMEOUT_HOURS } from '~/composables/useTimeoutConstants';

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
  deploymentName: string;
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
    // Advanced deployment emits
    'update:strategy': [strategy: DeploymentStrategy];
    'update:schedule': [schedule: string];
    'update:replicas': [replicas: number];
    'update:timeout': [timeout: number];
    'update:deploymentName': [name: string];
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

// Editor mode: schema-driven form builder (default) or raw JSON escape hatch
const editorMode = ref<'builder' | 'json'>('builder');
const builderTab = ref<{ canSave: () => boolean } | null>(null);

// Inline "Configure" settings drawer in the banner
const isConfigOpen = ref(false);

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

const effectiveMinTimeout = computed(() =>
  props.strategy === DeploymentStrategy.INFINITE
    ? MIN_INFINITE_TIMEOUT_HOURS
    : MIN_TIMEOUT_HOURS,
);

const timeoutLocal = computed({
  get: () => props.timeout,
  set: (value: number) =>
    emit('update:timeout', clampNumber(value, effectiveMinTimeout.value, MAX_TIMEOUT_HOURS)),
});

// Computed properties for template info
const computedJobTitle = computed(() => {
  if (props.selectedTemplate?.name) {
    return props.selectedTemplate.name;
  }
  return "Custom Deployment";
});

const templateIcon = computed(() => {
  const template = props.selectedTemplate as any;
  if (!template || template.id === "custom") return null;
  return template.icon || template.avatar_url || null;
});

// Only the create-deployment flow manages strategy/replicas/timeout; the legacy
// single-job page omits them, so hide the deployment settings there.
const hasDeploymentConfig = computed(() => props.strategy !== undefined);

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

// Inline template documentation: minimized to a peek, expandable in place
const isReadmeOpen = ref(false);

const renderedReadme = computed(() =>
  props.selectedTemplate?.readme
    ? (marked(props.selectedTemplate.readme) as string)
    : '',
);

// A freshly selected template starts minimized again
watch(
  () => props.selectedTemplate?.id,
  () => {
    isReadmeOpen.value = false;
  },
);

// Open modal and store original state
const openEditorModal = () => {
  originalJobDefinition.value = JSON.parse(JSON.stringify(props.jobDefinition));
  editingJobDefinition.value = JSON.parse(JSON.stringify(props.jobDefinition));
  editorMode.value = 'builder';
  showEditorModal.value = true;
};

// Handle save with validation (gate depends on the active editor)
const podTab = ref<{ canSave: () => boolean } | null>(null);
const handleSaveChanges = () => {
  const activeEditor = editorMode.value === 'builder' ? builderTab.value : podTab.value;
  if (!activeEditor?.canSave?.()) return;
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

/* ---------- Deployment banner ---------- */
.deploy-banner {
  --mono: ui-monospace, "SF Mono", "JetBrains Mono", "Cascadia Code", Menlo,
    Consolas, monospace;
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 2rem 2.25rem;
  background:
    radial-gradient(
      circle at 90% 8%,
      rgba($secondary, 0.16),
      transparent 46%
    ),
    linear-gradient(135deg, #0a0c0a 0%, #0f130d 55%, #0b0d0b 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 60px -30px rgba(0, 0, 0, 0.6);
}

.banner-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    rgba(255, 255, 255, 0.05) 1px,
    transparent 1px
  );
  background-size: 22px 22px;
  mask-image: linear-gradient(to bottom, black, transparent 92%);
  pointer-events: none;
}

.banner-content {
  position: relative;
}

.banner-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.banner-identity {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  min-width: 0;
  flex: 1 1 20rem;
}

.template-avatar {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 9px;
  }

  &.is-brand {
    background: rgba($secondary, 0.1);
    border-color: rgba($secondary, 0.25);
  }

  .brand-mark {
    width: 26px;
    height: 26px;
    color: $secondary;
  }
}

.banner-text {
  min-width: 0;
}

.banner-title {
  font-family: $title-family;
  font-weight: 600;
  font-size: 1.6rem;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: #fff;
  margin-bottom: 0.35rem;
  word-break: break-word;
}

.banner-image {
  font-family: var(--mono);
  font-size: 0.8rem;
  color: #8bf58f;
  margin-bottom: 0.5rem;
  word-break: break-all;
}

.banner-desc {
  color: #aeb8ad;
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 44rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.banner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex-shrink: 0;
}

.banner-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.95rem;
  border-radius: 9px;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  color: #e8f0e8;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.16);
  transition:
    transform 0.15s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover {
    transform: translateY(-1px);
    border-color: $secondary;
    color: #fff;
  }
}

/* Config bar: name field + Configure toggle */
.banner-config-bar {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-wrap: wrap;
}

.banner-name {
  display: block;
  flex: 1 1 18rem;
  min-width: 0;
}

.banner-name-label {
  display: block;
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7c877b;
  margin-bottom: 0.5rem;
}

.banner-name-field {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  max-width: 30rem;
  padding: 0 0.85rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus-within {
    border-color: $secondary;
    box-shadow: 0 0 0 3px rgba($secondary, 0.18);
  }

  input {
    flex: 1;
    min-width: 0;
    padding: 0.7rem 0;
    font-family: inherit;
    font-size: 0.95rem;
    color: #fff;
    background: transparent;
    border: none;
    outline: none;

    &::placeholder {
      color: #6f7a6e;
    }
  }
}

.banner-name-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: #7c877b;
}

.banner-config-actions {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.configure-btn,
.edit-def-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }
}

/* Ghost toggle for the inline deployment settings */
.configure-btn {
  color: #e8f0e8;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.16);

  .chevron {
    width: 15px;
    height: 15px;
    transition: transform 0.25s ease;
  }

  &:hover {
    transform: translateY(-1px);
    border-color: $secondary;
    color: #fff;
  }

  &.is-open .chevron {
    transform: rotate(180deg);
  }
}

/* Always-visible ghost action that opens the job definition editor.
   Matches the Settings toggle — the glowing primary CTA is Create Deployment. */
.edit-def-btn {
  color: #e8f0e8;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.16);

  &:hover {
    transform: translateY(-1px);
    border-color: $secondary;
    color: #fff;
  }
}

/* Expandable settings drawer — grid-rows 0fr↔1fr animates height cleanly */
.banner-config {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
}

.deploy-banner.is-expanded .banner-config {
  grid-template-rows: 1fr;
}

.banner-config-inner {
  min-height: 0;
  overflow: hidden;
}

.deploy-banner.is-expanded .banner-config-inner {
  margin-top: 1.5rem;
}

.config-eyebrow {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7c877b;
  margin-bottom: 1rem;
}

/* Dark-theme the reused Bulma form controls inside the drawer */
.banner-config :deep(.deployment-configuration-tab) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 1rem 1.25rem;
}

.banner-config :deep(.label) {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #9aa79a;
}

.banner-config :deep(.input),
.banner-config :deep(.select select) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  box-shadow: none;
}

.banner-config :deep(.select select) {
  width: 100%;
  /* The banner forces white select text, but the native option popup
     follows the document color-scheme — light-mode browsers then paint a
     white popup with white options (white-on-white). Pin the control to a
     dark scheme (fixes macOS Safari/Chrome, where option colors are
     ignored) and set explicit option colors (Windows Chrome/Firefox). */
  color-scheme: dark;
}

.banner-config :deep(.select select option) {
  background-color: #10140e;
  color: #fff;
}

.banner-config :deep(.select:not(.is-multiple):not(.is-loading)::after) {
  border-color: #8bf58f;
}

.banner-config :deep(.input::placeholder) {
  color: #6f7a6e;
}

.banner-config :deep(.input:focus),
.banner-config :deep(.select select:focus) {
  border-color: $secondary;
  box-shadow: 0 0 0 3px rgba($secondary, 0.18);
}

.banner-config :deep(.help) {
  color: #8a948a;
}

.banner-config :deep(.label .icon.has-text-grey) {
  color: #8a948a !important;
}

/* ---------- Inline template README ---------- */
.banner-readme {
  margin-top: 1.5rem;
}

/* Plain-text expand/collapse control below the peek */
.readme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.6rem;
  padding: 0;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  color: #8bf58f;
  background: none;
  border: none;
  transition: color 0.2s ease;

  .chevron {
    width: 13px;
    height: 13px;
    transition: transform 0.25s ease;
  }

  &:hover {
    color: #fff;
    text-decoration: underline;
  }

  &.is-open .chevron {
    transform: rotate(180deg);
  }
}

.readme-body {
  max-height: 30rem;
  overflow-y: auto;
  transition: max-height 0.3s ease;

  &.is-collapsed {
    max-height: 8rem;
    overflow: hidden;
  }

  :deep(> :first-child) {
    margin-top: 0;
  }

  :deep(p),
  :deep(li) {
    color: #c3ccc2;
    font-size: 0.9rem;
    line-height: 1.55;
    margin-bottom: 0.85rem;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    color: #fff;
    font-weight: 600;
    margin-top: 1.4rem;
    margin-bottom: 0.75rem;
  }

  :deep(h1) {
    font-size: 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding-bottom: 0.4rem;
  }

  :deep(h2) {
    font-size: 1.1rem;
  }

  :deep(h3) {
    font-size: 1rem;
  }

  :deep(ul),
  :deep(ol) {
    margin-left: 1.4rem;
    margin-bottom: 0.85rem;
    list-style: disc outside;
  }

  :deep(ol) {
    list-style: decimal outside;
  }

  :deep(li) {
    display: list-item;
    margin-bottom: 0.4rem;
    padding-left: 0.35rem;
  }

  :deep(a) {
    color: #8bf58f;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(code) {
    background: rgba(255, 255, 255, 0.08);
    color: #d7e0d6;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.85em;
    font-family: var(--mono);
  }

  :deep(pre) {
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1rem;
    border-radius: 10px;
    margin-bottom: 0.85rem;
    overflow-x: auto;

    code {
      background: none;
      padding: 0;
      color: #d7e0d6;
    }
  }

  :deep(blockquote) {
    border-left: 3px solid rgba(255, 255, 255, 0.2);
    padding-left: 1rem;
    margin: 0 0 0.85rem;
    color: #9aa79a;
  }

  :deep(img) {
    max-width: 100%;
    margin: 1rem 0;
    border-radius: 8px;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0.85rem;
    font-size: 0.85rem;

    th,
    td {
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0.5rem;
      color: #c3ccc2;
    }

    th {
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      font-weight: 600;
    }
  }
}

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

@media screen and (max-width: 768px) {
  .deploy-banner {
    padding: 1.5rem 1.25rem;
  }

  .banner-title {
    font-size: 1.35rem;
  }

  .banner-actions {
    width: 100%;
  }

  .banner-config-bar .configure-btn,
  .banner-actions .banner-btn {
    flex: 1 1 auto;
    justify-content: center;
  }

  .banner-name {
    flex-basis: 100%;
  }

  .banner-name-field {
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .banner-btn:hover,
  .configure-btn:hover {
    transform: none;
  }

  .banner-config {
    transition: none;
  }
}
</style>
