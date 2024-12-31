<template>
  <table class="table is-fullwidth is-striped">
    <tbody>
      <tr>
        <td colspan="2" class="has-background-light">
          <h4 class="title is-5">Job Info</h4>
        </td>
      </tr>
      <tr>
        <td>Job</td>
        <td>
          <span class="address is-family-monospace">{{ job.address }}</span>
        </td>
      </tr>
      <tr>
        <td>Node</td>
        <td>
          <span v-if="job.node.toString() === '11111111111111111111111111111111'
          ">Unclaimed</span>
          <nuxt-link v-else class="address is-family-monospace" :to="`/account/${job.node}`">
            {{ job.node }}
          </nuxt-link>
        </td>
      </tr>
      <tr>
        <td>Market</td>
        <td>
          <nuxt-link :to="`/markets/${job.market}`" class="address is-family-monospace">
            <span v-if="testgridMarkets && testgridMarkets.find((tgm: any) => tgm.address === job.market)">
              {{ testgridMarkets.find((tgm: any) => tgm.address === job.market).name }}
            </span>
            <span v-else>{{ job.market }}</span>
          </nuxt-link>
        </td>
      </tr>
      <tr>
        <td>Poster</td>
        <td>
          <nuxt-link class="address is-family-monospace" :to="`/account/${job.project}`">
            <span>{{ job.project }}</span>
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
          <span v-if="job.timeStart">
            {{
              useDateFormat(
                new Date(job.timeStart * 1000),
                "YYYY-MM-DD HH:mm:ss"
              ).value
            }}
            <UseTimeAgo v-slot="{ timeAgo }" :time="new Date(job.timeStart * 1000)">
              ({{ timeAgo }})
            </UseTimeAgo>
          </span>
          <span v-else>-</span>
        </td>
      </tr>
      <tr>
        <td>Duration</td>
        <td>
          <span v-if="job.timeEnd">
            {{ fmtMSS(job.timeEnd - job.timeStart) }}
          </span>
          <span v-else-if="job.timeStart">
            {{ fmtMSS(Math.floor(timestamp / 1000) - job.timeStart) }}
          </span>
          <span v-else> - </span>
          <span v-if="maxDuration"> (max {{ Math.round(maxDuration / 60) }}m)</span>
        </td>
      </tr>
      <tr>
        <td>Type</td>
        <td>
          <ExplorerJobType v-if="job.jobDefinition" :ipfs="job.jobDefinition" :text="true" class="ml-1" />
        </td>
      </tr>
      <tr>
        <td>Trigger</td>
        <td>
          <ExplorerJobTrigger v-if="job.jobDefinition" :ipfs="job.jobDefinition" :text="true" class="ml-1" />
        </td>
      </tr>
      <tr v-if="job.jobDefinition &&
        job.jobDefinition.state &&
        job.jobDefinition.state['nosana/job-type']">
        <td>Source</td>
        <td v-if="job.jobDefinition &&
          job.jobDefinition.state &&
          job.jobDefinition.state['nosana/job-type'] &&
          (job.jobDefinition.state['nosana/job-type'] === 'Github' ||
            job.jobDefinition.state['nosana/job-type'] === 'github-flow')
        ">
          <a v-if="job.jobDefinition.state['input/repo'] &&
            job.jobDefinition.state['input/commit-sha']
          " :href="job.jobDefinition.state['input/repo'].replace('.git', '') +
            '/commit/' +
            job.jobDefinition.state['input/commit-sha']
            " target="_blank">
            {{ job.jobDefinition.state["input/commit-sha"] }}
          </a>
        </td>
        <td v-else>Other</td>
      </tr>
      <tr v-if="job && job.state === 1">
        <td>Exposed Service</td>
        <td>
          <span
            v-if="job.jobDefinition && job.jobDefinition.ops && job.jobDefinition.ops[0] && job.jobDefinition.ops[0].args.expose">
            <a :href="`https://${jobId}.node.k8s.prd.nos.ci`" target="_blank">Visit service</a>
          </span>
          <span v-else>Not exposed</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { UseTimeAgo } from "@vueuse/components";

const props = defineProps({
  job: {
    required: true
  },
});
const job: Ref<any> = ref(props.job);

const { data: testgridMarkets, pending: loadingTestgridMarkets } = useAPI('/api/markets');
const { data: stats, pending: loadingStats } = useAPI('/api/stats');
const jobStatus: Ref<string | null> = ref(null);

const { markets, getMarkets, loadingMarkets } = useMarkets();
// Fetch markets if not already loaded
if (!markets.value) {
  getMarkets();
}

const timestamp = useTimestamp({ interval: 1000 });
const fmtMSS = (s: number) => {
  return (s - (s %= 60)) / 60 + (s > 9 ? "m:" : "m:0") + s + "s";
};
// Compute the display price based on the job status
const displayPrice: ComputedRef<string> = computed(() => {
  if (loadingMarkets.value || !markets.value || !job.value) return 'Could not load market';
  const market = markets.value.find((m) => m.address.toString() === job.value.market);
  if (!market) return 'Could not find market';
  const nosPrice = stats.value && stats.value[0] && stats.value[0].price ? stats.value[0].price : 0;

  if (job.value.state === 'COMPLETED' || job.value.state === 2 || jobStatus.value === 'COMPLETED') {
    const priceInNos = ((parseInt(job.value.price) / 1e6) * Math.min(job.value.timeEnd - job.value.timeStart, job.value.timeout ? job.value.timeout : market.jobTimeout));
    return `${priceInNos.toFixed(6)} NOS ${nosPrice ? `($${((nosPrice * priceInNos)).toFixed(2)})` : ''}`;
  } else {
    return job.value.price
      ? `${(parseInt(job.value.price) / 1e6)} NOS/s ${nosPrice ? `($${((nosPrice * (parseInt(job.value.price) / 1e6)) * 3600).toFixed(2)} / h)` : ''}`
      : 'Unknown';
  }
});
// Compute the max duration based on the market
const maxDuration: ComputedRef<number> = computed(() => {
  if (loadingMarkets.value || !markets.value || !job.value) return 0;
  const market = markets.value.find((m) => m.address.toString() === job.value.market);
  return market && market.jobTimeout ? market.jobTimeout.toNumber() : 0;
});

</script>
