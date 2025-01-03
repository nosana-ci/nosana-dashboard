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
            <div class="mr-4">
              <button
                @click="repostJob"
                :class="{ 'is-loading': loadingRepost }"
                class="button is-primary is-medium is-outlined"
              >
                Repost
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
              <div v-if="isConnecting" class="has-text-info">
                <span class="icon-text">
                  <span class="icon">
                    <i class="fas fa-sync fa-spin"></i>
                  </span>
                  <span>Connecting to logs...</span>
                </span>
              </div>
              <div v-else-if="logs && logs.length > 0" style="counter-reset: line">
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
import { useRoute, useRouter } from "vue-router";
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
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { useMarkets } from '~/composables/useMarkets';
import { Mode, ValidationSeverity, type ValidationError } from 'vanilla-jsoneditor';
import { validateJobDefinition, type Market, type IValidation } from "@nosana/sdk";
import JsonEditorVue from 'json-editor-vue';
import { useLocalStorage } from '@vueuse/core';

const toast = useToast();
const { nosana } = useSDK();
const ansi = new AnsiUp();
const router = useRouter();

const storedAuthHeader = useLocalStorage<string | null>('nosanaAuthHeader', null);

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

// Add state mapping at the top with other constants
const jobStateMapping: { [key: string]: number } = {
  RUNNING: 1,
  COMPLETED: 2,
  STOPPED: 3,
  FAILED: 4
};

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
    // Initialize logs only if wallet is connected
    if (connected.value && !logs.value) {
      logs.value = [];
    }
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
const isVerified = ref(storedAuthHeader.value !== null);

// 3) In signMessage, we now store the signed message to storedAuthHeader,
//    which is bound to localStorage.
const signMessage = async (forceNew = false) => {
  if (storedAuthHeader.value && !forceNew) {
    // Verify the stored signature matches the current wallet
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

  // Save the auth header to local storage so that
  // it persists when switching between pages.
  storedAuthHeader.value = authHeader;
  isVerified.value = true;
  return authHeader;
};

const needsVerification = computed(() => {
  return job.value && 
    (job.value.state === 'RUNNING' || job.value.state === 1) && 
    isJobPoster.value &&
    !isVerified.value;
});

// Add a watch for the wallet connection to validate stored auth header
watch(
  publicKey,
  async (newPublicKey) => {
    if (newPublicKey && storedAuthHeader.value) {
      // Check if the stored auth header matches the current wallet
      const [storedKey] = storedAuthHeader.value.split(':');
      if (storedKey !== newPublicKey.toString()) {
        // If the stored key doesn't match the current wallet, clear it
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
        // Initialize logs if job is running
        if (job.value && (job.value.state === 'RUNNING' || job.value.state === 1)) {
          logs.value = [];
        }
      } catch (error) {
        toast.error('Failed to verify wallet');
      }
    } else if (!newConnected) {
      isVerified.value = false;
      storedAuthHeader.value = null;
      // Clear logs when disconnecting
      logs.value = null;
      if (ws) {
        ws.close();
        isWebSocketConnected = false;
        isConnecting.value = false;
      }
    }
  },
  { immediate: true }
);

// Add a watch for connected state to handle logs initialization
watch(
  connected,
  async (newConnected) => {
    if (newConnected && job.value && (job.value.state === 'RUNNING' || job.value.state === 1)) {
      logs.value = [];

    } else if (!newConnected) {
      logs.value = null;
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

    // Fetch a fresh copy from on-chain
    const onChainJob = await nosana.value.jobs.get(job.value.address);

    // Convert to numeric if it's a string state
    const numericState = typeof onChainJob.state === 'string'
      ? jobStateMapping[onChainJob.state]
      : onChainJob.state;

    // Show toast logs with the actual states
    toast.info(`On-chain job.state: "${onChainJob.state}" (numeric: ${numericState})`);
    toast.info(`Local job.state: "${job.value.state}" (type: ${typeof job.value.state})`);
    toast.info(`Market: ${onChainJob.market || 'None'}`);
    toast.info(`Node: ${onChainJob.node}`);
    toast.info(`Project: ${onChainJob.project}`);
    toast.info(`Your wallet: ${publicKey.value.toString()}`);

    // Check if numericState matches RUNNING (1)
    if (numericState !== 1) {
      toast.warning(`Job is not in numeric RUNNING (1). Retrying in 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
      const reCheck = await nosana.value.jobs.get(job.value.address);
      const reCheckNumeric = typeof reCheck.state === 'string'
        ? jobStateMapping[reCheck.state]
        : reCheck.state;

      if (reCheckNumeric !== 1) {
        toast.error(`Still cannot extend: On-chain says "${reCheck.state}" (numeric: ${reCheckNumeric})`);
        return;
      }
    }

    const result = await nosana.value.jobs.extend(job.value.address, 300); 
    toast.success(`Job has been extended! Transaction: ${result.tx}`);

    const updated = await nosana.value.jobs.get(job.value.address);
    job.value = updated;
    toast.info(`After extension: On-chain job.state is "${updated.state}"`);

  } catch (err: any) {
    toast.error(`Error extending job: ${err.message ?? err.toString()}`);
  } finally {
    loadingExtend.value = false;
  }
};

// Add these refs near the top with other refs
const loadingRepost = ref(false);

// Remove duplicate imports and fix market types
const { markets, getMarkets, loadingMarkets } = useMarkets();
const { data: testgridMarkets } = await useAPI('/api/markets', { default: () => [] });

// Add this watch to initialize markets if needed
if (!markets.value && !loadingMarkets.value) {
  getMarkets();
}

// Add these computed properties
const pricePerHour = computed(() => {
  if (!repostMarket.value) return 0;
  return (repostMarket.value.jobPrice * 3600) / 1e6;
});

const maxPrice = computed(() => {
  if (!repostMarket.value || !repostTimeout.value) return 0;
  return (repostMarket.value.jobPrice * repostTimeout.value * 60) / 1e6;
});

const networkFee = computed(() => {
  return maxPrice.value * 0.1;
});

// Modify the repostJob function to initialize the values
const repostJob = async () => {
  if (!job.value?.address) {
    toast.error("No valid job address to repost.");
    return;
  }
  
  try {
    loadingRepost.value = true;
    router.push({
      path: '/jobs/create',
      query: {
        fromRepost: 'true',
        step: 'post-job',
        jobAddress: job.value.address,
      },
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

watch(
  () => job.value?.state,
  async (newState, oldState) => {
    // If job is not defined, bail out
    if (!job.value) return;

    // Determine if the state indicates the job is running
    const isRunState = (newState === 'RUNNING' || newState === 1);
    const wasRunState = (oldState === 'RUNNING' || oldState === 1);
    const walletOk = connected.value && isVerified.value && isJobPoster.value;

    // Only connect if transitioning to running state with valid wallet
    if (isRunState && walletOk && !isWebSocketConnected) {
      isConnecting.value = true;
      await connectWebSocket();
    }
    // Close socket if job is no longer running
    else if (ws && isWebSocketConnected && wasRunState && !isRunState) {
      ws.close();
      isWebSocketConnected = false;
      isConnecting.value = false;
    }
  }
);

// Also add a watch for wallet connection changes to handle disconnects
watch(
  () => connected.value && isVerified.value && isJobPoster.value,
  (newWalletOk, oldWalletOk) => {
    if (!newWalletOk && ws) {
      ws.close();
      isWebSocketConnected = false;
      isConnecting.value = false;
    }
  }
);

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
    isConnecting.value = false;
    return;
  }
  const wsUrl = `wss://${nodeAddress}.${frpServer}/log`;

  try {
    ws = new WebSocket(wsUrl);

    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      if (!isWebSocketConnected) {
        ws?.close();
        isConnecting.value = false;
        logs.value?.push({
          id: Date.now(),
          logs: "Could not establish WebSocket connection to get the logs. The node may be offline."
        });
      }
    }, 10000); // 10 second timeout

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
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
      isConnecting.value = false;
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
      clearTimeout(connectionTimeout);
      ws = null;
      isWebSocketConnected = false;
      if (isConnecting.value) {
        logs.value?.push({
          id: Date.now(),
          logs: "WebSocket connection closed. Could not establish connection to get the logs."
        });
        isConnecting.value = false;
      }
    };

    ws.onerror = (error) => {
      clearTimeout(connectionTimeout);
      isWebSocketConnected = false;
      logs.value?.push({
        id: Date.now(),
        logs: "Error connecting to WebSocket. The node may be offline."
      });
      isConnecting.value = false;
    };
  } catch (error) {
    isWebSocketConnected = false;
    logs.value?.push({
      id: Date.now(),
      logs: "Failed to establish WebSocket connection. The node may be offline."
    });
    isConnecting.value = false;
  }
};

// Ensure we close the WebSocket on unmount
onUnmounted(() => {
  if (ws) {
    ws.close();
  }
});

// Add validator function near other functions
const validator = (json: any): ValidationError[] => {
  const validation: IValidation<any> = validateJobDefinition(json);
  const errors: ValidationError[] = [];
  if (validation.errors?.length) {
    validation.errors.forEach((error: any) => {
      errors.push({
        path: error.path.replace('$input.', '').replace('$input', '').split('.'),
        message: error.message || 'Invalid value',
        severity: ValidationSeverity.error
      });
    });
  }
  return errors;
};

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
