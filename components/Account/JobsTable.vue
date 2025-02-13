<template>
  <div>
    <div class="columns is-multiline">
      <div class="column" v-if="hasRanJobs" :class="{ 'is-6': hasRanJobs && hasPostedJobs }">
        <ExplorerJobList :small="hasPostedJobs" :per-page="limit" :total-jobs="nodeJobs ? nodeJobs.totalJobs : null"
          v-model:page="pageJobsRun" v-model:state="state" :loading-jobs="loadingJobs" title="Deployments Ran"
          :jobs="nodeJobs ? nodeJobs.jobs : null">
        </ExplorerJobList>
      </div>
      <div class="column" v-if="hasPostedJobs" :class="{ 'is-6': hasRanJobs && hasPostedJobs }">
        <ExplorerJobList :small="hasRanJobs" :per-page="limit" :total-jobs="postedJobs ? postedJobs.totalJobs : null"
          v-model:page="pageJobsPosted" v-model:state="statePosted" :loading-jobs="loadingPostedJobs"
          title="Deployments Posted" :jobs="postedJobs ? postedJobs.jobs : null">
        </ExplorerJobList>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  nodeId: string;
}>();

const state = ref<number | null>(null);
const pageJobsRun: Ref<number> = ref(1);
const pageJobsPosted: Ref<number> = ref(1);
const statePosted: Ref<number | null> = ref(null);
const jobStateMapping = {
  0: "QUEUED",
  1: "RUNNING",
  2: "COMPLETED",
  3: "STOPPED",
};
const limit: Ref<number> = ref(10);
const nodeJobsUrl = computed(() => { return `/api/jobs?limit=${limit.value}&offset=${(pageJobsRun.value - 1) * limit.value}${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ''}${`&node=${props.nodeId}`}` })
const { data: nodeJobs, pending: loadingJobs, refresh: refreshJobs } = useAPI(nodeJobsUrl, { watch: [nodeJobsUrl] });

const postedJobsUrl = computed(() => { return `/api/jobs?limit=${limit.value}&offset=${(pageJobsPosted.value - 1) * limit.value}${statePosted.value !== null ? `&state=${jobStateMapping[statePosted.value]}` : ''}${`&poster=${props.nodeId}`}` })
const { data: postedJobs, pending: loadingPostedJobs, refresh: refreshPostedJobs } = useAPI(postedJobsUrl, { watch: [postedJobsUrl] });

const hasRanJobs = computed(() => {
  return nodeJobs.value && nodeJobs.value.jobs && nodeJobs.value.jobs.length
})
const hasPostedJobs = computed(() => {
  return postedJobs.value && postedJobs.value.jobs && postedJobs.value.jobs.length
})
</script>
