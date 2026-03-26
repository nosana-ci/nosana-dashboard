<template>
  <div class="box p-3 mb-0">
    <div class="is-flex is-align-items-center mb-2">
      <h3 class="title is-6 mb-0">{{ title }}</h3>
      <div
        v-if="legendHint"
        class="legend-hint is-flex has-text-grey is-size-7 ml-auto"
      >
        <span class="legend-hint-item is-inline-flex is-align-items-center">
          <svg width="20" height="2" class="legend-line">
            <line x1="0" y1="1" x2="20" y2="1" />
          </svg>
          {{ legendHint[0] }}
        </span>
        <span class="legend-hint-item is-inline-flex is-align-items-center">
          <svg width="20" height="2" class="legend-line legend-line--dashed">
            <line x1="0" y1="1" x2="20" y2="1" />
          </svg>
          {{ legendHint[1] }}
        </span>
      </div>
    </div>
    <div class="chart-container is-relative">
      <div
        v-if="loading"
        class="loading-overlay is-flex is-justify-content-center is-align-items-center"
      >
        <i class="fas fa-spinner fa-spin has-text-grey is-size-4"></i>
      </div>
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Line } from "vue-chartjs";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm";
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import type { ChartData, ChartOptions, LegendItem } from "chart.js";
import type { Series } from "~/composables/jobs/types";

ChartJS.register(
  TimeScale,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
);

const COLORS = [
  "#2feb2b",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];
const AXIS_FORMAT = "HH:mm";
const TOOLTIP_FORMAT = "HH:mm:ss";

const colorMode = useColorMode();
const gridColor = computed(() =>
  colorMode.value === "dark"
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)",
);
const tickColor = computed(() =>
  colorMode.value === "dark"
    ? "rgba(255, 255, 255, 0.5)"
    : "rgba(0, 0, 0, 0.5)",
);

const props = withDefaults(
  defineProps<{
    title: string;
    series: Series[];
    loading?: boolean;
    ySuffix?: string;
    suggestedYMax?: number;
    legendHint?: [string, string];
  }>(),
  { ySuffix: "" },
);

// ── Chart.js data & options ──
const chartData = computed<ChartData<"line">>(() => {
  const groups = [...new Set(props.series.map((s) => s.group))];
  return {
    datasets: props.series.map((s) => {
      const color = COLORS[groups.indexOf(s.group) % COLORS.length]!;
      return {
        label: s.label,
        data: s.points,
        borderColor: color,
        backgroundColor: color + "30",
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: s.dashed ? [5, 5] : [],
      };
    }),
  };
});

const chartOptions = computed<ChartOptions<"line">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 0 },
  interaction: { intersect: false, mode: "index" },
  plugins: {
    legend: {
      display: true,
      position: "bottom",
      labels: {
        boxWidth: 6,
        boxHeight: 6,
        padding: 8,
        usePointStyle: true,
        pointStyle: "circle",
        color: tickColor.value,
        filter: (item: LegendItem) => {
          const ds = chartData.value.datasets[item.datasetIndex ?? 0];
          return !ds?.borderDash?.length;
        },
      },
    },
    tooltip: { intersect: false, mode: "index" },
  },
  scales: {
    x: {
      type: "time",
      time: {
        tooltipFormat: TOOLTIP_FORMAT,
        displayFormats: { minute: AXIS_FORMAT, hour: AXIS_FORMAT },
      },
      ticks: {
        maxTicksLimit: 6,
        autoSkip: true,
        maxRotation: 0,
        color: tickColor.value,
      },
      grid: { color: gridColor.value },
      border: { color: gridColor.value },
    },
    y: {
      beginAtZero: true,
      suggestedMax: props.suggestedYMax,
      ticks: {
        callback: (v: string | number) => `${v}${props.ySuffix}`,
        color: tickColor.value,
      },
      grid: { color: gridColor.value },
      border: { color: gridColor.value },
    },
  },
}));
</script>

<style lang="scss" scoped>
.chart-container {
  height: 300px;
}
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(255, 255, 255, 0.6);

  .dark-mode & {
    background: rgba(0, 0, 0, 0.4);
  }
}
.legend-hint {
  gap: 1rem;
}
.legend-hint-item {
  gap: 0.25rem;
}
.legend-line line {
  stroke: currentColor;
  stroke-width: 2;
}
.legend-line--dashed line {
  stroke-dasharray: 4 3;
}
</style>
