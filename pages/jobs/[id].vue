<template>
  <div>
    <TopBar :title="'Job Page'" :subtitle="'Find information about your job here'">
    </TopBar>

    <div class="box">
      <div v-if="job">
        <div class="is-flex is-align-items-center is-justify-content-space-between mb-4">
          <div></div>
          <div class="is-flex is-align-items-center is-justify-content-center">
            <div v-if="job.state === 1 && job.jobDefinition && job.jobDefinition.ops && job.jobDefinition.ops[0] && job.jobDefinition.ops[0].args.expose" class="mr-4">
              <a :href="`https://${job.address}.node.k8s.prd.nos.ci`" target="_blank" class="button is-primary is-medium is-outlined">
                Visit Service
              </a>
            </div>
            <div v-if="isJobPoster && (job.state === 'RUNNING' || job.state === 1)" class="mr-4">
              <button @click="stopJob" :class="{ 'is-loading': loading }" class="button is-danger is-medium is-outlined">
                Stop Job
              </button>
            </div>
            <ExplorerJobStatus class="mr-2" :status="jobStatus ? jobStatus : job.state"></ExplorerJobStatus>
          </div>
        </div>

        <ExplorerJobInfo :job="job" />

        <div v-if="job.node && job.node.toString() !== '11111111111111111111111111111111'" class="mt-4">
          <JobNodeInfo :address="job.node.toString()" />
        </div>

        <div class="tabs mt-5">
          <ul>
            <li :class="{ 'is-active': activeTab === 'jobLogs' }">
              <a @click.prevent="activeTab = 'jobLogs'">Job Logs</a>
            </li>
            <li :class="{ 'is-active': activeTab === 'nodeLogs' }">
              <a @click.prevent="activeTab = 'nodeLogs'">Node Logs</a>
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
          <div v-show="activeTab === 'jobLogs'" class="p-1 py-4 has-background-white-bis">
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
          <div v-show="activeTab === 'nodeLogs'" class="p-1 py-4 has-background-white-bis">
            <div v-if="logs && logs.length > 0" style="counter-reset: line">
              <div v-for="step in logs" :key="step.id">
                <div v-for="(log, ik) in step.logs.split('\n')" :key="ik" class="row-count">
                  <span class="pre" v-html="log.slice(0, 10000)" />
                </div>
              </div>
            </div>
            <span v-else>Waiting for node logs...</span>
          </div>
          <div v-show="activeTab === 'result'" class="p-1 py-4 has-background-white-bis">
            <VueJsonPretty :data="job.jobResult" show-icon show-line-number />
          </div>
          <div v-show="activeTab === 'artifacts'" class="p-1 py-4 has-background-white-bis">
            <div>
              <p class="block">
                <a v-if="ipfsGateway && artifacts" class="button" :href="`${ipfsGateway}${String(artifacts).trim()}`">
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
import { onUnmounted, watch, ref, computed } from 'vue';
import { useRoute } from "vue-router";
import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';
import AnsiUp from 'ansi_up';
import { useWallet } from 'solana-wallets-vue';
import { useToast } from "vue-toastification";
import type { MessageSignerWalletAdapter } from '@solana/wallet-adapter-base';
import JobNodeInfo from '~/components/Node/JobNodeInfo.vue';
import { useIntervalFn } from '@vueuse/core';
import { useSDK } from '~/composables/useSDK';
import { useAPI } from '~/composables/useAPI';
import { useIpfs } from '~/composables/useIpfs';
import { useRuntimeConfig } from '#imports';

const toast = useToast();
const { nosana } = useSDK();
const ansi = new AnsiUp();

const ipfsResult = ref<{ results?: string[] }>({});
const { params } = useRoute();
const jobId = ref(String(params.id) || "");
const loading = ref(false);
const activeTab = ref("jobLogs");
const jobStatus = ref<string | null>(null);
const logs = ref<any[] | null>(null);

const { getIpfs } = useIpfs();
const artifacts = ref(null);
const ipfsGateway = ref(nosana.value ? nosana.value.ipfs.config.gateway : null);

const { data: job, pending: loadingJob, refresh: refreshJob } = useAPI(
  `https://dashboard.k8s.prd.nos.ci/api/jobs/${jobId.value}`,
  { watch: false }
);

const { pause: pauseJobPolling, resume: resumeJobPolling } = useIntervalFn(() => {
  refreshJob();
}, 30000, { immediate: false });

watch(job, async (newJob) => {
  if (!newJob) return;

  // Update jobStatus
  if (newJob.state === 2 || newJob.state === 'COMPLETED') {
    jobStatus.value = 'COMPLETED';
    pauseJobPolling();
  } else if (newJob.state === 3 || newJob.state === 'STOPPED') {
    jobStatus.value = 'STOPPED';
    pauseJobPolling();
  } else if (newJob.state === 'FAILED') {
    jobStatus.value = 'FAILED';
    pauseJobPolling();
  } else if (newJob.state === 1 || newJob.state === 'RUNNING') {
    jobStatus.value = null;
    resumeJobPolling();
  }

  // If job is RUNNING, initialize logs for streaming
  if ((newJob.state === 'RUNNING' || newJob.state === 1) && newJob.jobDefinition && !logs.value) {
    logs.value = [];
  }

  // Fetch IPFS results if needed, etc.
  try {
    loading.value = true;

    if (
      newJob.ipfsResult &&
      newJob.ipfsResult !== 'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51'
    ) {
      const resultResponse = await getIpfs(newJob.ipfsResult);
      ipfsResult.value = resultResponse;
      // ...existing logic for artifact detection, marking job as FAILED, etc.
    }
  } catch (error) {
    console.error('Error while processing job update:', error);
  } finally {
    loading.value = false;
  }
}, { immediate: true, deep: true });

const { wallet, publicKey, connected } = useWallet();

const isJobPoster = computed(() => {
  return connected.value && job.value && publicKey.value?.toString() === job.value.project;
});

// Add a function to handle signing
const signMessage = async () => {
  if (!connected.value || !publicKey.value || !wallet.value) {
    throw new Error('Wallet not connected or not found');
  }
  const message = 'Hello Nosana Node!';
  const encodedMessage = new TextEncoder().encode(message);
  const adapter = wallet.value.adapter as MessageSignerWalletAdapter;
  if (!adapter.signMessage) {
    throw new Error('Wallet does not support message signing');
  }
  const signedMessage = await adapter.signMessage(encodedMessage);
  const signature = Buffer.from(signedMessage).toString('base64');
  const publicKeyString = publicKey.value.toString();
  return `${publicKeyString}:${signature}`;
};

// Modify stopJob to use signMessage
const stopJob = async () => {
  if (!job.value) return;
  try {
    loading.value = true;
    const authorizationHeader = await signMessage();
    const nodeAddress = job.value.node.toString();
    const apiUrl = `https://${nodeAddress}.${useRuntimeConfig().public.nodeDomain}/service/stop/${jobId.value}`;
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
    const updatedJob = await nosana.value.jobs.get(jobId.value);
    job.value = updatedJob;
  } catch (e: any) {
    toast.error(`Error stopping job: ${e.toString()}`);
  } finally {
    loading.value = false;
  }
};

// ─────────────────────────────────────────────────────────────
// WebSocket code for streaming logs in real-time while job is running
// ─────────────────────────────────────────────────────────────

let ws: WebSocket | null = null;

// Add a flag to track WebSocket connection state
let isWebSocketConnected = false;

// Modify connectWebSocket to use signMessage
const connectWebSocket = async () => {
  if (!job.value || !job.value.node || !connected.value || !publicKey.value || !wallet.value) {
    console.error('Cannot connect WebSocket - missing job, node, or wallet connection');
    return;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  const nodeAddress = job.value.node.toString();
  const frpServer = useRuntimeConfig().public.frpServer || 'node.k8s.prd.nos.ci';
  let authHeader = '';
  try {
    authHeader = await signMessage();
  } catch (error) {
    console.error('Error creating auth header:', error);
    return;
  }
  const wsUrl = `wss://${nodeAddress}.${frpServer}/log`;
  try {
    ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      const authMessage = {
        path: '/log',
        header: authHeader,
        body: {
          jobAddress: jobId.value,
          address: job.value.project
        }
      };
      ws?.send(JSON.stringify(authMessage));
    };
    ws.onmessage = (event: MessageEvent) => {
      try {
        const outerData = JSON.parse(event.data);
        const innerData = JSON.parse(outerData.data); // Parse the nested JSON string
        if (innerData?.log) {
          const convertedLog = ansi.ansi_to_html(innerData.log);
          logs.value?.push({
            id: Date.now(),
            logs: convertedLog,
          });
        }
      } catch (err) {
        console.error('Error parsing log data');
      }
    };
    ws.onclose = (event) => {
      ws = null;
      isWebSocketConnected = false;
    };
    ws.onerror = (error) => {
      console.error('Error connecting to log stream');
    };
  } catch (error) {
    console.error('Error creating WebSocket:', error);
  }
};

// Modify the watch logic to ensure WebSocket connection only on state transition
watch(job, (newJob, oldJob) => {
  if (
    newJob &&
    (newJob.state === 'RUNNING' || newJob.state === 1) &&
    (!oldJob || oldJob.state !== 'RUNNING' && oldJob.state !== 1) &&
    !isWebSocketConnected
  ) {
    connectWebSocket();
    isWebSocketConnected = true;
  } else if (ws && !(newJob.state === 'RUNNING' || newJob.state === 1)) {
    console.log('Closing WebSocket because job is no longer running');
    ws.close();
    isWebSocketConnected = false;
  }
});

// Ensure we close the WebSocket on unmount
onUnmounted(() => {
  if (ws) {
    ws.close();
  }
});

</script>
<style lang="scss" scoped>
.pre {
  white-space: pre-wrap;
}
</style>
