<template>
  <template v-if="props.job">
    <!-- Solana address - hide in job context since it's already shown in header -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Solana Address</span>
        <span class="quick-detail-value">
          <a :href="`https://solscan.io/account/${props.job.address}`" target="_blank" class="address is-family-monospace">
            {{ props.job.address }}
          </a>
        </span>
      </div>
    </div>

    <!-- Host address - hide in job context since it's already shown in header -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Host Address</span>
        <span class="quick-detail-value">
          <span v-if="props.job.node === '11111111111111111111111111111111'" class="has-text-grey-light">Not assigned yet</span>
          <nuxt-link v-else class="address is-family-monospace" :to="`/host/${props.job.node}`">
            {{ props.job.node }}
          </nuxt-link>
        </span>
      </div>
    </div>

    <!-- Deployer address - hide in job context since it's already shown in header -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Deployer Address</span>
        <span class="quick-detail-value">
          <nuxt-link class="address is-family-monospace" :to="`/deployer/${props.job.project}`">
            {{ props.job.project }}
          </nuxt-link>
        </span>
      </div>
    </div>

    <!-- GPU pool - hide in job context since it's already shown in header -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">GPU Pool</span>
        <span class="quick-detail-value">
          <nuxt-link class="address is-family-monospace" :to="`/markets/${props.job.market}`">
            <span v-if="apiMarkets && apiMarkets.find((tgm: any) => tgm.address === props.job.market)">
              {{ apiMarkets.find((tgm: any) => tgm.address === props.job.market)?.name || props.job.market }}
            </span>
            <span v-else>{{ props.job.market }}</span>
          </nuxt-link>
        </span>
      </div>
    </div>

    <!-- Price - hide in job context since it's already shown in header -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Price</span>
        <span class="quick-detail-value">
          <JobPrice 
            :key="`deployment-price-${props.job.isCompleted}-${props.job.timeEnd || 'running'}-${props.job.state}`"
            :job="jobDataForPrice"
            :options="priceOptions"
          />
        </span>
      </div>
    </div>

    <!-- Started - hide in job context since it's already shown in header -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Started</span>
        <span class="quick-detail-value">
          <span v-if="timeStartFormatted">
            {{ timeStartFormatted }}
            <span class="has-text-grey is-size-7"> ({{ timeAgo }})</span>
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </div>

    <!-- Duration - hide in job context since it's already shown in Quick Details -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Duration</span>
        <span class="quick-detail-value">
          <span v-if="props.job.timeEnd && props.job.timeStart">
            {{ formatDuration(props.job.timeEnd - props.job.timeStart) }}
          </span>
          <span v-else-if="props.job.timeStart">
            {{ formatDuration(Math.floor(Date.now() / 1000) - props.job.timeStart) }}
            <span class="has-text-grey is-size-7"> (max {{ formatDuration(props.job.timeout || 7200) }})</span>
          </span>
          <span v-else>-</span>
        </span>
      </div>
    </div>

    <!-- Market -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Market</span>
        <span class="quick-detail-value">
          <nuxt-link class="address is-family-monospace" :to="`/markets/${props.job.market}`">
            <span v-if="apiMarkets && apiMarkets.find((tgm: any) => tgm.address === props.job.market)">
              {{ apiMarkets.find((tgm: any) => tgm.address === props.job.market)?.name || props.job.market }}
            </span>
            <span v-else>{{ props.job.market }}</span>
          </nuxt-link>
        </span>
      </div>
    </div>

    <!-- Job State -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Job State</span>
        <span class="quick-detail-value">
          <span v-if="props.job.state === 0">Queued</span>
          <span v-else-if="props.job.state === 1">Running</span>
          <span v-else-if="props.job.state === 2">Completed</span>
          <span v-else-if="props.job.state === 3">Stopped</span>
          <span v-else>{{ props.job.state }}</span>
        </span>
      </div>
    </div>

    <!-- Timeout -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Timeout</span>
        <span class="quick-detail-value">
          <span>{{ formatDuration(props.job.timeout || 7200) }}</span>
        </span>
      </div>
    </div>
  </template>
  <template v-else>
    <div class="column is-full">
      <p>Job information not available.</p>
    </div>
  </template>
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
  isQueuedJob?: boolean;
  showInJobContext?: boolean;
}>();

const formatDuration = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || (hours > 0 && remainingSeconds >= 0) ) parts.push(`${minutes}m`); // Show minutes if hours are shown or if minutes > 0
  if (remainingSeconds >= 0 || (hours === 0 && minutes === 0) ) parts.push(`${remainingSeconds}s`); // Always show seconds if no h/m, or if s > 0
  
  const result = parts.join(' ');
  return result.length > 0 ? result : '0s';
};


// Get NOS price from API
const { data: stats } = useAPI("/api/stats");

const timeStartFormatted = computed(() => {
  if (!props.job.timeStart) return null;
  const date = new Date(props.job.timeStart * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
});

const timeAgo = computed(() => {
  if (!props.job.timeStart) return null;
  try {
    const now = Date.now();
    const startTime = props.job.timeStart * 1000;
    const diffMs = now - startTime;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return null;
  }
});

const { data: nodeSpecs } = useAPI(`/api/nodes/${props.job.node}/specs`);

const { data: nodeInfo } = useAPI(
  `https://${props.job.node}.${useRuntimeConfig().public.nodeDomain}/node/info`
);

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

<style lang="scss" scoped>
.address {
  word-break: break-all;
  white-space: normal;
  display: inline-block;
  line-height: 1.3;
  font-size: 0.8rem;
}

.quick-detail-item {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .quick-detail-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #7a7a7a;
    text-transform: uppercase;
    margin-bottom: 0.1rem;
  }

  .quick-detail-value {
    font-size: 0.85rem;
    font-weight: 500;
    color: #363636;
    word-break: break-word;

    .has-text-grey {
      font-size: 0.75rem;
    }
  }
}

.no-padding {
  padding: 0 !important;
}

html.dark-mode {
  .quick-detail-item {
    .quick-detail-label {
      color: #b0b0b0;
    }
    .quick-detail-value,
    .quick-detail-value .address,
    .quick-detail-value .has-text-grey {
      color: #ffffff;
    }
    
    .quick-detail-value a,
    .quick-detail-value nuxt-link,
    .quick-detail-value .address {
      color: #10E80C !important; // Nosana green for links in dark mode
    }
    
    .quick-detail-value a:hover,
    .quick-detail-value nuxt-link:hover {
      color: #33ff33 !important; // Lighter green on hover
    }
  }
}
</style> 