<template>
  <div class="mb-5">
    <div class="is-flex is-align-items-center mb-3">
      <h2 class="title is-5 mb-0 mr-3">Job activity</h2>
      <div class="deployment-tabs">
        <button
          @click="$emit('update:jobActivityTab', 'active')"
          class="tab-button is-small"
          :class="{ 'is-active': jobActivityTab === 'active' }"
        >
          Active
        </button>
        <button
          @click="$emit('update:jobActivityTab', 'history')"
          class="tab-button is-small"
          :class="{ 'is-active': jobActivityTab === 'history' }"
        >
          History
        </button>
      </div>
    </div>

    <!-- Active Jobs -->
    <div v-if="jobActivityTab === 'active'">
      <div
        v-if="activeLoading && activeJobs.length === 0"
        class="box has-text-centered p-6"
      >
        <p class="has-text-grey">Loading active jobs...</p>
      </div>
      <div v-else-if="activeJobs.length === 0" class="box has-text-centered p-6">
        <p class="has-text-grey">
          <span v-if="deploymentStatus === 'DRAFT'"
            >Start deployment to create jobs</span
          >
          <span v-else>No active jobs</span>
        </p>
      </div>

      <div v-else>
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
        class="box has-text-centered p-6"
      >
        <p class="has-text-grey">Loading history...</p>
      </div>
      <div
        v-else-if="historyJobs.length === 0"
        class="box has-text-centered p-6"
      >
        <p class="has-text-grey">No completed jobs yet</p>
      </div>

      <div v-else>
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
