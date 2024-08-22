<template>
  <div class="box is-flex is-flex-direction-column">
    <h2 class="title is-5">Statistics</h2>
    <div class="columns">
      <div class="column is-one-fifth">
        <h2 class="subtitle">Completed jobs</h2>
        <h2 class="title is-1 pt-2">
          <span v-if="loadingStats">...</span>
          <span v-else>{{ stats.completed }}</span>
        </h2>
      </div>
      <div class="column is-one-fifth">
        <h2 class="subtitle">Running jobs</h2>
        <h2 class="title is-1 pt-2">
          <span v-if="loadingJobs">...</span>
          <span v-else>{{ runningJobs.totalJobs }}</span>
        </h2>
      </div>
      <div class="column is-one-fifth">
        <h2 class="subtitle">Total NOS earned</h2>
        <h2 class="title is-1 pt-2">
          <span v-if="loadingStats">...</span>
          <span v-else>{{ Math.round(stats.price) }}</span>
        </h2>
      </div>
      <div class="column is-one-fifth">
        <h2 class="subtitle">Total inference hours</h2>
        <h2 class="title is-1 pt-2">
          <span v-if="loadingStats">...</span>
          <span v-else>{{ Math.round(stats.duration / 3600) }}</span>
        </h2>
      </div>
      <div class="column is-one-fifth">
        <h2 class="subtitle">Online GPU Nodes</h2>
        <h2 class="title is-1 pt-2">
          <span v-if="loadingMarkets || loadingJobs">...</span>
          <span v-else-if="markets">
            {{
            markets
              .reduce(
                (a, b) => a + (b.queueType === 1 ? b.queue.length : 0),
                0,
              ) + runningJobs.totalJobs
            }}
          </span>
        </h2>
      </div>
    </div>
    <div v-if="!stats && !loadingStats">Could not retrieve stats</div>
  </div>
</template>

<script lang="ts" setup>
const { data: stats, pending: loadingStats } = useAPI('/api/jobs/stats');
const { data: runningJobs, pending: loadingJobs } = await useAPI('api/jobs?limit=1&offset=0&state=RUNNING');
const { markets, loadingMarkets } = useMarkets();
</script>