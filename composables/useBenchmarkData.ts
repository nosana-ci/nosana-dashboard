import { ref, computed, type ComputedRef } from "vue";
import { useAPI } from "./useAPI";

interface BenchmarkOptions {
  type: "llm" | "image-gen";
  nodeId: ComputedRef<string | string[] | undefined> | string;
  marketId: ComputedRef<string | undefined> | string;
}

export function useBenchmark(options: BenchmarkOptions) {
  const selectedFramework = ref<string | null>(null);
  const selectedModel = ref<string | null>(null);

  // Get filters
  const filtersUrl = computed(() => `/api/benchmarks/${options.type}-filters`);
  const { data: filters } = useAPI(filtersUrl, {
    watch: [filtersUrl],
    default: () => ({ frameworks: [], models: [] }),
  });

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
      default: () => ({ data: [], total: 0 }),
      immediate: false,
      server: false,
      transform: (response) => response || { data: [], total: 0 },
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
      default: () => ({ data: [], total: 0 }),
      immediate: false,
      server: false,
      transform: (response) => response || { data: [], total: 0 },
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
