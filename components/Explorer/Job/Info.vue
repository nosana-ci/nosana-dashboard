<template>
  <table class="table is-fullwidth is-striped">
    <tbody>
      <tr>
        <td colspan="2" class="has-background-light">
          <h4 class="title is-5">Deployment Info</h4>
        </td>
      </tr>
      <tr>
        <td>Deployments Solana address</td>
        <td>
          <a :href="`https://solscan.io/account/${props.job.address}`" target="_blank" class="address is-family-monospace">
            {{ props.job.address }}
          </a>
        </td>
      </tr>
      <tr>
        <td>Host address</td>
        <td>
          <span v-if="props.job.node.toString() === '11111111111111111111111111111111'">
            Unclaimed
          </span>
          <nuxt-link v-else class="address is-family-monospace" :to="`/nodes/${props.job.node}`">
            {{ props.job.node }}
          </nuxt-link>
        </td>
      </tr>
      <tr>
        <td>Deployer address</td>
        <td>
          <nuxt-link class="address is-family-monospace" :to="`/posters/${props.job.project}`">
            <span>{{ props.job.project }}</span>
          </nuxt-link>
        </td>
      </tr>
      <tr>
        <td>GPU</td>
        <td>
          <nuxt-link class="address is-family-monospace" :to="`/markets/${props.job.market}`">
            <span v-if="
              testgridMarkets &&
              testgridMarkets.find((tgm: any) => tgm.address === props.job.market)
            ">
              {{ testgridMarkets.find((tgm: any) => tgm.address === props.job.market).name }}
            </span>
            <span v-else>{{ props.job.market }}</span>
          </nuxt-link>
        </td>
      </tr>
      <tr>
        <td>Price</td>
        <td>
          <span v-if="loadingMarkets">..</span>
          <span v-else>
            {{ displayPrice }}
          </span>
        </td>
      </tr>
      <tr>
        <td>Started</td>
        <td>
          <span v-if="props.job.timeStart">
            {{
              useDateFormat(
                new Date(props.job.timeStart * 1000),
                "YYYY-MM-DD HH:mm:ss"
              ).value
            }}
            <UseTimeAgo v-slot="{ timeAgo }" :time="new Date(props.job.timeStart * 1000)">
              ({{ timeAgo }})
            </UseTimeAgo>
          </span>
          <span v-else>-</span>
        </td>
      </tr>
      <tr>
        <td>Duration</td>
        <td>
          <span v-if="props.job.timeEnd">
            {{ fmtMSS(props.job.timeEnd - props.job.timeStart) }}
          </span>
          <span v-else-if="props.job.timeStart">
            {{ fmtMSS(Math.floor(timestamp / 1000) - props.job.timeStart) }}
          </span>
          <span v-else> - </span>
          <span v-if="maxDuration"> (max {{ (maxDuration / 3600).toFixed(2) }}h)</span>
        </td>
      </tr>
      <tr v-if="
        props.job.jobDefinition &&
        props.job.jobDefinition.state &&
        props.job.jobDefinition.state['nosana/job-type']
      ">
        <td>Source</td>
        <td v-if="
          props.job.jobDefinition &&
          props.job.jobDefinition.state &&
          props.job.jobDefinition.state['nosana/job-type'] &&
          (props.job.jobDefinition.state['nosana/job-type'] === 'Github' ||
            props.job.jobDefinition.state['nosana/job-type'] === 'github-flow')
        ">
          <a v-if="
            props.job.jobDefinition.state['input/repo'] &&
            props.job.jobDefinition.state['input/commit-sha']
          " :href="props.job.jobDefinition.state['input/repo'].replace('.git', '') +
            '/commit/' +
            props.job.jobDefinition.state['input/commit-sha']" target="_blank">
            {{ props.job.jobDefinition.state["input/commit-sha"] }}
          </a>
        </td>
        <td v-else>Other</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { UseTimeAgo } from "@vueuse/components";
import type { PropType } from 'vue';
import { useAPI } from '~/composables/useAPI';

interface JobDefinition {
  state?: {
    'nosana/job-type'?: string;
    'input/repo'?: string;
    'input/commit-sha'?: string;
  };
  ops?: any[];
}

interface Job {
  address: string;
  node: { toString: () => string };
  market: string;
  project: string;
  price: string;
  timeStart: number;
  timeEnd: number;
  timeout?: number;
  state: string | number;
  jobDefinition: JobDefinition;
  jobResult: any;
  usdRewardPerHour?: number;
}

const props = defineProps({
  job: {
    type: Object as PropType<Job>,
    required: true,
  },
  isJobPoster: {
    type: Boolean,
    default: false,
  },
});

// Pull from /api/markets instead of the composable
const { data: apiMarkets, pending: loadingMarkets } = useAPI('/api/markets');

// Some additional data to get stats, if needed
const { data: stats } = useAPI('/api/stats');

const timestamp = useTimestamp({ interval: 1000 });
const fmtMSS = (s: number) => {
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  
  let result = '';
  if (hours > 0) {
    result += `${hours}h `;
  }
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  result += `${seconds}s`;
  return result;
};

// Price
const displayPrice = computed(() => {
  if (loadingMarkets.value || !apiMarkets.value || !props.job) {
    return 'Could not load market';
  }
  // Find the job's market in the /api/markets array
  const market = apiMarkets.value.find((m: any) => m.address === props.job.market);
  if (!market) {
    return 'Could not find market';
  }
  // If you also want a price in $ using some stats
  const nosPrice = stats.value?.price ?? 0;

  // Completed case
  if (props.job.state === 'COMPLETED' || props.job.state === 2) {
    const usedTime = Math.min(
      props.job.timeEnd - props.job.timeStart,
      props.job.timeout ?? (market.jobTimeout || 0)
    );
    const priceInNos = (parseInt(props.job.price, 10) / 1e6) * usedTime * 1.1;
    return `${priceInNos.toFixed(6)} NOS ${nosPrice ? `($${(nosPrice * priceInNos).toFixed(3)})` : ''
      }`;
  }

  // Running / queued
  if (props.job.price) {
    const pricePerSecond = parseInt(props.job.price, 10) / 1e6;
    return `${(pricePerSecond * 3600 * 1.1).toFixed(3)} NOS/h ${nosPrice
      ? `($${((nosPrice * pricePerSecond) * 3600 * 1.1).toFixed(3)}/h)`
      : ''
      }`;
  }

  return 'Unknown';
});

// Max Duration
const maxDuration = computed(() => {
  if (loadingMarkets.value || !apiMarkets.value || !props.job) return 0;
  // find the job's market in the /api/markets array
  const market = apiMarkets.value.find((m: any) => m.address === props.job.market);
  return props.job && props.job.timeout ? props.job.timeout : (market?.jobTimeout ?? 0);
});

// We'll re-use the data from /api/markets in another element, so let's keep that naming:
const { data: testgridMarkets } = useAPI('/api/markets');
</script>
