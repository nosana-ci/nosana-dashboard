<template>
  <div class="dep-header">
    <!-- Back link -->
    <button
      type="button"
      class="back-link"
      @click="$emit('navigateBack')"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>Deployments</span>
    </button>

    <!-- Title row + actions -->
    <div class="header-main">
      <div class="header-title-section">
        <div class="title-row">
          <div
            v-if="!isEditingName"
            class="name-display"
            :class="{ 'is-editable': canRename }"
            @click="startEditingName"
          >
            <h1 class="dep-name">{{ deployment.name || "Deployment" }}</h1>
            <span
              v-if="canRename"
              class="icon is-small has-text-grey ml-2 edit-name-icon"
              title="Rename deployment"
            >
              <EditIcon class="icon-14" />
            </span>
          </div>
          <form v-else class="name-edit" @submit.prevent="commitNameEdit">
            <input
              ref="nameInputRef"
              v-model="nameDraft"
              class="input name-edit-input"
              type="text"
              maxlength="100"
              :disabled="actionLoading"
              placeholder="Deployment name"
              @keydown.esc.prevent="cancelNameEdit"
              @blur="commitNameEdit"
            />
          </form>
          <DeploymentStatusPill :status="deployment.status" />
        </div>

        <p v-if="deployment.name" class="id-line">
          <span class="is-family-monospace">{{ shortId(deployment.id) }}</span>
          <button
            type="button"
            class="copy-btn"
            :class="{ 'is-copied': idCopied }"
            title="Copy deployment ID"
            @click="copyId"
          >
            <svg
              v-if="idCopied"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
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
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <template v-if="deployment.updated_at">
            <span class="id-sep">·</span>
            <span class="updated-time"
              >Updated {{ formatTimeAgo(deployment.updated_at) }}</span
            >
          </template>
        </p>
      </div>

      <!-- Actions Dropdown -->
      <div
        class="dropdown is-right"
        :class="{ 'is-active': isDropdownOpen }"
        ref="dropdownRef"
      >
        <div class="dropdown-trigger">
          <button
            class="button header-action-btn"
            @click="isDropdownOpen = !isDropdownOpen"
            :class="{ 'is-loading': actionLoading }"
          >
            <span>Actions</span>
            <span
              class="icon is-small dropdown-arrow ml-1"
              :class="{ 'is-rotated': isDropdownOpen }"
            >
              <ChevronDownIcon />
            </span>
          </button>
        </div>
        <div class="dropdown-menu">
          <div class="dropdown-content">
            <!-- Start Action -->
            <a
              v-if="canStart"
              class="dropdown-item"
              @click="emitAction('start')"
              :disabled="actionLoading"
            >
              <span class="icon is-small mr-2">
                <PlayIcon />
              </span>
              <span>Start</span>
            </a>

            <!-- Stop Action -->
            <a
              v-if="canStop"
              class="dropdown-item is-danger-item"
              @click="emitAction('stop')"
              :disabled="actionLoading"
            >
              <span class="icon is-small mr-2">
                <SquareIcon />
              </span>
              <span>Stop Deployment</span>
            </a>

            <!-- Archive Action -->
            <a
              v-if="canArchive"
              class="dropdown-item is-danger-item"
              @click="emitAction('archive')"
              :disabled="actionLoading"
            >
              <span class="icon is-small mr-2">
                <ArchiveIcon />
              </span>
              <span>Archive</span>
            </a>

            <hr
              class="dropdown-divider"
              v-if="
                (canStart || canStop || canArchive) &&
                deployment.status !== 'ARCHIVED'
              "
            />

            <!-- Update Replicas Action -->
            <a
              v-if="deployment.status !== 'ARCHIVED'"
              class="dropdown-item"
              @click="emitAction('update-replicas')"
              :disabled="actionLoading"
            >
              <span class="icon is-small mr-2">
                <GridIcon />
              </span>
              <span>Update Replicas</span>
            </a>

            <!-- Update Timeout Action -->
            <a
              v-if="deployment.status !== 'ARCHIVED'"
              class="dropdown-item"
              @click="emitAction('update-timeout')"
              :disabled="actionLoading"
            >
              <span class="icon is-small mr-2">
                <ClockIcon />
              </span>
              <span>Update Timeout</span>
            </a>

            <!-- Update Schedule Action (only for scheduled deployments) -->
            <a
              v-if="
                deployment.status !== 'ARCHIVED' &&
                deployment.strategy?.toUpperCase() === 'SCHEDULED'
              "
              class="dropdown-item"
              @click="emitAction('update-schedule')"
              :disabled="actionLoading"
            >
              <span class="icon is-small mr-2">
                <CalendarIcon />
              </span>
              <span>Update Schedule</span>
            </a>

            <!-- Create Revision Action -->
            <a
              v-if="deployment.status !== 'ARCHIVED'"
              class="dropdown-item"
              @click="emitAction('create-revision')"
              :disabled="actionLoading"
            >
              <span class="icon is-small mr-2">
                <EditIcon />
              </span>
              <span>Create Revision</span>
            </a>

            <div v-if="!hasAnyActions" class="dropdown-item has-text-grey">
              <span>No actions available</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab bar (segmented control) -->
    <div class="dep-tabs">
      <button
        v-for="tab in availableTabs"
        :key="tab"
        type="button"
        class="dep-tab"
        :class="{ 'is-active': activeTab === tab }"
        @click="$emit('switchTab', tab)"
      >
        {{
          tab === "configuration"
            ? "Configuration"
            : tab.charAt(0).toUpperCase() + tab.slice(1)
        }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Deployment } from "@nosana/kit";
import { formatTimeAgo } from "~/utils/relativeTime";

import ChevronDownIcon from "@/assets/img/icons/chevron-down.svg?component";
import PlayIcon from "@/assets/img/icons/play.svg?component";
import SquareIcon from "@/assets/img/icons/square.svg?component";
import ArchiveIcon from "@/assets/img/icons/archive.svg?component";
import GridIcon from "@/assets/img/icons/grid.svg?component";
import ClockIcon from "@/assets/img/icons/clock.svg?component";
import CalendarIcon from "@/assets/img/icons/calendar.svg?component";
import EditIcon from "@/assets/img/icons/edit.svg?component";
import DeploymentStatusPill from "@/components/Deployment/DeploymentStatusPill.vue";

const props = defineProps<{
  deployment: Deployment;
  activeTab: string;
  availableTabs: string[];
  actionLoading: boolean;
  canStart: boolean;
  canStop: boolean;
  canArchive: boolean;
  hasAnyActions: boolean;
}>();

const emit = defineEmits<{
  switchTab: [tab: string];
  action: [action: string];
  navigateBack: [];
  rename: [name: string];
}>();

// Compact relative time (e.g. "2h ago") for the header's "Updated" line.

// Concatenated deployment id (e.g. "d1f4c2a0…2c3d44") + copy affordance.
const shortId = (id: string): string =>
  id && id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id;

const idCopied = ref(false);
const copyId = () => {
  navigator.clipboard?.writeText(props.deployment.id);
  idCopied.value = true;
  setTimeout(() => (idCopied.value = false), 1400);
};

const isEditingName = ref(false);
const nameDraft = ref("");
const nameInputRef = ref<HTMLInputElement | null>(null);

const canRename = computed(
  () => props.deployment.status?.toUpperCase() !== "ARCHIVED",
);

const startEditingName = async () => {
  if (!canRename.value || props.actionLoading) return;
  nameDraft.value = props.deployment.name || "";
  isEditingName.value = true;
  await nextTick();
  nameInputRef.value?.focus();
  nameInputRef.value?.select();
};

const cancelNameEdit = () => {
  isEditingName.value = false;
  nameDraft.value = "";
};

const commitNameEdit = () => {
  if (!isEditingName.value) return;
  const next = nameDraft.value.trim();
  const current = props.deployment.name || "";
  isEditingName.value = false;
  if (!next || next === current) {
    nameDraft.value = "";
    return;
  }
  emit("rename", next);
  nameDraft.value = "";
};

const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const emitAction = (action: string) => {
  isDropdownOpen.value = false;
  emit("action", action);
};

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
.dep-header {
  padding: 1.25rem 1.5rem 0;
}

/* Back link */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: 0;
  padding: 0;
  margin-bottom: 1rem;
  cursor: pointer;
  color: $grey;
  font-family: $family-sans-serif;
  font-size: 0.9rem;
  transition: color 0.15s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    color: $text;
  }
}

html.dark-mode .back-link:hover {
  color: $white;
}

/* Title row + actions */
.header-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-title-section {
  min-width: 0;
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.name-display {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  padding: 2px 6px;
  margin-left: -6px;
}

.name-display.is-editable {
  cursor: text;
}

.name-display .edit-name-icon {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.name-display.is-editable:hover {
  background: rgba($black, 0.04);
}

.name-display.is-editable:hover .edit-name-icon {
  opacity: 1;
}

html.dark-mode .name-display.is-editable:hover {
  background: rgba($white, 0.06);
}

.dep-name {
  font-family: $title-family;
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0;
  color: $text;
}

html.dark-mode .dep-name {
  color: $white;
}

.name-edit-input {
  max-width: 340px;
  font-size: 1.25rem;
}

.id-line {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  font-size: 0.78rem;
  color: $grey;
}

.id-line .is-family-monospace {
  word-break: break-all;
}

.id-sep {
  color: $grey-light;
}

.updated-time {
  white-space: nowrap;
}

.copy-btn {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 0;
  background: transparent;
  color: $grey;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    background: $white-ter;
    color: $text;
  }

  &.is-copied {
    color: $secondary;
  }
}

html.dark-mode .copy-btn:hover {
  background: rgba($white, 0.08);
  color: $white;
}

/* Actions button — grey, matching the segmented control; the width override
   defeats the app-wide `.dropdown { width: 100% }` that breaks the flex row. */
.header-main .dropdown {
  width: auto;
  flex-shrink: 0;
}

.header-action-btn {
  font-family: $title-family;
  font-weight: 500;
  font-size: 0.9rem;
  border-radius: 10px;
  border: 1px solid $grey-lighter;
  background: $white-ter;
  color: $text;
  box-shadow: none;

  &:hover {
    background: $grey-lightest;
    border-color: $grey-light;
  }
}

html.dark-mode .header-action-btn {
  background: rgba($white, 0.06);
  border-color: rgba($white, 0.1);
  color: $white;

  &:hover {
    background: rgba($white, 0.1);
  }
}

.dropdown-arrow {
  transition: transform 0.2s ease;
}

.dropdown-arrow.is-rotated {
  transform: rotate(180deg);
}

/* Actions dropdown menu — matches the artifact's clean rounded card */
.header-main .dropdown-menu {
  min-width: 226px;
  padding-top: 8px;
}

.header-main .dropdown-content {
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba($black, 0.14);
  padding: 6px;
}

.header-main .dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.7rem;
  border-radius: 9px;
  font-size: 0.9rem;
  color: $text;
  background: transparent;
  white-space: nowrap;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  .icon {
    color: $grey;
    transition: color 0.15s ease;
  }

  &:hover {
    background: $white-ter;
    color: $text;

    .icon {
      color: $secondary;
    }
  }
}

.header-main .dropdown-item.is-danger-item {
  color: $danger;

  .icon {
    color: $danger;
  }

  &:hover {
    background: rgba($danger, 0.1);
    color: $danger;

    .icon {
      color: $danger;
    }
  }
}

.header-main .dropdown-divider {
  height: 1px;
  margin: 5px 4px;
  border: 0;
  background: $grey-lighter;
}

html.dark-mode .header-main .dropdown-content {
  background: $black-ter;
  border-color: rgba($white, 0.1);
  box-shadow: 0 14px 44px rgba($black, 0.55);
}

html.dark-mode .header-main .dropdown-item {
  color: $white;

  &:hover {
    background: rgba($white, 0.06);
  }
}

html.dark-mode .header-main .dropdown-item.is-danger-item {
  color: $danger;

  .icon {
    color: $danger;
  }

  &:hover {
    background: rgba($danger, 0.16);
    color: $danger;
  }
}

html.dark-mode .header-main .dropdown-divider {
  background: rgba($white, 0.1);
}

/* Segmented tab control */
.dep-tabs {
  display: inline-flex;
  gap: 3px;
  padding: 5px;
  margin: 1.75rem 0 0.25rem;
  border-radius: 13px;
  background: $grey-lightest;
  max-width: 100%;
  overflow-x: auto;
}

html.dark-mode .dep-tabs {
  background: rgba($white, 0.08);
}

.dep-tab {
  font-family: $title-family;
  font-weight: 500;
  font-size: 0.9rem;
  color: $grey-dark;
  border: 0;
  background: none;
  padding: 0.6rem 1.35rem;
  border-radius: 9px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.15s ease,
    background 0.15s ease;

  &:hover {
    color: $text;
  }

  &.is-active {
    background: $secondary;
    color: #05230a;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba($black, 0.12);
  }
}

html.dark-mode .dep-tab {
  color: $grey-light;
}

html.dark-mode .dep-tab:hover {
  color: $white;
}

html.dark-mode .dep-tab.is-active {
  background: $secondary;
  color: #05230a;
  box-shadow: 0 1px 3px rgba($black, 0.5);
}

@media screen and (max-width: 768px) {
  .dep-header {
    padding: 1rem 1rem 0;
  }

  .dep-name {
    font-size: 1.35rem;
  }

  .header-main {
    flex-wrap: wrap;
  }
}
</style>
