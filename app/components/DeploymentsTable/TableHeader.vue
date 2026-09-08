<template>
  <div class="column is-12">
    <div
      class="is-flex is-align-items-center is-justify-content-space-between is-flex-wrap-nowrap mb-4"
    >
      <div class="th-search">
        <svg
          class="th-search-icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
          <path
            d="m20 20-3.5-3.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <input
          class="th-search-input"
          type="text"
          :placeholder="`Search ${currentTab}`"
          v-model="searchText"
        />
      </div>
      <div v-if="buttons.length > 1" class="deployment-tabs ml-4">
        <template v-for="button in buttons" :key="button.tab">
          <button
            class="tab-button"
            :class="{ 'is-active': currentTab === button.tab }"
            @click="push({ query: { tab: button.tab } })"
          >
            {{ button.label }}
          </button>
        </template>
      </div>
      <div class="is-flex-grow-1"></div>
      <Transition name="th-actions">
        <div
          v-if="currentTab === 'deployments' && selectedIds.size"
          ref="actionsRef"
          class="dropdown is-right th-actions mr-2"
          :class="{ 'is-active': actionsOpen }"
        >
          <div class="dropdown-trigger">
            <button
              type="button"
              class="button th-actions-btn"
              :class="{ 'is-loading': bulkRunning !== null }"
              aria-haspopup="true"
              @click="actionsOpen = !actionsOpen"
            >
              <span>Actions</span>
              <span class="th-actions-count">{{ selectedIds.size }}</span>
              <span
                class="icon is-small th-actions-caret"
                :class="{ 'is-rotated': actionsOpen }"
              >
                <ChevronDownIcon />
              </span>
            </button>
          </div>
          <div class="dropdown-menu" role="menu">
            <div class="dropdown-content">
              <a
                v-for="action in availableBulkActions"
                :key="action.key"
                class="dropdown-item"
                :class="{
                  'is-danger-item': action.danger,
                  'is-disabled': !bulkTargets[action.key].length,
                }"
                @click="pickAction(action.key)"
              >
                <span class="icon is-small mr-2">
                  <component :is="bulkIcons[action.key]" />
                </span>
                <span>{{ action.label }}</span>
                <span class="th-item-count">
                  {{ bulkTargets[action.key].length }}
                </span>
              </a>
              <hr class="dropdown-divider" />
              <a class="dropdown-item" @click="pickAction('clear')">
                <span>Clear selection</span>
              </a>
            </div>
          </div>
        </div>
      </Transition>
      <div class="th-select-control">
        <select v-model="pageSizeValue" class="th-select" aria-label="Per page">
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>
        <svg
          class="th-select-caret"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <div v-if="showMarketFilter" class="th-select-control ml-2">
        <select v-model="marketValue" class="th-select" aria-label="Market">
          <option :value="null">All markets</option>
          <option
            v-for="market in marketOptions"
            :key="market.value"
            :value="market.value"
          >
            {{ market.label }}
          </option>
        </select>
        <svg
          class="th-select-caret"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <div v-if="filtersOptions" class="th-select-control ml-2">
        <select v-model="filterValue" class="th-select" aria-label="Status">
          <option
            v-for="filterState in filtersOptions"
            :key="filterState.value === null ? 'null' : filterState.value"
            :value="filterState.value"
          >
            {{ filterState.label }}
          </option>
        </select>
        <svg
          class="th-select-caret"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from "vue-router";
import { useWallet } from "@nosana/solana-vue";
import { filters } from "./filters";
import { truncateMiddle } from "~/utils/solana";
import ChevronDownIcon from "@/assets/img/icons/chevron-down.svg?component";
import PlayIcon from "@/assets/img/icons/play.svg?component";
import SquareIcon from "@/assets/img/icons/square.svg?component";
import ArchiveIcon from "@/assets/img/icons/archive.svg?component";
import TrashIcon from "@/assets/img/icons/trash.svg?component";
import {
  useDeploymentSelection,
  type BulkActionKey,
} from "~/composables/useDeploymentSelection";

const { connected } = useWallet();
const { isAuthenticated } = useSuperTokens();
const { currentRoute, push, replace } = useRouter();
const { nosana } = useKit();

// The Vaults tab is an advanced view for custom/legacy vaults only; the
// shared (main) vault is managed from the account page.
const { ensureSharedVault, hasCustomVaults } = useSharedVault();

onMounted(() => {
  if (connected.value && !isAuthenticated.value) {
    ensureSharedVault();
  }
});

watch(connected, (isConnected) => {
  if (isConnected && !isAuthenticated.value) {
    ensureSharedVault();
  }
});

// Build the market filter dropdown from the markets the user actually has
// deployments in (the list endpoint can't filter by market server-side).
const { data: marketsMeta } = useAPI("/markets", { default: () => [] });
const deploymentMarkets = ref<string[]>([]);

const loadDeploymentMarkets = async () => {
  try {
    const result = await nosana.value.api.deployments.list({ limit: 100 });
    const seen = new Set<string>();
    for (const d of result.deployments || []) {
      if (d.market) seen.add(d.market);
    }
    deploymentMarkets.value = [...seen];
  } catch {
    deploymentMarkets.value = [];
  }
};

watch(
  [isAuthenticated, connected],
  ([auth, conn]) => {
    if (auth || conn) loadDeploymentMarkets();
  },
  { immediate: true },
);

const marketOptions = computed(() =>
  deploymentMarkets.value
    .map((address) => {
      const match = marketsMeta.value?.find((m: any) => m.address === address);
      return {
        label: match?.name || truncateMiddle(address, 6, 6),
        value: address,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label)),
);

const showMarketFilter = computed(
  () =>
    currentTab.value === "deployments" && deploymentMarkets.value.length > 1,
);

const marketValue = computed({
  get() {
    return currentRoute.value.query.market?.toString() || null;
  },
  set(newMarket: string | null) {
    replace({
      query: {
        ...currentRoute.value.query,
        market: newMarket ?? undefined,
      },
    });
  },
});

const currentTab = computed(
  () => currentRoute.value.query.tab?.toString() || "deployments",
);

const filtersOptions = computed(() => {
  return filters[currentTab.value];
});

const buttons = computed(() => {
  if (isAuthenticated.value) {
    // Credit users: deployments only, no tab switcher
    return [{ label: "Deployments", tab: "deployments" }];
  }
  // Wallet users: deployments, plus the advanced Vaults view only when
  // custom/legacy vaults exist (the shared vault lives on the account page)
  return [
    { label: "Deployments", tab: "deployments" },
    ...(connected.value && hasCustomVaults.value
      ? [{ label: "Vaults", tab: "vaults" }]
      : []),
  ];
});

const searchText = computed({
  get() {
    return currentRoute.value.query.search?.toString() || null;
  },
  set(value: string | null) {
    replace({
      query: {
        ...currentRoute.value.query,
        search: value || undefined,
      },
    });
  },
});

const filterValue = computed({
  get() {
    return currentRoute.value.query.filter?.toString() || null;
  },
  set(newFilter: string | null) {
    replace({
      query: {
        ...currentRoute.value.query,
        filter: newFilter ?? undefined,
      },
    });
  },
});

const pageSizeValue = computed({
  get() {
    return currentRoute.value.query.size?.toString() || "10";
  },
  set(newSize: string) {
    replace({
      query: {
        ...currentRoute.value.query,
        size: newSize === "10" ? undefined : newSize, // Don't include size=10 in URL for cleaner URLs
      },
    });
  },
});

// Bulk actions for the deployments ticked in the list below. The button only
// exists while something is selected; it sits before the filters and takes
// its width from the flex spacer, so the filters never move.
const {
  selectedIds,
  availableBulkActions,
  bulkTargets,
  bulkRunning,
  clearSelection,
  runBulkAction,
} = useDeploymentSelection();

const bulkIcons = {
  start: PlayIcon,
  stop: SquareIcon,
  archive: ArchiveIcon,
  delete: TrashIcon,
};

const actionsOpen = ref(false);
const actionsRef = ref<HTMLElement | null>(null);

watch(
  () => selectedIds.value.size,
  (size) => {
    if (!size) actionsOpen.value = false;
  },
);

const pickAction = (key: BulkActionKey | "clear") => {
  actionsOpen.value = false;
  if (key === "clear") clearSelection();
  else runBulkAction(key);
};

const closeActionsOnOutsideClick = (event: MouseEvent) => {
  if (actionsRef.value && !actionsRef.value.contains(event.target as Node)) {
    actionsOpen.value = false;
  }
};

onMounted(() => document.addEventListener("click", closeActionsOnOutsideClick));
onUnmounted(() =>
  document.removeEventListener("click", closeActionsOnOutsideClick),
);
</script>
<style scoped lang="scss">
/* Search + dropdowns styled to match the Create Deployment "Select GPU" toolbar */
.th-search {
  position: relative;
  flex: 0 1 280px;
  min-width: 180px;
}

.th-search-icon {
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9aa0a6;
  pointer-events: none;
}

.th-search-input {
  width: 100%;
  height: 40px;
  padding: 0 0.9rem 0 2.35rem;
  font-size: 0.875rem;
  color: #1a1c1e;
  background: #ffffff;
  border: 1px solid #e1e3e6;
  border-radius: 10px;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.th-search-input::placeholder {
  color: #9aa0a6;
}

.th-search-input:focus {
  border-color: $secondary;
  box-shadow: 0 0 0 3px rgba($secondary, 0.15);
}

.th-select-control {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 40px;
  background: #ffffff;
  border: 1px solid #e1e3e6;
  border-radius: 10px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.th-select-control:focus-within {
  border-color: $secondary;
  box-shadow: 0 0 0 3px rgba($secondary, 0.15);
}

.th-select {
  appearance: none;
  -webkit-appearance: none;
  height: 100%;
  padding: 0 2.1rem 0 0.85rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1c1e;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  outline: none;
}

.th-select-caret {
  position: absolute;
  right: 0.7rem;
  width: 16px;
  height: 16px;
  color: #80868b;
  pointer-events: none;
}

/* Dark mode */
.dark-mode .th-search-input,
.dark-mode .th-select-control {
  background: #242526;
  border-color: #3a3a3a;
}

.dark-mode .th-search-input {
  color: #eceef0;
}

.dark-mode .th-search-input::placeholder {
  color: #80868b;
}

.dark-mode .th-select {
  color: #eceef0;
}

.dark-mode .th-search-input:focus,
.dark-mode .th-select-control:focus-within {
  border-color: $secondary;
  box-shadow: 0 0 0 3px rgba($secondary, 0.2);
}

.dark-mode .th-search-icon,
.dark-mode .th-select-caret {
  color: #80868b;
}

/* Bulk "Actions" menu for the selected deployments: same look as the
   deployment page's actions menu, sized to sit with the toolbar controls. */
.th-actions {
  width: auto; /* defeat the app-wide `.dropdown { width: 100% }` */
  flex-shrink: 0;
}

.th-actions-btn {
  height: 40px;
  padding: 0 0.85rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1c1e;
  background: #ffffff;
  border: 1px solid #e1e3e6;
  border-radius: 10px;
  box-shadow: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;

  &:hover {
    background: #f7f8f9;
    border-color: #cfd3d7;
    color: #1a1c1e;
  }

  &:focus-visible {
    border-color: $secondary;
    box-shadow: 0 0 0 3px rgba($secondary, 0.15);
  }
}

.th-actions-enter-active {
  transition: opacity 0.15s ease;
}

.th-actions-enter-from {
  opacity: 0;
}

.th-actions-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  margin-left: 0.5rem;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #05230a;
  background: $secondary;
}

.th-actions-caret {
  margin-left: 0.35rem;
  color: #80868b;
  transition: transform 0.2s ease;

  &.is-rotated {
    transform: rotate(180deg);
  }
}

.th-actions .dropdown-menu {
  min-width: 210px;
  padding-top: 8px;
}

.th-actions .dropdown-content {
  background: #ffffff;
  border: 1px solid $grey-lighter;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba($black, 0.14);
  padding: 6px;
}

.th-actions .dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.7rem;
  border-radius: 9px;
  font-size: 0.9rem;
  color: $text;
  background: transparent;
  white-space: nowrap;
  cursor: pointer;
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

  &.is-disabled {
    opacity: 0.45;
    pointer-events: none;
  }
}

.th-actions .dropdown-item.is-danger-item {
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

.th-item-count {
  margin-left: auto;
  padding-left: 1rem;
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  color: $grey;
}

.th-actions .dropdown-divider {
  height: 1px;
  margin: 5px 4px;
  border: 0;
  background: $grey-lighter;
}

.dark-mode .th-actions-btn {
  background: #242526;
  border-color: #3a3a3a;
  color: #eceef0;

  &:hover {
    background: #2c2d2e;
    border-color: #4a4a4a;
    color: #eceef0;
  }
}

.dark-mode .th-actions .dropdown-content {
  background: $black-ter;
  border-color: rgba($white, 0.1);
  box-shadow: 0 14px 44px rgba($black, 0.55);
}

.dark-mode .th-actions .dropdown-item {
  color: $white;

  &:hover {
    background: rgba($white, 0.06);
  }
}

.dark-mode .th-actions .dropdown-item.is-danger-item {
  color: $danger;

  &:hover {
    background: rgba($danger, 0.16);
    color: $danger;
  }
}

.dark-mode .th-actions .dropdown-divider {
  background: rgba($white, 0.1);
}
</style>
