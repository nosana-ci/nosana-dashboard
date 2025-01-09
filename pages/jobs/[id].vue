<template>
  <div>
    <TopBar :title="'Job Page'" :subtitle="'Find information about your job here'">
    </TopBar>

    <div class="box">
      <div v-if="job">
        <div class="is-flex is-align-items-center is-justify-content-space-between mb-4">
          <div class="is-flex is-align-items-center">
            <div
              v-if="(isRunning(job.state))
                     && job.jobDefinition 
                     && job.jobDefinition.ops 
                     && job.jobDefinition.ops[0] 
                     && job.jobDefinition.ops[0].args.expose"
              class="mr-4">
              <a :href="`https://${job.address}.node.k8s.prd.nos.ci`" target="_blank"
                class="button is-medium is-outlined has-background-transparent visit-service-btn">
                Visit Service
              </a>
            </div>
            <div v-if="isJobPoster && isRunning(job.state)" class="mr-4">
              <button @click="stopJob" :class="{ 'is-loading': loading }"
                class="button is-danger is-medium is-outlined">
                Stop Job
              </button>
            </div>
            <div v-if="isJobPoster && isRunning(job.state)" class="mr-4">
              <button @click="openExtendModal" :class="{ 'is-loading': loadingExtend }"
                class="button is-warning is-medium is-outlined">
                Extend Job
              </button>
            </div>
          </div>
          <div>
            <ExplorerJobStatus :status="job.state"></ExplorerJobStatus>
          </div>
        </div>

        <ExplorerJobInfo :job="job" :is-job-poster="isJobPoster" @repost="repostJob" />

        <div v-if="job.node && job.node.toString() !== '11111111111111111111111111111111'" class="mt-4">
          <JobNodeInfo :address="job.node.toString()" />
        </div>

        <div class="tabs mt-5">
          <ul>
            <li :class="{ 'is-active': activeTab === 'logs' }">
              <a @click.prevent="activeTab = 'logs'">Logs</a>
            </li>
            <li v-if="hasResultsRegex" :class="{ 'is-active': activeTab === 'result' }">
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
            <div v-if="isRunning(job.state)"
              class="is-family-monospace has-background-black has-text-white box light-mode">
              <div v-if="isConnecting" class="has-text-info">
                <span class="icon-text">
                  <span class="icon">
                    <i class="fas fa-sync fa-spin"></i>
                  </span>
                  <span>Connecting to node...</span>
                </span>
              </div>
              <div v-else-if="logs && logs.length > 0" style="counter-reset: line">
                <div v-for="step in logs" :key="step.id">
                  <div v-for="(log, ik) in step.logs.split('\n')" :key="ik" class="row-count">
                    <div class="is-flex is-justify-content-space-between is-align-items-center">
                      <span class="pre" v-html="log.slice(0, 10000)" />
                      <button v-if="log.includes('Error connecting to WebSocket')" 
                        @click="checkAndConnectWebSocket" 
                        class="button is-info is-small ml-4">
                        <span class="icon">
                          <i class="fas fa-sync"></i>
                        </span>
                        <span>Retry Connection</span>
                      </button>
                    </div>
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
            <ExplorerJobResult 
              v-else-if="(ipfsResult && job.state === 'COMPLETED') || getStateNumber(job.state) === 2"
              :ipfs-result="ipfsResult" 
              :ipfs-job="job.jobDefinition" />
          </div>
          <div v-show="activeTab === 'result'" class="p-1 py-4 has-background-white-bis">
            <div v-if="isRunning(job.state)" class="has-text-grey">
              Waiting for results...
            </div>
            <div v-else-if="!job.jobResult" class="has-text-grey">
              This container did not have a results regex
            </div>
            <VueJsonPretty v-else :data="job.jobResult" show-icon show-line-number />
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

    <!-- Extend Modal -->
    <div v-if="showExtendModal" class="modal is-active">
      <div class="modal-background" @click="showExtendModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Extend Job</p>
          <button class="delete" aria-label="close" @click="showExtendModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">Extension time (minutes)</label>
            <div class="control">
              <input class="input" type="number" v-model="extendTime" min="1" />
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-success" @click="confirmExtend">
            Extend
          </button>
          <button class="button" @click="showExtendModal = false">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, watch, ref, computed, onMounted, onActivated } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import AnsiUp from 'ansi_up';
import { useWallet } from 'solana-wallets-vue';
import { useToast } from 'vue-toastification';
import type { MessageSignerWalletAdapter } from '@solana/wallet-adapter-base';
import JobNodeInfo from '~/components/Node/JobNodeInfo.vue';
import { useIntervalFn } from '@vueuse/core';
import { useSDK } from '~/composables/useSDK';
import { useAPI } from '~/composables/useAPI';
import { useIpfs } from '~/composables/useIpfs';
import { useRuntimeConfig } from '#imports';
import { useMarkets } from '~/composables/useMarkets';
import { useLocalStorage } from '@vueuse/core';

/**
 * Helper to convert job state to a number, normalizing "RUNNING", "QUEUED", etc.
 */
function getStateNumber(stateVal: string | number): number {
  if (stateVal === 'QUEUED' || stateVal === 0) return 0;
  if (stateVal === 'RUNNING' || stateVal === 1) return 1;
  if (stateVal === 'COMPLETED' || stateVal === 2) return 2;
  if (stateVal === 'STOPPED' || stateVal === 3) return 3;
  return -1;
}

function isQueued(stateVal: string | number): boolean {
  return getStateNumber(stateVal) === 0;
}
function isRunning(stateVal: string | number): boolean {
  return getStateNumber(stateVal) === 1;
}
function isCompleted(stateVal: string | number): boolean {
  return getStateNumber(stateVal) === 2;
}
function isStopped(stateVal: string | number): boolean {
  return getStateNumber(stateVal) === 3;
}

const toast = useToast();
const { nosana } = useSDK();
const ansi = new AnsiUp();
const router = useRouter();

const storedAuthHeader = useLocalStorage<string | null>('nosanaAuthHeader', null);

const ipfsResult = ref<{ results?: string[] }>({});
const { params } = useRoute();
const jobId = ref(String(params.id) || '');
const loading = ref(false);
const loadingExtend = ref(false);
const activeTab = ref('logs');
const logs = ref<any[] | null>(null);

const { getIpfs } = useIpfs();
const artifacts = ref(null);
const ipfsGateway = ref(nosana.value ? nosana.value.ipfs.config.gateway : null);

const { data: job, pending: loadingJob, refresh: refreshJob } = useAPI(`/api/jobs/${jobId.value}`, {
  watch: false
});

const { pause: pauseJobPolling, resume: resumeJobPolling } = useIntervalFn(
  () => {
    console.log('REFRESHING');
    refreshJob();
  },
  30000,
  { immediate: false }
);

const progressBars = ref<{ [key: string]: any }>({});

watch(
  job,
  async (newJob) => {
    if (!newJob) return;

    if (getStateNumber(newJob.state) < 2) {
      resumeJobPolling();
      // Initialize logs only if wallet is connected
      if (connected.value && !logs.value) {
        logs.value = [];
      }
    } else {
      pauseJobPolling();
    }

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
      toast.error(`Error fetching IPFS result: ${JSON.stringify(error)}`);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true, deep: true }
);

const { wallet, publicKey, connected } = useWallet();

// Check if user is job poster
const isJobPoster = computed(() => {
  return connected.value && job.value && publicKey.value?.toString() === job.value.project;
});

const isVerified = ref(storedAuthHeader.value !== null);

const signMessage = async (forceNew = false) => {
  if (storedAuthHeader.value && !forceNew) {
    const [storedKey] = storedAuthHeader.value.split(':');
    if (storedKey === publicKey.value?.toString()) {
      isVerified.value = true;
      return storedAuthHeader.value;
    }
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

  storedAuthHeader.value = authHeader;
  isVerified.value = true;
  return authHeader;
};

const needsVerification = computed(() => {
  return (
    job.value &&
    isRunning(job.value.state) &&
    isJobPoster.value &&
    !isVerified.value
  );
});

watch(
  publicKey,
  async (newPublicKey) => {
    // if the new key does not match the stored one, clear it out
    if (newPublicKey && storedAuthHeader.value) {
      const [storedKey] = storedAuthHeader.value.split(':');
      if (storedKey !== newPublicKey.toString()) {
        storedAuthHeader.value = null;
        isVerified.value = false;
      }
    }
  },
  { immediate: true }
);

watch(
  [connected, needsVerification],
  async ([newConnected, newNeedsVerification]) => {
    if (newConnected && newNeedsVerification && !isVerified.value) {
      try {
        await signMessage(true);
        toast.success('Wallet verified successfully');
        refreshJob();
        if (job.value && isRunning(job.value.state)) {
          logs.value = [];
        }
      } catch (error) {
        toast.error('Failed to verify wallet');
      }
    } else if (!newConnected) {
      isVerified.value = false;
      storedAuthHeader.value = null;
      logs.value = null;
      if (ws) {
        ws.close();
        ws = null;
        isWebSocketConnected = false;
        isConnecting.value = false;
      }
    }
  },
  { immediate: true }
);

watch(
  connected,
  async (newConnected) => {
    if (newConnected && job.value && isRunning(job.value.state)) {
      logs.value = [];
    } else if (!newConnected) {
      logs.value = null;
    }
  },
  { immediate: true }
);

/**
 * STOP JOB logic
 * - If job is in queue (state=0 or "QUEUED"), delist
 * - If job is running (state=1 or "RUNNING"), end
 * - Else, let user know
 */
const stopJob = async () => {
  if (!job.value) {
    toast.error('No job found.');
    return;
  }

  // Make sure we're verified
  if (!isVerified.value) {
    try {
      await signMessage(true);
    } catch (error) {
      toast.error('Please verify your wallet first');
      return;
    }
  }

  loading.value = true;
  try {
    // get the current on-chain state of the job
    const onChainJob = await nosana.value.jobs.get(jobId.value);
    const numericState = getStateNumber(onChainJob.state);

    // If job is completed (2) or stopped (3), no need to proceed
    if (numericState === 2 || numericState === 3) {
      toast.info(`Job is already ${numericState === 2 ? 'COMPLETED' : 'STOPPED'}`);
      return;
    }

    // If job is queued (0), delist it
    if (numericState === 0) {
      await nosana.value.jobs.delist(jobId.value);
      toast.success('Job successfully delisted (canceled) from queue!');
    }
    // If job is running (1), end it
    else if (numericState === 1) {
      await nosana.value.jobs.end(jobId.value);
      toast.success('Job successfully ended!');
    }
    // Otherwise, let the user know
    else {
      toast.error(`Job is not in QUEUED or RUNNING state (currently: ${onChainJob.state})`);
    }

    refreshJob();
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    toast.error(`Error stopping job: ${errorMessage}`);
    console.error('Stop job error:', e);
  } finally {
    loading.value = false;
  }
};

// Show/hide the extend modal
const showExtendModal = ref(false);
// How many minutes to extend
const extendTime = ref<number>(5);

// Open the modal
const openExtendModal = () => {
  showExtendModal.value = true;
};

// Confirm extend – uses the new "extend" method from the SDK
const confirmExtend = async () => {
  if (!job.value) {
    toast.error('No job found.');
    return;
  }

  if (!connected.value || !publicKey.value) {
    toast.error('Please connect your wallet first!');
    return;
  }

  try {
    loadingExtend.value = true;

    // fetch a fresh copy from on-chain
    const onChainJob = await nosana.value.jobs.get(job.value.address);
    const numericState = getStateNumber(onChainJob.state);

    // if jobAccount.state != 1 => job cannot be extended per SDK restrictions
    if (numericState !== 1) {
      toast.error('Job can only be extended while running (state=1)');
      return;
    }

    const timeInSeconds = extendTime.value * 60;
    console.log('timeInSeconds', timeInSeconds);
    console.log('job.value.address', job.value.address);
    const result = await nosana.value.jobs.extend(job.value.address, timeInSeconds);
    toast.success(`Job has been extended! Transaction: ${result.tx}`);

    const updated = await nosana.value.jobs.get(job.value.address);
    job.value = updated;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    toast.error(`Error extending job: ${errorMessage}`);
    console.error('Extend job error:', e);
  } finally {
    loadingExtend.value = false;
    showExtendModal.value = false;
  }
};

const loadingRepost = ref(false);
const { markets, getMarkets, loadingMarkets } = useMarkets();
const { data: testgridMarkets } = await useAPI('/api/markets', { default: () => [] });

if (!markets.value && !loadingMarkets.value) {
  getMarkets();
}

const repostJob = async () => {
  if (!job.value?.address) {
    toast.error('No valid job address to repost.');
    return;
  }

  const theTimeout = job.value.timeout ? Math.floor(job.value.timeout / 60) : 60;

  try {
    loadingRepost.value = true;
    router.push({
      path: '/jobs/create',
      query: {
        fromRepost: 'true',
        step: 'post-job',
        jobAddress: job.value.address,
        jobTimeout: theTimeout
      }
    });
  } catch (error: any) {
    toast.error(`Error preparing repost: ${error.toString()}`);
  } finally {
    loadingRepost.value = false;
  }
};

let ws: WebSocket | null = null;
let isWebSocketConnected = false;
const isConnecting = ref(false);

const checkAndConnectWebSocket = async () => {
  if (isWebSocketConnected || isConnecting.value) return;

  if (
    job.value &&
    isRunning(job.value.state) &&
    isJobPoster.value &&
    isVerified.value &&
    connected.value
  ) {
    isConnecting.value = true;
    await connectWebSocket();
  }
};

onMounted(() => {
  checkAndConnectWebSocket();
});

onActivated(() => {
  checkAndConnectWebSocket();
});

const connectWebSocket = async () => {
  if (ws) {
    ws.close();
    ws = null;
    isWebSocketConnected = false;
  }

  if (logs.value) {
    logs.value = logs.value.filter(
      (log) => !log.logs.includes('Error connecting to WebSocket')
    );
  }

  const nodeAddress = job.value.node.toString();
  const frpServer = useRuntimeConfig().public.nodeDomain;

  let authHeader = '';
  try {
    authHeader = await signMessage();
  } catch (error) {
    isConnecting.value = false;
    isWebSocketConnected = false;
    return;
  }

  const wsUrl = `wss://${nodeAddress}.${frpServer}/log`;

  try {
    ws = new WebSocket(wsUrl);

    const connectionTimeout = setTimeout(() => {
      if (!isWebSocketConnected) {
        if (ws) {
          ws.close();
          ws = null;
        }
        isConnecting.value = false;
        isWebSocketConnected = false;
        logs.value?.push({
          id: Date.now(),
          logs: 'Could not establish WebSocket connection to get the logs. The node may be offline.'
        });
      }
    }, 10000);

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      isWebSocketConnected = true;
      isConnecting.value = false;
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
      isConnecting.value = false;

      try {
        const outerData = JSON.parse(event.data);
        let logData: any = outerData;

        if (
          !('type' in outerData || 'log' in outerData || 'method' in outerData) &&
          outerData.data
        ) {
          logData = JSON.parse(outerData.data);
        }

        if (!logData) return;
        const convertedLog = ansi.ansi_to_html(logData.log || '');

        if (
          (logData.type === 'multi-process-bar-update' ||
            logData.method === 'MultiProgressBarReporter.update') &&
          logData.payload?.event
        ) {
          const event = logData.payload.event;
          const layerId = event.id;

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

            const lastLog = logs.value?.[logs.value.length - 1]?.logs;
            const newLog = `${event.status}: ${layerId}`;
            if (newLog !== lastLog) {
              logs.value?.push({
                id: Date.now(),
                logs: newLog
              });
            }
            return;
          }

          if (event.status === 'Downloading' || event.status === 'Extracting') {
            const current = event.progressDetail?.current || 0;
            const total = event.progressDetail?.total || 0;

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
            return;
          }
        } else if (logData.log) {
          const lastLog = logs.value?.[logs.value.length - 1]?.logs;
          if (convertedLog !== lastLog) {
            logs.value?.push({
              id: Date.now(),
              logs: convertedLog
            });
          }
        }
      } catch (err: any) {
        toast.error('Error parsing log data: ' + err.toString());
      }
    };

    ws.onclose = () => {
      clearTimeout(connectionTimeout);
      ws = null;
      isWebSocketConnected = false;
      if (isConnecting.value) {
        logs.value?.push({
          id: Date.now(),
          logs: 'WebSocket connection closed. Could not establish connection to get the logs.'
        });
        isConnecting.value = false;
      }
    };

    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      ws = null;
      isWebSocketConnected = false;
      logs.value?.push({
        id: Date.now(),
        logs: 'Error connecting to WebSocket. The node may be offline.'
      });
      isConnecting.value = false;
    };
  } catch (error) {
    ws = null;
    isWebSocketConnected = false;
    isConnecting.value = false;
    logs.value?.push({
      id: Date.now(),
      logs: 'Failed to establish WebSocket connection. The node may be offline.'
    });
  }
};

onUnmounted(() => {
  if (ws) {
    ws.close();
    ws = null;
  }
  isWebSocketConnected = false;
  isConnecting.value = false;
  logs.value = null;
});

watch(
  [() => job.value?.state, () => connected.value, () => isVerified.value, () => isJobPoster.value],
  async () => {
    await checkAndConnectWebSocket();
  },
  { immediate: true }
);

const hasResultsRegex = computed(() => {
  if (!job.value?.jobDefinition?.ops) return false;
  return job.value.jobDefinition.ops.some((op: any) => op.results);
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

.visit-service-btn {
  color: #10E80C !important;
  border-color: #10E80C !important;
  background: transparent !important;

  &:hover {
    background: #10E80C !important;
    color: white !important;
  }
}

.modal.is-active {
  display: flex;
}

.modal-card {
  max-width: 500px;
  width: 100%;
}
</style>
