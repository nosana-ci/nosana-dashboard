<template>
  <div class="box">
    <h3 class="title is-5 mb-4">{{ title }}</h3>
    <div class="filters mb-4">
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
      <div v-if="loading" class="has-text-centered">
        <progress class="progress is-small is-info" max="100"></progress>
        <p>Loading benchmark data...</p>
      </div>
      <div v-else-if="error" class="notification is-warning">
        {{ error }}
      </div>
      <div v-else-if="!templateData || templateData.templates.length === 0" class="notification is-info">
        No benchmark data available for this node.
      </div>
      <Bar v-else :data="chartData" :options="chartOptions" :height="300" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "vue-chartjs";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  nodeId: {
    type: String,
    required: true,
  },
  defaultMetric: {
    type: String,
    default: 'tokensPerSecond',
  },
});

interface TemplatePerformance {
  templateId: string;
  templateName: string;
  node: {
    tokensPerSecond: number;
    temperature: number;
    wattage: number;
    benchmarkCount: number;
  };
  market: {
    tokensPerSecond: number;
    temperature: number;
    wattage: number;
    benchmarkCount: number;
  };
}

interface TemplateData {
  nodeId: string;
  marketAddress: string;
  templates: TemplatePerformance[];
}

const selectedMetric = ref(props.defaultMetric);

const metricOptions = [
  { value: 'tokensPerSecond', label: 'Tokens / Second' },
  { value: 'temperature', label: 'Temperature (°C)' },
  { value: 'wattage', label: 'Power Usage (W)' },
];

// Fetch template performance data using useAPI at the top level
const apiUrl = computed(() => `/api/benchmarks/node-template-performance/${props.nodeId}`);

const { data: templateData, pending: loading, error: fetchError } = useAPI(
  apiUrl,
  {
    watch: [apiUrl],
  }
);

// Compute error message
const error = computed(() => {
  if (fetchError.value) {
    return 'Failed to load benchmark data';
  }
  return null;
});

const chartData = computed(() => {
  if (!templateData.value?.templates || templateData.value.templates.length === 0) {
    return { labels: [], datasets: [] };
  }

  const templates = templateData.value.templates;
  const labels = templates.map((t: TemplatePerformance) => t.templateName);
  
  const nodeData = templates.map((t: TemplatePerformance) => {
    const value = t.node[selectedMetric.value as keyof typeof t.node];
    return typeof value === 'number' ? value : 0;
  });
  
  const marketData = templates.map((t: TemplatePerformance) => {
    const value = t.market[selectedMetric.value as keyof typeof t.market];
    return typeof value === 'number' ? value : 0;
  });

  return {
    labels,
    datasets: [
      {
        label: 'Node Performance',
        data: nodeData,
        backgroundColor: '#0066ff',
        borderWidth: 1,
      },
      {
        label: 'Market Average',
        data: marketData,
        backgroundColor: '#10E80C',
        borderWidth: 1,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: {
        display: false,
      },
    },
    y: {
      title: {
        display: true,
        text: metricOptions.find(m => m.value === selectedMetric.value)?.label || '',
      },
      beginAtZero: true,
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      align: 'end' as const,
    },
  },
}));
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
  max-width: 300px;
}
</style>

