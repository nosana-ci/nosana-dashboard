<template>
  <div>
    <TopBar :title="'Job Page'" :subtitle="'Find information about your job here'">
    </TopBar>

    <div class="box">
      <div v-if="job">
        <div class="is-flex is-align-items-center is-justify-content-space-between mb-4">
          <div></div>
          <div class="is-flex is-align-items-center is-justify-content-center">
            <div v-if="isJobPoster && (job.state === 'RUNNING' || job.state === 1)" class="mr-4">
              <button @click="stopJob" :class="{ 'is-loading': loading }" class="button is-danger is-small is-outlined">
                Stop Job
              </button>
            </div>
            <ExplorerJobStatus class="mr-2" :status="jobStatus ? jobStatus : job.state"></ExplorerJobStatus>
          </div>
        </div>

        <ExplorerJobInfo :job="job" />

        <div class="tabs mt-5">
          <ul>
            <li :class="{ 'is-active': activeTab === 'logs' }">
              <a @click.prevent="activeTab = 'logs'">Logs</a>
            </li>
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
            <VueJsonPretty :data="job.jobDefinition" show-icon show-line-number />
          </div>
          <div v-show="activeTab === 'logs'" class="p-1 py-4 has-background-white-bis">
            <div v-if="job.state === 'RUNNING' || job.state === 1"
              class="is-family-monospace has-background-black has-text-white box light-mode">
              <div v-if="logs && logs.length > 0" style="counter-reset: line">
                <div v-for="step in logs" :key="step.id">
                  <div v-for="(log, ik) in step.logs.split('\n')" :key="ik" class="row-count">
                    <span class="pre" v-html="log.slice(0, 10000)" />
                  </div>
                </div>
              </div>
              <span v-else>Waiting for logs...</span>
            </div>
            <div v-else-if="loading">Loading logs..</div>
            <div v-else-if="!ipfsResult">No logs</div>
            <div v-else-if="ipfsResult.results && ipfsResult.results[0] === 'nos/secret'">
              Results are secret
            </div>
            <ExplorerJobResult v-else-if="(ipfsResult && job.state === 'COMPLETED') || job.state === 2
            " :ipfs-result="ipfsResult" :ipfs-job="job.jobDefinition" />
          </div>
          <div v-show="activeTab === 'result'" class="p-1 py-4 has-background-white-bis">
            <VueJsonPretty :data="job.jobResult" show-icon show-line-number />
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
                <code>npx @nosana/cli download {{ artifacts }}</code>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="loadingJob">Loading job..</div>
      <div v-else>Job not found</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';
import AnsiUp from 'ansi_up';
import { useWallet } from 'solana-wallets-vue'
import { useToast } from "vue-toastification";
import type { MessageSignerWalletAdapter } from '@solana/wallet-adapter-base';
const toast = useToast();

const { nosana } = useSDK();
const ansi = new AnsiUp();

const ipfsResult: Ref<{ [key: string]: any }> = ref({});
const { params } = useRoute();
const jobId: Ref<string> = ref(String(params.id) || "");
const loading: Ref<boolean> = ref(false);
const activeTab: Ref<string> = ref("logs");
const jobStatus: Ref<string | null> = ref(null);
const logs: Ref<any | null> = ref(null);
const { getIpfs } = useIpfs();
const artifacts = ref(null);
const ipfsGateway = ref(nosana.value ? nosana.value.ipfs.config.gateway : null);




const { data: job, pending: loadingJob } = useAPI(`/api/jobs/${jobId.value}`);


const { wallet, publicKey, connected } = useWallet();

const isJobPoster = computed(() => {
  return connected.value && job.value && publicKey.value?.toString() === job.value.project;
});

const stopJob = async () => {
  if (!job.value) return;
  try {
    loading.value = true;

    if (!connected.value || !publicKey.value) {
      throw new Error('Wallet not connected');
    }
    if (!wallet.value) {
      throw new Error('Wallet not found');
    }

    const nodeAddress = job.value.node.toString();
    const apiUrl = `https://${nodeAddress}.${useRuntimeConfig().public.nodeDomain}/service/stop/${jobId.value}`;

    // Use the specific node API URL for a one-time real test
    // const apiUrl = 'https://3vwMHHicGk9enrHst7cJhbucNWSMyMDuB8G9HX1DQk7A.node.k8s.dev.nos.ci/service/stop/testjobid123';

    // Create the authorization header
    const message = 'Hello Nosana Node!';
    const encodedMessage = new TextEncoder().encode(message);

    const adapter = wallet.value.adapter as MessageSignerWalletAdapter;
    if (!adapter.signMessage) {
      throw new Error('Wallet does not support message signing');
    }

    // Sign the message
    const signedMessage = await adapter.signMessage(encodedMessage);

    // Create Authorization header: "PublicKey:Base64Signature"
    const signature = Buffer.from(signedMessage).toString('base64');
    const publicKeyString = publicKey.value.toString();
    const authorizationHeader = `${publicKeyString}:${signature}`;

    // Make the real API call
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authorizationHeader,
      },
    });

    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', text);

    if (response.status === 403) {
      toast.error(`Authentication failed: ${text}`);
      return;
    }

    if (response.status === 200) {
      toast.success(`Success: ${text}`);
      return;
    }

    // Rrefresh the job data
    const updatedJob = await nosana.value.jobs.get(jobId.value);
    job.value = updatedJob;

  } catch (e: any) {
    // Catch any runtime errors
    toast.error(`Error stopping job: ${e.toString()}`);
  } finally {
    loading.value = false;
  }
};

watch(job, async () => {
  try {
    loading.value = true;
    try {
      if (
        (job.value?.state === "RUNNING" || job.value?.state === 1) &&
        job.value.jobDefinition &&
        typeof job.value.jobDefinition !== "string" &&
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
