`<template>
  <div>
    <table class="table is-fullwidth">
      <tbody>
        <tr>
          <td colspan="2" class="has-background-light">
            <h4 class="title is-5">Node Info</h4>
          </td>
        </tr>
        <!-- Specifications -->
        <tr v-if="nodeSpecs?.gpus && nodeSpecs.gpus.length > 0">
          <td>GPU</td>
          <td>{{ nodeSpecs.gpus[0]?.gpu }}</td>
        </tr>
        <tr v-if="nodeSpecs?.cpu">
          <td>CPU</td>
          <td>{{ nodeSpecs.cpu }}</td>
        </tr>
        <tr v-if="nodeSpecs?.ram">
          <td>RAM</td>
          <td>{{ nodeSpecs.ram.toFixed(1) }} GB</td>
        </tr>
        <tr v-if="nodeSpecs?.diskSpace">
          <td>Disk Space</td>
          <td>{{ nodeSpecs.diskSpace.toFixed(1) }} GB</td>
        </tr>
        <tr v-if="nodeSpecs?.country">
          <td>Country</td>
          <td>{{ nodeSpecs.country }}</td>
        </tr>
        <tr v-if="nodeSpecs?.bandwidth">
          <td>Ping</td>
          <td>{{ nodeSpecs.bandwidth.ping.toFixed(1) }} ms</td>
        </tr>
        <tr v-if="nodeSpecs?.bandwidth">
          <td>Download Speed</td>
          <td>{{ nodeSpecs.bandwidth.download.toFixed(1) }} Mbps</td>
        </tr>
        <tr v-if="nodeSpecs?.bandwidth">
          <td>Upload Speed</td>
          <td>{{ nodeSpecs.bandwidth.upload.toFixed(1) }} Mbps</td>
        </tr>
        <tr>
          <td>
            <span class="is-flex-inline">
              <span>Performance Rank</span>
              <span class="has-tooltip-arrow ml-1" style="vertical-align: middle;" data-tooltip="An aggregated performance ranking based on all leaderboard positions of the node compared to all other nodes in the market.">
                <img src="~/assets/img/icons/info.svg" />
              </span>
            </span>
          </td>
          <td v-if="!nodeRanking">-</td>
          <td v-else>{{ nodeRanking.performanceRank }}</td>
        </tr>
        <tr>
          <td>
            <span class="">
              <span>Stability Rank</span>
              <span class="has-tooltip-arrow ml-1" style="vertical-align: middle;" data-tooltip="An aggregated stability ranking based on the nodes performance variance. The less variance the better.">
                <img src="~/assets/img/icons/info.svg" />
              </span>
            </span>
          </td>
          <td v-if="!nodeRanking">-</td>
          <td v-else>{{ nodeRanking.stabilityRank }}</td>
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
const { data: nodeSpecs, pending: loadingSpecs } = useAPI(`/api/nodes/${props.address}/specs`, {
  // @ts-ignore TODO: add to useAPI opts type
  disableToastonError: true,
});

// When specs are loaded, retrieve node ranking
let rankingAPInstance: any = null;
watch(nodeSpecs, (specs) => {
  if (specs?.marketAddress) {
    if (!rankingAPInstance) {
      rankingAPInstance = useAPI(`/api/benchmarks/node-ranking?market=${specs.marketAddress}`);
    }
  }
})

interface NodeRanking {
  node: string;
  performanceRank: number;
  stabilityRank: number;
  participationRate: number;
}

const nodeRanking: ComputedRef<NodeRanking | null> = computed(() => {
  if (rankingAPInstance && rankingAPInstance.data && rankingAPInstance.data.value) {
    return rankingAPInstance.data.value.find((ranking: NodeRanking) => {
      return ranking.node === props.address;
    }) || null;
  }
  return null;
});
</script>`