<template>
  <div class="deployment-logs-container">
    <div
      v-if="allJobsForLogs.length === 0"
      class="notification is-light has-text-centered"
    >
      <p class="has-text-grey">No jobs to show logs for</p>
    </div>
    <div v-else class="deployment-logs-content">
      <!-- Pagination for logs tab -->
      <div v-if="logsJobsTotalPages > 1" class="mb-3">
        <Pagination
          :modelValue="logsJobsPage"
          @update:modelValue="$emit('update:logsJobsPage', $event)"
          :total-page="logsJobsTotalPages"
          :max-page="logsJobsTotalPages"
        />
      </div>
      <!-- Job Tabs (show if more than one job on current page) -->
      <div v-if="allJobs.length > 1" class="deployment-tabs mb-3">
        <button
          v-for="job in allJobs"
          :key="job.job"
          @click="$emit('selectJob', job)"
          :class="{ 'is-active': activeLogsJobId === job.job }"
          class="tab-button"
        >
          {{ job.job.slice(0, 16) }}...
          <span
            v-if="getJobStateNumber(job) === 2"
            class="ml-2 is-size-7 has-text-grey"
            >(completed)</span
          >
        </button>
      </div>

      <!-- Selected Job Logs -->
      <div v-if="activeLogsJobId && deploymentId" class="selected-job-logs">
        <!-- Show logs for active jobs -->
        <div v-if="isActiveJob(activeLogsJobId)">
          <JobLogsContainer
            :job-id="activeLogsJobId"
            :deployment-id="deploymentId"
          />
        </div>
        <!-- Show results for completed jobs -->
        <div
          v-else-if="isCompletedJob(activeLogsJobId)"
          class="completed-job-results"
        >
          <div
            v-if="loadingJobResults[activeLogsJobId]"
            class="has-text-centered p-4"
          >
            <p class="has-text-grey">Loading results...</p>
          </div>
          <div
            v-else-if="
              completedJobResults[activeLogsJobId] &&
              getJobData(activeLogsJobId)
            "
          >
            <JobResult
              :ipfs-result="completedJobResults[activeLogsJobId]!"
              :ipfs-job="getJobData(activeLogsJobId)!"
            />
          </div>
          <div v-else-if="!loadingJobResults[activeLogsJobId]">
            <JobResult
              :ipfs-result="null"
              :ipfs-job="getJobData(activeLogsJobId) || null"
            />
          </div>
        </div>
      </div>
      <!-- No job selected -->
      <div v-else class="has-text-centered p-4">
        <p class="has-text-grey">Select a job to view logs</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentJobItem } from "@nosana/api";
import type { ResultsSection } from "~/composables/jobs/types";
import JobLogsContainer from "~/components/Job/LogsContainer.vue";
import JobResult from "~/components/Job/Result.vue";
import Pagination from "~/components/Pagination.vue";

defineProps<{
  deploymentId: string;
  allJobsForLogs: DeploymentJobItem[];
  allJobs: DeploymentJobItem[];
  logsJobsPage: number;
  logsJobsTotalPages: number;
  activeLogsJobId: string | null;
  completedJobResults: Record<string, ResultsSection | null>;
  loadingJobResults: Record<string, boolean>;
  getJobStateNumber: (job: DeploymentJobItem) => number;
  isActiveJob: (jobId: string) => boolean;
  isCompletedJob: (jobId: string) => boolean;
  getJobData: (jobId: string) => DeploymentJobItem | undefined;
}>();

defineEmits<{
  "update:logsJobsPage": [value: number];
  selectJob: [job: DeploymentJobItem];
}>();
</script>

<style lang="scss" scoped>
.deployment-logs-container {
  .deployment-logs-content {
    background-color: $white;
    border-radius: $radius-small;
    margin-top: 0.2rem;
  }

  .selected-job-logs {
    min-height: 25rem;
  }
}

html.dark-mode {
  .deployment-logs-container .deployment-logs-content {
    background-color: $black-ter;
  }
}
</style>
