`
<template>
  <div>
    <table class="table is-fullwidth two-column-labels">
      <tbody>
        <tr>
          <td colspan="2" class="has-background-light">
            <h4 class="title is-5">Host Info</h4>
          </td>
        </tr>
        <!-- Specifications -->
        <tr>
          <td>Country</td>
          <td>{{ countryName || "-" }}</td>
        </tr>
        <tr>
          <td>Internet Speed</td>
          <td>
            {{
              genericBenchmarkResponse?.data?.[0]?.metrics
                ?.internetSpeedDownload
                ? Number(
                    genericBenchmarkResponse.data[0].metrics
                      .internetSpeedDownload
                  ).toFixed(2)
                : "-"
            }}
            Mbps
          </td>
        </tr>
        <tr>
          <td>GPU</td>
          <td>{{ combinedSpecs?.gpus?.[0]?.gpu || "-" }}</td>
        </tr>
        <tr>
          <td>CPU</td>
          <td>{{ combinedSpecs?.cpu || "-" }}</td>
        </tr>
        <tr>
          <td>RAM</td>
          <td>{{ combinedSpecs?.ram ? `${combinedSpecs.ram} GB` : "-" }}</td>
        </tr>
        <tr>
          <td>Disk Space</td>
          <td>
            {{
              combinedSpecs?.diskSpace ? `${combinedSpecs.diskSpace} GB` : "-"
            }}
          </td>
        </tr>
        <tr>
          <td>NVIDIA Driver</td>
          <td>{{ combinedSpecs?.nvmlVersion || "-" }}</td>
        </tr>
        <tr>
          <td>CUDA Driver</td>
          <td>{{ combinedSpecs?.cudaVersion || "-" }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  address: string;
}>();

/**********************
 * Node Specification *
 **********************/
const { data: nodeSpecs, pending: loadingSpecs } = useAPI(
  `/api/nodes/${props.address}/specs`,
  {
    // @ts-ignore TODO: add to useAPI opts type
    disableToastOnError: true,
  }
);

const { data: nodeInfo, pending: loadingInfo } = useAPI(
  `https://${props.address}.${useRuntimeConfig().public.nodeDomain}/node/info`,
  {
    // @ts-ignore
    disableToastOnError: true,
  }
);

/*************
 * Node Benchmarks *
 *************/
const { data: genericBenchmarkResponse } = useAPI(
  `/api/benchmarks/generic-benchmark-data?node=${props.address}`,
  {
    // @ts-ignore
    disableToastOnError: true,
  }
);

/*************
 * Country Name *
 *************/
const countryName = computed(() => {
  if (!combinedSpecs.value?.country) return null;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(
      combinedSpecs.value.country
    );
  } catch (e) {
    return combinedSpecs.value.country;
  }
});

/*************
 * Combined Node Specs *
 *************/
const combinedSpecs = computed(() => {
  if (!nodeSpecs.value) return null;

  const nodeInfoData = nodeInfo.value?.info;

  return {
    nodeAddress: props.address,
    marketAddress: nodeSpecs.value.marketAddress,
    ram: nodeInfoData?.ram_mb
      ? Number(Math.round(nodeInfoData.ram_mb / 1024)).toFixed(2)
      : Number(nodeSpecs.value.ram).toFixed(2),
    diskSpace: nodeInfoData?.disk_gb
      ? Number(nodeInfoData.disk_gb).toFixed(2)
      : Number(nodeSpecs.value.diskSpace).toFixed(2),
    cpu: nodeInfoData?.cpu?.model ?? nodeSpecs.value.cpu,
    country: nodeInfoData?.country ?? nodeSpecs.value.country,
    bandwidth: nodeInfoData?.network?.download_mbps
      ? Number(nodeInfoData.network.download_mbps).toFixed(2)
      : Number(nodeSpecs.value.bandwidth).toFixed(2),
    gpus: nodeInfoData?.gpus?.devices
      ? nodeInfoData.gpus.devices.map((gpu: any) => ({
          gpu: gpu.name,
          memory: gpu.memory?.total_mb,
          architecture: `${gpu.network_architecture?.major}.${gpu.network_architecture?.minor}`,
        }))
      : nodeSpecs.value.gpus,
    cudaVersion: nodeInfoData?.gpus.cuda_driver_version,
    nvmlVersion: nodeInfoData?.gpus.nvml_driver_version,
  };
});
</script>
`
