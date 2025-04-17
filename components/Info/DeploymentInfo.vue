<template>
  <!-- Deployment Info Section -->
  <tr>
    <td colspan="2" class="has-background-light">
      <h4 class="title is-5">Deployment Info</h4>
    </td>
  </tr>
  <tr>
    <td>Solana address</td>
    <td>
      <a
        :href="`https://solscan.io/account/${address}`"
        target="_blank"
        class="address is-family-monospace"
      >
        {{ address }}
      </a>
    </td>
  </tr>
  <tr>
    <td>Host address</td>
    <td>
      <nuxt-link
        class="address is-family-monospace"
        :to="`/host/${node}`"
      >
        {{ node }}
      </nuxt-link>
    </td>
  </tr>
  <tr>
    <td>Deployer address</td>
    <td>
      <nuxt-link
        class="address is-family-monospace"
        :to="`/deployer/${project}`"
      >
        {{ project }}
      </nuxt-link>
    </td>
  </tr>
  <tr>
    <td>GPU pool</td>
    <td>
      <nuxt-link
        class="address is-family-monospace"
        :to="`/markets/${market}`"
      >
        <span
          v-if="
            apiMarkets &&
            apiMarkets.find((tgm: any) => tgm.address === market)
          "
        >
          {{ apiMarkets.find((tgm: any) => tgm.address === market).name }}
        </span>
        <span v-else>{{ market }}</span>
      </nuxt-link>
    </td>
  </tr>
  <tr>
    <td>Price</td>
    <td>
      {{ formattedPrice }}
      <span v-if="nosPriceUsd">(${{ calculatedUsdPrice }})</span>
    </td>
  </tr>
  <tr>
    <td>Started</td>
    <td>
      <span v-if="timeStartFormatted">
        {{ timeStartFormatted }}
        <span class="has-text-grey">({{ timeAgo }})</span>
      </span>
      <span v-else>-</span>
    </td>
  </tr>
  <tr>
    <td>Duration</td>
    <td>
      <span v-if="timeEnd && timeStart">
        {{ formatDuration(timeEnd - timeStart) }}
      </span>
      <span v-else-if="timeStart">
        {{ formatDuration(Math.floor(Date.now() / 1000) - timeStart) }}
        <span class="has-text-grey">(max {{ formatDuration(timeout || 7200) }})</span>
      </span>
      <span v-else>-</span>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { PublicKey } from "@solana/web3.js";

const props = defineProps<{
  address: string;
  node: string;
  project: string;
  market: string;
  price: number;
  timeStart?: number;
  timeEnd?: number;
  timeout?: number;
  jobDefinition?: any;
  isCompleted?: boolean;
}>();

// Format duration (seconds) to readable format
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${hours}h ${minutes}m ${remainingSeconds}s`;
};

// Format price
const formattedPrice = computed(() => {
  return (props.price / 1e6).toFixed(6) + " NOS";
});

// Get NOS price from API
const { data: stats } = useAPI("/api/stats");
const nosPriceUsd = computed(() => stats.value?.price || null);

// Calculate USD price
const calculatedUsdPrice = computed(() => {
  if (!nosPriceUsd.value) return null;
  return ((props.price / 1e6) * nosPriceUsd.value).toFixed(3);
});

// Format time started
const timeStartFormatted = computed(() => {
  if (!props.timeStart) return null;
  const date = new Date(props.timeStart * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
});

// Get time ago
const timeAgo = computed(() => {
  if (!props.timeStart) return null;
  try {
    const now = Date.now();
    const startTime = props.timeStart * 1000;
    const diffMs = now - startTime;
    
    // Convert to appropriate time unit
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec} seconds ago`;
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } catch(e) {
    return null;
  }
});

// Get host specs
const { data: nodeSpecs } = useAPI(`/api/nodes/${props.node}/specs`, {
  // @ts-ignore
  disableToastOnError: true,
});

const { data: nodeInfo } = useAPI(
  `https://${props.node}.${useRuntimeConfig().public.nodeDomain}/node/info`,
  {
    // @ts-ignore
    disableToastOnError: true,
  }
);

// Combined node specs
const combinedSpecs = computed(() => {
  if (!nodeSpecs.value) return null;

  const nodeInfoData = nodeInfo.value?.info;

  return {
    gpus: nodeInfoData?.gpus?.devices
      ? nodeInfoData.gpus.devices.map((gpu: any) => ({
          gpu: gpu.name,
          memory: gpu.memory?.total_mb,
          architecture: `${gpu.network_architecture?.major}.${gpu.network_architecture?.minor}`,
        }))
      : nodeSpecs.value.gpus,
  };
});

// Market data for GPU name
const { data: apiMarkets, pending: loadingMarkets } = useAPI("/api/markets");

</script> 