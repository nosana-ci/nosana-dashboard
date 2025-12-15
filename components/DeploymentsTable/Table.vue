<template>
  <div class="box mt-4 has-text-left">
    <div class="columns is-multiline">
      <div class="column is-12">
        <TableHeader />

        <DeploymentList
          v-if="currentTab === 'deployments'"
          :items-per-page="itemsPerPage"
        />
        <JobsList v-if="currentTab === 'jobs'" :items-per-page="itemsPerPage" :status-filter="filterValue" />
        <VaultsList v-if="currentTab === 'vaults'" :items-per-page="itemsPerPage" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from "vue-router";

import JobsList from "~/components/List/JobList.vue";
import VaultsList from "~/components/List/VaultsList.vue";
import DeploymentList from "~/components/List/DeploymentsList.vue";
import TableHeader from "~/components/DeploymentsTable/TableHeader.vue";

const { currentRoute } = useRouter();

const currentTab = computed(
  () => currentRoute.value.query.tab?.toString() || "deployments"
);

const filterValue = computed(
  () => currentRoute.value.query.filter?.toString() || null
);

const pageSizeValue = computed(
  () => currentRoute.value.query.size?.toString() || "10"
);

const itemsPerPage = computed(() => {
  const size = pageSizeValue.value;
  if (size === "all") {
    // For "all" option, use a large number for jobs API, deployments handle this client-side
    return currentTab.value === "jobs" ? 1000 : 1000;
  }
  return parseInt(size) || 10;
});
</script>
