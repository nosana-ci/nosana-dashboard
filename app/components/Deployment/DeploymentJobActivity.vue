<template>
  <div class="mb-5">
    <div class="is-flex is-align-items-center mb-3">
      <h2 class="title is-5 mb-0 mr-3">Job activity</h2>
      <!-- Job Activity Tabs (only show if 5+ jobs) -->
      <div v-if="totalJobs >= 5" class="deployment-tabs">
        <button
          @click="
            $emit('update:jobActivityTab', 'active');
            $emit('update:historicalJobsPage', 1);
          "
          class="tab-button is-small"
          :class="{ 'is-active': jobActivityTab === 'active' }"
        >
          Active
        </button>
        <button
          @click="
            $emit('update:jobActivityTab', 'history');
            $emit('update:historicalJobsPage', 1);
          "
          class="tab-button is-small"
          :class="{ 'is-active': jobActivityTab === 'history' }"
        >
          History
        </button>
      </div>
    </div>

    <!-- All Jobs (when tabs are hidden, < 5 jobs) -->
    <div v-if="totalJobs < 5">
      <div
        v-if="activeJobs.length === 0 && allHistoricalJobs.length === 0"
        class="box has-text-centered p-6"
      >
        <p class="has-text-grey">
          <span v-if="deploymentStatus === 'DRAFT'"
            >Start deployment to create jobs</span
          >
          <span v-else>No jobs yet</span>
        </p>
      </div>

      <div v-else class="box is-borderless">
        <div class="table-container">
          <table class="table is-fullwidth mb-0" style="table-layout: fixed">
            <thead>
              <tr>
                <th style="width: 25%">Name</th>
                <th style="width: 10%">Revision</th>
                <th style="width: 12%">Status</th>
                <th style="width: 18%">Created on</th>
                <th style="width: 20%">Navigation</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="job in [...activeJobs, ...allHistoricalJobs]"
                :key="job.job"
              >
                <td
                  style="
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 0;
                  "
                >
                  <span class="is-family-monospace is-size-7">{{
                    job.job
                  }}</span>
                </td>
                <td>
                  {{ job.revision || "-" }}
                </td>
                <td>
                  <JobStatus :status="getJobStateNumber(job)" />
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
    </div>

    <!-- Active Jobs (when tabs are shown, >= 5 jobs) -->
    <div v-else-if="jobActivityTab === 'active'">
      <div v-if="activeJobs.length === 0" class="box has-text-centered p-6">
        <p class="has-text-grey">
          <span v-if="deploymentStatus === 'DRAFT'"
            >Start deployment to create jobs</span
          >
          <span v-else>No active jobs</span>
        </p>
      </div>

      <div v-else class="box is-borderless">
        <div class="table-container">
          <table class="table is-fullwidth mb-0" style="table-layout: fixed">
            <thead>
              <tr>
                <th style="width: 25%">Name</th>
                <th style="width: 10%">Revision</th>
                <th style="width: 12%">Status</th>
                <th style="width: 18%">Created on</th>
                <th style="width: 20%">Navigation</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in activeJobs" :key="job.job">
                <td
                  style="
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 0;
                  "
                >
                  <span class="is-family-monospace is-size-7">{{
                    job.job
                  }}</span>
                </td>
                <td>
                  {{ job.revision || "-" }}
                </td>
                <td>
                  <JobStatus :status="getJobStateNumber(job)" />
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
    </div>

    <!-- Historical Jobs -->
    <div v-if="jobActivityTab === 'history'">
      <div
        v-if="allHistoricalJobs.length === 0"
        class="box has-text-centered p-6"
      >
        <p class="has-text-grey">No completed jobs yet</p>
      </div>

      <div v-else>
        <div class="box is-borderless">
          <div class="table-container">
            <table class="table is-fullwidth mb-0" style="table-layout: fixed">
              <thead>
                <tr>
                  <th style="width: 25%">Name</th>
                  <th style="width: 10%">Revision</th>
                  <th style="width: 12%">Status</th>
                  <th style="width: 15%">Duration</th>
                  <th style="width: 18%">Created on</th>
                  <th style="width: 20%">Navigation</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="job in historicalJobs" :key="job.job">
                  <td
                    style="
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                      max-width: 0;
                    "
                  >
                    <span class="is-family-monospace is-size-7">{{
                      job.job
                    }}</span>
                  </td>
                  <td>
                    {{ job.revision || "-" }}
                  </td>
                  <td>
                    <JobStatus :status="job.state || 0" />
                  </td>
                  <td>
                    <span v-if="getJobDuration(job.job) !== null">
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
        <!-- Pagination for historical jobs -->
        <div v-if="historicalJobsTotalPages > 1" class="mt-4">
          <Pagination
            :modelValue="historicalJobsPage"
            @update:modelValue="$emit('update:historicalJobsPage', $event)"
            :total-page="historicalJobsTotalPages"
            :max-page="historicalJobsTotalPages"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentJobItem } from "@nosana/api";
import { formatDate } from "~/utils/formatDate";
import JobStatus from "~/components/Job/Status.vue";
import SecondsFormatter from "~/components/SecondsFormatter.vue";
import Pagination from "~/components/Pagination.vue";

defineProps<{
  deploymentId: string;
  deploymentStatus: string;
  activeJobs: DeploymentJobItem[];
  allHistoricalJobs: DeploymentJobItem[];
  historicalJobs: DeploymentJobItem[];
  historicalJobsTotalPages: number;
  historicalJobsPage: number;
  totalJobs: number;
  jobActivityTab: string;
  getJobStateNumber: (job: DeploymentJobItem) => number;
  getJobDuration: (jobId: string) => number | null;
}>();

defineEmits<{
  "update:jobActivityTab": [value: string];
  "update:historicalJobsPage": [value: number];
}>();
</script>
