<template>
  <div class="box">
    <div v-if="loading">Loading..</div>
    <div v-else>
      <div v-if="address">
        <div
          class="is-flex is-align-items-center is-justify-content-space-between mb-4"
        >
          <h3 class="title is-5 address is-family-monospace my-0">
            <span
              v-if="
                address.toString() ===
                'FEEw3nDocYSyrLT4HPjibjYuaNekakWNmasNvEx3nHKi'
              "
              >Nosana Test Grid</span
            >
            <span v-else>{{ address }}</span>
          </h3>
        </div>

        <table class="table is-fullwidth is-striped mt-5 mb-6">
          <tbody>
            <tr>
              <td>NOS Balance</td>
              <td>
                <span v-if="balance">{{ balance.uiAmount }}</span> NOS
              </td>
            </tr>
            <tr>
              <td>SOL Balance</td>
              <td>
                <span v-if="solBalance">{{ solBalance / 1e9 }}</span> SOL
              </td>
            </tr>
            <tr v-if="jobs && nodeNfts && nodeNfts.length > 0">
              <td>Jobs ran</td>
              <td>
                <span>{{ jobs.length }}</span>
              </td>
            </tr>
            <tr v-if="jobs && nodeNfts && nodeNfts.length > 0">
              <td>Node Access Key</td>
              <td style="vertical-align: middle">
                <div
                  v-for="nft in nodeNfts"
                  data-tooltip="Node Access Key found"
                  style="width: fit-content"
                  class="is-flex"
                >
                  <JobStatus :status="'COMPLETED'" image-only></JobStatus>
                  <span class="address is-family-monospace ml-2">{{
                    Object.values(testgridMarkets).find(
                      (m) => m.collection === nft.collection.address.toString(),
                    )
                      ? Object.values(testgridMarkets).find(
                          (m) =>
                            m.collection === nft.collection.address.toString(),
                        ).name
                      : nft.collection.address.toString()
                  }}</span>
                </div>
              </td>
            </tr>
            <tr v-if="jobs && nodeNfts && nodeNfts.length > 0">
              <td>Status</td>
              <td style="vertical-align: middle">
                <div
                  v-if="nodeStatus === 'QUEUED'"
                  data-tooltip="Node is queued in market"
                  style="width: fit-content"
                  class="is-flex"
                >
                  <JobStatus :status="'QUEUED'" image-only></JobStatus>
                </div>
                <div
                  v-else-if="nodeStatus === 'RUNNING'"
                  data-tooltip="Node is running a job"
                  style="width: fit-content"
                  class="is-flex"
                >
                  <JobStatus image-only :status="'RUNNING'"></JobStatus>
                </div>
                <span v-else>-</span>
              </td>
            </tr>
            <tr
              v-if="
                nodeStatus === 'QUEUED' && nodeMarket && nodeMarket.length > 0
              "
            >
              <td>Market</td>
              <td>
                <nuxt-link
                  :to="`/jobs/${nodeMarket[0].address.toString()}`"
                  class="address is-family-monospace"
                  >{{ nodeMarket[0].address.toString() }}</nuxt-link
                >
              </td>
            </tr>
            <tr
              v-if="nodeStatus === 'RUNNING' && nodeRuns && nodeRuns.length > 0"
            >
              <td>Running job</td>
              <td>
                <nuxt-link
                  :to="`/jobs/${nodeRuns[0].pubkey.toString()}`"
                  class="address is-family-monospace"
                  >{{ nodeRuns[0].pubkey.toString() }}</nuxt-link
                >
              </td>
            </tr>
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
          </tbody>
        </table>

        <div v-if="nodeNfts && nodeNfts.length > 0">
          <JobList title="Inferences by this node" :jobs="jobs"></JobList>
        </div>
      </div>
      <div v-else>Address not found</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PublicKey, Connection } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
const { data: testgridMarkets, pending: loadingTestgridMarkets } = useAPI('/api/markets', { default: () => [] });


const { params } = useRoute();
const { nosana, network } = useSDK();
const { getJobs } = useJobs();
const { markets } = useMarkets();
const address: Ref<string | null> = ref(null);
const balance: Ref<any | null> = ref(null);
const solBalance: Ref<any | null> = ref(null);
const nodeStatus: Ref<any | null> = ref(null);
const nodeNfts: Ref<Array<any>> = ref([]);
const nodeMarket: Ref<any> = ref(null);
const nodeRuns: Ref<any> = ref(null);
const loading: Ref<boolean> = ref(false);
const jobs: Ref<Array<any> | null> = ref(null);

// create connection for Metaplex
// TODO move this to SDK or plugin(?)
const web3 = new Connection(
  network.value === 'devnet'
    ? 'https://rpc.ironforge.network/devnet?apiKey=01HXY5BNJRYXRW05J6NE9YFQ3M'
    : 'https://rpc.ironforge.network/mainnet?apiKey=01HXY5BNJRYXRW05J6NE9YFQ3M',
);
const metaplex = new Metaplex(web3);

watch(network, () => {
  address.value = null;
  balance.value = null;
  jobs.value = null;
  getAddress();
});

const getAddress = async () => {
  loading.value = true;
  try {
    const pk = new PublicKey(String(params.id));
    address.value = pk.toString();

    try {
      jobs.value = await getJobs({ node: address.value });
    } catch (e) {
      console.log('cant get jobs of node', e);
    }

    try {
      balance.value = await nosana.value.solana.getNosBalance(address.value);
      solBalance.value = await nosana.value.solana.getSolBalance(address.value);
    } catch (e) {
      console.error('cant get balance', e);
    }

    try {
      const nfts = await metaplex
        .nfts()
        .findAllByOwner({ owner: new PublicKey(address.value) });

      for (let i = 0; i < nfts.length; i++) {
        const nft = nfts[i];
        for (const market in testgridMarkets) {
          const marketObject =
            testgridMarkets[market as keyof typeof testgridMarkets];
          if (
            nft &&
            nft.collection &&
            nft.collection.verified &&
            nft.collection.address.toString() === marketObject.collection
          ) {
            nodeNfts.value.push(nft);
          }
        }
      }
    } catch (e) {
      console.error('cant get nft', e);
    }
  } catch (error) {
    console.error('not a valid address', error);
    address.value = null;
  }

  // get market where node is in
  const nodesInMarkets = markets?.value?.flatMap((market) => {
    return market.queueType === 1
      ? market.queue.map((data: any) => data.toString())
      : [];
  });

  if (nodesInMarkets?.includes(address.value)) {
    nodeStatus.value = 'QUEUED';
    nodeMarket.value = markets?.value?.filter((m) =>
      m.queue.find((a: any) => a.toString() === address.value?.toString()),
    );
  }

  nodeRuns.value = jobs.value.filter((j) => j.state === 1);
  // get active runs of node
  if (nodeRuns.value.length) {
    nodeStatus.value = 'RUNNING';
  }
  loading.value = false;
};

getAddress();

// useIntervalFn(getMarkets, 30000);
</script>
<style lang="scss" scoped></style>
