<template>
  <!-- Specifications Section -->
  <tr>
    <td>GPU</td>
    <td>
      <span v-if="resolvedSpecs?.gpus?.length">
        {{ resolvedSpecs.gpus[0].gpu }}
      </span>
      <span v-else>-</span>
    </td>
  </tr>
  <tr>
    <td>NVIDIA Driver</td>
    <td>{{ resolvedSpecs?.nvmlVersion || "-" }}</td>
  </tr>
  <tr>
    <td>CUDA Version</td>
    <td>{{ resolvedSpecs?.cudaVersion || "-" }}</td>
  </tr>
  <tr>
    <td>CPU</td>
    <td>{{ resolvedSpecs?.cpu || "-" }}</td>
  </tr>
  <tr>
    <td>RAM</td>
    <td>{{ resolvedSpecs?.ram }} MB</td>
  </tr>
  <tr>
    <td>Disk Space</td>
    <td>{{ resolvedSpecs?.diskSpace }} GB</td>
  </tr>
  <tr>
    <td>Country</td>
    <td>{{ formatCountry(resolvedSpecs?.country) }}</td>
  </tr>
  <tr>
    <td>System Environment</td>
    <td>{{ resolvedSpecs?.systemEnvironment || "-" }}</td>
  </tr>
  <tr>
    <td>Download Speed</td>
    <td v-if="!aggregatedDownloadSpeed">-</td>
    <td v-else>{{ aggregatedDownloadSpeed }} Mbps</td>
  </tr>
  <tr>
    <td>Upload Speed</td>
    <td v-if="!aggregatedUploadSpeed">-</td>
    <td v-else>{{ aggregatedUploadSpeed }} Mbps</td>
  </tr>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ComputedRef } from "vue";

interface Specs {
  gpus: Array<{ gpu: string }>;
  cpu: string;
  ram: number;
  diskSpace: number;
  country: string;
  bandwidth?: {
    ping: number;
    download: number;
    upload: number;
  };
  cudaVersion: number;
  nvmlVersion: string;
  nodeVersion: string;
  systemEnvironment: string | null;
}

interface NodeRanking {
  node: string;
  participationRate: number;
  uptimePercentage: number;
}

const props = defineProps<{
  // Direct specs can be provided
  specs?: Specs;
  nodeRanking?: NodeRanking | null;
  genericBenchmarkResponse?: any;

  // Or a nodeAddress can be provided to fetch the data
  nodeAddress?: string;
}>();

// If specs are directly provided, use them; otherwise fetch and process data
const resolvedSpecs = computed(() => {
  return props.specs || combinedSpecs.value;
});

const resolvedNodeRanking = computed(() => {
  return props.nodeRanking || nodeRanking.value;
});

const resolvedBenchmarkResponse = computed(() => {
  return props.genericBenchmarkResponse || genericBenchmarkResponse.value;
});

// Fetch and process data if nodeAddress is provided
const fetchData = !!props.nodeAddress;

// Node specifications
const { data: nodeSpecs } = fetchData
  ? useAPI(`/api/nodes/${props.nodeAddress}/specs`, {
      // @ts-ignore
      disableToastOnError: true,
    })
  : { data: ref(null) };

// Node info from node API
const { data: nodeInfo } = fetchData
  ? useAPI(
      `https://${props.nodeAddress}.${useRuntimeConfig().public.nodeDomain}/node/info`,
      {
        // @ts-ignore
        disableToastOnError: true,
      }
    )
  : { data: ref(null) };

// Generic benchmark data
const { data: genericBenchmarkResponse } = fetchData
  ? useAPI(
      `/api/benchmarks/generic-benchmark-data?node=${props.nodeAddress}&bandwidthMeasurementTool=fast`,
      {
        // @ts-ignore
        disableToastOnError: true,
      }
    )
  : { data: ref(null) };

// Node ranking data
const { data: nodeRankingData } = fetchData
  ? useAPI(`/api/benchmarks/node-report?node=${props.nodeAddress}`, {
      // @ts-ignore
      disableToastOnError: true,
    })
  : { data: ref(null) };

// Node ranking data
const nodeRanking = computed(() => {
  if (!fetchData || !nodeRankingData.value?.length) return null;
  return (
    nodeRankingData.value.find(
      (ranking: any) => ranking.node === props.nodeAddress
    ) || null
  );
});

const aggregatedDownloadSpeed = computed(() => {
  if (
    !resolvedBenchmarkResponse.value ||
    !resolvedBenchmarkResponse.value.data ||
    resolvedBenchmarkResponse.value.data.length === 0
  ) {
    return null;
  }
  const validEntries = resolvedBenchmarkResponse.value.data.filter(
    (entry: any) =>
      entry.metrics && typeof entry.metrics.internetSpeedDownload === "number"
  );
  if (validEntries.length === 0) return null;
  const totalDownload = validEntries.reduce(
    (sum: number, entry: any) => sum + entry.metrics.internetSpeedDownload,
    0
  );
  return (totalDownload / validEntries.length).toFixed(2);
});

const aggregatedUploadSpeed = computed(() => {
  if (
    !resolvedBenchmarkResponse.value ||
    !resolvedBenchmarkResponse.value.data ||
    resolvedBenchmarkResponse.value.data.length === 0
  ) {
    return null;
  }
  const validEntries = resolvedBenchmarkResponse.value.data.filter(
    (entry: any) =>
      entry.metrics && typeof entry.metrics.internetSpeedUpload === "number"
  );
  if (validEntries.length === 0) return null;
  const totalUpload = validEntries.reduce(
    (sum: number, entry: any) => sum + entry.metrics.internetSpeedUpload,
    0
  );
  return (totalUpload / validEntries.length).toFixed(2);
});

// Combined specs from both sources
const combinedSpecs = computed(() => {
  if (!fetchData || !nodeSpecs.value) return null;
  const nodeInfoData = nodeInfo.value?.info;

  return {
    nodeAddress: props.nodeAddress,
    marketAddress: nodeSpecs.value.marketAddress,
    ram: nodeInfoData?.ram_mb
      ? Math.round(nodeInfoData.ram_mb)
      : Math.round(Number(nodeSpecs.value.ram)),
    diskSpace: nodeInfoData?.disk_gb
      ? Math.round(Number(nodeInfoData.disk_gb))
      : Math.round(Number(nodeSpecs.value.diskSpace)),
    cpu: nodeInfoData?.cpu?.model ?? nodeSpecs.value.cpu,
    country: nodeInfoData?.country ?? nodeSpecs.value.country,
    bandwidth:
      nodeInfoData?.network?.download_mbps ?? nodeSpecs.value.bandwidth,
    gpus: nodeInfoData?.gpus?.devices
      ? nodeInfoData.gpus.devices.map((gpu: any) => ({
          gpu: gpu.name,
          memory: gpu.memory?.total_mb,
          architecture: `${gpu.network_architecture?.major}.${gpu.network_architecture?.minor}`,
        }))
      : nodeSpecs.value.gpus,
    cudaVersion:
      nodeInfoData?.gpus?.cuda_driver_version ?? nodeSpecs.value.cudaVersion,
    nvmlVersion:
      nodeInfoData?.gpus?.nvml_driver_version ?? nodeSpecs.value.nvmlVersion,
    nodeVersion: nodeInfoData?.version ?? nodeSpecs.value.nodeVersion,
    systemEnvironment: nodeInfoData?.system_environment
      ? nodeInfoData.system_environment.toLowerCase().includes("wsl")
        ? "WSL"
        : nodeInfoData.system_environment
          ? "Linux"
          : null
      : nodeSpecs.value.systemEnvironment
        ? nodeSpecs.value.systemEnvironment.toLowerCase().includes("wsl")
          ? "WSL"
          : "Linux"
        : null,
  };
});

const formatCountry = (countryCode: string) => {
  if (!countryCode) return "-";
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ||
      countryCode
    );
  } catch {
    return countryCode;
  }
};
</script>

<style lang="scss" scoped>
.info-icon {
  width: 20px;
  height: 20px;
  background-image: url("https://www.systemuicons.com/images/icons/info_circle.svg");
}
</style>
