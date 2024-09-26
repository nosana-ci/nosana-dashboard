<template>
  <div>
    <div v-if="loadingMarkets">
      <span class="title">...</span>
    </div>
    <div v-else-if="markets">
      <div>
        <span class="title">{{
          markets.reduce((a, b) => {
            return a + (b.queueType === 1 && b.queue
              ? b.queue.length
              : 0);
          }, 0)
        }} /
        </span>
        <template v-if="loadingRunningJobs">
          <span class="title">...</span>
          <br>
          <span class="subtitle"> nodes available</span>
        </template>

        <template v-else-if="runningJobs">
          <span class="title"> {{
            markets.reduce((a, b) => {
              return a + (b.queueType === 1 && b.queue
                ? b.queue.length
                : 0);
            }, 0) + Object.values(runningJobs).reduce((a: any, b: any) => a + b.running, 0)
          }}</span>
          <br>
          <span class="subtitle"> nodes available</span>
          <div class="is-flex is-justify-content-center doughnut-container">
            <Doughnut class="mt-4" :data="{
              labels: ['Available Nodes', 'Used Nodes'],
              datasets: [
                {
                  data: [markets.reduce((a, b) => {
                    return a + (b.queueType === 1
                      ? b.queue.length
                      : 0);
                  }, 0), Object.values(runningJobs).reduce((a: any, b: any) => a + b.running, 0)],
                  backgroundColor: ['#10E80C', '#d3fdd3'],
                }
              ]
            }" :options="{ responsive: true, plugins: { legend: { display: false } } }" />
          </div>
        </template>
        <span v-else class="title">?<br>
          <span class="subtitle"> nodes available</span>
        </span>
      </div>
    </div>
    <div v-else>-</div>
  </div>
</template>
<script setup lang="ts">
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend)
const { markets, getMarkets, loadingMarkets } = useMarkets();
const { data: runningJobs, pending: loadingRunningJobs } = await useAPI('/api/jobs/running');


if (!markets.value && !loadingMarkets) {
  getMarkets();
}
</script>

<style lang="scss" scoped>
@include touch {
  .doughnut-container {
    max-height: 150px;
  }
}
</style>