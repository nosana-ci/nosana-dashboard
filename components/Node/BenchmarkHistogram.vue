<template>
  <div class="box">
    <h3 class="title is-5 mb-4">{{ title }}</h3>
    
    <!-- Filters Section -->
    <div class="filters mb-4">
      <div class="field">
        <label class="label">Model</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="selectedModel">
              <option v-for="model in uniqueModels" :key="model" :value="model">
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
              <option v-for="framework in uniqueFrameworks" :key="framework" :value="framework">
                {{ framework }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Single Chart -->
    <div class="chart-wrapper">
      <Bar
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { Bar } from 'vue-chartjs';

Chart.register(...registerables);

// Generic interface for benchmark data
interface BenchmarkDataPoint {
  framework: string;
  model: string;
  xValue: number;
  yValue: number;
}

const props = defineProps<{
  benchmarkData: Array<BenchmarkDataPoint>;
  marketBenchmarkData?: Array<BenchmarkDataPoint>;
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  defaultModel?: string;
  defaultFramework?: string;
}>();

// Computed properties for unique values
const uniqueModels = computed(() => 
  [...new Set(props.benchmarkData.map(item => item.model))].sort()
);

const uniqueFrameworks = computed(() => 
  [...new Set(props.benchmarkData.map(item => item.framework))].sort()
);

// Set default values for filters
const selectedModel = ref(props.defaultModel || '');
const selectedFramework = ref(props.defaultFramework || '');

// Filtered data based on selections
const filteredData = computed(() => {
  return props.benchmarkData.filter(item => 
    item.model === selectedModel.value && 
    item.framework === selectedFramework.value
  );
});

// Updated chartData computed to use generic property names
const chartData = computed(() => {
  const sortedData = [...filteredData.value].sort((a, b) => a.xValue - b.xValue);
  const marketData = props.marketBenchmarkData?.filter(item => 
    item.model === selectedModel.value && 
    item.framework === selectedFramework.value
  ).sort((a, b) => a.xValue - b.xValue);
  
  return {
    labels: sortedData.map(item => item.xValue.toString()),
    datasets: [
      {
        label: 'Node Performance',
        data: sortedData.map(item => item.yValue),
        backgroundColor: '#0066ff',
        borderWidth: 1
      },
      ...(marketData ? [{
        label: 'Market Average',
        data: marketData.map(item => item.yValue),
        backgroundColor: '#10E80C',
        borderWidth: 1
      }] : [])
    ]
  };
});

// Update chartOptions to use provided labels
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true
    },
    tooltip: {
      callbacks: {
        label: (context: any) => 
          `${context.dataset.label}: ${context.formattedValue} ${props.yAxisLabel}`
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: props.xAxisLabel
      }
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: props.yAxisLabel
      }
    }
  }
}));

// Set initial values when component mounts
onMounted(() => {
  if (!selectedModel.value && uniqueModels.value.length) {
    selectedModel.value = uniqueModels.value[0];
  }
  if (!selectedFramework.value && uniqueFrameworks.value.length) {
    selectedFramework.value = uniqueFrameworks.value[0];
  }
});

// Add watchers for the defaults
watch(() => props.defaultModel, (newValue) => {
  if (newValue && newValue !== selectedModel.value) {
    selectedModel.value = newValue;
  }
});

watch(() => props.defaultFramework, (newValue) => {
  if (newValue && newValue !== selectedFramework.value) {
    selectedFramework.value = newValue;
  }
});
</script>

<style scoped>
.filters {
  display: flex;
  gap: 1rem;
}

.field {
  flex: 1;
}

.chart-wrapper {
  height: 400px;
  position: relative;
}
</style>