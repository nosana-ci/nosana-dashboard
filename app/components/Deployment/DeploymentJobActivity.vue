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

      <template v-else>
        <div class="da-card">
          <JobActivityTable
            :jobs="activeJobs"
            :deploymentId="deploymentId"
            :getJobStateNumber="getJobStateNumber"
            @open="$emit('open', $event)"
            @viewLogs="$emit('viewLogs', $event)"
            @openSsh="$emit('openSsh', $event)"
            @openRevision="$emit('openRevision', $event)"
          />
          <div v-if="activeHasPrev || activeHasNext" class="da-foot">
            <JobActivityPager
              :hasPrev="activeHasPrev"
              :hasNext="activeHasNext"
              :loading="activeLoading"
              @prev="$emit('active:prev')"
              @next="$emit('active:next')"
            />
          </div>
        </div>
        <JobStatusKey class="da-key" :states="statesIn(activeJobs)" />
      </template>
    </div>

    <!-- Historical Jobs -->
    <div v-else-if="jobActivityTab === 'history'">
      <div
        v-if="historyLoading && historyJobs.length === 0"
        class="da-card da-empty"
      >
        Loading history…
      </div>
      <div v-else-if="historyJobs.length === 0" class="da-card da-empty">
        No completed jobs yet
      </div>

      <template v-else>
        <div class="da-card">
          <JobActivityTable
            :jobs="historyJobs"
            :deploymentId="deploymentId"
            :getJobStateNumber="getJobStateNumber"
            :getJobDuration="getJobDuration"
            :showDuration="true"
            @open="$emit('open', $event)"
            @viewLogs="$emit('viewLogs', $event)"
            @openRevision="$emit('openRevision', $event)"
          />
          <div v-if="historyHasPrev || historyHasNext" class="da-foot">
            <JobActivityPager
              :hasPrev="historyHasPrev"
              :hasNext="historyHasNext"
              :loading="historyLoading"
              @prev="$emit('history:prev')"
              @next="$emit('history:next')"
            />
          </div>
        </div>
        <JobStatusKey class="da-key" :states="statesIn(historyJobs)" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentJobItem } from "@nosana/api";
import JobActivityTable from "~/components/Deployment/JobActivityTable.vue";
import JobActivityPager from "~/components/Deployment/JobActivityPager.vue";
import JobStatusKey from "~/components/Deployment/JobStatusKey.vue";

const props = defineProps<{
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

// The states actually present in a list, so the key only explains what is shown.
const statesIn = (jobs: DeploymentJobItem[]) =>
  [...new Set(jobs.map(props.getJobStateNumber))].sort((a, b) => a - b);

defineEmits<{
  "update:jobActivityTab": [value: string];
  open: [jobId: string];
  viewLogs: [jobId: string];
  openSsh: [jobId: string];
  openRevision: [revision: number];
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

.da-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.7rem 1.1rem;
  border-top: 1px solid $grey-lighter;
}

/* The status key sits outside the card, on the page background, inset to the
   card's own row padding. */
.da-key {
  padding: 0.7rem 1.1rem 0;
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

html.dark-mode .da-foot {
  border-top-color: rgba($white, 0.08);
}
</style>
