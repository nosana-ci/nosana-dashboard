<template>
  <div v-if="jobs && jobs.jobs">
    <ExplorerJobList
      :per-page="limit"
      :total-jobs="jobs.totalJobs"
      v-model:page="page"
      v-model:state="state"
      :loading-jobs="loadingJobs"
      :jobs="jobs.jobs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAPI } from "../../composables/useAPI";

const props = defineProps<{
  nodeId: string;
}>();

const page = ref(1);
const state = ref<number | null>(null);
const limit = ref(10);

const jobStateMapping = {
  0: "QUEUED",
  1: "RUNNING",
  2: "COMPLETED",
  3: "STOPPED",
};

const jobsUrl = computed(() => {
  return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${
    state.value !== null ? `&state=${jobStateMapping[state.value]}` : ""
  }&node=${props.nodeId}`;
});

const { data: jobs, pending: loadingJobs } = useAPI(jobsUrl, {
  watch: [jobsUrl],
});
</script>
