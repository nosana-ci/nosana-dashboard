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
          <span v-if="node.toString() === '11111111111111111111111111111111'">
            Unclaimed
          </span>
          <nuxt-link
            v-else
            class="address is-family-monospace"
            :to="`/nodes/${node}`"
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
            :to="`/posters/${project}`"
          >
            <span>{{ project }}</span>
          </nuxt-link>
        </td>
      </tr>
      <tr>
        <td>GPU</td>
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
          <span v-if="loadingMarkets">..</span>
          <span v-else>
            {{ displayPrice }}
          </span>
        </td>
      </tr>
      <tr>
        <td>Started</td>
        <td>
          <span v-if="timeStart">
            {{
              useDateFormat(new Date(timeStart * 1000), "YYYY-MM-DD HH:mm:ss")
                .value
            }}
            <UseTimeAgo v-slot="{ timeAgo }" :time="new Date(timeStart * 1000)">
              ({{ timeAgo }})
            </UseTimeAgo>
          </span>
          <span v-else>-</span>
        </td>
      </tr>
      <tr>
        <td>Duration</td>
        <td>
          <span v-if="timeEnd">
            {{ fmtMSS(timeEnd - timeStart) }}
          </span>
          <span v-else-if="timeStart">
            <SecondsFormatter
              v-if="timestamp"
              :seconds="Math.floor(timestamp / 1000) - timeStart"
              :showSeconds="true"
            />
          </span>
          <span v-else> - </span>
          <span v-if="timeout ? timeout : (onChainMarket?.jobTimeout ?? 0)">
            (max
            <SecondsFormatter
              :seconds="timeout ? timeout : (onChainMarket?.jobTimeout ?? 0)"
            />)
          </span>
        </td>
      </tr>
      <tr
        v-if="
          jobDefinition &&
          jobDefinition.state &&
          jobDefinition.state['nosana/job-type']
        "
      >
        <td>Source</td>
        <td
          v-if="
            jobDefinition &&
            jobDefinition.state &&
            jobDefinition.state['nosana/job-type'] &&
            (jobDefinition.state['nosana/job-type'] === 'Github' ||
              jobDefinition.state['nosana/job-type'] === 'github-flow')
          "
        >
          <a
            v-if="
              jobDefinition.state['input/repo'] &&
              jobDefinition.state['input/commit-sha']
            "
            :href="
              jobDefinition.state['input/repo'].replace('.git', '') +
              '/commit/' +
              jobDefinition.state['input/commit-sha']
            "
            target="_blank"
          >
            {{ jobDefinition.state["input/commit-sha"] }}
          </a>
        </td>
        <td v-else>Other</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { UseTimeAgo } from "@vueuse/components";

import { useAPI } from "~/composables/useAPI";
import { PublicKey } from "@solana/web3.js";

interface Props {
  address: string;
  node: string;
  project: PublicKey;
  market: PublicKey;
  price: number;
  timeStart: number;
  timeEnd: number;
  timeout: number;
  jobDefinition: any;
  isCompleted: boolean;
}

const {
  address,
  node,
  project,
  market,
  price,
  timeStart,
  timeEnd,
  timeout,
  jobDefinition,
  isCompleted,
} = defineProps<Props>();

// Pull from /api/markets instead of the composable
const { data: apiMarkets, pending: loadingMarkets } = useAPI("/api/markets");

// Some additional data to get stats, if needed
const { data: stats } = useAPI("/api/stats");

const onChainMarket = computed(() => {
  return apiMarkets.value?.find((m: any) => m.address === market);
});

const timestamp = useTimestamp({ interval: 1000 });
const fmtMSS = (s: number) => {
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  let result = "";
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
  if (loadingMarkets.value || !apiMarkets.value) {
    return "Could not load market";
  }
  // Find the job's market in the /api/markets array
  const market2 = apiMarkets.value.find((m: any) => m.address === market);
  if (!market2) {
    return "Could not find market";
  }
  // If you also want a price in $ using some stats
  const nosPrice = stats.value?.price ?? 0;

  // Completed case
  if (isCompleted) {
    const usedTime = Math.min(
      timeEnd - timeStart,
      timeout ?? (market2.jobTimeout || 0)
    );
    const priceInNos = (parseInt(`${price}`, 10) / 1e6) * usedTime * 1.1;
    return `${priceInNos.toFixed(6)} NOS ${
      nosPrice ? `($${(nosPrice * priceInNos).toFixed(3)})` : ""
    }`;
  }

  // Running / queued
  if (price) {
    const pricePerSecond = parseInt(`${price}`, 10) / 1e6;
    return `${(pricePerSecond * 3600 * 1.1).toFixed(3)} NOS/h ${
      nosPrice
        ? `($${(nosPrice * pricePerSecond * 3600 * 1.1).toFixed(3)}/h)`
        : ""
    }`;
  }

  return "Unknown";
});
</script>
