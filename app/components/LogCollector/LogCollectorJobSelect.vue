<template>
  <div class="job-select-header job-filters">
    <button
      class="filter-pill"
      :class="{ active: selectedJobIds.size === 0 }"
      @click="onSelectAll"
    >
      All
    </button>
    <button
      v-if="jobsByState.running.length"
      class="filter-pill"
      :class="{ active: isStateSelected(JobState.RUNNING) }"
      @click="$emit('selectState', JobState.RUNNING)"
    >
      Running
    </button>
    <button
      v-if="jobsByState.completed.length"
      class="filter-pill"
      :class="{ active: isStateSelected(JobState.COMPLETED) }"
      @click="$emit('selectState', JobState.COMPLETED)"
    >
      Completed
    </button>
    <button
      v-if="jobsByState.stopped.length"
      class="filter-pill"
      :class="{ active: isStateSelected(JobState.STOPPED) }"
      @click="$emit('selectState', JobState.STOPPED)"
    >
      Stopped
    </button>
  </div>
  <div
    v-for="(job, index) in jobs"
    :key="job.job"
    class="job-card"
    :class="{ selected: selectedJobIds.has(job.job) }"
    @click="$emit('toggle', job.job)"
  >
    <div class="job-card-top">
      <span
        class="job-color-bar"
        :style="{ backgroundColor: jobColor(index) }"
      ></span>
      <span class="job-card-id">{{ job.job.slice(0, 12) }}</span>
      <span class="job-status-badge" :class="stateClass(job)">
        {{ stateLabel(job) }}
      </span>
    </div>
    <div class="job-card-details">
      <div v-if="job.revision" class="job-detail">
        <span class="job-detail-label">Revision</span>
        <span class="job-detail-value">#{{ job.revision }}</span>
      </div>
      <div class="job-detail">
        <span class="job-detail-label">Started</span>
        <span class="job-detail-value">{{ formatJobStart(job) }}</span>
      </div>
      <div v-if="getJobDuration(job) !== null" class="job-detail">
        <span class="job-detail-label">Duration</span>
        <span class="job-detail-value">
          <SecondsFormatter
            :seconds="getJobDuration(job)!"
            :showSeconds="true"
          />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { JobState } from "@nosana/kit";
import type { JobItem } from "~/composables/jobs/logCollectorTypes";
import { getStatusText } from "~/composables/useStatus";
import {
  resolveJobState,
  jobColor,
  computeJobDuration,
  formatEpochSeconds,
  formatIsoString,
} from "~/composables/jobs/logCollectorUtils";

const props = defineProps<{
  jobs: JobItem[];
  selectedJobIds: Set<string>;
}>();

const emit = defineEmits<{
  toggle: [jobId: string];
  selectState: [state: JobState];
  selectAll: [];
}>();

const closeDropdown = inject<() => void>('dropdown-close', () => {});
const nowTs = useTimestamp({ interval: 1000 });

function onSelectAll() {
  emit('selectAll');
  closeDropdown();
}

function stateLabel(job: JobItem): string {
  return getStatusText(resolveJobState(job.state));
}

function stateClass(job: JobItem): string {
  const state = resolveJobState(job.state);
  if (state === JobState.RUNNING) return "dot-running";
  if (state >= JobState.COMPLETED) return "dot-completed";
  return "dot-queued";
}

function getJobDuration(job: JobItem): number | null {
  return computeJobDuration(job, nowTs.value);
}

function formatJobStart(job: JobItem): string {
  if (job.time_start) return formatEpochSeconds(job.time_start);
  if (job.created_at) return formatIsoString(job.created_at);
  return "-";
}

const jobsByState = computed(() => {
  const running: string[] = [];
  const completed: string[] = [];
  const stopped: string[] = [];
  for (const job of props.jobs) {
    const state = resolveJobState(job.state);
    if (state === JobState.RUNNING) running.push(job.job);
    else if (state === JobState.COMPLETED) completed.push(job.job);
    else if (state === JobState.STOPPED) stopped.push(job.job);
  }
  return { running, completed, stopped };
});

function isStateSelected(state: JobState): boolean {
  if (props.selectedJobIds.size === 0) return false;
  const ids =
    state === JobState.RUNNING
      ? jobsByState.value.running
      : state === JobState.COMPLETED
        ? jobsByState.value.completed
        : jobsByState.value.stopped;
  return (
    ids.length > 0 &&
    ids.every((id) => props.selectedJobIds.has(id)) &&
    props.selectedJobIds.size === ids.length
  );
}

</script>

<style lang="scss" scoped>
.job-select-header {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $text-light;
  border-bottom: 1px solid $border;
  display: flex;
  gap: 0.3rem;
  position: sticky;
  top: 0;
  background: $scheme-main;
  z-index: 1;
}

.filter-pill {
  background: transparent;
  border: 1px solid $border;
  border-radius: 4px;
  padding: 0.2rem 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  color: $text-light;
  transition: all 0.15s;

  &:hover {
    border-color: $link;
    color: $link;
  }
  &.active {
    background: rgba($link, 0.12);
    border-color: $link;
    color: $link;
  }
}

.job-card {
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid rgba($border, 0.4);
  transition: background 0.1s;

  &:hover {
    background: rgba($link, 0.06);
  }
  &.selected {
    background: rgba($link, 0.1);
    border-left: 3px solid $link;
    padding-left: calc(0.7rem - 3px);
  }
  &:not(.selected) {
    opacity: 0.6;
  }
}

.job-card-top {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
}

.job-color-bar {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.job-card-id {
  font-family: "JetBrains Mono", monospace;
  font-size: 1rem;
  font-weight: 600;
  flex: 1;
}

.job-status-badge {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;

  &.dot-running {
    color: $success;
    background: rgba($success, 0.12);
  }
  &.dot-completed {
    color: $grey;
    background: rgba($grey, 0.1);
  }
  &.dot-queued {
    color: $warning;
    background: rgba($warning, 0.12);
  }
}

.job-card-details {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding-left: calc(10px + 0.4rem);
}

.job-detail {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.job-detail-label {
  font-size: 0.85rem;
  color: $text-light;
  flex-shrink: 0;
}
.job-detail-value {
  font-size: 0.85rem;
  font-family: "JetBrains Mono", monospace;
  color: $text;
  text-align: right;
}

html.dark-mode {
  .job-select-header {
    background: $black-ter;
    border-bottom-color: $grey-darker;
  }
  .filter-pill {
    border-color: $grey-darker;
    color: $grey-light;
  }
  .job-card {
    border-bottom-color: rgba($grey-darker, 0.5);
  }
  .job-card:hover {
    background: rgba($white, 0.04);
  }
  .job-card.selected {
    background: rgba($link, 0.12);
  }
  .job-card-id {
    color: $white-ter;
  }
  .job-detail-value {
    color: $grey-light;
  }
}
</style>
