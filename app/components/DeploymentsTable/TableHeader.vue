<template>
  <div class="column is-12">
    <div
      class="is-flex is-align-items-center is-justify-content-space-between is-flex-wrap-nowrap mb-4"
    >
      <div class="control has-icons-left">
        <input
          class="input"
          type="text"
          :placeholder="`Search ${currentTab}`"
          v-model="searchText"
        />
        <span class="icon is-small is-left">
          <GreenDownChevron />
        </span>
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
      <div class="select page-size-select">
        <select v-model="pageSizeValue">
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>
      <div v-if="filtersOptions" class="select status-select ml-2">
        <select v-model="filterValue">
          <option
            v-for="filterState in filtersOptions"
            :key="filterState.value === null ? 'null' : filterState.value"
            :value="filterState.value"
          >
            {{ filterState.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from "vue-router";
import { useWallet } from "@nosana/solana-vue";
import GreenDownChevron from "@/assets/img/icons/green-down-chevron.svg?component";
import { filters } from "./filters";

const { connected } = useWallet();
const { isAuthenticated } = useSuperTokens();
const { currentRoute, push, replace } = useRouter();

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
  // Wallet users: deployments + vaults, no jobs
  return [
    { label: "Deployments", tab: "deployments" },
    ...(connected.value ? [{ label: "Vaults", tab: "vaults" }] : []),
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
<style></style>
