<template>
  <div class="box mt-4 has-text-left">
    <div class="columns is-multiline">
      <div class="column is-12">
        <TableHeader />

        <DeploymentList
          v-if="currentTab === 'deployments'"
          :items-per-page="10"
        />
        <JobsList v-if="currentTab === 'jobs'" :items-per-page="10" />
        <VaultsList v-if="currentTab === 'vaults'" />
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
</script>
