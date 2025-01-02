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
            <div v-if="isJobPoster && (job.state === 'RUNNING' || job.state === 1)" class="mr-4">
              <button @click="extendJob" :class="{ 'is-loading': loadingExtend }" class="button is-warning is-medium is-outlined">
                Extend Job
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
                  <div v-if="step.progress" class="progress-bar mb-2">
                    <div class="progress-text">
                      {{ step.progress.status }} | {{ step.progress.id }} | {{ step.progress.sizeText }}
                    </div>
                    <progress class="progress is-primary" :value="step.progress.current" :max="step.progress.total">
                      {{ step.progress.progress }}
                    </progress>
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
            <ExplorerJobResult v-else-if="(ipfsResult && job.state === 'COMPLETED') || job.state === 2" 
              :ipfs-result="ipfsResult" :ipfs-job="job.jobDefinition" />
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

// Add stored auth header
const storedAuthHeader = ref<string | null>(null);

const ipfsResult = ref<{ results?: string[] }>({});
const { params } = useRoute();
const jobId = ref(String(params.id) || "");
const loading = ref(false);
const loadingExtend = ref(false);
const activeTab = ref("logs");
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

// Add progressBars ref at the top with other refs
const progressBars = ref<{ [key: string]: any }>({});

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

  // Initialize logs when job starts running
  if ((newJob.state === 'RUNNING' || newJob.state === 1) && newJob.jobDefinition) {
    if (!logs.value) logs.value = [];
  }

  // Fetch IPFS results if needed
  try {
    loading.value = true;

    if (
      newJob.ipfsResult &&
      newJob.ipfsResult !== 'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51'
    ) {
      const resultResponse = await getIpfs(newJob.ipfsResult);
      ipfsResult.value = resultResponse;
    }
  } catch (error) {
  } finally {
    loading.value = false;
  }
}, { immediate: true, deep: true });

const { wallet, publicKey, connected } = useWallet();

const isJobPoster = computed(() => {
  return connected.value && job.value && publicKey.value?.toString() === job.value.project;
});

// Add verification status
const isVerified = ref(false);

// Modify signMessage to handle verification
const signMessage = async (forceNew = false) => {
  // Return stored auth header if available and not forcing new
  if (storedAuthHeader.value && !forceNew) {
    return storedAuthHeader.value;
  }

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
  const authHeader = `${publicKeyString}:${signature}`;
  
  // Store the auth header for future use
  storedAuthHeader.value = authHeader;
  isVerified.value = true;
  return authHeader;
};

// Add a computed property to check if verification is needed
const needsVerification = computed(() => {
  return job.value && 
    (job.value.state === 'RUNNING' || job.value.state === 1) && 
    isJobPoster.value;
});

// Instead of separate watchers for connected & needsVerification,
// unify them so it only attempts to sign once on page load or state changes.
watch(
  [connected, needsVerification],
  async ([newConnected, newNeedsVerification]) => {
    // Whenever either "connected" or "needsVerification" changes, 
    // re-check if the user must sign.
    if (newConnected && newNeedsVerification && !isVerified.value) {
      try {
        await signMessage(true);
        toast.success('Wallet verified successfully');
      } catch (error) {
        toast.error('Failed to verify wallet');
      }
    }
    // If user becomes disconnected, reset
    else if (!newConnected) {
      isVerified.value = false;
      storedAuthHeader.value = null;
      // Close the websocket if it's open
      if (ws) {
        ws.close();
        isWebSocketConnected = false;
      }
    }
  },
  { immediate: true }
);

// Modify stopJob to check verification
const stopJob = async () => {
  if (!job.value) return;
  if (!isVerified.value) {
    try {
      await signMessage(true);
    } catch (error) {
      toast.error('Please verify your wallet first');
      return;
    }
  }
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
    if (response.status === 403) {
      storedAuthHeader.value = null;
      toast.error(`Authentication failed: ${text}`);
      return;
    }
    if (response.status === 200) {
      toast.success(`Success: ${text}`);
      return;
    }
    // Refresh job data
    const updatedJob = await nosana.value.jobs.get(jobId.value);
    job.value = updatedJob;
  } catch (e: any) {
    storedAuthHeader.value = null;
    toast.error(`Error stopping job: ${e.toString()}`);
  } finally {
    loading.value = false;
  }
};

// 2) The new "extendJob" function which calls the SDK's extend:
const extendJob = async () => {
  if (!job.value) return;
  if (!isVerified.value) {
    try {
      await signMessage(true);
    } catch (error) {
      toast.error('Please verify your wallet first');
      return;
    }
  }

  try {
    loadingExtend.value = true;
    // For demonstration, let's add 300 more seconds to jobTimeout:
    const extensionSeconds = 300;

    // First get the market from the job
    const market = job.value.market;
    if (!market) {
      throw new Error('No market found for this job');
    }

    // Call extend with proper error handling
    try {
      const result = await nosana.value.jobs.extend(jobId.value, extensionSeconds);
      toast.success(`Job extended successfully. Tx: ${result.tx}`);
      // Refresh job to see updated jobTimeout in UI
      await refreshJob();
    } catch (error: any) {
      // Handle specific error cases
      if (error.message.includes('Account does not exist')) {
        toast.error('Market account not found. Please try again later.');
      } else if (error.message.includes('job cannot be extended')) {
        toast.error('Job cannot be extended - it must be in running state.');
      } else {
        toast.error(`Error extending job: ${error.message}`);
      }
    }
  } catch (error: any) {
    toast.error(`Error extending job: ${error.message}`);
  } finally {
    loadingExtend.value = false;
  }
};

// WebSocket code for streaming logs in real-time while job is running
// ─────────────────────────────────────────────────────────────

let ws: WebSocket | null = null;
let isWebSocketConnected = false;

// Add a function to check if we should connect to WebSocket
const shouldConnectWebSocket = computed(() => {
  return job.value && 
    (job.value.state === 'RUNNING' || job.value.state === 1) && 
    connected.value && 
    isVerified.value &&
    isJobPoster.value;
});

// Modify the job watcher to use shouldConnectWebSocket
watch(
  job,
  async (newJob, oldJob) => {
    if (shouldConnectWebSocket.value && !isWebSocketConnected) {
      await connectWebSocket();
    } else if (ws && !(newJob?.state === 'RUNNING' || newJob?.state === 1)) {
      ws.close();
      isWebSocketConnected = false;
    }
  },
  { immediate: true, deep: true }
);

// Modify connectWebSocket to be simpler since checks are done before calling
const connectWebSocket = async () => {
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
    return;
  }
  const wsUrl = `wss://${nodeAddress}.${frpServer}/log`;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      isWebSocketConnected = true;
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
        
        // Handle empty responses
        if (!outerData.data && !outerData.type) return;
        
        // If it's a direct message (not wrapped in data)
        const innerData = outerData.data ? JSON.parse(outerData.data) : outerData;
        
        if (!innerData) return;

        // Convert ANSI codes in any text field we have
        const convertedLog = ansi.ansi_to_html(innerData.log || '');

        // Handle regular logs and container logs
        if ((innerData.log && !innerData.type) || innerData.type === 'container') {
          logs.value?.push({
            id: Date.now(),
            logs: convertedLog
          });
          return;
        }

        // Handle progress bar updates
        if ((innerData.type === 'multi-process-bar-update' || innerData.method === 'MultiProgressBarReporter.update') && innerData.payload?.event) {
          const event = innerData.payload.event;
          const layerId = event.id;

          // Handle completion states
          if (
            event.status === 'Download complete' ||
            event.status === 'Pull complete' ||
            event.status === 'Already exists'
          ) {
            if (progressBars.value[layerId]) {
              const index = logs.value?.findIndex(
                (item) => item.id === progressBars.value[layerId]
              );
              if (index !== undefined && index !== -1 && logs.value) {
                logs.value.splice(index, 1);
              }
              delete progressBars.value[layerId];
            }

            logs.value?.push({
              id: Date.now(),
              logs: `${event.status}: ${layerId}`
            });
            return;
          }

          // Handle active download/extract states
          if (event.status === 'Downloading' || event.status === 'Extracting') {
            const current = event.progressDetail?.current || 0;
            const total = event.progressDetail?.total || 0;

            // Format size for display
            const formatSize = (bytes: number) => {
              if (!bytes || isNaN(bytes)) return '0B';
              const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
              const i = Math.floor(Math.log(bytes) / Math.log(1024));
              return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
            };

            const progressText = `${event.status} | ${layerId} | ${formatSize(current)}/${formatSize(total)}`;
            const progressObj = {
              id: progressBars.value[layerId] || Date.now(),
              logs: progressText,
              progress: {
                status: event.status,
                id: layerId,
                current: current,
                total: total,
                progress: progressText,
                sizeText: `${formatSize(current)}/${formatSize(total)}`
              }
            };

            // Update existing progress bar or create new one
            if (progressBars.value[layerId]) {
              const index = logs.value?.findIndex(
                (item) => item.id === progressBars.value[layerId]
              );
              if (index !== undefined && index !== -1 && logs.value) {
                logs.value[index] = progressObj;
              }
            } else {
              logs.value?.push(progressObj);
              progressBars.value[layerId] = progressObj.id;
            }
          }
        } else if (innerData.log) {
          // Handle all other log messages
          logs.value?.push({
            id: Date.now(),
            logs: convertedLog
          });
        }
      } catch (err: any) {
        toast.error('Error parsing log data: ' + err.toString());
      }
    };

    ws.onclose = () => {
      ws = null;
      isWebSocketConnected = false;
    };
    ws.onerror = (error) => {
      isWebSocketConnected = false;
    };
  } catch (error) {
    isWebSocketConnected = false;
  }
};

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

.progress.is-primary::-webkit-progress-bar {
  background-color: #dbdbdb;
}

.progress.is-primary::-webkit-progress-value {
  background-color: #00d1b2;
}

.progress.is-primary::-moz-progress-bar {
  background-color: #00d1b2;
}
</style>
