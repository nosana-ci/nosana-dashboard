<template>
  <div>
    <ExplorerJobList :per-page="limit" :total-jobs="limit" v-model:page="page" v-model:state="state"
      :loading-jobs="loadingJobs" title="Latest Jobs" :jobs="jobs ? jobs.jobs : null" :small="true">
    </ExplorerJobList>
    <div class="has-text-right mt-auto pt-2">
      <nuxt-link to="/explorer/jobs" class="button is-white">
        <span>All jobs</span>
        <span class="icon"> &#8250; </span>
      </nuxt-link>
    </div>
    <div v-if="!loadingJobs && !jobs">Could not load jobs</div>
  </div>
</template>

<script lang="ts" setup>
const page: Ref<number> = ref(1);
const state: Ref<number | null> = ref(null);
const jobStateMapping: any = {
  0: 'QUEUED',
  1: 'RUNNING',
  2: 'COMPLETED',
  3: 'STOPPED',
};
const limit: Ref<number> = ref(10);
const jobsUrl = computed(() => { return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ''}` })
watch(jobsUrl, () => {
  console.log('resetting jobs..')
  jobs.value = null
})
const { data: jobs, pending: loadingJobs, refresh: refreshJobs } = await useAPI(jobsUrl, { watch: [jobsUrl] });

// Fetch jobs every 30 seconds
useIntervalFn(refreshJobs, 30000);
</script>