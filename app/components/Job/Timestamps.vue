<template>
  <div>
    <div class="columns">
      <div class="column is-12">
        <div class="box">
          <div class="is-flex is-align-items-center">
            <h2 class="title is-5 mb-0">
              Jobs
              <span class="has-text-weight-bold ml-2">
                <count-up v-if="timestamps"
                  :end-val="totalDeployments"></count-up>
                <span v-else-if="loadingTimestamps">...</span>
                <span v-else>-</span>
              </span>
              <small class="ml-2">
                <span v-if="time == 1 * 3600">(last hour)</span>
                <span v-else-if="time == 24 * 3600">(last day)</span>
                <span v-else-if="time == 7 * 24 * 3600">(last week)</span>
                <span v-else-if="time == 365 / 12 * 24 * 3600">(last month)</span>
                <span v-else-if="time == 365 / 4 * 24 * 3600">(last quarter)</span>
                <span v-else-if="time == 365 * 24 * 3600">(last year)</span>
              </small>
            </h2>

            <div class="select is-small ml-auto">
              <select v-model="time">
                <option :value="1 * 3600">1h</option>
                <option :value="24 * 3600">24h</option>
                <option :value="7 * 24 * 3600">7d</option>
                <option :value="365 / 12 * 24 * 3600">1M</option>
                <option :value="365 / 4 * 24 * 3600">3M</option>
                <option :value="365 * 24 * 3600">1Y</option>
                <option :value="0">All</option>
              </select>
            </div>
          </div>

          <div style="height: 200px; position: relative;">
            <Line :options="lineOptions" :data="chartData" style="width: 100%" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CountUp from 'vue-countup-v3';
import { Line } from 'vue-chartjs';
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';

import {
  Chart as Chartjs,
  type ChartData,
  type ChartOptions,
  TimeScale,
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  BarController,
  BarElement,
  Interaction,
} from 'chart.js';
// import { CrosshairPlugin, Interpolate } from 'chartjs-plugin-crosshair';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

// declare module 'chart.js' {
//   interface InteractionModeMap {
//     interpolate: Interpolate;
//   }
// }

const time: Ref<number | string> = ref(365 / 12 * 24 * 3600); // 1 month

const timestampsUrl = computed(() => { return `/api/jobs/stats/timestamps?period=${time.value}` })
watch(timestampsUrl, () => {
  timestamps.value = null
})

const { data: timestamps, pending: loadingTimestamps } = await useAPI(timestampsUrl, { watch: [timestampsUrl] });
// Interaction.modes.interpolate = Interpolate;

// Calculate total deployments from original data
const totalDeployments = computed(() => {
  const data: Array<{ x: any, y: number }> = timestamps.value && timestamps.value.data ? timestamps.value.data : [];
  if (!data || data.length === 0) {
    return 0;
  }
  // Ensure 'y' exists and is a number before summing
  return data.reduce((sum, point) => sum + (point && typeof point.y === 'number' ? point.y : 0), 0);
});

Chartjs.register(
  TimeScale,
  LineElement,
  LineController,
  CategoryScale,
  BarController,
  LinearScale,
  PointElement,
  BarElement,
  Filler,
  Tooltip,
  // CrosshairPlugin,
);


const tooltipFormat = ref('[Week] W MMM YYYY');
const unit: Ref<false | "millisecond" | "second" | "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year" | undefined> = ref('day');

const chartData = computed<ChartData<'line'>>(() => {
  const originalData: Array<any> = timestamps.value && timestamps.value.data ? [...timestamps.value.data] : [];
  const timeValue = parseInt(time.value as string);

  let chartDisplayData = originalData;
  // Remove first and last points for display if data exists and has more than 2 points
  if (originalData.length > 2) {
    chartDisplayData = originalData.slice(1, -1); // Use slice to create a new array for the chart
  }

  if (timeValue > 365 / 3 * 24 * 3600) {
    // Bigger than 4 month, group by week
    tooltipFormat.value = '[Week] W - MMMM YYYY';
    unit.value = 'month';
  } else if (timeValue > 5 * 24 * 3600) {
    // Bigger than 5 days, group by day
    tooltipFormat.value = 'DD MMMM YYYY';
    unit.value = 'day';
  } else if (timeValue > 12 * 3600) {
    // Bigger than 12 hours, group by hour
    tooltipFormat.value = 'HH[h] - DD MMMM YYYY';
    unit.value = 'hour';
  } else if (timeValue > 0) {
    // under 12 hours
    tooltipFormat.value = 'HH:mm - DD MMMM YYYY';
    unit.value = 'minute';
  }
  else {
    // All: Group by month
    tooltipFormat.value = 'MMMM YYYY';
    unit.value = 'month';
  }
  return {
    datasets: [
      {
        fill: true,
        cubicInterpolationMode: 'monotone',
        label: 'Jobs',
        borderColor: '#2feb2b',
        showLine: true,
        backgroundColor: '#2feb2b45',
        data: chartDisplayData,
        interpolate: true,
        // pointRadius: 2,
      },
    ],
  };
});

const lineOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      intersect: false,
      mode: 'index',
    },
    crosshair: {
      sync: {
        enable: false,
      },
      line: {
        color: '#2feb2b', // crosshair line color
      },
      zoom: {
        enabled: true, // enable zooming
        zoomButtonText: 'Reset Zoom', // reset zoom button text
        zoomButtonClass: 'button is-small is-outlined reset-zoom', // reset zoom button class
      },
    },
  },
  scales: {
    x: {
      type: 'time',

      grid: {
        tickBorderDash: [2, 4],
      },
      border: {
        dash: [2, 4],
      },
      time: {
        unit: unit.value,
        // round: 'day',
        tooltipFormat: tooltipFormat.value,
      },
    },
    y: {
      beginAtZero: true,
      border: {
        dash: [2, 4],
      },
      grid: {
        tickBorderDash: [2, 4],
      },
    },
  },
}));
</script>

<style lang="scss" scoped>
.countup-wrap {
  display: inline;
}
</style>
<style lang="scss">
.reset-zoom {
  position: absolute;
  top: 20px;
  right: 20px;
}
</style>
