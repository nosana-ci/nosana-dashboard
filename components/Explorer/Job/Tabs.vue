<template>
  <div class="tabs mt-5">
    <ul>
      <li :class="{ 'is-active': activeTab === 'logs' }">
        <a @click.prevent="activeTab = 'logs'">Logs</a>
      </li>
      <li v-if="job.jobResult" :class="{ 'is-active': activeTab === 'result' }">
        <a @click.prevent="activeTab = 'result'">Result</a>
      </li>
      <li :class="{ 'is-active': activeTab === 'info' }">
        <a @click.prevent="activeTab = 'info'">Job Definition</a>
      </li>
      <li
        v-if="hasArtifacts"
        :class="{ 'is-active': activeTab === 'artifacts' }"
      >
        <a @click.prevent="activeTab = 'artifacts'">Artifacts</a>
      </li>
    </ul>
  </div>
  <JobDefinitionView
    v-if="activeTab === 'info'"
    :jobDefinition="jobDefinition"
  />
  <JobLogsView
    v-if="activeTab === 'logs'"
    :job="job"
    :endpoints="endpoints"
    :jobDefinition="jobDefinition"
    :signMessageError="false"
    :isJobPoster="isJobPoster"
    :loading="false"
    :isConnecting="isConnecting"
    :logs="logs"
    :progressBars="progressBars"
    :resourceProgressBars="resourceProgressBars"
  />
  <JobResultsView v-if="activeTab === 'result'" :job="job" />
  <JobArtifactsView v-if="activeTab === 'artifacts'" :job="job" />
</template>

<script setup lang="ts">
import type { JobDefinition } from "@nosana/sdk";

import JobLogsView from "./Tabs/Logs.vue";
import JobResultsView from "./Tabs/Results.vue";
import JobArtifactsView from "./Tabs/Artifacts.vue";
import JobDefinitionView from "./Tabs/JobDefinition.vue";

import type { Endpoints, UseJob } from "~/composables/jobs/useJob";
import type { LogEntry, ProgressBar } from "~/composables/jobs/useJobLogs";

interface Props {
  job: UseJob;
  endpoints: Endpoints;
  isJobPoster: boolean;
  jobDefinition: JobDefinition;
  hasArtifacts: boolean;
  isConnecting: boolean;
  logs: LogEntry[];
  progressBars: Map<string, ProgressBar>;
  resourceProgressBars: Map<string, any>;
}

const { job, jobDefinition, endpoints, isJobPoster, hasArtifacts } =
  defineProps<Props>();

const activeTab = ref("logs");
</script>
