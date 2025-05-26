<template>
  <!-- Job Title Header with Collapsible Content -->
  <div class="job-header-container">
    <div class="job-title-row" @click="toggleMainContent" :class="{ 'is-closed': !isMainContentOpen }">
      <div class="job-title-info">
        <!-- Template Name/Title -->
        <div class="job-title">
          <template v-if="templateForJob">
            <span class="title-text main-row-text">{{ templateForJob.name }}</span>
          </template>
          <template v-else-if="jobDefinitionId || dockerImage">
            <span class="title-text main-row-text">{{ jobDefinitionId || dockerImage }}</span>
          </template>
          <template v-else>
            <span class="title-text main-row-text">
              <span class="icon is-small mr-1">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              Loading
            </span>
          </template>
        </div>

        <!-- GPU Info -->
        <div class="job-gpu">
          <span v-if="actualGpuInfo" class="gpu-text main-row-text">{{ cleanGpuName }}</span>
          <span v-else class="gpu-text main-row-text">
            <span class="icon is-small mr-1">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            Loading
          </span>
        </div>

        <!-- Price per hour -->
        <div class="job-price">
          <JobPrice 
            :job="{
              usdRewardPerHour: job.usdRewardPerHour,
              timeStart: job.timeStart,
              timeEnd: job.timeEnd,
              timeout: job.timeout,
              state: job.state ?? (job.isCompleted ? 2 : job.timeStart ? 1 : 0)
            }"
            :options="{ showPerHour: true }"
            class="main-row-text"
          />
        </div>

        <!-- Docker URL -->
        <div class="job-docker">
          <span v-if="dockerImage" class="docker-url is-family-monospace main-row-text">{{ dockerImage }}</span>
          <span v-else class="docker-url main-row-text">
            <span class="icon is-small mr-1">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            Loading
          </span>
        </div>

        <!-- Action Buttons (Stop/Extend) -->
        <div class="job-actions-inline">
          <template v-if="isJobPoster && job.isRunning">
            <button
              @click.stop="stopJob"
              :class="{ 'is-loading': loading }"
              class="button is-light is-small stop-button"
            >
              Stop
            </button>
            <button
              @click.stop="openExtendModal"
              :class="{ 'is-loading': loadingExtend }"
              class="button is-light is-small"
            >
              Extend
            </button>
            <button @click.stop="repostJob" class="button is-light is-small">
              <span class="icon"><i class="fas fa-redo"></i></span>
              <span>Redeploy</span>
            </button>
          </template>
        </div>

        <!-- Job Status -->
        <div class="job-status">
          <JobStatus
            :status="
              job.isCompleted && job.jobStatus
                ? job.jobStatus === 'success'
                  ? 'SUCCESS'
                  : 'FAILED'
                : job.state
            "
          />
        </div>
      </div>

      <!-- Dropdown Arrow -->
      <div class="dropdown-arrow">
        <img src="~/assets/img/icons/arrow-expand.svg" alt="Expand" class="expand-arrow" :class="{ 'is-expanded': isMainContentOpen }" />
      </div>
    </div>

    <!-- Service Endpoints Table (always visible) -->
    <div v-if="endpoints && endpoints.size > 0" class="service-endpoints-section-persistent">
      <table class="table">
        <tbody>
          <tr v-for="([url, endpointData], index) in Array.from(endpoints.entries())" :key="index">
            <td class="endpoint-port-cell">
              <span class="port-text">Port {{ endpointData.port }}</span>
            </td>
            <td class="endpoint-status-cell">
              <span class="endpoint-status-simple" :class="{
                'status-online': endpointData.status === 'ONLINE',
                'status-offline': endpointData.status === 'OFFLINE',
                'status-loading': endpointData.status === 'UNKNOWN'
              }">
                <span class="status-icon">
                  <span v-if="endpointData.status === 'ONLINE'" class="icon is-small">
                    <i class="fas fa-check-circle"></i>
                  </span>
                  <span v-else-if="endpointData.status === 'OFFLINE'" class="icon is-small">
                    <i class="fas fa-times-circle"></i>
                  </span>
                  <span v-else class="icon is-small">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                </span>
                <span class="status-text">
                  {{ endpointData.status === 'UNKNOWN' ? 'Loading' : endpointData.status }}
                </span>
              </span>
            </td>
            <td class="endpoint-url-cell">
              <a :href="url" target="_blank" class="button is-small is-light">
                <span>Open Service</span>
                <span class="icon is-small ml-1">
                  <img src="~/assets/img/icons/external.png" alt="External" class="external-icon">
                </span>
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Collapsible Content -->
    <div v-if="isMainContentOpen" class="job-content">
      <!-- Action Buttons Row (conditional, moved inside collapsible) -->
      <div v-if="isJobPoster && job.state === 0" class="job-actions-row-collapsible mb-4">
        <div class="action-buttons-left">
          <button
            @click.stop="stopJob"
            :class="{ 'is-loading': loading }"
            class="button is-light is-small stop-button"
          >
            Delist Job
          </button>
        </div>
      </div>

      <!-- Quick Details Section -->
      <div class="quick-details-section mb-4">
        <div class="quick-details-grid">
          <!-- Duration -->
          <div class="detail-item">
            <span class="icon is-small">
              <i class="fas fa-clock"></i>
            </span>
            <div class="detail-content">
              <span class="detail-label">Duration</span>
              <span class="detail-value">
                <span v-if="jobDurationDisplay">{{ jobDurationDisplay }}</span>
                <span v-else>
                  <span class="icon is-small mr-1">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  Loading
                </span>
              </span>
            </div>
          </div>

          <!-- Country -->
          <div class="detail-item">
            <span class="icon is-small">
              <i class="fas fa-globe"></i>
            </span>
            <div class="detail-content">
              <span class="detail-label">Country</span>
              <span class="detail-value">
                <span v-if="countryInfo">{{ countryInfo }}</span>
                <span v-else>
                  <span class="icon is-small mr-1">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  Loading
                </span>
              </span>
            </div>
          </div>

          <!-- CPU -->
          <div class="detail-item">
            <span class="icon is-small">
              <i class="fas fa-microchip"></i>
            </span>
            <div class="detail-content">
              <span class="detail-label">CPU</span>
              <span class="detail-value">
                <span v-if="combinedSpecs?.cpu">{{ combinedSpecs.cpu }}</span>
                <span v-else>
                  <span class="icon is-small mr-1">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  Loading
                </span>
              </span>
            </div>
          </div>

          <!-- RAM -->
          <div class="detail-item">
            <span class="icon is-small">
              <i class="fas fa-memory"></i>
            </span>
            <div class="detail-content">
              <span class="detail-label">RAM</span>
              <span class="detail-value">
                <span v-if="combinedSpecs?.ram">{{ combinedSpecs.ram }} MB</span>
                <span v-else>
                  <span class="icon is-small mr-1">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  Loading
                </span>
              </span>
            </div>
          </div>

          <!-- Disk Space -->
          <div class="detail-item">
            <span class="icon is-small">
              <i class="fas fa-hdd"></i>
            </span>
            <div class="detail-content">
              <span class="detail-label">Disk Space</span>
              <span class="detail-value">
                <span v-if="combinedSpecs?.diskSpace">{{ combinedSpecs.diskSpace }} GB</span>
                <span v-else>
                  <span class="icon is-small mr-1">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  Loading
                </span>
              </span>
            </div>
          </div>

          <!-- Download Speed -->
          <div class="detail-item">
            <span class="icon is-small">
              <i class="fas fa-download"></i>
            </span>
            <div class="detail-content">
              <span class="detail-label">Download</span>
              <span class="detail-value">
                <span v-if="benchmarkData?.data?.length">
                  {{ Number(benchmarkData.data[0]?.metrics.internetSpeedDownload).toFixed(2) }} Mbps
                </span>
                <span v-else>
                  <span class="icon is-small mr-1">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  Loading
                </span>
              </span>
            </div>
          </div>

          <!-- Upload Speed -->
          <div class="detail-item">
            <span class="icon is-small">
              <i class="fas fa-upload"></i>
            </span>
            <div class="detail-content">
              <span class="detail-label">Upload</span>
              <span class="detail-value">
                <span v-if="benchmarkData?.data?.length">
                  {{ Number(benchmarkData.data[0]?.metrics.internetSpeedUpload).toFixed(2) }} Mbps
                </span>
                <span v-else>
                  <span class="icon is-small mr-1">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  Loading
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Action Buttons -->
      <div v-if="job.jobDefinition" class="modal-buttons-container mt-5">
        <JobTabs
          :job="job"
          :endpoints="endpoints"
          :isJobPoster="isJobPoster"
          :jobDefinition="job.jobDefinition"
          :hasArtifacts="false"
          :isConnecting="isConnecting"
          :logs="logs"
          :progressBars="progressBars"
          :resourceProgressBars="resourceProgressBars"
          :showChatTab="isChatServiceReady"
          :chatServiceUrl="chatServiceUrl"
          v-model:activeTab="activeTab"
          ref="jobTabsRef"
        />
      </div>
    </div>
  </div>

  <ExtendModal
    v-if="modal.isOpen.value && job"
    :job="job"
    :nosPrice="nosPrice"
    :closeExtendModal="modal.close"
    :userBalances="userBalances"
  />
  <LogSubscription
    v-if="isJobPoster && job.isRunning"
    :initLogs="initLogs"
    :closeLogs="closeLogs"
  />

  <!-- Chat Popup -->
  <div v-if="showChatPopup" class="chat-prompt-popup">
    <div class="popup-content">
      <p>The model's ready. Would you like to test it out in chat?</p>
      <button @click="activateChatAndClosePopup">Open Test-Chat</button>
      <button @click="showChatPopup = false">Dismiss</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import JobLogsView from "~/components/Job/Tabs/Logs.vue";
import JobDefinitionView from "~/components/Job/Tabs/JobDefinition.vue";
import JobChatView from "~/components/Job/Tabs/Chat.vue";
import JobResultsView from "~/components/Job/Tabs/Results.vue";
import DeploymentInfo from "~/components/Info/DeploymentInfo.vue";
import HostSpecifications from "~/components/Info/HostSpecifications.vue";
import JobStatus from "~/components/Job/Status.vue";
import JobPrice from "~/components/Job/Price.vue";
import ExtendModal from "~/components/Job/Modals/Extend.vue";
import JobTabs from "~/components/Job/Tabs.vue";

import LogSubscription from "./LogSubscription.vue";
import { useJobLogs } from "~/composables/jobs/useJobLogs";
import { useTemplates } from "~/composables/useTemplates";
import { useToast } from "vue-toastification";

import type { UseModal } from "~/composables/jobs/useModal";
import type { Endpoints, UseJob } from "~/composables/jobs/useJob";
import { computed, ref, watch, watchEffect, nextTick, onMounted, onUnmounted } from 'vue';
import type { JobDefinition, ExposedPort, Operation, OperationArgsMap, HttpHealthCheck } from '@nosana/sdk';

interface Props {
  job: UseJob;
  modal: UseModal;
  endpoints: Endpoints;
  nosPrice: number;
  isJobPoster: boolean;
}

const { job, isJobPoster, endpoints, modal, nosPrice } = defineProps<Props>();
const { userBalances, signMessage } = useNosanaWallet();
const { templates } = useTemplates();
const toast = useToast();
const router = useRouter();
const { isVerified } = useNosanaWallet();

const currentTime = ref(Math.floor(Date.now() / 1000));
let timerId: NodeJS.Timeout | null = null;

onMounted(() => {
  timerId = setInterval(() => {
    currentTime.value = Math.floor(Date.now() / 1000);
  }, 1000);
});

onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId);
  }
});

const isChatServiceReady = ref(false); // Controls chat tab visibility

const showChatPopup = ref(false);
const chatServiceUrl = ref<string | null>(null);
const popupAlreadyShown = ref(false);

const isDetailsOpen = ref(false);

const isMainContentOpen = ref(false);

// Loading states for buttons
const loading = ref<boolean>(false);
const loadingExtend = ref<boolean>(false);

// Computed properties for job info
const dockerImage = computed(() => {
  if (!job.jobDefinition?.ops?.length) {
    return null; // Will show loading state
  }
  const firstOp = job.jobDefinition.ops[0];
  if (firstOp.type === 'container/run') {
    const args = firstOp.args as OperationArgsMap['container/run'];
    if (args.image) {
      return args.image;
    }
  }
  return null; // Will show loading state
});

const jobDefinitionId = computed(() => {
  if (!job.jobDefinition?.ops?.length) return null;
  const firstOp = job.jobDefinition.ops[0];
  return firstOp.id || null;
});

const templateForJob = computed(() => {
  if (!templates.value || !job.jobDefinition) return null;
  return templates.value.find(t => 
    JSON.stringify(t.jobDefinition) === JSON.stringify(job.jobDefinition)
  );
});

const isGHCR = (image: string) => {
  return image.startsWith('ghcr.io');
};

// Get host specs for actual GPU info
const { data: nodeSpecs } = useAPI(`/api/nodes/${job.node}/specs`, {
  // @ts-ignore
  disableToastOnError: true,
});

const { data: nodeInfo } = useAPI(
  `https://${job.node}.${useRuntimeConfig().public.nodeDomain}/node/info`,
  {
    // @ts-ignore
    disableToastOnError: true,
  }
);

const actualGpuInfo = computed(() => {
  // Try to get GPU info from node info first
  if (nodeInfo.value?.info?.gpus?.devices?.length) {
    const gpu = nodeInfo.value.info.gpus.devices[0];
    return gpu.name || 'GPU';
  }
  
  // Fallback to node specs
  if (nodeSpecs.value?.gpus?.length) {
    return nodeSpecs.value.gpus[0].gpu || 'GPU';
  }
  
  return 'GPU';
});

const countryInfo = computed(() => {
  // Try to get country from node info first
  if (nodeInfo.value?.info?.country) {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(nodeInfo.value.info.country) || nodeInfo.value.info.country;
    } catch {
      return nodeInfo.value.info.country;
    }
  }
  
  // Fallback to node specs
  if (nodeSpecs.value?.country) {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(nodeSpecs.value.country) || nodeSpecs.value.country;
    } catch {
      return nodeSpecs.value.country;
    }
  }
  
  return null;
});

const formatDuration = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return 'Invalid duration';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
};

const jobDurationDisplay = computed(() => {
  if (job.timeStart === undefined || job.timeout === undefined) return null; // Loading or not applicable

  const maxDurationFormatted = formatDuration(job.timeout);

  if (job.isCompleted && job.timeEnd !== undefined) {
    // Job completed, show actual duration
    const actualDuration = job.timeEnd - job.timeStart;
    return `${formatDuration(actualDuration)} (max ${maxDurationFormatted})`;
  } else if (job.isRunning && job.timeStart) {
    // Job running, show current duration
    const currentDuration = currentTime.value - job.timeStart;
    return `${formatDuration(currentDuration)} (max ${maxDurationFormatted})`;
  } else if (job.state === 0 && job.timeStart === 0) {
    // Queued job, just show max duration
    return `(max ${maxDurationFormatted})`;
  } 
  return `(max ${maxDurationFormatted})`; // Default or fallback
});

const cleanGpuName = computed(() => {
  if (actualGpuInfo.value.startsWith('NVIDIA GeForce')) {
    return actualGpuInfo.value.substring(15);
  }
  return actualGpuInfo.value;
});

// Format time started
const timeStartFormatted = computed(() => {
  if (!job.timeStart) return null;
  const date = new Date(job.timeStart * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
});

// Get time ago
const timeAgo = computed(() => {
  if (!job.timeStart) return null;
  try {
    const now = Date.now();
    const startTime = job.timeStart * 1000;
    const diffMs = now - startTime;
    
    // Convert to appropriate time unit
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec} seconds ago`;
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } catch(e) {
    return null;
  }
});

// Combined node specs
const combinedSpecs = computed(() => {
  if (!nodeSpecs.value) return null;

  const nodeInfoData = nodeInfo.value?.info;

  return {
    nodeAddress: job.node,
    marketAddress: nodeSpecs.value.marketAddress,
    ram: nodeInfoData?.ram_mb
      ? Math.round(nodeInfoData.ram_mb)
      : Math.round(Number(nodeSpecs.value.ram)),
    diskSpace: nodeInfoData?.disk_gb
      ? Math.round(Number(nodeInfoData.disk_gb))
      : Math.round(Number(nodeSpecs.value.diskSpace)),
    cpu: nodeInfoData?.cpu?.model ?? nodeSpecs.value.cpu,
    country: nodeInfoData?.country ?? nodeSpecs.value.country,
    bandwidth:
      nodeInfoData?.network?.download_mbps ?? nodeSpecs.value.bandwidth,
    gpus: nodeInfoData?.gpus?.devices
      ? nodeInfoData.gpus.devices.map((gpu: any) => ({
          gpu: gpu.name,
          memory: gpu.memory?.total_mb,
          architecture: `${gpu.network_architecture?.major}.${gpu.network_architecture?.minor}`,
        }))
      : nodeSpecs.value.gpus,
    cudaVersion:
      nodeInfoData?.gpus?.cuda_driver_version ?? nodeSpecs.value.cudaVersion,
    nvmlVersion:
      nodeInfoData?.gpus?.nvml_driver_version ?? nodeSpecs.value.nvmlVersion,
    nodeVersion: nodeInfoData?.version ?? nodeSpecs.value.nodeVersion,
    systemEnvironment: nodeInfoData?.system_environment
      ? nodeInfoData.system_environment.toLowerCase().includes("wsl")
        ? "WSL"
        : nodeInfoData.system_environment
          ? "Linux"
          : null
      : nodeSpecs.value.systemEnvironment
        ? nodeSpecs.value.systemEnvironment.toLowerCase().includes("wsl")
          ? "WSL"
          : "Linux"
        : null,
  };
});

// Generic benchmark data
const { data: benchmarkData } = useAPI(
  `/api/benchmarks/generic-benchmark-data?node=${job.node}`,
  {
    // @ts-ignore
    disableToastOnError: true,
  }
);

const toggleDetails = () => {
  isDetailsOpen.value = !isDetailsOpen.value;
};

const toggleMainContent = () => {
  isMainContentOpen.value = !isMainContentOpen.value;
};

// Job action functions (moved from JobToolbar)
async function stopJob() {
  loading.value = true;

  if (!isVerified.value) {
    try {
      await signMessage(true);
    } catch (error) {
      loading.value = false;
      toast.error("Failed to verify wallet.");
      return;
    }
  }

  try {
    await job.stopJob();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('Job is already COMPLETED') && !message.includes('Job is already STOPPED')) {
       toast.error(`Failed to initiate stop/delist: ${message}`); 
    }
    console.error("Error calling job.stopJob():", error);
  } finally {
    loading.value = false;
  }
}

function repostJob() {
  // Generate a unique repost ID with timestamp
  const repostId = `repost-${Date.now()}`;
  
  // Store job information in localStorage
  localStorage.setItem(repostId, JSON.stringify({
    jobAddress: job.address,
    jobTimeout: (job.timeout / 3600).toFixed(2),
    marketAddress: job.market.toString(),
    timestamp: Date.now()
  }));
  
  // Navigate with minimal URL parameters
  router.push({
    path: "/deploy",
    query: {
      repostId: repostId
    },
  });
}

function openExtendModal() {
  modal.open();
}

const hasOpenaiEndpoint = computed(() => {
  if (!job.jobDefinition || !job.jobDefinition.ops) {
    return false;
  }

  for (const op of job.jobDefinition.ops) {
    if (op.type === 'container/run') {
      const args = op.args as OperationArgsMap['container/run'];
      if (args.expose && Array.isArray(args.expose)) {
        const exposedPorts = args.expose.filter(
          (e): e is ExposedPort => typeof e === 'object' && e !== null && 'health_checks' in e
        );
        for (const exposedPort of exposedPorts) {
          if (exposedPort.health_checks) {
            for (const healthCheck of exposedPort.health_checks) {
              if (healthCheck.type === 'http') {
                const httpCheck = healthCheck as HttpHealthCheck;
                if (
                  httpCheck.path.includes("/v1") &&
                  httpCheck.method === "POST"
                ) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
  }
  return false;
});

const {
  isConnecting,
  logs,
  progressBars,
  resourceProgressBars,
  initLogs,
  closeLogs,
} = useJobLogs(job.address, job.node, endpoints, isJobPoster, signMessage);

watchEffect(() => {
  if (hasOpenaiEndpoint.value && job?.jobDefinition && endpoints) {
    for (const [url, endpointData] of endpoints.entries()) {
      const op = job.jobDefinition.ops[endpointData.opIndex];
      if (op && op.type === 'container/run') {
        const args = op.args as OperationArgsMap['container/run'];
        if (args.expose && Array.isArray(args.expose)) {
          const exposedPorts = args.expose.filter(
            (e): e is ExposedPort => typeof e === 'object' && e !== null && 'health_checks' in e
          );
          for (const exposedPort of exposedPorts) {
            if (exposedPort.health_checks) {
              for (const healthCheck of exposedPort.health_checks) {
                if (healthCheck.type === 'http') {
                  const httpCheck = healthCheck as HttpHealthCheck;
                  if (
                    httpCheck.path.includes("/v1") &&
                    httpCheck.method === "POST"
                  ) {
                    chatServiceUrl.value = url;
                    return; // Found our chat service
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});

watch([chatServiceUrl, endpoints], ([newUrl, currentEndpoints]) => {
  if (newUrl && currentEndpoints.has(newUrl)) {
    const serviceInfo = currentEndpoints.get(newUrl);
    if (serviceInfo && serviceInfo.status === 'ONLINE') {
      isChatServiceReady.value = true; // Enable the chat tab
      if (!popupAlreadyShown.value) {
        showChatPopup.value = true;
        popupAlreadyShown.value = true; // Ensure popup is shown only once
      }
    }
  }
}, { deep: true }); // deep true for endpoints map

function activateChatAndClosePopup() {
  showChatPopup.value = false;
  activeTab.value = 'chat'; // Switch to chat tab instead of opening modal
  
  // Scroll to bottom to show the chat UI properly
  nextTick(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  });
}

const activeTab = ref('logs');
const jobTabsRef = ref<any>(null); // Ref for the JobTabs component

watch(isMainContentOpen, (newValue) => {
  if (newValue && activeTab.value === 'logs') {
    nextTick(() => {
      if (jobTabsRef.value && jobTabsRef.value.logsView && jobTabsRef.value.logsView.scrollToBottomOnOpen) {
        jobTabsRef.value.logsView.scrollToBottomOnOpen();
      }
    });
  }
});

</script>

<style lang="scss" scoped>
// --- Global Variables (subset for popup) ---
$nosana-green: #1bff45;
$nosana-darker: #030303;
$nosana-border: #222;
$text-light: #ffffff;
$text-secondary: rgba(white, 0.7);
$border-radius: 12px;

.job-header-container {
  background-color: #ffffff;
  border: none;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
  padding: 0 1rem;
}

.job-title-row {
  background-color: transparent;
  margin: 0 -1rem;
  padding: 1rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: none;

  &:hover {
    background-color: rgba(0,0,0,0.03);
  }

  &.is-closed {
    border-bottom: none;
  }
}

.job-title-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 0;
}

.job-title {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 180px;

  .title-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.job-gpu {
  flex: 1;
  min-width: 100px;

  .gpu-text {
    font-weight: 500;
    color: #6c757d;
    font-size: 0.9rem;
  }
}

.job-price {
  flex: 1;
  min-width: 80px;
  
  :deep(.job-price) {
    font-weight: normal !important;
    color: #000000 !important;
    font-family: inherit !important;
    font-size: 0.9rem;
  }
}

.job-docker {
  flex: 2;
  min-width: 0;

  .docker-url {
    color: #6c757d;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
}

.job-actions-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
  flex-shrink: 0;
}

.job-status {
  min-width: 100px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}

.dropdown-arrow {
  margin-left: 1rem;
  flex-shrink: 0;

  .expand-arrow {
    width: 16px;
    height: 16px;
    opacity: 0.8;
    transition: transform 0.2s ease;
    transform: rotate(90deg);
  }
  
  .expand-arrow.is-expanded {
    transform: rotate(0deg);
  }
}

.job-content {
  background-color: transparent;
  padding-top: 1rem;
  padding-bottom: 1.25rem;
}

.template-icon {
  background-color: #ffffff;
  border: 1px solid #dbdbdb;
  width: 24px;
  height: 24px;
  border-radius: 100%;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}

.container-icon {
  background-color: #ffffff;
  border: 1px solid #dbdbdb;
  width: 24px;
  height: 24px;
  border-radius: 100%;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .github-icon {
    position: relative;
    top: -1px;
    width: 16px;
    height: 16px;
  }

  .docker-icon {
    filter: invert(48%) sepia(90%) saturate(2299%) hue-rotate(188deg) brightness(97%) contrast(91%);
    width: 16px;
    height: 16px;
  }
}

// Dark mode adjustments
html.dark-mode .job-header-container {
  background-color: #2c2c2c;
  border: none;

  .job-title-row {
    &:hover {
      background-color: rgba(255,255,255,0.05);
    }
    &.is-closed {
      border-bottom: none;
    }
  }
}

html.dark-mode .quick-details-section {
  .quick-details-grid {
    background-color: #2c2c2c;
    border-color: #444;
  }

  .detail-item {
    .icon {
      color: #b0b0b0;
    }

    .detail-content {
      .detail-label {
        color: #b0b0b0;
      }

      .detail-value {
        color: #ffffff;
      }
    }
  }
}

html.dark-mode .service-endpoints-section-persistent {
  border-bottom: none;
  
  .endpoint-port-cell .port-text {
    color: #b0b0b0;
  }
  
  .endpoint-status-simple {
    &.status-online { color: #28a745; }
    &.status-offline { color: #dc3545; }
    &.status-loading { color: #ffc107; }
  }
}

// Responsive design
@media (max-width: 1200px) {
  .job-title-info {
    gap: 1.5rem;
  }
  
  .job-title {
    min-width: 150px;
  }
}

@media (max-width: 768px) {
  .job-title-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .job-title,
  .job-gpu,
  .job-price,
  .job-docker,
  .job-actions-inline,
  .job-status {
    min-width: auto;
    width: 100%;
  }

  .job-status {
    justify-content: flex-start;
  }

  .job-actions-row {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;

    .action-buttons-left {
      justify-content: center;
    }
  }
}

.chat-prompt-popup {
  position: fixed;
  top: 50%; 
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba($nosana-darker, 0.95); 
  border: 1px solid $nosana-green;
  color: $text-light;
  padding: 20px;
  border-radius: $border-radius;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  text-align: center;

  .popup-content {
    p {
      margin-bottom: 15px;
      font-size: 16px;
    }
    button {
      background-color: $nosana-green;
      color: $nosana-darker;
      border: none;
      padding: 10px 15px;
      border-radius: 6px;
      cursor: pointer;
      margin: 0 10px;
      font-weight: 500;
      transition: background-color 0.2s;
      &:hover {
        background-color: lighten($nosana-green, 10%);
      }
      &:last-child {
        background-color: rgba($text-secondary, 0.3);
        color: $text-light;
        &:hover {
          background-color: rgba($text-secondary, 0.5);
        }
      }
    }
  }
}

.service-endpoints-section-persistent {
  padding: 0.25rem 1rem;
  border-bottom: none;

  .table {
    width: auto;
    margin-bottom: 0;
    background-color: transparent;

    tbody tr td {
      border: none;
      padding: 0.3rem 0.5rem;
      vertical-align: middle;
      text-align: left;
    }
  }

  .endpoint-port-cell { 
    width: auto; 
    padding-right: 0.8rem; 
    
    .port-text { 
      font-weight: 500; 
      color: #6c757d;
      font-size: 0.75rem; 
      font-family: inherit;
    } 
  }
  .endpoint-status-cell { width: auto; text-align: left; padding-right: 0.8rem; }
  .endpoint-url-cell { 
    width: auto; text-align: left; 
    .button.is-small {
      font-size: 0.75rem;
      font-weight: 500; font-family: inherit; display: inline-flex; align-items: center;
      .external-icon { width: 11px; height: 11px; opacity: 0.8; }
    }
  }
  .endpoint-status-simple { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0; font-weight: 500; font-size: 0.75rem; font-family: inherit; 
    .icon.is-small { font-size: 1em; }
    &.status-online { color: #28a745; } &.status-offline { color: #dc3545; } &.status-loading { color: #ffc107; }
  }
}

.quick-details-section {
  margin-left: -1rem;
  .quick-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1rem;
    background-color: #ffffff;
    border: none;
    border-radius: 6px;
  }

  .detail-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;

    .icon {
      color: #6c757d;
      margin-top: 0.1rem;
      flex-shrink: 0;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
      flex: 1;

      .detail-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detail-value {
        font-size: 0.875rem;
        color: #2c3e50;
        font-weight: 500;
        word-break: break-word;
      }
    }
  }
}

.all-details-section {
  .button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    
    .expand-arrow-small {
      width: 12px;
      height: 12px;
      opacity: 0.8;
      transition: transform 0.2s ease;
      transform: rotate(-90deg);
    }
    
    .expand-arrow-small.is-expanded {
      transform: rotate(0deg);
    }
  }
}

.modal-buttons-container {
  .custom-action-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 0.75rem;
    
    .button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      
      .expand-arrow-small {
        width: 12px;
        height: 12px;
        opacity: 0.8;
        transition: transform 0.2s ease;
        transform: rotate(-90deg);
      }
      
      .expand-arrow-small.is-expanded {
        transform: rotate(0deg);
      }
    }
  }
}

.main-row-text {
  font-weight: normal !important;
  color: #000000 !important;
  font-family: inherit !important;
  font-size: 0.9rem;
}

:deep(.job-price .job-price) {
  font-weight: normal !important;
  color: #000000 !important;
  font-family: inherit !important;
  font-size: 0.9rem;
}

// Stop button styling - light red background
.button.stop-button {
  background-color: #ffebee !important;
  border-color: #ffcdd2 !important;
  color: #c62828 !important;
  
  &:hover {
    background-color: #ffcdd2 !important;
    border-color: #ef9a9a !important;
  }
}

// Dark mode button styling
html.dark-mode {
  .button.is-light {
    background-color: #4a4a4a !important;
    border-color: #4a4a4a !important;
    color: #ffffff !important;
    
    &:hover {
      background-color: #5a5a5a !important;
      border-color: #5a5a5a !important;
    }
  }
  
  // Stop button in dark mode
  .button.stop-button {
    background-color: #4a2c2c !important;
    border-color: #6a3a3a !important;
    color: #ff8a80 !important;
    
    &:hover {
      background-color: #5a3a3a !important;
      border-color: #7a4a4a !important;
    }
  }
}
</style>



