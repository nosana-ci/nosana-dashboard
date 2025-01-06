import { ref, computed, type ComputedRef, watch } from "vue";
import { useAPI } from "./useAPI";

interface BenchmarkOptions {
  type: "llm" | "image-gen";
  nodeId: ComputedRef<string | string[] | undefined> | string;
  marketId: ComputedRef<string | undefined> | string;
}

interface BenchmarkDataItem {
  framework: string;
  model: string;
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
          (!selectedModel.value || item.model === selectedModel.value)
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
          (!selectedModel.value || item.model === selectedModel.value)
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
        (item: BenchmarkDataItem) => item.model
      )
    );
    return filters.value.models.filter((model) => existingModels.has(model));
  });

  // Initialize filters when market data is loaded
  watch(
    rawMarketBenchmarkData,
    (newData) => {
      if (newData?.data && newData.data.length > 0) {
        // Get node data combinations
        const nodeDataCombinations = new Set(
          rawBenchmarkData.value?.data?.map(
            (item: { model: string; framework: string }) =>
              `${item.model}-${item.framework}`
          ) || []
        );

        if (availableModels.value.length > 0) {
          // First find a model that has any node data
          const modelWithNodeData = availableModels.value.find(
            (model) =>
              nodeDataCombinations.has(
                `${model}-${availableFrameworks.value[0]}`
              ) ||
              nodeDataCombinations.has(`${model}-comfy`) ||
              nodeDataCombinations.has(`${model}-forge`)
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
                // If we have node data and comfy is among the frameworks with node data, use it
                const comfyIndex = frameworksWithNodeData.findIndex(
                  (f) => f.toLowerCase() === "comfy"
                );
                selectedFramework.value =
                  comfyIndex >= 0
                    ? frameworksWithNodeData[comfyIndex]
                    : frameworksWithNodeData[0];
              } else {
                // For LLM, use the first framework with node data
                selectedFramework.value = frameworksWithNodeData[0];
              }
            } else {
              // Fall back to first market framework if none have node data
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
