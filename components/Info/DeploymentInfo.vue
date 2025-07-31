<template>
  <!-- Deployment Info Section -->
  <tr>
    <td>Solana address</td>
    <td>
      <a
        :href="`https://solscan.io/account/${props.job.address}`"
        target="_blank"
        class="address is-family-monospace"
      >
        {{ props.job.address }}
      </a>
    </td>
  </tr>
  <tr>
    <td>Host address</td>
    <td>
      <nuxt-link
        class="address is-family-monospace"
        :to="`/host/${props.job.node}`"
      >
        {{ props.job.node }}
      </nuxt-link>
    </td>
  </tr>
  <tr>
    <td>Deployer address</td>
    <td>
      <nuxt-link
        class="address is-family-monospace"
        :to="`/deployer/${props.job.project}`"
      >
        {{ props.job.project }}
      </nuxt-link>
    </td>
  </tr>
  <tr>
    <td>GPU pool</td>
    <td>
      <nuxt-link
        class="address is-family-monospace"
        :to="`/markets/${props.job.market}`"
      >
        <span
          v-if="
            apiMarkets &&
            apiMarkets.find((tgm: any) => tgm.address === props.job.market)
          "
        >
          {{ apiMarkets.find((tgm: any) => tgm.address === props.job.market).name }}
        </span>
        <span v-else>{{ props.job.market }}</span>
      </nuxt-link>
    </td>
  </tr>
  <tr>
    <td>Price</td>
    <td>
      <JobPrice 
        :key="`deployment-price-${props.job.isCompleted}-${props.job.timeEnd || 'running'}-${props.job.state}`"
        :job="jobDataForPrice"
        :options="priceOptions"
        :marketsData="apiMarkets"
      />
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
      <span v-if="props.job.timeEnd && props.job.timeStart">
        <SecondsFormatter :seconds="props.job.timeEnd - props.job.timeStart" :showSeconds="true" />
      </span>
      <span v-else-if="props.job.timeStart">
        <SecondsFormatter :seconds="Math.floor(Date.now() / 1000) - props.job.timeStart" :showSeconds="true" />
        <span class="has-text-grey">(max <SecondsFormatter :seconds="props.job.timeout || 7200" />)</span>
      </span>
      <span v-else>-</span>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { PublicKey } from "@solana/web3.js";
import JobPrice from "~/components/Job/Price.vue";
import SecondsFormatter from "~/components/SecondsFormatter.vue";
import type { UseJob } from "~/composables/jobs/useJob";

const props = defineProps<{
  job: UseJob;
  jobDefinition: any;
}>();


// Get NOS price from API
const { data: stats } = useAPI("/api/stats");

// Format time started
const timeStartFormatted = computed(() => {
  if (!props.job.timeStart) return null;
  const date = new Date(props.job.timeStart * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
});

// Get time ago
const timeAgo = computed(() => {
  if (!props.job.timeStart) return null;
  try {
    const now = Date.now();
    const startTime = props.job.timeStart * 1000;
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
const { data: nodeSpecs } = useAPI(`/api/nodes/${props.job.node}/specs`, {
  // @ts-ignore
  disableToastOnError: true,
});

const { data: nodeInfo } = useAPI(
  `https://${props.job.node}.${useRuntimeConfig().public.nodeDomain}/node/info`,
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

const jobDataForPrice = computed(() => {
  return {
    usdRewardPerHour: props.job.usdRewardPerHour,
    timeStart: props.job.timeStart,
    timeEnd: props.job.timeEnd,
    timeout: props.job.timeout,
    state: props.job.state ?? (props.job.isCompleted ? 2 : props.job.timeStart ? 1 : 0),
    market: props.job.market?.toString()
  };
});

const priceOptions = computed(() => {
  return {
    showPerHour: !props.job.isCompleted
  };
});

</script> 