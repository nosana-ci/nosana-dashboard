<template>
  <div>
    <div class="is-flex is-justify-content-space-between mb-5">
      <div>
        <h2 class="title">Explorer</h2>
        <h3 class="subtitle mb-2 is-capitalized">{{ config.public.network }}</h3>
      </div>
      <ClientOnly>
        <wallet-multi-button :dark="$colorMode.value === 'dark'"></wallet-multi-button>
      </ClientOnly>
    </div>
    <ExplorerSearch />
    <div class="box is-flex is-flex-direction-column">
      <h2 class="title is-5">Statistics</h2>
    </div>
    <ExplorerGraphs />
    <div class="columns mt-4 is-multiline">
      <div class="column is-6">
        <div class="box is-flex is-flex-direction-column">
          <ExplorerJobList :per-page="limit" :total-jobs="limit" v-model:page="page" v-model:state="state" :loading-jobs="loadingJobs" title="Latest Inferences" :jobs="jobs ? jobs.jobs : null" :small="true">
          </ExplorerJobList>
          <div class="has-text-right mt-auto pt-2">
            <nuxt-link to="/jobs" class="button is-white">
              <span>All jobs</span>
              <span class="icon"> &#8250; </span>
            </nuxt-link>
          </div>
        </div>
      </div>
      <div class="column is-6">
        <div class="box is-flex is-flex-direction-column">
          <h2 class="title is-5">Test Grid Markets</h2>
          <ExplorerMarketQueues></ExplorerMarketQueues>
          <div class="has-text-right mt-auto pt-2">
            <nuxt-link to="/markets" class="button is-white">
              <span>All markets</span>
              <span class="icon"> &#8250; </span>
            </nuxt-link>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!loadingJobs && !jobs">Could not load jobs</div>
  </div>
</template>

<script lang="ts" setup>
import { WalletMultiButton } from "solana-wallets-vue";
const config = useRuntimeConfig();
const page: Ref<number> = ref(1);
const state: Ref<number | null> = ref(null);
const jobStateMapping: any = {
  0: 'QUEUED',
  1: 'RUNNING',
  2: 'COMPLETED',
  3: 'STOPPED',
};
const limit: Ref<number> = ref(5);
const jobsUrl = computed(() => { return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${state.value !== null ? `&state=${jobStateMapping[state.value]}` : '' }` })
watch(jobsUrl, () => { 
  console.log('resetting jobs..')
  jobs.value = null
})
const { data: jobs, pending: loadingJobs } = await useAPI(jobsUrl, {watch: [jobsUrl]});

</script>