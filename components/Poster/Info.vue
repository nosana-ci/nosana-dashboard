<template>
  <div>
    <div v-if="!isPoster">
      <div v-if="loadingJobs">
        Checking if account is the model deployer..
      </div>
      <div v-else>
        <!-- Not a deployer-->
      </div>
    </div>
    <div v-else>
      <table class="table is-fullwidth">
        <tbody>
          <tr>
            <td colspan="2" class="has-background-light">
              <h4 class="title is-5">Deployment Info</h4>
            </td>
          </tr>
          <tr>
            <td>Deployments</td>
            <td v-if="loadingJobs">...</td>
            <td v-else-if="jobs">
              <span>{{ jobs.totalJobs }}</span>
            </td>
            <td v-else class="has-text-danger">Could not retrieve deployments</td>
          </tr>
        </tbody>
      </table>

      <ExplorerJobList :per-page="limit" :total-jobs="jobs ? jobs.totalJobs : null" v-model:page="page"
        v-model:state="state" :loading-jobs="loadingJobs" title="Deployments" :jobs="jobs ? jobs.jobs : null" />
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  address: string;
}
const props = defineProps<Props>();

const page: Ref<number> = ref(1);
const state: Ref<number | null> = ref(null);
const jobStateMapping: any = {
  0: 'QUEUED',
  1: 'RUNNING',
  2: 'COMPLETED',
  3: 'STOPPED',
};
const limit: Ref<number> = ref(10);

const jobsUrl: ComputedRef<string> = computed(() => {
  return (
    `/api/jobs?limit=${limit.value}` +
    `&offset=${(page.value - 1) * limit.value}` +
    `${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ''}` +
    `&poster=${props.address}`
  )
});

const { data: jobs, pending: loadingJobs } = useAPI(jobsUrl, { watch: [jobsUrl] });

const hasPostedJobs: ComputedRef<boolean> = computed(() => {
  return !!(jobs.value && jobs.value.jobs && jobs.value.jobs.length)
});

const isPoster: ComputedRef<Boolean> = computed(() => {
  return hasPostedJobs.value
})
</script>
