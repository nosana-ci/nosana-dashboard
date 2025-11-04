<template>
  <div>
    <TopBar :title="'Explorer'" :subtitle="'Deployments'"></TopBar>
    <div class="box has-background-white-ter">
      <Search />
    </div>
    <div class="has-text-right mb-2">
      <nuxt-link class="button is-primary is-outlined" to="/deployments/create">
        <span class="icon">
          <JobBuilderIcon />
        </span>
        <span>Create Deployment</span>
      </nuxt-link>
    </div>
    <div class="box">

      <DeploymentList :per-page="limit" :total-jobs="jobs ? jobs.totalJobs : null" v-model:page="page"
        v-model:state="state" :loading-jobs="loadingJobs" :jobs="jobs ? jobs.jobs : null">
      </DeploymentList>
    </div>
    <div v-if="!loadingJobs && !jobs">Could not load jobs</div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import JobBuilderIcon from '@/assets/img/icons/sidebar/job-builder.svg?component';
import DeploymentList from "~/components/List/DeploymentList.vue";
import Search from "~/components/Search.vue";
const page: Ref<number> = ref(1);
const state: Ref<number | null> = ref(null);
const jobStateMapping: any = {
  0: 'QUEUED',
  1: 'RUNNING',
  2: 'COMPLETED',
  3: 'STOPPED',
};
const limit: Ref<number> = ref(17);
const jobsUrl = computed(() => { return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ''}` })
watch(jobsUrl, () => {
  console.log('resetting jobs..')
  jobs.value = null
})
const { data: jobs, pending: loadingJobs, refresh: refreshJobs } = await useAPI(jobsUrl, { watch: [jobsUrl] });

// Fetch jobs every 30 seconds with cleanup
const { pause: pauseJobsPolling, resume: resumeJobsPolling } = useIntervalFn(refreshJobs, 30000);

// Cleanup on unmount
onBeforeUnmount(() => {
  pauseJobsPolling();
});
</script>