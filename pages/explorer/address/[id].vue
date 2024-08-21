<template>
  <div class="box">
    <div v-if="loading">Loading..</div>
    <div v-else>
      <div v-if="address">
        <div class="is-flex is-align-items-center is-justify-content-space-between mb-4">
          <h3 class="title is-5 address is-family-monospace my-0">
            <span v-if="address.toString() ===
      'FEEw3nDocYSyrLT4HPjibjYuaNekakWNmasNvEx3nHKi'
      ">Nosana Test Grid</span>
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
                <span>{{ jobs.totalJobs }}</span>
              </td>
            </tr>
            <tr v-if="jobs && nodeNfts && nodeNfts.length > 0">
              <td>Node Access Key</td>
              <td style="vertical-align: middle">
                <div v-for="nft in nodeNfts" data-tooltip="Node Access Key found" style="width: fit-content"
                  class="is-flex">
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
                <div v-if="nodeStatus === 'QUEUED'" data-tooltip="Node is queued in market" style="width: fit-content"
                  class="is-flex">
                  <ExplorerJobStatus :status="'QUEUED'" image-only></ExplorerJobStatus>
                </div>
                <div v-else-if="nodeStatus === 'RUNNING'" data-tooltip="Node is running a job"
                  style="width: fit-content" class="is-flex">
                  <ExplorerJobStatus image-only :status="'RUNNING'"></ExplorerJobStatus>
                </div>
                <span v-else>-</span>
              </td>
            </tr>
            <tr v-if="nodeStatus === 'QUEUED' && nodeMarket && nodeMarket.length > 0
      ">
              <td>Market</td>
              <td>
                <nuxt-link :to="`/explorer/markets/${nodeMarket[0].address.toString()}`" class="address is-family-monospace">{{
      nodeMarket[0].address.toString() }}</nuxt-link>
              </td>
            </tr>
            <tr v-if="nodeStatus === 'RUNNING' && nodeRuns && nodeRuns.length > 0">
              <td>Running job</td>
              <td>
                <nuxt-link :to="`/explorer/jobs/${nodeRuns[0].account.job}`" class="address is-family-monospace">{{
      nodeRuns[0].account.job }}</nuxt-link>
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
        <div v-if="jobs && jobs.jobs && jobs.jobs.length > 0">
          <ExplorerJobList :per-page="limit" :total-jobs="jobs ? jobs.totalJobs : null" v-model:page="page" v-model:state="state"
          :loading-jobs="loadingJobs" title="Inferences by this node" :jobs="jobs ? jobs.jobs : null"
          >
        </ExplorerJobList>
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
const config = useRuntimeConfig();

const { params } = useRoute();
const { nosana } = useSDK();
const { markets } = useMarkets();
const address: Ref<string | null> = ref(null);
const balance: Ref<any | null> = ref(null);
const solBalance: Ref<any | null> = ref(null);
const nodeStatus: Ref<any | null> = ref(null);
const nodeNfts: Ref<Array<any>> = ref([]);
const nodeMarket: Ref<any> = ref(null);
const nodeRuns: Ref<any> = ref(null);
const loading: Ref<boolean> = ref(false);
const page: Ref<number> = ref(1);
const state: Ref<number | null> = ref(null);
const jobStateMapping: any = {
  0: 'QUEUED',
  1: 'RUNNING',
  2: 'COMPLETED',
  3: 'STOPPED',
};
const limit: Ref<number> = ref(10);
const jobsUrl = computed(() => { return `/api/jobs?limit=${limit.value}&offset=${(page.value - 1) * limit.value}${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ''}${`&node=${params.id}`}` })
const { data: jobs, pending: loadingJobs, refresh: refreshJobs } = useAPI(jobsUrl, { watch: [jobsUrl] });

// create connection for Metaplex
// TODO move this to SDK or plugin(?)
const web3 = new Connection(config.public.rpcUrl);
const metaplex = new Metaplex(web3);

const getAddress = async () => {
  loading.value = true;
  try {
    const pk = new PublicKey(String(params.id));
    address.value = pk.toString();

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
      // TODO: Get from blockchain (or store in backend)
      const marketCollections = {
        "3XGECQon74HQwPJuZjgCwqdQ5Nt3wktZ9fcavcDN9qB2": "5uSnGLSTpYH8FoB7xpVCzE2wGhQgtP1bPYd8kBQshxfe",
        "7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq": "ugCe55FzswF1phYMpexUVXzo3Uqt2sNTHTcjsMiiAt6",
        "RXP7JK8MTY4uPJng4UjC9ZJdDDSG6wGr8pvVf3mwgXF": "8MKuo7k5kkuEP7sge4PbvReoiC7kkouqiMRT7911ctQk",
        "7RepDm4Xt9k6qV5oiSHvi8oBoty4Q2tfBGnCYjFLj6vA": "4N3fpCsPkSD9jthjhb6u3xiShKV8JPrqAEH5U4ZEzr2E",
        "CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ": "7DADwbsh7LZEq72piFuw1ZcMPL969nNcSxiVhP4szNG5",
        "47LQHZwT7gfVoBDYnRYhsYv6vKk8a1oW3Y3SdHAp1gTr": "CqKAq74fyWz75hjJQnx7TBgZzsbkxNuYx7fwSd9fhsx4",
        "EzuHhkrhmV98HWzREsgLenKj2iHdJgrKmzfL8psP8Aso": "GoDu9vJejoctovm5GcFuvZbsiAgZyqGC7wVS5gJcM4jy",
        "77wdaAuYVxBW5u2QiqddkAzoBZ5cuKxH9ZCbx5HfFUb2": "CVjC6Wn2xWhGb5RKfgc6xv6X4ZHn5djN4hcWNnUEbnM4",
        "97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf": "AdyHDgVzfryraFycA1QyXiCaRAm2wU9qhyDGD3mWtkUc",
        "7fnuvPYzfd961iRDPRgMSKLrUf1QjTGnn7viu3P12Zuc": "3e6JcmUHRQmwj4BEdY3c2BRDKDBfP7zRXCgfkP8a1J2J",
        "4uBye3vJ1FAYukDdrvqQ36MZZZxqW3o8utWu8fyomRuN": "Hz84hQ3Ym91k3NzSEPv2EExNgicbVFh8p7K4ALypb3ec",
        "EjryZ6XEthz3z7nnLfjXBYafyn7VyHgChfbfM47LfAao": "9ZMu17xX44dhXf3p5wghVYLFUyVti14m16fzCLhxPLtK",
        "BLqSzPzcXMX5gseNXE4Ma45f31Eo6tNFVYoRmPG7kxP2": "5VMchU4F6JM1J1qDHnkYdQkfE2qw6n95ZvxUsnKowskF",
        "GLJHzqRN9fKGBsvsFzmGnaQGknUtLN1dqaFR8n3YdM22": "sz88CKDPgWUXYkKiJvdSu5VBZVkeLc7GPfNLphSYLmt",
        "Crop49jpc7prcgAcS82WbWyGHwbN5GgDym3uFbxxCTZg": "Hc3MezRfJ5nmgcqDibQ1Aqc8iy8TyiADCYqCYVcumtrf",
        "3EWVbggirRpDY2npzPDA7k21yzwz5wgwGxVVv6zCnRpa": "AVHy9AsjvrFCm1KroYCUtRY9JwtJk1ET4PmM6VAPnPQy",
        "CMyJnArDXppcQi5MipWysYd4cAAv4LoLFuQthGt13K4C": "7hfkzcLaMkrHbyYwXgt4kM72Joi84U6akf8o9MZEjmMU",
        "AQYvQ4XzJjvsuRaM2kvAAwe4tHxB4LdFbYD2bENvMKNG": "3vqrXqiWoMkcRWbtsGkRyexw1DTXgFqsc3fT5VUL4cVm",
        "5ffSGG5Bf4tAyWTKSHhmKkKYPHPwbk1ZwwDnqH7G8nRw": "G61sB6Y6T5yPNijusi4D6mdvoWQDi8co99hGbFJGFjTb",
        "9thajUFM92m7zXMgZoyJ2YSRWWU1qGkYFVDdVYrmgN5X": "4gg8NEcwvRZ5vjnD1WooFotQYvFFEjAEg2e2CEqz6KqU",
        "75232r1YPyUDPck8NohZqbngp5Met5MCfnDd7xPf3yo3": "8XQCiNJAQZiNRJsrBNA38BdTCnoenCeMZ5pWRwS1HyUp",
        "CDpMkQdc3HwDnFAtMZ1nGeVf8ijeoxtCM8CEJTZqNDyp": "AmByetuHD75BgqbE8yT6g3r2hPHjysPdsK5m2dirSHjU",
        "4xTJxmi2VAKvMtj1BKU4tLQPJwUwGrvRHPSB5E67dKt5": "J2By6MKGHM3bsv3RpUk1MyTSEGxVZmC1zCgvXMjkdkRN",
        "2dLsNrsBCNc6rmAqA54A4EKQ4HwBkK8L8HmTCCkFE1ej": "7SACYwKjKrdgukDgsJB9oexjvHZBckrZDE9fHVK6zeHG",
        "2Nz9Hi43CPcwdyw9fTyHwQDWjhRxg4mmauJmoVVATwFU": "Fq1AdbwgBEPTqQHXVp15Fpqyq6jjGNrPf7JrFeNvp71H",
        "EzBNvVhSZWdXxqbtvFy91ntLfU2jH9E3ENh8izY6pvwj": "CpaqMg9RCmdoaVRfwWf6Ym3qQyEzsughzDoFZjJhAhDj",
        "5KQ6JCPcWHyy7ZHKDoeqjE5paRh3SA32gerWdYJjuFZJ": "BCyYJvpX3EGrajqfdb4J2JRxBNjY5vt5c95iNk2qUzUJ",
        "QuxR88HnRRgMNqh5GfCB5ckWrdW7GsrwcBRhJ4uxJF3": "BAHxjVB5YzYHTfE4vBR7Y7uEx3zqLr9ZTyq2D93c6Q2Z",
        "CPPjN1MrbX8PkWPMjcMAMGy3LXLNHmMu1w4axQnp1Sgu": "A7gsUwDeGKF8HqPFozJ7wpKAqmV4G4it5MNkcmWUupSQ",
        "F3aGGSMb73XHbJbDXVbcXo7iYM9fyevvAZGQfwgrnWtB": "2TyMKHSVByDxaHEjDRJgtPTkvsDjhydic5UgYw6LmNRr"
      };

      for (let i = 0; i < nfts.length; i++) {
        const nft = nfts[i];
        for (const marketIndex in testgridMarkets.value) {
          const marketObject =
            testgridMarkets.value[marketIndex];
          console.log(nft, marketObject);
          if (
            nft &&
            nft.collection &&
            nft.collection.verified &&
            nft.collection.address.toString() === marketCollections[marketObject.address]
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

  nodeRuns.value = await nosana.value.jobs.getRuns([
    {
      memcmp: {
        offset: 40,
        bytes: params.id,
      },
    },
  ]);

  // get active runs of node
  if (nodeRuns.value && nodeRuns.value.length) {
    nodeStatus.value = 'RUNNING';
  }
  loading.value = false;
};

watch(loadingTestgridMarkets, (newLoading) => {
  if (!newLoading) {
    getAddress();
  }
})

// useIntervalFn(getMarkets, 30000);
</script>
<style lang="scss" scoped></style>
