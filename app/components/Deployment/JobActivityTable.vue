<template>
  <div class="box is-borderless">
    <div class="table-container">
      <table class="table is-fullwidth mb-0" style="table-layout: fixed">
        <thead>
          <tr>
            <th style="width: 25%">Name</th>
            <th style="width: 10%">Revision</th>
            <th style="width: 12%">Status</th>
            <th v-if="showDuration" style="width: 15%">Duration</th>
            <th style="width: 18%">Created on</th>
            <th style="width: 20%">Navigation</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in jobs" :key="job.job">
            <td
              style="
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 0;
              "
            >
              <span class="is-family-monospace is-size-7">{{ job.job }}</span>
            </td>
            <td>{{ job.revision || "-" }}</td>
            <td>
              <JobStatus :status="getJobStateNumber(job)" />
            </td>
            <td v-if="showDuration">
              <span v-if="getJobDuration && getJobDuration(job.job) !== null">
                <SecondsFormatter
                  :seconds="getJobDuration(job.job) as number"
                  :showSeconds="true"
                />
              </span>
              <span v-else>-</span>
            </td>
            <td>{{ formatDate(job.created_at) }}</td>
            <td>
              <NuxtLink
                :to="`/deployments/${deploymentId}/jobs/${job.job}`"
                class="has-text-link"
              >
                View job
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentJobItem } from "@nosana/api";
import { formatDate } from "~/utils/formatDate";
import JobStatus from "~/components/Job/Status.vue";
import SecondsFormatter from "~/components/SecondsFormatter.vue";

defineProps<{
  jobs: DeploymentJobItem[];
  deploymentId: string;
  getJobStateNumber: (job: DeploymentJobItem) => number;
  getJobDuration?: (jobId: string) => number | null;
  showDuration?: boolean;
}>();
</script>
