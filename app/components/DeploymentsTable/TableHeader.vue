<template>
  <div class="column is-12">
    <div
      class="is-flex is-align-items-center is-justify-content-space-between is-flex-wrap-nowrap mb-4"
    >
      <div class="deployment-tabs">
        <template v-for="button in buttons" :key="button.tab">
          <button
            class="tab-button"
            :class="{ 'is-active': currentTab === button.tab }"
            v-if="button.tab !== 'vaults' || connected"
            @click="push({ query: { tab: button.tab } })"
          >
            {{ button.label }}
          </button>
        </template>
      </div>
      <div class="control has-icons-left ml-auto">
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
      <div class="select page-size-select ml-2">
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
const { currentRoute, push, replace } = useRouter();

const currentTab = computed(
  () => currentRoute.value.query.tab?.toString() || "deployments",
);

const filtersOptions = computed(() => {
  return filters[currentTab.value];
});

const buttons = computed(() => [
  { label: "Deployments", tab: "deployments" },
  { label: "Jobs", tab: "jobs" },
  ...(connected ? [{ label: "Vaults", tab: "vaults" }] : []),
]);

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
