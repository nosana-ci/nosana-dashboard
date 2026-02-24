<template>
  <div class="p-5 deployment-header">
    <div class="is-flex is-justify-content-space-between is-align-items-start">
      <div class="header-left-section">
        <div class="is-flex is-align-items-center mb-0">
          <button
            @click="$emit('navigateBack')"
            class="button is-ghost back-button mr-4 pb-1 height-auto"
          >
            <span class="icon is-small">
              <ArrowUpIcon
                class="icon-16 transform-rotate-270 back-arrow-icon"
              />
            </span>
          </button>
          <div class="header-title-section">
            <h1 class="title is-5 has-text-weight-normal mb-1">
              {{ deployment.name || "Deployment" }}
            </h1>
            <p
              v-if="deployment.name"
              class="subtitle is-7 has-text-grey is-family-monospace mb-0"
            >
              {{ deployment.id }}
            </p>
          </div>
          <StatusTag :status="deployment.status" class="ml-4" />
        </div>
      </div>
      <div class="deployment-tabs">
        <button
          v-for="tab in availableTabs"
          :key="tab"
          @click="$emit('switchTab', tab)"
          :class="{ 'is-active': activeTab === tab }"
          class="tab-button"
        >
          {{
            tab === "configuration"
              ? "Configuration"
              : tab.charAt(0).toUpperCase() + tab.slice(1)
          }}
        </button>
        <!-- Actions Dropdown -->
        <div
          class="dropdown is-right"
          :class="{ 'is-active': isDropdownOpen }"
          ref="dropdownRef"
        >
          <div class="dropdown-trigger">
            <button
              class="tab-button actions-button"
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
                class="dropdown-item"
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
                class="dropdown-item"
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

              <VaultActions
                v-if="hasVault && deploymentVault"
                :vault="deploymentVault"
                :closeMenu="closeDropdown"
                :switchAction="(action: string) => emitAction(action)"
                :isDisabled="actionLoading"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Deployment } from "@nosana/kit";
import StatusTag from "~/components/Common/StatusTag.vue";
import VaultActions from "~/components/Vault/VaultActions.vue";

import ArrowUpIcon from "@/assets/img/icons/arrow-up.svg?component";
import ChevronDownIcon from "@/assets/img/icons/chevron-down.svg?component";
import PlayIcon from "@/assets/img/icons/play.svg?component";
import SquareIcon from "@/assets/img/icons/square.svg?component";
import ArchiveIcon from "@/assets/img/icons/archive.svg?component";
import GridIcon from "@/assets/img/icons/grid.svg?component";
import ClockIcon from "@/assets/img/icons/clock.svg?component";
import CalendarIcon from "@/assets/img/icons/calendar.svg?component";
import EditIcon from "@/assets/img/icons/edit.svg?component";

defineProps<{
  deployment: Deployment;
  activeTab: string;
  availableTabs: string[];
  actionLoading: boolean;
  canStart: boolean;
  canStop: boolean;
  canArchive: boolean;
  hasAnyActions: boolean;
  hasVault: boolean;
  deploymentVault: any;
}>();

const emit = defineEmits<{
  switchTab: [tab: string];
  action: [action: string];
  navigateBack: [];
}>();

const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

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
.deployment-header > .is-flex {
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left-section {
  min-width: 0;
  flex: 1;
}

.header-title-section {
  min-width: 0;
  max-width: 400px;
  display: flex !important;
  flex-direction: column !important;
}

.header-title-section .title {
  display: block !important;
  margin-bottom: 0.25rem !important;
}

.header-title-section .subtitle {
  display: block !important;
  word-break: break-all;
  line-height: 1.2;
  margin-top: 0 !important;
}

.deployment-header .status-tag {
  white-space: nowrap;
  flex-shrink: 0;
}

.deployment-header {
  border-bottom: 1px solid $grey-lighter;
}

html.dark-mode .deployment-header {
  border-bottom-color: $grey-dark;
}

@media screen and (max-width: 768px) {
  .deployment-header > .is-flex {
    flex-direction: column !important;
    align-items: stretch !important;
    flex-wrap: nowrap !important;
  }

  .header-left-section {
    width: 100%;
    margin-bottom: 1rem;
  }

  .deployment-tabs {
    width: 100% !important;
    justify-content: flex-start;
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .header-title-section {
    max-width: none;
  }

  .header-title-section .subtitle {
    font-size: 0.75rem;
  }

  .tab-button {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
}

@media screen and (max-width: 480px) {
  .deployment-tabs {
    gap: 0.25rem;
  }

  .tab-button {
    font-size: 0.75rem;
    padding: 0.375rem 0.5rem;
  }
}
</style>
