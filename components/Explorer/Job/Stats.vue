<template>
  <div class="box is-flex is-flex-direction-column">
    <h2 class="title is-5">Statistics</h2>
    <div class="columns">
      <div class="column is-one-fifth">
        <h2 class="subtitle">Completed jobs</h2>
        <h2 class="title is-1 pt-2">
          <span v-if="loadingStats">...</span>
          <CustomCountUp v-else :end-val="stats.completed"></CustomCountUp>
        </h2>
      </div>
      <div class="column is-one-fifth">
        <h2 class="subtitle">Running jobs</h2>
        <h2 class="title is-1 pt-2">
          <span v-if="loadingRunningJobs">...</span>
          <CustomCountUp v-else :end-val="runningJobs.totalJobs"></CustomCountUp>
        </h2>
      </div>
      <div class="column is-one-fifth">
        <h2 class="subtitle">Queued jobs</h2>
        <h2 class="title is-1 pt-2">
          <span v-if="loadingQueuedJobs">...</span>
          <CustomCountUp v-else :end-val="queuedJobs.totalJobs"></CustomCountUp>
        </h2>
      </div>
      <div class="column is-one-fifth">
        <h2 class="subtitle">Total inference hours</h2>
        <h2 class="title is-1 pt-2">
          <span v-if="loadingStats">...</span>
          <CustomCountUp v-else :end-val="Math.round(stats.duration / 3600)"></CustomCountUp>
        </h2>
      </div>
      <div class="column is-one-fifth">
        <h2 class="subtitle">Online GPU Hosts</h2>
        <h2 class="title is-1 pt-2">
          <span v-if="loadingMarkets || loadingRunningJobs">...</span>
          <CustomCountUp v-else-if="markets"
            :end-val="markets.reduce((a, b) => a + (b.queueType === 1 ? b.queue.length : 0), 0) + runningJobs.totalJobs">
          </CustomCountUp>
        </h2>
      </div>
    </div>
    <div v-if="!stats && !loadingStats">Could not retrieve stats</div>
  </div>
</template>

<script lang="ts" setup>
const { data: stats, pending: loadingStats } = useAPI('/api/jobs/stats');
const { data: runningJobs, pending: loadingRunningJobs } = await useAPI('api/jobs?limit=1&offset=0&state=RUNNING');
const { data: queuedJobs, pending: loadingQueuedJobs } = await useAPI('api/jobs?limit=1&offset=0&state=QUEUED');
const { markets, loadingMarkets } = useMarkets();
</script>