<template>
  <div class="box">
    <div v-if="nodeId">
      <h2 class="title is-4 mb-4">Node Information</h2>

      <table class="table is-fullwidth mt-5 mb-6">
        <tbody>
          <NodeInfoTable :node-id="params.id" />
          <tr>
            <td colspan="2">
              <div class="charts-container">
                <div class="chart-section">
                  <NodeBenchmarkHistogram
                    title="LLM Performance"
                    type="llm"
                    :node-id="nodeId"
                    :market-id="marketId"
                    default-metric="averageTokensPerSecond"
                    :metrics="[
                      {
                        value: 'averageTokensPerSecond',
                        label: 'Tokens / Second',
                      },
                      { value: 'avgClockSpeed', label: 'Clock Speed (MHz)' },
                      { value: 'avgWattage', label: 'Power Usage (W)' },
                      { value: 'avgTemperature', label: 'Temperature (°C)' },
                    ]"
                    x-axis-label="Concurrent Users"
                  />
                </div>

                <div class="chart-section">
                  <NodeBenchmarkHistogram
                    title="Image Generation Performance"
                    type="image-gen"
                    :node-id="nodeId"
                    :market-id="marketId"
                    default-metric="imagesPerSecond"
                    :metrics="[
                      { value: 'imagesPerSecond', label: 'Images / Second' },
                      { value: 'avgClockSpeed', label: 'Clock Speed (MHz)' },
                      { value: 'avgWattage', label: 'Power Usage (W)' },
                      { value: 'avgTemperature', label: 'Temperature (°C)' },
                    ]"
                    x-axis-label="Batch Size"
                  />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <NodeJobsTable :node-id="nodeId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from "chart.js";
const { markets, getMarkets, loadingMarkets } = useMarkets();

if (!markets.value) {
  getMarkets();
}

Chart.register(...registerables);

const { params } = useRoute();

// For testing
const nodeId = "C49tmP2PeNLmP2sKe6WiXWMTVbeb9KbqaA1azCwBjfyK";
const marketId = "Crop49jpc7prcgAcS82WbWyGHwbN5GgDym3uFbxxCTZg";

// const nodeId = computed(() => params.id);

// TODO:get market info out of info table component and use it as argument for both the histograms and info table

// const nodesInMarkets = markets?.value?.flatMap((market) => {
//     return market.queueType === 1
//       ? market.queue.map((data: any) => data.toString())
//       : [];
//   });

//   if (nodesInMarkets?.includes(address.value)) {
//     nodeStatus.value = "QUEUED";
//     nodeMarket.value = markets?.value?.filter((m) =>
//       m.queue.find((a: any) => a.toString() === address.value?.toString())
//     );
//   }
</script>
<style lang="scss" scoped>
.charts-container {
  display: flex;
  gap: 2rem;
  margin: 1rem 0;
}

.chart-section {
  flex: 1;
  min-width: 0;
}
</style>
