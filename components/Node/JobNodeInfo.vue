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
        <tr v-if="nodeSpecs">
          <td>GPU</td>
          <td>{{ nodeSpecs.gpus[0]?.gpu }}</td>
        </tr>
        <tr v-if="nodeSpecs">
          <td>CPU</td>
          <td>{{ nodeSpecs.cpu }}</td>
        </tr>
        <tr v-if="nodeSpecs">
          <td>RAM</td>
          <td>{{ nodeSpecs.ram }} GB</td>
        </tr>
        <tr v-if="nodeSpecs">
          <td>Disk Space</td>
          <td>{{ nodeSpecs.diskSpace }} GB</td>
        </tr>
        <tr v-if="nodeSpecs">
          <td>Country</td>
          <td>{{ nodeSpecs.country }}</td>
        </tr>
        <tr v-if="nodeSpecs">
          <td>Ping</td>
          <td>
            <span v-if="nodeSpecs.bandwidth">
              {{ nodeSpecs.bandwidth?.ping }} ms
            </span>
            <span v-else>Unknown</span>
          </td>
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