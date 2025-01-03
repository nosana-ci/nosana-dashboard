import { ref, computed, type ComputedRef } from "vue";
import { useAPI } from "./useAPI";

interface BenchmarkOptions {
  type: "llm" | "image-gen";
  nodeId: ComputedRef<string | string[] | undefined> | string;
  marketId: ComputedRef<string | undefined> | string;
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
    return `/api/benchmarks/${options.type}-benchmark-data?node=${nodeId}&framework=${selectedFramework.value}&model=${selectedModel.value}&columns=${columns.join("&columns=")}`;
  });

  const { data: benchmarkData } = useAPI(
    () => {
      return benchmarkUrl.value || "/api/benchmarks/empty";
    },
    {
      watch: [benchmarkUrl],
      immediate: false,
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
    return `/api/benchmarks/${options.type}-benchmark-data?level=market&market=${marketId}&framework=${selectedFramework.value}&model=${selectedModel.value}&columns=${columns.join("&columns=")}`;
  });

  const { data: marketBenchmarkData } = useAPI(
    () => {
      return marketBenchmarkUrl.value || "/api/benchmarks/empty";
    },
    {
      watch: [marketBenchmarkUrl],
      immediate: false,
      server: false,
    }
  );

  return {
    selectedFramework,
    selectedModel,
    filters,
    benchmarkData,
    marketBenchmarkData,
  };
}
