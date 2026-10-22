<template>
  <!-- The toolbar sits above a soft card, as the deployment and create pages lay out their sections -->
  <div class="has-text-left">
    <TableHeader />

    <div class="section-card list-card">
      <DeploymentList
        v-if="currentTab === 'deployments'"
        :items-per-page="itemsPerPage"
      />
      <JobsList
        v-if="currentTab === 'jobs'"
        :items-per-page="itemsPerPage"
        :status-filter="filterValue"
      />
      <VaultsList
        v-if="currentTab === 'vaults'"
        :items-per-page="itemsPerPage"
      />
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
  () => currentRoute.value.query.tab?.toString() || "deployments",
);

const filterValue = computed(
  () => currentRoute.value.query.filter?.toString() || null,
);

const pageSizeValue = computed(
  () => currentRoute.value.query.size?.toString() || "10",
);

const itemsPerPage = computed(() => {
  const size = pageSizeValue.value;
  return parseInt(size) || 10;
});
</script>

<style scoped lang="scss">
// The lists keep their own row padding; the card only frames them.
.list-card {
  padding: 0.25rem 0.5rem;

  :deep(.table-container) {
    margin-bottom: 0;
  }

  :deep(.table) {
    background: transparent;
  }
}
</style>
