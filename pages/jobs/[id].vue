<template>
  <div class="box">
    <div v-if="job">
      <div class="is-flex is-align-items-center is-justify-content-space-between mb-4">
        <h3 class="title is-5 address is-family-monospace my-0">
          {{ jobId }}
        </h3>
        <ExplorerJobStatus class="ml-2" :status="jobStatus ? jobStatus : job.state"></ExplorerJobStatus>
      </div>

      <table class="table is-fullwidth is-striped">
        <tbody>
          <tr>
            <td>Node</td>
            <td>
              <span v-if="job.node.toString() === '11111111111111111111111111111111'
              ">Unclaimed</span>
              <nuxt-link v-else class="address is-family-monospace" :to="`/address/${job.node}`">{{ job.node
                }}</nuxt-link>
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
              <nuxt-link class="address is-family-monospace" :to="`/address/${job.project}`">
                <span>{{ job.project }}</span>
              </nuxt-link>
            </td>
          </tr>
          <tr v-if="jobStatus === 'COMPLETED' ||
            job.state === 'COMPLETED' ||
            job.state === 2
          ">
            <td>Price</td>
            <td>
              <span v-if="loadingMarkets">..</span>
              <span v-else>
                {{
                  ((parseInt(job.price) / 1e6) * Math.min(job.timeEnd - job.timeStart, markets?.find(m => m.address ==
                    job.market).jobTimeout)).toFixed(6)
                }}
                NOS</span>
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
            </td>
          </tr>
          <tr>
            <td>Type</td>
            <td>
              <ExplorerJobType v-if="ipfsJob" :ipfs="ipfsJob" :text="true" class="ml-1" />
            </td>
          </tr>
          <tr>
            <td>Trigger</td>
            <td>
              <ExplorerJobTrigger v-if="ipfsJob" :ipfs="ipfsJob" :text="true" class="ml-1" />
            </td>
          </tr>
          <tr v-if="ipfsJob &&
            ipfsJob.state &&
            ipfsJob.state['nosana/job-type']">
            <td>Source</td>
            <td v-if="ipfsJob &&
              ipfsJob.state &&
              ipfsJob.state['nosana/job-type'] &&
              (ipfsJob.state['nosana/job-type'] === 'Github' ||
                ipfsJob.state['nosana/job-type'] === 'github-flow')
            ">
              <a v-if="ipfsJob.state['input/repo'] &&
                ipfsJob.state['input/commit-sha']
              " :href="ipfsJob.state['input/repo'].replace('.git', '') +
                '/commit/' +
                ipfsJob.state['input/commit-sha']
                " target="_blank">
                {{ ipfsJob.state["input/commit-sha"] }}
              </a>
            </td>
            <td v-else>Other</td>
          </tr>
        </tbody>
      </table>

      <div class="tabs mt-5">
        <ul>
          <li :class="{ 'is-active': activeTab === 'result' }">
            <a @click.prevent="activeTab = 'result'">Result</a>
          </li>
          <li :class="{ 'is-active': activeTab === 'info' }">
            <a @click.prevent="activeTab = 'info'">Job Definition</a>
          </li>
          <li v-if="artifacts" :class="{ 'is-active': activeTab === 'artifacts' }">
            <a @click.prevent="activeTab = 'artifacts'">Artifacts</a>
          </li>
        </ul>
      </div>
      <div>
        <div v-show="activeTab === 'info'" class="p-1 py-4 has-background-white-bis">
          <VueJsonPretty :data="ipfsJob" show-icon show-line-number />
        </div>
        <div v-show="activeTab === 'result'" class="p-1 py-4 has-background-white-bis">
          <div v-if="job.state === 'RUNNING' || job.state === 1"
            class="is-family-monospace has-background-black has-text-white box light-mode">
            <div v-if="logs && logs.length > 0" style="counter-reset: line">
              <div v-for="step in logs" :key="step.id">
                <div v-for="(log, ik) in step.logs.split('\n')" :key="ik" class="row-count">
                  <span class="pre" v-html="log.slice(0, 10000)" />
                </div>
              </div>
            </div>
            <span v-else>Waiting for results...</span>
          </div>
          <div v-else-if="loading">Loading results..</div>
          <div v-else-if="!ipfsResult">No results</div>
          <div v-else-if="ipfsResult.results && ipfsResult.results[0] === 'nos/secret'">
            Results are secret
          </div>
          <ExplorerJobResult v-else-if="(ipfsResult && job.state === 'COMPLETED') || job.state === 2
          " :ipfs-result="ipfsResult" :ipfs-job="ipfsJob" />
        </div>
        <div v-show="activeTab === 'artifacts'" class="p-1 py-4 has-background-white-bis">
          <div>
            <p class="block">
              <a v-if="ipfsGateway && artifacts" class="button" :href="`${ipfsGateway}${artifacts.trim()}`">
                Download artifacts
              </a>
            </p>
            <p class="block">
              Download with CLI:<br />
              <code>npx nosana/cli download {{ artifacts }}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="loadingJob">Loading inference..</div>
    <div v-else>Inference not found</div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';
import { UseTimeAgo } from "@vueuse/components";
import { type Ref, ref, watch } from "vue";
import AnsiUp from 'ansi_up';

const { nosana } = useSDK();
const ansi = new AnsiUp();

const ipfsJob: Ref<{ [key: string]: any }> = ref({});
const ipfsResult: Ref<{ [key: string]: any }> = ref({});
const { params } = useRoute();
const jobId: Ref<string> = ref(String(params.id) || "");
const loading: Ref<boolean> = ref(false);
const activeTab: Ref<string> = ref("result");
const jobStatus: Ref<string | null> = ref(null);
const logs: Ref<any | null> = ref(null);
const { getIpfs } = useIpfs();
const artifacts = ref(null);
const ipfsGateway = ref(nosana.value ? nosana.value.ipfs.config.gateway : null);

const timestamp = useTimestamp({ interval: 1000 });
const fmtMSS = (s: number) => {
  return (s - (s %= 60)) / 60 + (s > 9 ? "m:" : "m:0") + s + "s";
};

const { markets, getMarkets, loadingMarkets } = useMarkets();


if (!markets.value) {
  getMarkets();
}

const { data: job, pending: loadingJob } = await useAPI(`/api/jobs/${jobId.value}`);
const { data: testgridMarkets, pending: loadingTestgridMarkets } = await useAPI('/api/markets');


watch(job, async () => {
  try {
    loading.value = true;
    try {
      ipfsJob.value = await getIpfs(job.value!.ipfsJob);
      console.log('ipfsJob.value', ipfsJob.value);
      if (
        (job.value?.state === "RUNNING" || job.value?.state === 1) &&
        ipfsJob.value &&
        typeof ipfsJob.value !== "string" &&
        !logs.value
      ) {
        logs.value = [];
      }
      if (
        job.value!.ipfsResult &&
        job.value!.ipfsResult !==
        "QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51"
      ) {
        const resultResponse = await getIpfs(job.value!.ipfsResult);
        ipfsResult.value = resultResponse;
      }
      if (ipfsResult.value && typeof ipfsResult.value !== "string") {
        const artifactId = ipfsJob.value.ops[ipfsJob.value.ops.length - 1].id;
        if (artifactId.startsWith("artifact-")) {
          if (ipfsResult.value!.results[artifactId]) {
            const steps = ipfsResult.value!.results[artifactId][1];
            if (Array.isArray(steps)) {
              const logs = steps[steps.length - 1].log;
              if (logs && logs[logs.length - 2]) {
                artifacts.value = logs[logs.length - 2][1].slice(-47);
              }
            }
          }
        }
        console.log('ipfsResult.value', ipfsResult.value);
        for (const key in ipfsResult.value!.results) {
          const results = ipfsResult.value!.results[key];
          if (
            (results && results[0] && results[0].exit) ||
            (results &&
              results[0] &&
              (results[0].includes("error") || results[0].includes("failed")))
          ) {
            jobStatus.value = "FAILED";
          }

          if (Array.isArray(results)) {
            if (results[1]) {
              if (Array.isArray(results[1]) || Array.isArray(results[2])) {
                const resultsArray = Array.isArray(results[1])
                  ? results[1]
                  : results[2][1];
                if (resultsArray) {
                  for (let i = 0; i < resultsArray.length; i++) {
                    const step = resultsArray[i];
                    if (step.log && Array.isArray(step.log)) {
                      step.log = step.log
                        .reduce((str: any, log: any) => str.concat(log[1]), "")
                        .split("\n")
                        .map((l: any) => [1, ansi.ansi_to_html(l)]);
                    }
                  }
                }
              }
            }
          }
        }

        if (
          ipfsResult.value.results &&
          ipfsResult.value.results["nosana/error"]
        ) {
          jobStatus.value = "FAILED";
        }
      }
    } catch (error) {
      console.log("error when processing ipfs", error);
    }
  } catch (e) {
    console.error(e);
    job.value = null;
  }
  loading.value = false;
});
</script>
<style lang="scss" scoped>
.pre {
  white-space: pre-wrap;
}
</style>
