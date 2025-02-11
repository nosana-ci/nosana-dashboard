<template>
  <div>
    <TopBar :title="'Job Page'" :subtitle="'Find information about your job here'">
    </TopBar>

    <div class="box">
      <div v-if="job">
        <div class="is-flex is-align-items-center is-justify-content-space-between mb-4">
          <div class="is-flex is-align-items-center">
            <div v-if="(isRunning(job.state))
              && job.jobDefinition
              && job.jobDefinition.ops
              && job.jobDefinition.ops[0]
              && job.jobDefinition.ops[0].args.expose
              && (!job.jobDefinition.ops[0].args.private || isJobPoster)
              && serviceUrl" class="mr-4">
              <a :href="serviceUrl" target="_blank" class="button is-success">
                Visit Service
              </a>
            </div>
            <div v-if="isJobPoster && (isRunning(job.state) || getStateNumber(job.state) === 0)" class="mr-4">
              <button @click="stopJob" :class="{ 'is-loading': loading }" class="button is-danger">
                Stop Job
              </button>
            </div>
            <div v-if="isJobPoster && isRunning(job.state)" class="mr-4">
              <button @click="openExtendModal" :class="{ 'is-loading': loadingExtend }" class="button is-warning">
                Extend Job
              </button>
            </div>

          </div>
          <div class="is-flex is-align-items-center">
            <div class="mr-4">
              <button @click="repostJob" class="button is-primary is-small is-outlined">
                Repost
              </button>
            </div>
            <ExplorerJobStatus
              :status="job.state === 2 && job.jobStatus ? (job.jobStatus === 'success' ? 'SUCCESS' : 'FAILED') : job.state">
            </ExplorerJobStatus>
          </div>
        </div>

        <ExplorerJobInfo :job="job" :is-job-poster="isJobPoster" />

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
            <div v-if="isRunning(job.state) && connected">
              <div v-if="isConnecting">Loading logs..</div>
              <div v-else-if="signMessageError">Failed to sign message. Please try again.</div>
              <div v-else>
                <JobLogViewer ref="logViewer" :is-job-poster="isJobPoster" />
              </div>
            </div>
            <div v-else-if="isRunning(job.state)">
              Please connect your wallet to view logs
            </div>
            <div v-else-if="loading">Loading logs..</div>
            <div v-else-if="isCompleted(job.state) && (!job.ipfsResult || !ipfsResult)">The job was prematurely stopped so no logs are available</div>
            <div v-else-if="!ipfsResult">No logs</div>
            <div v-else-if="ipfsResult.results && ipfsResult.results[0] === 'nos/secret'">
              Results are secret
            </div>
            <ExplorerJobResult v-else-if="(ipfsResult && job.state === 'COMPLETED') || getStateNumber(job.state) === 2"
              :ipfs-result="ipfsResult" :ipfs-job="job.jobDefinition" />
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
            <p class="help mt-2">
              Cost: {{ extensionCost.toFixed(2) }} NOS
              <span v-if="nosPrice" class="has-text-grey">(~${{ (extensionCost * nosPrice).toFixed(2) }})</span>
            </p>
            <p v-if="!hasEnoughBalance" class="help is-danger mt-2">
              Insufficient NOS balance. You need {{ extensionCost.toFixed(2) }} NOS but have {{ userBalances.nos.toFixed(2) }} NOS.
            </p>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button 
            class="button is-success" 
            @click="confirmExtend"
            :disabled="!hasEnoughBalance"
          >
            Extend
          </button>
          <button class="button" @click="showExtendModal = false">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import base58 from "bs58";
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
import JobLogViewer from '~/components/Job/LogViewer.vue';

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

function isRunning(stateVal: string | number): boolean {
  return getStateNumber(stateVal) === 1;
}
function isCompleted(stateVal: string | number): boolean {
  return getStateNumber(stateVal) === 2;
}

const { params } = useRoute();
const jobId = ref(String(params.id) || '');
const loading = ref(false);
const loadingExtend = ref(false);
const activeTab = ref('logs');
const logs = ref<any[] | null>(null);

const { wallet, publicKey, connected } = useWallet();
const toast = useToast();
const { nosana } = useSDK();
const ansi = new AnsiUp();
const router = useRouter();

const storedAuthHeader = useLocalStorage<string | null>('nosanaAuthHeader', null);

const userBalances = ref({
  nos: 0,
  sol: 0,
  usdc: 0,
  usdt: 0
});

const nosPrice = ref(0);

const { data: priceData } = await useAPI(
  'https://api.coingecko.com/api/v3/simple/price?ids=nosana&vs_currencies=usd',
  {
    default: () => ({
      nosana: { usd: 0 }
    })
  }
);

watch(() => priceData.value, (newPrice) => {
  if (newPrice?.nosana?.usd) {
    nosPrice.value = newPrice.nosana.usd;
  }
}, { immediate: true });

const refreshAllBalances = async () => {
  try {
    const nosBal = await nosana.value.solana.getNosBalance();
    userBalances.value.nos = nosBal?.uiAmount ?? 0;
  } catch (error) {
    console.error('Failed to refresh NOS balance', error);
  }
};

watch(connected, async (isConnected) => {
  if (isConnected) {
    await refreshAllBalances();
  }
}, { immediate: true });

const ipfsResult = ref<{ results?: string[] }>({});

const { getIpfs } = useIpfs();
const artifacts = ref(null);
const ipfsGateway = ref(nosana.value ? nosana.value.ipfs.config.gateway : null);

const { data: job, pending: loadingJob, refresh: refreshJob } = useAPI(`/api/jobs/${jobId.value}`, {
  watch: false
});

const { pause: pauseJobPolling, resume: resumeJobPolling } = useIntervalFn(
  () => {
    refreshJob();
  },
  10000,
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
      if (
        newJob.ipfsResult &&
        newJob.ipfsResult !== 'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51'
      ) {
        const resultResponse = await getIpfs(newJob.ipfsResult);
        ipfsResult.value = resultResponse;
      }
    } catch (error) {
      toast.error(`Error fetching IPFS result: ${JSON.stringify(error)}`);
    }
  },
  { immediate: true, deep: true }
);

// Check if user is job poster
const isJobPoster = computed(() => {
  return connected.value && job.value && publicKey.value?.toString() === job.value.project;
});

const isVerified = ref(storedAuthHeader.value !== null);

const signMessageError = ref(false);

const signMessage = async (forceNew = false) => {
  if (storedAuthHeader.value && !forceNew) {
    isVerified.value = true;
    return storedAuthHeader.value;
  }

  if (!connected.value || !publicKey.value || !wallet.value) {
    throw new Error('Wallet not connected or not found');
  }

  try {
    signMessageError.value = false;
    const message = "Hello Nosana Node!";
    const encodedMessage = new TextEncoder().encode(message);
    const adapter = wallet.value.adapter as MessageSignerWalletAdapter;

    if (!adapter.signMessage) {
      throw new Error("Wallet does not support message signing");
    }

    const signedMessage = await adapter.signMessage(encodedMessage);
    const authHeader = `${message}:${base58.encode(signedMessage)}`;

    storedAuthHeader.value = authHeader;
    isVerified.value = true;
    return authHeader;
  } catch (error) {
    signMessageError.value = true;
    isVerified.value = false;
    throw error;
  }
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
    // If you want to invalidate stored auth when wallet changes:
    if (!newPublicKey) {
      storedAuthHeader.value = null;
      isVerified.value = false;
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
    const numericState = getStateNumber(job.value.state);

    // If job is completed (2) or stopped (3), no need to proceed
    if (numericState === 2 || numericState === 3) {
      toast.info(`Job is already ${numericState === 2 ? 'COMPLETED' : 'STOPPED'}`);
      return;
    }

    // If job is queued (0), delist it
    if (numericState === 0) {
      await nosana.value.jobs.delist(jobId.value);
      loading.value = false;
      toast.success('Job successfully delisted (canceled) from queue!');
      refreshJob(); // Immediate refresh
    }
    // If job is running (1), end it
    else if (numericState === 1) {
      await nosana.value.jobs.end(jobId.value);
      loading.value = false;
      toast.success('Job successfully ended!');
      refreshJob(); // Immediate refresh
    }
    // Otherwise, let the user know
    else {
      toast.error(`Job is not in QUEUED or RUNNING state (currently: ${job.value.state})`);
      return;
    }

    // Do another refresh after a short delay to ensure we have the latest state
    setTimeout(() => refreshJob(), 2000);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const fullError = String(e);
    if (errorMessage.includes('TransactionExpiredTimeoutError') || 
        fullError.includes('Transaction was not confirmed in') ||
        fullError.includes('TimeoutError')) {
      toast.error('Solana is congested, try again or with a higher fee (Turbo/Ultra)');
    } else if (errorMessage.includes('Unknown action') || 
               fullError.includes('Unknown action')) {
      toast.error('Not enough NOS balance for the transaction');
    } else {
      toast.error(`Error stopping job: ${errorMessage}`);
    }
    console.error('Stop job error:', e);
  } finally {
    loading.value = false;
  }
};

// Show/hide the extend modal
const showExtendModal = ref(false);
// How many minutes to extend
const extendTime = ref<number>(5);

// Add computed property for extension cost
const extensionCost = computed(() => {
  if (!job.value?.market || !markets.value) return 0;
  
  const market = markets.value.find(m => m.address.toString() === job.value?.market);
  if (!market) return 0;
  
  // Calculate cost: (market price per second * extension time in seconds) / 1e6 for NOS conversion
  const basePrice = (market.jobPrice * extendTime.value * 60) / 1e6;
  // Add 10% network fee
  const networkFee = basePrice * 0.1;
  
  return basePrice + networkFee;
});

const hasEnoughBalance = computed(() => {
  const balance = publicKey.value ? userBalances.value?.nos || 0 : 0;
  return balance >= extensionCost.value;
});

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

  if (!hasEnoughBalance.value) {
    toast.error('Insufficient NOS balance for extension');
    return;
  }

  try {
    loadingExtend.value = true;

    const numericState = getStateNumber(job.value.state);

    // if jobAccount.state != 1 => job cannot be extended per SDK restrictions
    if (numericState !== 1) {
      toast.error('Job can only be extended while running (state=1)');
      return;
    }

    // Add the current timeout to the extend time to make it feel like we're adding time
    const currentTimeoutMinutes = job.value.timeout ? Math.floor(job.value.timeout / 60) : 0;
    const newTimeoutMinutes = currentTimeoutMinutes + extendTime.value;
    const timeInSeconds = newTimeoutMinutes * 60;

    const result = await nosana.value.jobs.extend(job.value.address, timeInSeconds);
    loadingExtend.value = false;
    toast.success(`Job has been extended! Transaction: ${result.tx}`);
    refreshJob(); // Immediate refresh
    showExtendModal.value = false;  // Close modal after successful extension

    // Do another refresh after a short delay to ensure we have the latest state
    setTimeout(() => refreshJob(), 2000);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const fullError = String(e);
    if (errorMessage.includes('TransactionExpiredTimeoutError') || 
        fullError.includes('Transaction was not confirmed in') ||
        fullError.includes('TimeoutError')) {
      toast.error('Solana is congested, try again or with a higher fee (Turbo/Ultra)');
    } else if (errorMessage.includes('Unknown action') || 
               fullError.includes('Unknown action')) {
      toast.error('Not enough NOS balance for the transaction');
    } else {
      toast.error(`Error extending job: ${errorMessage}`);
    }
    console.error('Extend job error:', e);
  } finally {
    loadingExtend.value = false;
  }
};

const loadingRepost = ref(false);
const { markets, getMarkets, loadingMarkets } = useMarkets();

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
const hasRetried = ref(false);

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

interface ProgressBar {
  id: string;
  current: number;
  total: number;
  status: string;
  text: string;
}

interface LogEntry {
  id: number;
  type: 'log' | 'progress';
  content: string;
  ansi?: boolean;
  progress?: ProgressBar;
}

const structuredLogs = ref<LogEntry[]>([]);


const serviceUrl = ref<string | null>(null);
const hasShownServiceOnlineToast = ref(false);

function stripAnsi(str: string): string {
  return str.replace(/\u001b\[\d+m|\u001b\[\d+;\d+m|\u001b\[0m|\u001b\[1m|\u001b\[22m/g, '');
}

function handleWebSocketMessage(event: MessageEvent) {
  logViewer.value?.handleWebSocketMessage(event);

  // Check for service online message in logs
  const data = event.data;

  try {
    const jsonData = typeof data === 'string' ? JSON.parse(data) : data;

    if (jsonData.data) {
      const innerData = typeof jsonData.data === 'string' ? JSON.parse(jsonData.data) : jsonData.data;

      // Check if this is a log message about service being exposed
      if (innerData.log) {
        const cleanLog = stripAnsi(innerData.log);

        // Try both URL formats
        const exposedMatch = cleanLog.match(/Job .* is now exposed \((https:\/\/[^)]+)\)/) ||
          cleanLog.match(/Service exposed at: (https:\/\/[^)\s]+)/);

        if (exposedMatch && !hasShownServiceOnlineToast.value) {
          const url = exposedMatch[1];
          serviceUrl.value = url;
          toast.success('Service is online');
          hasShownServiceOnlineToast.value = true;
        }
      }
    }
  } catch (e) {
    // Silently handle parsing errors
  }
}

// Update the computed property for service URL
watch(() => job.value?.address, (newAddress) => {
  if (!newAddress) return;

  // Set default URL (for non-private jobs)
  if (job.value?.jobDefinition?.ops?.[0]?.args?.expose) {
    if (!job.value?.jobDefinition?.ops[0]?.args?.private) {
      const url = `https://${newAddress}.node.k8s.prd.nos.ci`;
      serviceUrl.value = url;
  }
  }
}, { immediate: true });

const logViewer = ref<InstanceType<typeof JobLogViewer> | null>(null);

const connectWebSocket = async () => {
  if (ws) {
    ws.close();
    ws = null;
    isWebSocketConnected = false;
  }

  // Remove old error logs
  logViewer.value?.clearLogs();

  const nodeAddress = job.value.node.toString();
  const frpServer = useRuntimeConfig().public.nodeDomain;
  let authHeader = '';

  try {
    authHeader = await signMessage();
  } catch {
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
        logViewer.value?.addLog(
          'Could not establish WebSocket connection to get the logs. The node may be offline.',
          false
        );
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
          address: job.value.project,
        },
      };
      ws?.send(JSON.stringify(authMessage));
    };

    ws.onmessage = (event: MessageEvent) => {
      isConnecting.value = false;
      handleWebSocketMessage(event);
    };

    ws.onclose = () => {
      clearTimeout(connectionTimeout);
      ws = null;
      isWebSocketConnected = false;
      if (isConnecting.value) {
        logViewer.value?.addLog(
          'WebSocket connection closed. Could not establish connection to get the logs.',
          false
        );
      }
      isConnecting.value = false;
    };

    ws.onerror = async () => {
      clearTimeout(connectionTimeout);
      ws = null;
      isWebSocketConnected = false;
      logViewer.value?.addLog(
        'Error connecting to WebSocket. The node may be offline.',
        false
      );
      isConnecting.value = false;

      // Only attempt re-signing if there are no logs yet
      if (!hasRetried.value && connected.value && isJobPoster.value && isRunning(job.value?.state)) {
        hasRetried.value = true;
        try {
          await signMessage(true);
          checkAndConnectWebSocket();
        } catch (err) {
          console.error('Re-sign message error:', err);
        }
      }
    };
  } catch (error) {
    ws = null;
    isWebSocketConnected = false;
    isConnecting.value = false;
    logViewer.value?.addLog(
      'Failed to establish WebSocket connection. The node may be offline.',
      false
    );
  }
};

onUnmounted(() => {
  logViewer.value?.clearLogs();
  if (ws) {
    ws.close();
    ws = null;
  }
  isWebSocketConnected = false;
  isConnecting.value = false;
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

.modal.is-active {
  display: flex;
}

.modal-card {
  max-width: 500px;
  width: 100%;
}

.progress-text {
  margin-bottom: 0.5rem;
  font-family: monospace;
}

.progress.is-primary {
  margin-bottom: 1rem;
}
</style>
