import { computed, ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useAPI } from './useAPI';

interface BenchmarkConfig {
  endpoint: string;
  formatData: (data: any) => {
    framework: string;
    model: string;
    xValue: number;
    yValue: number;
  };
}

interface RawBenchmarkData {
  framework: string;
  model: string;
  metrics: {
    averageTokensPerSecond?: number;
    imagesPerSecond?: number;
  };
  cuCount?: string;
  batchSize?: string;
}

interface FormattedBenchmarkData {
  framework: string;
  model: string;
  xValue: number;
  yValue: number;
}

const extractModelSize = (modelName: string): number => {
  const llmMatch = modelName.match(/(\d+)B/);
  if (llmMatch) {
    return parseInt(llmMatch[1]);
  }
  const numberMatch = modelName.match(/(\d+)/);
  return numberMatch ? parseInt(numberMatch[1]) : 0;
};

const findBestFramework = (marketData: FormattedBenchmarkData[]): string => {
  if (!marketData.length) return '';
  
  const frameworkGroups = marketData.reduce((acc, item) => {
    if (!acc[item.framework]) {
      acc[item.framework] = [];
    }
    acc[item.framework].push(item);
    return acc;
  }, {} as Record<string, FormattedBenchmarkData[]>);

  const maxXValue = Math.max(...marketData.map(item => item.xValue));

  let bestFramework = '';
  let highestYValue = -1;

  Object.entries(frameworkGroups).forEach(([framework, items]) => {
    const maxXItems = items.filter(item => item.xValue === maxXValue);
    if (maxXItems.length > 0) {
      const maxY = Math.max(...maxXItems.map(item => item.yValue));
      if (maxY > highestYValue) {
        highestYValue = maxY;
        bestFramework = framework;
      }
    }
  });

  return bestFramework;
};

export const useBenchmarkData = (config: BenchmarkConfig, nodeSpecsRef: Ref<any>) => {
  const { params } = useRoute();
  
  const benchmarkUrl = computed(() => `${config.endpoint}?node=${params.id}`);
  const { data: benchmarks } = useAPI(benchmarkUrl, { 
    watch: [benchmarkUrl],
    default: () => ({ data: [], total: 0 })
  });

  const marketBenchmarkUrl = computed(() => {
    const marketAddress = nodeSpecsRef.value?.marketAddress;
    return marketAddress 
      ? `${config.endpoint}?level=market&market=${marketAddress}`
      : null;
  });

  const marketBenchmarks = ref({ data: [], total: 0 });

  watchEffect(() => {
    if (marketBenchmarkUrl.value) {
      const { data } = useAPI(marketBenchmarkUrl.value, { 
        default: () => ({ data: [], total: 0 })
      });
      marketBenchmarks.value = data.value;

    } else {
    }
  });

  const formattedBenchmarkData = computed(() => 
    benchmarks.value?.data ? benchmarks.value.data.map(config.formatData) : []
  );

  const formattedMarketBenchmarkData = computed(() => 
    marketBenchmarks.value?.data ? marketBenchmarks.value.data.map(config.formatData) : []
  );

  const defaultModel = computed(() => {
    if (!benchmarks.value?.data) return '';
    
    const uniqueModels = Array.from(new Set<string>(
      benchmarks.value.data.map((item: RawBenchmarkData) => item.model)
    ));
    
    return uniqueModels.sort((a, b) => extractModelSize(b) - extractModelSize(a))[0] || '';
  });

  const defaultFramework = computed(() => {
    return findBestFramework(formattedMarketBenchmarkData.value);
  });

  return {
    benchmarks,
    marketBenchmarks,
    formattedBenchmarkData,
    formattedMarketBenchmarkData,
    defaultModel,
    defaultFramework
  };
};