<template>
  <div class="log-collector">
    <div
      v-if="!jobs || jobs.length === 0"
      class="notification is-light has-text-centered"
    >
      <p class="has-text-grey">No jobs to show logs for</p>
    </div>

    <!-- Same window as the web terminal: a filter strip over a dark surface -->
    <div v-else class="log-frame">
      <div class="log-frame-bar">
        <LogCollectorFilterBar
          :jobs="sortedJobs"
          :selectedJobIds="selectedJobIds"
          :show-jobs="!hideJobSelect"
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
      </div>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { JobItem } from "~/composables/jobs/logCollectorTypes";
import { useLogSources } from "~/composables/jobs/useLogSources";
import { useLogFilter } from "~/composables/jobs/useLogFilter";
import LogCollectorFilterBar from "~/components/LogCollector/LogCollectorFilterBar.vue";
import LogCollectorViewer from "~/components/LogCollector/LogCollectorViewer.vue";

const props = defineProps<{
  deploymentId: string;
  jobs: JobItem[];
  market?: string;
  /** Jobs the view opens filtered to, e.g. from a job row's Logs button. */
  jobFilter?: string[];
  /** Hide the job picker when the view is scoped to one job. */
  hideJobSelect?: boolean;
}>();

const jobsRef = computed(() => props.jobs);
const selectedJobIds = ref<Set<string>>(new Set(props.jobFilter ?? []));

watch(
  () => props.jobFilter,
  (ids) => {
    selectedJobIds.value = new Set(ids ?? []);
  },
);

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
  market: computed(() => props.market),
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

// Always dark, on the same surface as the terminal and the JSON editor so the
// panel's code surfaces read as one family.
.log-frame {
  @include code-surface-frame;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

// The filter strip: the selectors dress as the panel's quiet buttons and
// the search as one of its dark inputs, spaced apart instead of joined.
.log-frame-bar {
  @include code-surface-bar;
  padding: 0.55rem 0.75rem;

  :deep(.filter-bar) {
    padding: 0;
  }

  :deep(.search-combo) {
    gap: 0.45rem;
    align-items: center;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;

    &.focused {
      border-color: transparent;
      box-shadow: none;
    }
  }

  :deep(.combo-sep) {
    display: none;
  }

  :deep(.dropdown-btn) {
    gap: 0.35rem;
    padding: 0.3rem 0.55rem 0.3rem 0.7rem;
    border: 1px solid rgba($white, 0.14);
    border-radius: 8px;
    background: rgba($white, 0.06);
    color: $white;
    font-size: 0.8rem;
    font-weight: 500;
    line-height: 1.3;
    transition: background 0.15s ease, border-color 0.15s ease;

    .icon {
      color: #8a948a;
      font-size: 0.75rem;
    }

    &:hover {
      background: rgba($white, 0.12);
    }
  }

  :deep(.search-input) {
    padding: 0.3rem 1.8rem 0.3rem 0.7rem;
    border: 1px solid rgba($white, 0.12);
    border-radius: 8px;
    background: rgba($white, 0.05);
    color: #e6ede6;
    font-size: 0.8rem;
    line-height: 1.3;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &::placeholder {
      color: #8a948a;
      opacity: 1;
    }

    &:focus {
      border-color: $secondary;
      box-shadow: 0 0 0 3px rgba($secondary, 0.18);
    }
  }

  :deep(.clear-search) {
    color: #8a948a;

    &:hover {
      color: $white;
    }
  }
}
</style>
