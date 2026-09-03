<template>
  <div class="mb-5">
    <div class="da-head">
      <h2 class="title is-5 mb-0">Job activity</h2>
      <div class="seg-tabs">
        <button
          :class="{ 'is-active': jobActivityTab === 'active' }"
          @click="$emit('update:jobActivityTab', 'active')"
        >
          Active
        </button>
        <button
          :class="{ 'is-active': jobActivityTab === 'history' }"
          @click="$emit('update:jobActivityTab', 'history')"
        >
          History
        </button>
      </div>
    </div>

    <!-- Active Jobs -->
    <div v-if="jobActivityTab === 'active'">
      <div
        v-if="activeLoading && activeJobs.length === 0"
        class="da-card da-empty"
      >
        Loading active jobs…
      </div>
      <div v-else-if="activeJobs.length === 0" class="da-card da-empty">
        <span v-if="deploymentStatus === 'DRAFT'"
          >Start deployment to create jobs</span
        >
        <span v-else>No active jobs</span>
      </div>

      <div v-else class="da-card">
        <JobActivityTable
          :jobs="activeJobs"
          :deploymentId="deploymentId"
          :getJobStateNumber="getJobStateNumber"
        />
        <JobActivityPager
          :hasPrev="activeHasPrev"
          :hasNext="activeHasNext"
          :loading="activeLoading"
          @prev="$emit('active:prev')"
          @next="$emit('active:next')"
        />
      </div>
    </div>

    <!-- Historical Jobs -->
    <div v-else-if="jobActivityTab === 'history'">
      <div
        v-if="historyLoading && historyJobs.length === 0"
        class="da-card da-empty"
      >
        Loading history…
      </div>
      <div
        v-else-if="historyJobs.length === 0"
        class="da-card da-empty"
      >
        No completed jobs yet
      </div>

      <div v-else class="da-card">
        <JobActivityTable
          :jobs="historyJobs"
          :deploymentId="deploymentId"
          :getJobStateNumber="getJobStateNumber"
          :getJobDuration="getJobDuration"
          :showDuration="true"
        />
        <JobActivityPager
          :hasPrev="historyHasPrev"
          :hasNext="historyHasNext"
          :loading="historyLoading"
          @prev="$emit('history:prev')"
          @next="$emit('history:next')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentJobItem } from "@nosana/api";
import JobActivityTable from "~/components/Deployment/JobActivityTable.vue";
import JobActivityPager from "~/components/Deployment/JobActivityPager.vue";

defineProps<{
  deploymentId: string;
  deploymentStatus: string;
  jobActivityTab: string;
  activeJobs: DeploymentJobItem[];
  activeLoading: boolean;
  activeHasPrev: boolean;
  activeHasNext: boolean;
  historyJobs: DeploymentJobItem[];
  historyLoading: boolean;
  historyHasPrev: boolean;
  historyHasNext: boolean;
  getJobStateNumber: (job: DeploymentJobItem) => number;
  getJobDuration: (jobId: string) => number | null;
}>();

defineEmits<{
  "update:jobActivityTab": [value: string];
  "active:prev": [];
  "active:next": [];
  "history:prev": [];
  "history:next": [];
}>();
</script>

<style lang="scss" scoped>
.da-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.da-card {
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 14px;
  overflow: hidden;
}

.da-empty {
  padding: 2.75rem 1rem;
  text-align: center;
  color: $grey;
  font-size: 0.9rem;
}

html.dark-mode .da-card {
  background: $black-ter;
  border-color: rgba($white, 0.08);
}
</style>
