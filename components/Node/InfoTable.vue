<template>
  <table class="table is-fullwidth mt-5 mb-6">
    <tbody>
      <!-- General Section -->
      <tr>
        <td colspan="2" class="has-background-light">
          <h4 class="title is-5 mb-0">General</h4>
        </td>
      </tr>
      <tr>
        <td>Node</td>
        <td>{{ address }}</td>
      </tr>
      <tr>
        <td>NOS Balance</td>
        <td>
          <span v-if="balance">{{ balance.uiAmount.toFixed(2) }}</span>
          <span v-else>-</span>
        </td>
      </tr>
      <tr>
        <td>NOS Staked</td>
        <td>
          <span v-if="nosStaked && nosStaked.amount">{{
            (nosStaked.amount / 1e6).toFixed(2)
          }}</span>
          <span v-else>-</span>
        </td>
      </tr>
      <tr>
        <td>SOL Balance</td>
        <td>
          <span v-if="solBalance">{{ (solBalance / 1e9).toFixed(2) }}</span>
        </td>
      </tr>
      <tr v-if="jobs && jobs.totalJobs">
        <td>Jobs ran</td>
        <td>
          <span>{{ jobs.totalJobs }}</span>
        </td>
      </tr>
      <tr v-if="nodeStatus">
        <td>Status</td>
        <td style="vertical-align: middle">
          <div
            v-if="nodeStatus === 'QUEUED'"
            data-tooltip="Node is queued in market"
            style="width: fit-content"
            class="is-flex"
          >
            <ExplorerJobStatus
              :status="'QUEUED'"
              image-only
            ></ExplorerJobStatus>
          </div>
          <div
            v-else-if="nodeStatus === 'RUNNING'"
            data-tooltip="Node is running a job"
            style="width: fit-content"
            class="is-flex"
          >
            <ExplorerJobStatus
              image-only
              :status="'RUNNING'"
            ></ExplorerJobStatus>
          </div>
          <span v-else>-</span>
        </td>
      </tr>
      <tr v-if="nodeStatus === 'QUEUED' && nodeMarket && nodeMarket.length > 0">
        <td>Market</td>
        <td>
          <nuxt-link
            :to="`/markets/${nodeMarket[0].address.toString()}`"
            class="address is-family-monospace"
            >{{ nodeMarket[0].address.toString() }}</nuxt-link
          >
        </td>
      </tr>
      <tr v-if="nodeStatus === 'RUNNING' && nodeRuns && nodeRuns.length > 0">
        <td>Running job</td>
        <td>
          <nuxt-link
            :to="`/jobs/${nodeRuns[0].account.job}`"
            class="address is-family-monospace"
            >{{ nodeRuns[0].account.job }}</nuxt-link
          >
        </td>
      </tr>
      <!-- <template v-if="nodeStatus || (jobs && jobs.length)">
              <tr>
                <td>Node Uptime</td>
                <td v-if="!nodeInfo || !nodeInfo.uptime">Offline</td>
                <td v-else>
                  {{ (nodeInfo.uptime / (3600 * 1000)).toFixed(1) }} hours
                </td>
              </tr>
            </template> -->

      <!-- TODO: First need to include price in the jobs.all() in SDK-->
      <!-- <tr v-if="jobs">
                <td>Total NOS earned</td>
                <td>
                  <span>{{
                    jobs.reduce((a, b) => {
                      return a + b.price && b.timeEnd && b.timeStart
                        ? (b.price / 1e6) * (b.timeEnd - b.timeStart)
                        : 0;
                    }, 0)
                  }}</span>
                </td>
              </tr> -->

      <!-- Specifications Section -->
      <tr>
        <td colspan="2" class="has-background-light">
          <h4 class="title is-5 mb-0">Specifications</h4>
        </td>
      </tr>
      <tr>
        <td>GPU</td>
        <td v-if="!nodeSpecs">-</td>
        <td v-else>{{ nodeSpecs.gpus[0]?.gpu }}</td>
      </tr>
      <tr>
        <td>CPU</td>
        <td v-if="!nodeSpecs">-</td>
        <td v-else>{{ nodeSpecs.cpu }}</td>
      </tr>
      <tr>
        <td>RAM (GB)</td>
        <td v-if="!nodeSpecs">-</td>
        <td v-else>{{ nodeSpecs.ram }}</td>
      </tr>
      <tr>
        <td>Disk Space (GB)</td>
        <td v-if="!nodeSpecs">-</td>
        <td v-else>{{ nodeSpecs.diskSpace }}</td>
      </tr>
      <tr>
        <td>Country</td>
        <td v-if="!nodeSpecs">-</td>
        <td v-else>{{ nodeSpecs.country }}</td>
      </tr>

      <!-- Performance Section -->
      <tr>
        <td colspan="2" class="has-background-light">
          <h4 class="title is-5 mb-0">Performance</h4>
        </td>
      </tr>
      <tr>
        <td>
          <div style="display: flex" class="tooltip">
            <p>Performance Rank</p>
            <span class="info-icon"></span>
            <div class="tooltip-text">
              <p>
                An aggregated performance ranking based on all leaderboard
                positions of the node compared to all other nodes in the market.
              </p>
            </div>
          </div>
        </td>
        <td v-if="!nodeRanking">-</td>
        <td v-else>{{ nodeRanking.performanceRank }}</td>
      </tr>
      <tr>
        <td>
          <div style="display: flex" class="tooltip">
            <p>Stability Rank</p>
            <span class="info-icon"></span>
            <div class="tooltip-text">
              <p>
                An aggregated stability ranking based on the nodes performance
                variance. The less variance the better.
              </p>
            </div>
          </div>
        </td>
        <td v-if="!nodeRanking">-</td>
        <td v-else>{{ nodeRanking.stabilityRank }}</td>
      </tr>
      <tr>
        <td>Average Download Speed (Mbps)</td>
        <td
          v-if="
            !genericBenchmarkResponse || !genericBenchmarkResponse.data.length
          "
        >
          -
        </td>
        <td v-else>
          {{ genericBenchmarkResponse.data[0]?.metrics.internetSpeedDownload }}
        </td>
      </tr>
      <tr>
        <td>Average Upload Speed (Mbps)</td>
        <td
          v-if="
            !genericBenchmarkResponse || !genericBenchmarkResponse.data.length
          "
        >
          -
        </td>
        <td v-else>
          {{ genericBenchmarkResponse.data[0]?.metrics.internetSpeedUpload }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { PublicKey } from "@solana/web3.js";
import { useAPI } from "../../composables/useAPI";
import { useMarkets } from "../../composables/useMarkets";
import { useSDK } from "../../composables/useSDK";

interface Props {
  nodeId: string;
}

interface NodeRanking {
  node: string;
  performanceRank: number;
  stabilityRank: number;
  participationRate: number;
}

interface JobsData {
  totalJobs?: number;
}

const props = defineProps<Props>();

const { nosana } = useSDK();
const { markets, getMarkets, loadingMarkets } = useMarkets();
const { data: testgridMarkets, pending: loadingTestgridMarkets } = useAPI(
  "/api/markets",
  { default: () => [] }
);

if (!markets.value) {
  getMarkets();
}

console.log(markets.value);

const address = ref<string | null>(null);
const balance = ref<any | null>(null);
const solBalance = ref<any | null>(null);
const nosStaked = ref<any | null>(null);
const nodeStatus = ref<string | null>(null);
const nodeMarket = ref<any>(null);
const nodeRuns = ref<any>(null);
const nodeRanking = ref<NodeRanking | null>(null);
const jobs = ref<JobsData>({});

const nodeSpecsUrl = computed(() => `/api/nodes/${props.nodeId}/specs`);
const { data: nodeSpecs } = useAPI(nodeSpecsUrl, {
  watch: [nodeSpecsUrl],
  default: () => null,
});

const genericBenchmarkUrl = computed(
  () => `/api/benchmarks/generic-benchmark-data?node=${props.nodeId}`
);
const { data: genericBenchmarkResponse } = useAPI(genericBenchmarkUrl, {
  watch: [genericBenchmarkUrl],
  default: () => ({ data: [] }),
});

const getNodeInfo = async () => {
  try {
    const pk = new PublicKey(props.nodeId);
    address.value = pk.toString();

    try {
      balance.value = await nosana.value.solana.getNosBalance(address.value);
      solBalance.value = await nosana.value.solana.getSolBalance(address.value);
      try {
        nosStaked.value = await nosana.value.stake.get(address.value);
      } catch (error) {
        console.error("cant fetch stake", error);
      }
    } catch (e) {
      console.error("cant get balance", e);
    }
  } catch (error) {
    console.error("not a valid address", error);
    address.value = null;
  }

  const nodesInMarkets = markets?.value?.flatMap((market) => {
    return market.queueType === 1
      ? market.queue.map((data: any) => data.toString())
      : [];
  });

  if (nodesInMarkets?.includes(address.value)) {
    nodeStatus.value = "QUEUED";
    nodeMarket.value = markets?.value?.filter((m) =>
      m.queue.find((a: any) => a.toString() === address.value?.toString())
    );
  }

  nodeRuns.value = await nosana.value.jobs.getRuns([
    {
      memcmp: {
        offset: 40,
        bytes: props.nodeId,
      },
    },
  ]);

  if (nodeRuns.value && nodeRuns.value.length) {
    nodeStatus.value = "RUNNING";
  }

  if (nodeSpecs?.value?.marketAddress) {
    const { data } = await useAPI(
      `/api/benchmarks/node-ranking?market=${nodeSpecs?.value?.marketAddress}`
    );
    nodeRanking.value =
      data.value.find((ranking: NodeRanking) => {
        return ranking.node === address.value;
      }) || null;
  }
};

watch(
  [loadingTestgridMarkets, loadingMarkets],
  ([newTestgridLoading, newMarketsLoading]) => {
    if (!newTestgridLoading && !newMarketsLoading) {
      getNodeInfo();
    }
  }
);
</script>

<style lang="scss" scoped>
.info-icon {
  width: 20px;
  height: 20px;
  background-image: url("https://www.systemuicons.com/images/icons/info_circle.svg");
}
</style>
