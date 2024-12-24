<template>
  <div class="box">
    <h3 class="title is-5 mb-4">{{ title }}</h3>
    <div class="filters mb-4">
      <div class="field">
        <label class="label">Model</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="selectedModel">
              <option
                v-for="model in filters?.models"
                :key="model"
                :value="model"
              >
                {{ model }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">Framework</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="selectedFramework">
              <option
                v-for="framework in filters?.frameworks"
                :key="framework"
                :value="framework"
              >
                {{ framework }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">Metric</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="selectedMetric">
              <option
                v-for="metric in metricOptions"
                :key="metric.value"
                :value="metric.value"
              >
                {{ metric.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-wrapper">
      <div v-if="!benchmarkData?.data">Loading benchmark data...</div>
      <Bar v-else :data="chartData" :options="chartOptions" :height="300" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from "vue";
import { Bar } from "vue-chartjs";
import { useBenchmark } from "@/composables/useBenchmarkData";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    validator: (value: string) => ["llm", "image-gen"].includes(value),
  },
  nodeId: {
    type: String,
    required: true,
  },
  marketId: {
    type: String,
    required: true,
  },
  defaultMetric: {
    type: String,
    required: true,
  },
  metrics: {
    type: Array as () => Array<{ value: string; label: string }>,
    required: true,
  },
  xAxisLabel: {
    type: String,
    required: true,
  },
});

const {
  selectedFramework,
  selectedModel,
  filters,
  benchmarkData,
  marketBenchmarkData,
} = useBenchmark({
  type: props.type,
  nodeId: props.nodeId,
  marketId: props.marketId,
});

const selectedMetric = ref(props.defaultMetric);

const metricOptions = computed(() => {
  if (!benchmarkData.value?.data || benchmarkData.value.data.length === 0) {
    return [];
  }

  const sampleMetrics = benchmarkData.value.data[0]?.metrics || {};
  return props.metrics.filter(
    (metric) =>
      sampleMetrics[metric.value] !== undefined &&
      sampleMetrics[metric.value] !== null
  );
});

// Watch metric options and update selected metric if current selection becomes invalid
watch(metricOptions, (newOptions) => {
  if (
    newOptions.length > 0 &&
    !newOptions.find((opt) => opt.value === selectedMetric.value)
  ) {
    selectedMetric.value = newOptions[0].value;
  }
});

const chartData = computed(() => {
  const sortKey = props.type === "llm" ? "cuCount" : "batchSize";

  if (!benchmarkData.value?.data) {
    return { labels: [], datasets: [] };
  }

  const sortedNodeData = [...benchmarkData.value.data].sort(
    (a, b) => (a[sortKey] || 0) - (b[sortKey] || 0)
  );

  const sortedMarketData = marketBenchmarkData.value?.data
    ? [...marketBenchmarkData.value.data].sort(
        (a, b) => (a[sortKey] || 0) - (b[sortKey] || 0)
      )
    : [];

  const allValues = [
    ...new Set([
      ...sortedNodeData.map((item) => item[sortKey]),
      ...sortedMarketData.map((item) => item[sortKey]),
    ]),
  ].sort((a, b) => (a || 0) - (b || 0));

  return {
    labels: allValues.map((value) => value?.toString() || ""),
    datasets: [
      {
        label: "Node Performance",
        data: allValues.map((value) => {
          const dataPoint = sortedNodeData.find(
            (item) => item[sortKey] === value
          );
          return dataPoint ? dataPoint.metrics[selectedMetric.value] : null;
        }),
        backgroundColor: "#0066ff",
        borderWidth: 1,
      },
      ...(sortedMarketData.length > 0
        ? [
            {
              label: "Market Average",
              data: allValues.map((value) => {
                const dataPoint = sortedMarketData.find(
                  (item) => item[sortKey] === value
                );
                return dataPoint
                  ? dataPoint.metrics[selectedMetric.value]
                  : null;
              }),
              backgroundColor: "#10E80C",
              borderWidth: 1,
            },
          ]
        : []),
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: {
        display: true,
        text: props.xAxisLabel,
      },
    },
    y: {
      title: {
        display: true,
        text:
          metricOptions.value.find((m) => m.value === selectedMetric.value)
            ?.label || "",
      },
      beginAtZero: true,
    },
  },
}));

watch(
  filters,
  (newFilters) => {
    if (newFilters) {
      selectedModel.value = newFilters.models[0];

      if (props.type === "image-gen") {
        const comfyIndex = newFilters.frameworks.findIndex(
          (f: string) => f.toLowerCase() === "comfy"
        );
        selectedFramework.value =
          comfyIndex >= 0
            ? newFilters.frameworks[comfyIndex]
            : newFilters.frameworks[0];
      } else {
        selectedFramework.value = newFilters.frameworks[0];
      }
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.label {
  display: inline-block;
  font-size: 0.9rem;
  font-weight: 600;
}

.chart-wrapper {
  height: 400px;
  position: relative;
  width: 100%;
  margin: 20px 0;
}

.filters {
  display: flex;
  gap: 1rem;
}

.field {
  flex: 1;
}
</style>
