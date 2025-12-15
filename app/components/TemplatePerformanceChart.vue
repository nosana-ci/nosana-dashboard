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
      <Bar
        v-else
        :data="chartData"
        :options="chartOptions"
        :plugins="chartPlugins"
        :height="300"
      />
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

// Always compare with the premium market counterpart
const selectedMarket = computed(() => {
  if (!templateData.value?.currentMarket || !templateData.value.marketOptions) {
    return '';
  }

  const currentMarket = templateData.value.marketOptions[templateData.value.currentMarket];
  const baseSlug = currentMarket?.slug.replace('-community', '') || '';

  // Find premium market (either current market or its counterpart)
  const premiumMarket = (
    Object.entries(templateData.value.marketOptions) as [string, MarketOption][]
  ).find(([, market]) => market.type === 'PREMIUM' && market.slug === baseSlug);

  return premiumMarket ? premiumMarket[0] : '';
});

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
const marketOptions = computed<Record<string, MarketOption>>(() => {
  const allMarkets = (templateData.value?.marketOptions ||
    {}) as Record<string, MarketOption>;
  return Object.fromEntries(
    Object.entries(allMarkets).filter(
      ([, market]: [string, MarketOption]) => market.type === 'PREMIUM'
    )
  );
});


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

const comparisonLegend = computed<
  Array<{ templateId: string; templateName: string; delta: number }>
>(() => {
  if (
    !selectedMarket.value ||
    !templateData.value?.templates ||
    !templateData.value.marketOptions[selectedMarket.value]
  ) {
    return [];
  }

  const marketData = templateData.value.marketOptions[selectedMarket.value];

  return templateData.value.templates.map((t: TemplatePerformance) => {
    const nodeVal = Number(
      t.node[selectedMetric.value as keyof NodePerformance] ?? 0
    );
    const marketTemplate = marketData.templates[t.templateId];
    const marketVal = Number(
      marketTemplate?.[selectedMetric.value as keyof NodePerformance] ?? 0
    );

    let delta = 0;
    if (Number.isFinite(nodeVal) && Number.isFinite(marketVal) && marketVal !== 0) {
      delta = Math.round(((nodeVal - marketVal) / marketVal) * 100);
    }

    return {
      templateId: t.templateId,
      templateName: t.templateName,
      delta,
    };
  });
});

const comparisonDeltaByLabel = computed<Record<string, number>>(() => {
  return Object.fromEntries(
    comparisonLegend.value.map((item) => [item.templateName, item.delta])
  );
});

const chartOptions = computed(() => {
  const deltaMap = comparisonDeltaByLabel.value;
  const labels = chartData.value.labels || [];

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 10,
      },
    },
    scales: {
      x: {
        title: {
          display: false,
        },
        ticks: {
          callback(value: any, index: number) {
            return labels[index] ?? value;
          },
        },
      },
      y: {
        title: {
          display: true,
          text:
            metricOptions.find((m) => m.value === selectedMetric.value)?.label ||
            '',
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
  };
});

const percentileOverlayPlugin = {
  id: 'percentileOverlayPlugin',
  afterDraw(chart: any) {
    const deltaMap = comparisonDeltaByLabel.value;
    const labels = chartData.value.labels || [];
    const xScale = chart.scales?.x;
    if (!xScale || !labels.length) return;

    const ctx = chart.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 10px "Helvetica Neue", Arial, sans-serif';

    const baseY = chart.chartArea.bottom + 26;
    labels.forEach((label: string, idx: number) => {
      const delta = deltaMap[label];
      if (delta === undefined) return;
      const x = xScale.getPixelForTick(idx);
      ctx.fillStyle = delta >= 0 ? '#23d160' : '#f14668';
      const text = `${delta >= 0 ? '+' : ''}${delta}%`;
      ctx.fillText(text, x, baseY);
    });

    ctx.restore();
  },
};

const chartPlugins = computed(() => {
  const hasComparison = comparisonLegend.value.length > 0 && selectedMarket.value;
  return hasComparison ? [percentileOverlayPlugin] : [];
});
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
  margin: 0;
}

.filters {
  display: flex;
  gap: 1rem;
}

.field {
  max-width: 300px;
}
</style>

