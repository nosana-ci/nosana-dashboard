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
      <div class="field">
        <label class="label">Compare with Market</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="selectedMarket">
              <option value="">No comparison</option>
              <option
                v-for="(market, address) in marketOptions"
                :key="address"
                :value="address"
              >
                {{ market.name }} ({{ market.type }})
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

interface NodePerformance {
  tokensPerSecond: number;
  temperature: number;
  wattage: number;
  benchmarkCount: number;
}

interface MarketOption {
  name: string;
  type: string;
  slug: string;
  templates: Record<string, NodePerformance>;
}

interface TemplatePerformance {
  templateId: string;
  templateName: string;
  node: NodePerformance;
}

interface TemplateData {
  nodeId: string;
  currentMarket: string | null;
  templates: TemplatePerformance[];
  marketOptions: Record<string, MarketOption>;
}

const selectedMetric = ref(props.defaultMetric);
const selectedMarket = ref('');

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

// Market options for dropdown (filtered to only show PREMIUM markets)
const marketOptions = computed(() => {
  const allMarkets = templateData.value?.marketOptions || {};
  return Object.fromEntries(
    Object.entries(allMarkets).filter(([address, market]) => market.type === 'PREMIUM')
  );
});

// Set default market - use premium counterpart for community markets
watch(templateData, (newData) => {
  if (newData?.currentMarket && !selectedMarket.value) {
    const currentMarket = newData.marketOptions[newData.currentMarket];
    const baseSlug = currentMarket?.slug.replace('-community', '') || '';
    
    // Find premium market (either current market or its counterpart)
    const premiumMarket = Object.entries(newData.marketOptions)
      .find(([_, market]) => market.type === 'PREMIUM' && market.slug === baseSlug);
    
    if (premiumMarket) {
      selectedMarket.value = premiumMarket[0];
    }
  }
}, { immediate: true });

const chartData = computed(() => {
  if (!templateData.value?.templates || templateData.value.templates.length === 0) {
    return { labels: [], datasets: [] };
  }

  const templates = templateData.value.templates;
  const labels = templates.map((t: TemplatePerformance) => t.templateName);
  
  const nodeData = templates.map((t: TemplatePerformance) => {
    const value = t.node[selectedMetric.value as keyof NodePerformance];
    return typeof value === 'number' ? value : 0;
  });

  const datasets = [
    {
      label: 'Node Performance',
      data: nodeData,
      backgroundColor: 'hsl(217, 100%, 50%)', // Bulma info color
      borderWidth: 1,
    },
  ];

  // Add market comparison data if a market is selected
  if (selectedMarket.value && templateData.value.marketOptions[selectedMarket.value]) {
    const selectedMarketData = templateData.value.marketOptions[selectedMarket.value];
    const marketData = templates.map((t: TemplatePerformance) => {
      const marketTemplate = selectedMarketData.templates[t.templateId];
      if (marketTemplate) {
        const value = marketTemplate[selectedMetric.value as keyof NodePerformance];
        return typeof value === 'number' ? value : 0;
      }
      return 0;
    });

    datasets.push({
      label: `${selectedMarketData.name} Average`,
      data: marketData,
      backgroundColor: 'hsl(116, 92%, 49%)', // Bulma secondary color
      borderWidth: 1,
    });
  }

  return {
    labels,
    datasets,
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

