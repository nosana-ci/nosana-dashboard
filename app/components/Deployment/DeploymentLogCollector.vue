<template>
  <div class="log-collector">
    <div
      v-if="!jobs || jobs.length === 0"
      class="notification is-light has-text-centered"
    >
      <p class="has-text-grey">No jobs to show logs for</p>
    </div>

    <template v-else>
      <LogCollectorFilterBar
        :jobs="sortedJobs"
        :selectedJobIds="selectedJobIds"
        :opIds="allOpIds"
        :selectedOpId="selectedOpId"
        :activeTypes="activeTypes"
        :searchText="searchText"
        @toggleJob="toggleJob"
        @selectState="selectState"
        @selectAllJobs="selectAllJobs"
        @update:selectedOpId="selectedOpId = $event"
        @toggleLevel="toggleLevel"
        @showAllLevels="showAllLevels"
        @clearLevels="clearLevels"
        @update:searchText="searchText = $event"
      />

      <LogCollectorViewer
        :entries="filtered"
        :progressBars="allProgressBars"
        :resourceProgressBars="allResourceProgressBars"
        :isConnecting="anyConnecting"
        :showJobBadges="selectedJobIds.size !== 1"
        :jobs="sortedJobs"
        :loadingOlderLogs="loadingOlderLogs"
        :allLogsLoaded="allLogsLoaded"
        @scrolledNearTop="loadOlderLogs"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { JobItem } from "~/composables/jobs/logCollectorTypes";
import { useLogSources } from "~/composables/jobs/useLogSources";
import { useLogFilter } from "~/composables/jobs/useLogFilter";
import LogCollectorFilterBar from "~/components/LogCollector/LogCollectorFilterBar.vue";
import LogCollectorViewer from "~/components/LogCollector/LogCollectorViewer.vue";

const props = defineProps<{
  deploymentId: string;
  jobs: JobItem[];
}>();

const jobsRef = computed(() => props.jobs);
const selectedJobIds = ref<Set<string>>(new Set());

const {
  entries,
  allProgressBars,
  allResourceProgressBars,
  anyConnecting,
  allOpIds,
  sortedJobs,
  loadOlderLogs,
  loadingOlderLogs,
  allLogsLoaded,
} = useLogSources({
  deploymentId: props.deploymentId,
  jobs: jobsRef,
  selectedJobIds,
});

const {
  selectedOpId,
  activeTypes,
  searchText,
  filtered,
  toggleJob,
  selectAllJobs,
  selectState,
  toggleLevel,
  showAllLevels,
  clearLevels,
} = useLogFilter(entries, jobsRef, selectedJobIds);
</script>

<style lang="scss" scoped>
.log-collector {
  margin-top: 0.2rem;
  display: flex;
  flex-direction: column;
  height: 75vh;
}
</style>
