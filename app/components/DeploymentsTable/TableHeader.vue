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

const { connected } = useWallet();
const { isAuthenticated } = useSuperTokens();
const { currentRoute, push, replace } = useRouter();

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
</script>
<style scoped>
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
  border-color: #10e80c;
  box-shadow: 0 0 0 3px rgba(16, 232, 12, 0.15);
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
  border-color: #10e80c;
  box-shadow: 0 0 0 3px rgba(16, 232, 12, 0.15);
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
  border-color: #10e80c;
  box-shadow: 0 0 0 3px rgba(16, 232, 12, 0.2);
}

.dark-mode .th-search-icon,
.dark-mode .th-select-caret {
  color: #80868b;
}
</style>
