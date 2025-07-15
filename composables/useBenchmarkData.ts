import { ref, computed, type ComputedRef, watch } from "vue";
import { useAPI } from "./useAPI";

interface BenchmarkOptions {
  type: "llm" | "image-gen";
  nodeId: ComputedRef<string | string[] | undefined> | string;
  marketId: ComputedRef<string | undefined> | string;
}

interface BenchmarkDataItem {
  framework: string;
  modelName: string;
  metrics: {
    avgClockSpeed: string;
    avgWattage: string;
    avgTemperature: string;
    averageTokensPerSecond?: string;
    imagesPerSecond?: string;
  };
}

const llmFilters = {
  frameworks: ["lmdeploy", "tgi", "vllm"],
  models: ["llama3.1_70B_4x", "llama3.1_8B", "llama3.1_8B_4x"],
};

const imageGenFilters = {
  frameworks: ["auto", "comfy", "forge", "invokeai"],
  models: ["stable_diffusion_1.5"],
};

export function useBenchmark(options: BenchmarkOptions) {
  const selectedFramework = ref<string | null>(null);
  const selectedModel = ref<string | null>(null);

  // Replace API call with computed that returns hardcoded filters
  const filters = computed(() =>
    options.type === "llm" ? llmFilters : imageGenFilters
  );

  // Get columns based on type
  const columns =
    options.type === "llm"
      ? [
          "averageTokensPerSecond",
          "avgClockSpeed",
          "avgWattage",
          "avgTemperature",
        ]
      : ["imagesPerSecond", "avgClockSpeed", "avgWattage", "avgTemperature"];

  // Node benchmark data
  const benchmarkUrl = computed(() => {
    const nodeId =
      typeof options.nodeId === "string"
        ? options.nodeId
        : options.nodeId.value;
    if (!nodeId) return null;
    return `/api/benchmarks/${options.type}-benchmark-data?node=${nodeId}&columns=${columns.join("&columns=")}`;
  });

  const { data: rawBenchmarkData } = useAPI(
    () => {
      return benchmarkUrl.value || "/api/benchmarks/empty";
    },
    {
      watch: [benchmarkUrl],
      immediate: true,
      server: false,
    }
  );

  // Market benchmark data
  const marketBenchmarkUrl = computed(() => {
    const marketId =
      typeof options.marketId === "string"
        ? options.marketId
        : options.marketId.value;
    if (!marketId) return null;
    return `/api/benchmarks/${options.type}-benchmark-data?level=market&market=${marketId}&columns=${columns.join("&columns=")}`;
  });

  const { data: rawMarketBenchmarkData } = useAPI(
    () => {
      return marketBenchmarkUrl.value || "/api/benchmarks/empty";
    },
    {
      watch: [marketBenchmarkUrl],
      immediate: true,
      server: false,
    }
  );

  const benchmarkData = computed(() => {
    if (!rawBenchmarkData.value?.data) return { data: [] };
    return {
      data: rawBenchmarkData.value.data.filter(
        (item: BenchmarkDataItem) =>
          (!selectedFramework.value ||
            item.framework === selectedFramework.value) &&
          (!selectedModel.value || item.modelName === selectedModel.value)
      ),
    };
  });

  const marketBenchmarkData = computed(() => {
    if (!rawMarketBenchmarkData.value?.data) return { data: [] };
    return {
      data: rawMarketBenchmarkData.value.data.filter(
        (item: BenchmarkDataItem) =>
          (!selectedFramework.value ||
            item.framework === selectedFramework.value) &&
          (!selectedModel.value || item.modelName === selectedModel.value)
      ),
    };
  });

  const availableFrameworks = computed(() => {
    if (
      !rawMarketBenchmarkData.value?.data ||
      rawMarketBenchmarkData.value.data.length === 0
    ) {
      return [];
    }

    const existingFrameworks = new Set(
      rawMarketBenchmarkData.value.data.map(
        (item: BenchmarkDataItem) => item.framework
      )
    );
    return filters.value.frameworks.filter((framework) =>
      existingFrameworks.has(framework)
    );
  });

  const availableModels = computed(() => {
    if (
      !rawMarketBenchmarkData.value?.data ||
      rawMarketBenchmarkData.value.data.length === 0
    ) {
      return [];
    }

    const existingModels = new Set(
      rawMarketBenchmarkData.value.data.map(
        (item: BenchmarkDataItem) => item.modelName
      )
    );
    return filters.value.models.filter((model) => existingModels.has(model));
  });

  // Initialize filters when market data is loaded
  watch(
    [rawMarketBenchmarkData, rawBenchmarkData],
    ([marketData, nodeData]) => {
      if (marketData?.data?.length > 0 && nodeData?.data) {
        // Get node data combinations
        const nodeDataCombinations = new Set(
          nodeData.data.map(
            (item: { modelName: string; framework: string }) =>
              `${item.modelName}-${item.framework}`
          )
        );

        if (availableModels.value.length > 0) {
          // First find a model that has any node data
          const modelWithNodeData = availableModels.value.find((model) =>
            availableFrameworks.value.some((framework) =>
              nodeDataCombinations.has(`${model}-${framework}`)
            )
          );

          // Set the model first
          selectedModel.value = modelWithNodeData || availableModels.value[0];

          // Then find frameworks that work with this model
          if (availableFrameworks.value.length > 0) {
            const frameworksWithNodeData = availableFrameworks.value.filter(
              (framework) =>
                nodeDataCombinations.has(`${selectedModel.value}-${framework}`)
            );

            if (frameworksWithNodeData.length > 0) {
              if (options.type === "image-gen") {
                // For image-gen, prioritize comfy if it has node data
                const hasComfy = frameworksWithNodeData.includes("comfy");
                selectedFramework.value = hasComfy
                  ? "comfy"
                  : frameworksWithNodeData[0];
              } else {
                selectedFramework.value = frameworksWithNodeData[0];
              }
            } else {
              selectedFramework.value = availableFrameworks.value[0];
            }
          }
        }
      }
    },
    { immediate: true }
  );

  return {
    selectedFramework,
    selectedModel,
    filters,
    benchmarkData,
    marketBenchmarkData,
    availableFrameworks,
    availableModels,
  };
}

interface GenericBenchmarkMetric {
  storageToCpuBandwidthMbps: number;
  cpuToGpuBandwidthMbps: number;
  systemReadWriteSpeed: number;
  ramReadWriteSpeed: number;
  internetSpeedDownload: number | null;
  internetSpeedUpload: number | null;
  bandwidthLatency: number | null;
}

interface GenericBenchmarkData {
  node: string;
  gpu: string;
  benchVersion: string;
  bandwidthMeasurementTool: string;
  metrics: GenericBenchmarkMetric;
}

interface GenericBenchmarkResponse {
  data: GenericBenchmarkData[];
  total: number;
}

export const useGenericBenchmark = (
  benchmarkResponse: ComputedRef<GenericBenchmarkResponse | null>
) => {
  const processedBenchmarkResponse = computed(() => {
    if (benchmarkResponse.value && benchmarkResponse.value.data) {
      const fast = benchmarkResponse.value.data.find(
        (d: GenericBenchmarkData) => d.bandwidthMeasurementTool === "fast"
      );
      if (fast) return { data: [fast] };

      const ookla = benchmarkResponse.value.data.find(
        (d: GenericBenchmarkData) => d.bandwidthMeasurementTool === "ookla"
      );
      if (ookla) return { data: [ookla] };

      const speedtest = benchmarkResponse.value.data.find(
        (d: GenericBenchmarkData) =>
          d.bandwidthMeasurementTool === "speedtest-cli"
      );
      if (speedtest) return { data: [speedtest] };
    }
    return { data: [] };
  });

  return {
    processedBenchmarkResponse,
  };
};
