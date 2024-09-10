<template>
  <div>
    <div style="height: 400px">
      <Bar :options="barOptions" :data="queueData" style="width: 100%" />
    </div>
    <table class="table is-fullwidth is-striped">
      <tbody>
        <tr>
          <td><b>Test Grid Job Queue</b></td>
          <td>
            <span v-if="markets">
              {{
        markets
          .filter((m) =>
            testgridMarkets.find((tgm: any) =>
              tgm.address === m.address.toString()
            ),
          )
          .reduce(
            (a, b) => a + (b.queueType === 0 ? b.queue.length : 0),
            0,
          )
      }}
              jobs
            </span>
            <span v-else-if="loadingMarkets || loadingTestgridMarkets">...</span>
            <span v-else>-</span>
          </td>
        </tr>
        <tr>
          <td><b>Testgrid Node Queue</b></td>
          <td>
            <span v-if="markets">
              {{
        markets
          .filter((m) =>
            testgridMarkets.find((tgm: any) =>
              tgm.address === m.address.toString()
            )
          )
          .reduce(
            (a, b) => a + (b.queueType === 1 ? b.queue.length : 0),
            0,
          )
      }}
              nodes
            </span>
            <span v-else-if="loadingMarkets || loadingTestgridMarkets">...</span>
            <span v-else>-</span>
          </td>
        </tr>
        <tr>
          <td><b>Testgrid Jobs Running</b></td>
          <td>
            <span v-if="jobs">
              {{ jobs.totalJobs }}
              jobs
            </span>
            <span v-else-if="loadingJobs">...</span>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="!loadingMarkets && !markets">Could not load markets from blockchain</div>
    <div v-if="!loadingTestgridMarkets && (!testgridMarkets || !testgridMarkets.length)">Could not load markets from testgrid</div>
  </div>
</template>

<script lang="ts" setup>
import { Bar } from 'vue-chartjs';
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
import {
  Chart as Chartjs,
  type ChartData,
  type ChartOptions,
  Tooltip,
  BarController,
  Legend,
  BarElement,
} from 'chart.js';

Chartjs.register(BarController, BarElement, Tooltip, Legend);

const { markets, loadingMarkets, getMarkets } = useMarkets();

const { data: testgridMarkets, pending: loadingTestgridMarkets } = await useAPI('/api/markets', { default: () => [] });
const { data: jobs, pending: loadingJobs } = await useAPI('api/jobs?limit=1&offset=0&state=RUNNING');


// @ts-ignore
const queueData = computed<ChartData<'bar'>>(() => {
  const data: Array<any> = markets.value && testgridMarkets.value
    ? markets.value
      .filter((m) => m.queue.length)
      .filter((m) =>
        testgridMarkets.value.find((tgm: any) =>
          tgm.address === m.address.toString()
        ),
      )
    : [];
  return {
    labels: data.map(
      (m) =>
        testgridMarkets.value.find((tgm: any) => tgm.address === m.address.toString())
          .slug,
    ),
    datasets: [
      {
        label: 'Nodes',
        borderWidth: 3,
        borderColor: '#2feb2b',
        backgroundColor: '#2feb2b45',
        data: data.map((m: any) => (m.queueType === 1 ? m.queue.length : 0)),
      },
      {
        label: 'Jobs',
        borderWidth: 3,
        borderColor: '#f9d54b',
        backgroundColor: '#f9d54b45',
        data: data.map((m: { queueType: number; queue: string | any[]; }) => (m.queueType === 0 ? -m.queue.length : 0)),
      },
    ],
  };
});

// @ts-ignore
const barOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  // barThickness: 20,
  interaction: {
    intersect: false,
  },
  indexAxis: 'y',
  plugins: {
    legend: {
      position: 'bottom',
      onClick: () => { },
    },
    tooltip: {
      callbacks: {
        label: (tooltipItem) =>
          `${tooltipItem.dataset.label}: ${Math.abs(
            tooltipItem.formattedValue,
          )}`,
      },
    },
    crosshair: false,
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        lineWidth: (v) => {
          return v.tick?.value === 0 ? 1 : 0;
        },
        color: '#000000',
      },
      ticks: {
        precision: 0,
        callback: function (value) {
          return Math.abs(value);
        },
      },
    },
    y: {
      stacked: true,
      border: {
        dash: [2, 4],
      },
      ticks: {
        precision: 0,
      },
      grid: {
        tickBorderDash: [2, 4],
      },
    },
  },
}));
getMarkets();
// Fetch markets every 30 seconds
useIntervalFn(getMarkets, 30000);
</script>
