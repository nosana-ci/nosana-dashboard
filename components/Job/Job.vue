<template>
  <!-- Job Card Container -->
  <div class="card">
    <!-- Card Header and Service Endpoints Container -->
    <div class="card-header-container" @click="toggleMainContent">
    <!-- Card Header - Always Visible -->
      <header class="card-header">
      <div class="w-100">
        <!-- Main Job Info Row -->
          <div class="job-header-main p-4 w-100" style="flex-grow: 1;">
          <div class="job-header-grid">
            <!-- Job Title -->
            <div class="job-title-col">
              <div class="job-title">
                <template v-if="templateForJob">
                  {{ templateForJob.name }}
                </template>
                <template v-else-if="jobDefinitionId">
                  {{ jobDefinitionId }}
                </template>
                <template v-else-if="dockerImage">
                  {{ dockerImage.split('/').pop() }}
                </template>
                <template v-else>
                  <span class="icon-text">
                    <span class="icon is-small">
                      <i class="fas fa-spinner fa-spin"></i>
                    </span>
                    <span>Loading</span>
                  </span>
                </template>
              </div>
                <div class="job-docker">
                  <span v-if="dockerImage">{{ dockerImage }}</span>
                </div>
            </div>

            <!-- GPU -->
            <div class="job-gpu-col">
              <div class="job-gpu">
                <span v-if="actualGpuInfo">{{ cleanGpuName }}</span>
                <span v-else>
                  <span class="icon-text">
                    <span class="icon is-small">
                      <i class="fas fa-spinner fa-spin"></i>
                    </span>
                    <span>Loading GPU</span>
                  </span>
                </span>
              </div>
            </div>

            <!-- Price -->
            <div class="job-price">
              <div class="price-value">
                <JobPrice 
                  :job="{
                    usdRewardPerHour: job.usdRewardPerHour,
                    timeStart: job.timeStart,
                    timeEnd: job.timeEnd,
                    timeout: job.timeout,
                    state: job.state ?? (job.isCompleted ? 2 : job.timeStart ? 1 : 0)
                  }"
                    :options="{ showPerHour: !job.isCompleted }"
                />
              </div>
            </div>

              <!-- Actions and Status -->
              <div class="job-actions is-hidden-mobile">
                <div class="actions-container">
              <button
                    v-if="job.isRunning && isJobPoster"
                @click.stop="stopJob"
                :class="{ 'is-loading': loading }"
                    class="button is-danger is-small custom-button"
              >
                    <span class="icon is-small mr-1">
                      <img src="~/assets/img/icons/stop.svg" class="button-icon" />
                    </span>
                    <span>Stop</span>
              </button>
              <button
                    v-if="job.isRunning && isJobPoster"
                @click.stop="openExtendModal"
                :class="{ 'is-loading': loadingExtend }"
                    class="button is-primary is-small ml-2 custom-button"
              >
                    <span class="icon is-small mr-1">
                      <img src="~/assets/img/icons/plus_symbol.svg" class="button-icon" />
                    </span>
                    <span>Extend</span>
              </button>
              <button 
                v-if="job.isRunning || job.isCompleted"
                @click.stop="repostJob" 
                    class="button is-primary is-small ml-2 custom-button"
              >
                    <span class="icon is-small mr-1">
                      <img src="~/assets/img/icons/redo.svg" class="button-icon" />
                </span>
                <span>Redeploy</span>
              </button>
                  <div class="job-status ml-2">
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
              </div>
            </div>
          </div>
        </div>

        <!-- Dropdown Arrow -->
        <button class="card-header-icon" aria-label="more options">
          <span class="icon">
            <img 
              src="~/assets/img/icons/arrow-collapse.svg" 
              class="arrow-icon" 
              :class="{ 'is-rotated': isMainContentOpen }"
              alt="Toggle content"
            />
          </span>
        </button>
      </header>

        <!-- Service Endpoints Row -->
      <div v-if="endpoints && endpoints.size > 0" class="service-endpoints px-5 py-2">
          <div 
            v-for="([url, endpointData], index) in Array.from(endpoints.entries())" 
            :key="index"
            class="endpoint-item mb-2"
          >
            <div class="endpoint-content">
            <span class="endpoint-port">- Port {{ endpointData.port }}</span>
            <div class="tag is-outlined is-light ml-2" :class="{
                  'is-success': job.isRunning && endpointData.status === 'ONLINE',
                  'is-danger': !job.isRunning || (job.isRunning && endpointData.status === 'OFFLINE'),
              'is-info': job.isRunning && endpointData.status === 'UNKNOWN'
                }">
              <span>{{ 
                !job.isRunning || job.isCompleted 
                  ? 'OFFLINE' 
                  : endpointData.status === 'UNKNOWN' 
                    ? 'LOADING' 
                    : endpointData.status 
              }}</span>
              </div>
            <a :href="url" target="_blank" class="button is-small custom-button" @click.stop>
                Open Service
              </a>
            </div>
          </div>
        </div>
      </div>

    <div v-if="isMainContentOpen" class="content-separator"></div>

    <!-- Collapsible Content -->
    <div v-if="isMainContentOpen" class="card-content p-4">
      <!-- Delist Button for Queued Jobs -->
      <div v-if="isJobPoster && job.state === 0" class="notification is-warning is-light mb-4">
        <div class="is-flex is-justify-content-space-between is-align-items-center">
          <div>
            <p class="subtitle is-6 mb-1">Job is queued</p>
            <p class="is-size-7">This job is waiting to be picked up by a node.</p>
          </div>
          <button
            @click.stop="stopJob"
            :class="{ 'is-loading': loading }"
            class="button is-warning"
          >
            Delist Job
          </button>
        </div>
      </div>

      <!-- Quick Details Compact Grid -->
      <div class="content mb-5">
        <div class="columns is-multiline is-variable is-0 no-padding">
          <!-- Duration -->
          <div class="column is-one-third-desktop is-half-tablet is-full-mobile no-padding">
            <div class="quick-detail-item">
              <span class="quick-detail-label">Duration</span>
              <span class="quick-detail-value">
                <span v-if="jobDurationDisplay">{{ jobDurationDisplay }}</span>
                <span v-else class="icon-text">
                  <span class="icon is-small"><i class="fas fa-spinner fa-spin"></i></span>
                  <span>Loading</span>
                </span>
              </span>
            </div>
          </div>

          <!-- Country -->
          <div class="column is-one-third-desktop is-half-tablet is-full-mobile no-padding">
            <div class="quick-detail-item">
              <span class="quick-detail-label">Country</span>
              <span class="quick-detail-value">
                <span v-if="countryInfo">{{ countryInfo }}</span>
                <span v-else class="icon-text">
                  <span class="icon is-small"><i class="fas fa-spinner fa-spin"></i></span>
                  <span>Loading</span>
                </span>
              </span>
            </div>
          </div>

          <!-- CPU -->
          <div class="column is-one-third-desktop is-half-tablet is-full-mobile no-padding">
            <div class="quick-detail-item">
              <span class="quick-detail-label">CPU</span>
              <span class="quick-detail-value">
                <span v-if="combinedSpecs?.cpu">{{ combinedSpecs.cpu }}</span>
                <span v-else class="icon-text">
                  <span class="icon is-small"><i class="fas fa-spinner fa-spin"></i></span>
                  <span>Loading</span>
                </span>
              </span>
            </div>
          </div>

          <!-- RAM -->
          <div class="column is-one-third-desktop is-half-tablet is-full-mobile no-padding">
            <div class="quick-detail-item">
              <span class="quick-detail-label">RAM</span>
              <span class="quick-detail-value">
                <span v-if="combinedSpecs?.ram">{{ combinedSpecs.ram }} MB</span>
                <span v-else class="icon-text">
                  <span class="icon is-small"><i class="fas fa-spinner fa-spin"></i></span>
                  <span>Loading</span>
                </span>
              </span>
            </div>
          </div>

          <!-- Disk Space -->
          <div class="column is-one-third-desktop is-half-tablet is-full-mobile no-padding">
            <div class="quick-detail-item">
              <span class="quick-detail-label">Disk Space</span>
              <span class="quick-detail-value">
                <span v-if="combinedSpecs?.diskSpace">{{ combinedSpecs.diskSpace }} GB</span>
                <span v-else class="icon-text">
                  <span class="icon is-small"><i class="fas fa-spinner fa-spin"></i></span>
                  <span>Loading</span>
                </span>
              </span>
            </div>
          </div>

          <!-- Download Speed -->
          <div class="column is-one-third-desktop is-half-tablet is-full-mobile no-padding">
            <div class="quick-detail-item">
              <span class="quick-detail-label">Download</span>
              <span class="quick-detail-value">
                <span v-if="benchmarkData?.data?.length">
                  {{ Number(benchmarkData.data[0]?.metrics.internetSpeedDownload).toFixed(2) }} Mbps
                </span>
                <span v-else class="icon-text">
                  <span class="icon is-small"><i class="fas fa-spinner fa-spin"></i></span>
                  <span>Loading</span>
                </span>
              </span>
            </div>
          </div>

          <!-- Upload Speed -->
          <div class="column is-one-third-desktop is-half-tablet is-full-mobile no-padding" style="display: none;">
            <div class="quick-detail-item">
              <span class="quick-detail-label">Upload</span>
              <span class="quick-detail-value">
                <span v-if="benchmarkData?.data?.length">
                  {{ Number(benchmarkData.data[0]?.metrics.internetSpeedUpload).toFixed(2) }} Mbps
                </span>
                <span v-else class="icon-text">
                  <span class="icon is-small"><i class="fas fa-spinner fa-spin"></i></span>
                  <span>Loading</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Section -->
      <div v-if="job.jobDefinition">
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

  <!-- Modals -->
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
  <div v-if="showChatPopup" class="modal is-active">
    <div class="modal-background" @click="showChatPopup = false"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Test Chat Available</p>
        <button class="delete" aria-label="close" @click="showChatPopup = false"></button>
      </header>
      <footer class="modal-card-foot">
        <button class="button is-success" @click="activateChatAndClosePopup">Open Test-Chat</button>
        <button class="button" @click="showChatPopup = false">Dismiss</button>
      </footer>
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

watch([chatServiceUrl, endpoints, () => job.isRunning, () => job.isCompleted], ([newUrl, currentEndpoints, isRunning, isCompleted]) => {
  if (newUrl && currentEndpoints.has(newUrl)) {
    const serviceInfo = currentEndpoints.get(newUrl);
    if (serviceInfo && serviceInfo.status === 'ONLINE' && isRunning && !isCompleted) {
      isChatServiceReady.value = true; // Enable the chat tab
      if (!popupAlreadyShown.value) {
        showChatPopup.value = true;
        popupAlreadyShown.value = true; // Ensure popup is shown only once
      }
    } else {
      isChatServiceReady.value = false; // Disable chat tab
    }
  } else {
    isChatServiceReady.value = false; // Disable chat tab if no URL or endpoint info
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

const getStatusIcon = (status: string) => {
  if (!job.isRunning || job.isCompleted) {
    return '/img/icons/status/stopped.svg'; // Offline because job is not running or completed
  }

  // Job is running, determine icon by endpoint status
  if (status === 'ONLINE') {
    return '/img/icons/status/done.svg';
  } else if (status === 'UNKNOWN') {
    return '/img/icons/status/running.svg'; // Loading state
  } else if (status === 'OFFLINE') {
    return '/img/icons/status/failed.svg'; // Offline because endpoint is offline
  }
  
  return '/img/icons/status/failed.svg'; // Default to failed if status is unexpected while job is running
};

const getStatusText = (status: string) => {
  if (!job.isRunning || job.isCompleted) {
    return 'OFFLINE';
  }
  // Job is running
  if (status === 'ONLINE') {
    return 'ONLINE';
  } else if (status === 'UNKNOWN') {
    return 'LOADING';
  } else if (status === 'OFFLINE') {
    return 'OFFLINE';
  }
  return 'OFFLINE'; // Default to OFFLINE for any other case when job is running
};

</script>

<style lang="scss" scoped>
// Utility class for full width
.w-100 {
  width: 100%;
}

.has-text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Card header container styling
.card-header-container {
  cursor: pointer;
  background-color: #ffffff;
  border-radius: 8px 8px 0 0; // Round top corners
}

// New job header layout
.job-header-main {
  /* border-bottom: 1px solid #e8e8e8; */ /* Removed */
}

.job-header-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

.job-title-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  min-width: 0; // Allow container to shrink below content size
  
  .job-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #363636;
    line-height: 1.2;
  }
  
  .job-docker {
    font-size: 0.8rem;
    font-family: monospace;
    color: #7a7a7a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: -0.1rem;
    max-width: 100%; // Ensure it doesn't overflow its container
  }
}

.job-gpu-col {
  display: flex;
  align-items: center;
  
  .job-gpu {
    font-size: 1.05rem;
    color: #363636;
    font-weight: 600;
    line-height: 1.2;
  }
}

.job-price {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    text-align: left;
    justify-content: flex-start;
  }
  
  .price-value {
    font-size: 1.05rem;
    font-weight: 600;
    color: #363636;
    line-height: 1.2;
  }
}

.job-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-start;
  
  @media (max-width: 768px) {
    justify-content: flex-start;
  }

  .actions-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .button {
    .icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      
      i {
        font-size: 0.75rem !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: inline-block !important;
      }
      
      .button-icon {
        width: 12px !important;
        height: 12px !important;
        display: inline-block !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
    }
  }

  .custom-button {
    background-color: #e8e8e8 !important;
    border-color: #e8e8e8 !important;
    color: #363636 !important;
    border: none !important;
    box-shadow: none !important;
    
    &:hover {
      background-color: #d8d8d8 !important;
      border-color: #d8d8d8 !important;
    }
    
    .button-icon {
      filter: brightness(0) saturate(100%) invert(21%) sepia(6%) saturate(2013%) hue-rotate(201deg) brightness(95%) contrast(93%);
    }

    &.is-success.is-outlined {
      background-color: transparent !important;
      border-color: #48c774 !important;
      color: #48c774 !important;
      
      &:hover {
        background-color: #48c774 !important;
        border-color: #48c774 !important;
        color: white !important;
      }
    }

    &.is-danger {
      &:focus,
      &:active,
      &:focus-visible {
        box-shadow: none !important;
        outline: none !important;
      }
    }
  }
}

.job-status {
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    margin-left: 0.5rem;
  }
}

// Service endpoints styling
.service-endpoints {
  background-color: #ffffff;
  border-top: 0px solid #e8e8e8;
  transition: background-color 0.2s ease;
}

.endpoint-content {
  background-color: #ffffff;
  transition: background-color 0.2s ease;
}

.card-header.is-clickable:hover + .service-endpoints,
.card-header.is-clickable:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.endpoint-item {
  &:last-child {
    margin-bottom: 0 !important;
  }
}

.endpoint-content {
  display: flex;
  align-items: center;
  padding: 0.0rem;
  background: #ffffff;
  gap: 0.5rem;
}

.endpoint-port {
  font-weight: 500;
  color: #363636;
  font-size: 0.93rem;
  display: flex;
  align-items: center;
}

.tags.has-addons {
  display: inline-flex;
  align-items: center;
  margin: 0;
  margin-top: 0.6rem;
  
  .tag {
    display: inline-flex;
    align-items: center;
    height: 1.3rem;
    padding: 0 0.5rem;
  }
}

// Smooth rotation for dropdown arrow
.fa-angle-down {
  transition: transform 0.3s ease;
}

// Quick Details specific styling
.quick-detail-item {
  padding: 0.2rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .quick-detail-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #7a7a7a;
    text-transform: uppercase;
    margin-bottom: 0;
  }

  .quick-detail-value {
    font-size: 0.9rem;
      font-weight: 500;
    color: #363636;
    word-break: break-word;

    .icon-text {
      color: #363636;
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .card-header-title {
    .columns {
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .column {
      width: 100% !important;
      text-align: left !important; // Align all header items left on mobile
      &.has-text-centered {
        text-align: left !important;
      }
    }
  }
  
  .buttons {
    justify-content: flex-start; // Align buttons left on mobile
    &.is-flex-wrap-nowrap {
      flex-wrap: wrap !important; // Allow buttons to wrap on mobile
      .button {
        margin-bottom: 0.5rem !important;
      }
    }
  }
  .level-left,
  .level-right {
    flex-basis: auto;
    flex-grow: 0;
    flex-shrink: 0;
  }
  .level-left + .level-right {
    margin-top: 0.75rem;
  }
}

// Dark mode adjustments
html.dark-mode {
  .card {
    background-color: #2c2c2c;
    border-color: #444;
  }
  
  .card-header {
    background-color: #2c2c2c;
    border-bottom-color: #444;
  }
  
  .card-header-container {
    background-color: #2c2c2c;
  }
  
  .card-content {
    background-color: #2c2c2c;

    pre {
      background-color: #1f1f1f;
      color: #c9d1d9;
      border-radius: 4px;
      border: 1px solid #444;
      padding: 1rem;
    }
  }
  
  .box {
    background-color: #363636;
    border-color: #555;
  }

  // New header layout dark mode
  .job-header-main {
    /* border-bottom-color: #444; */ /* Removed */
  }
  
  .job-title-col {
    .job-title {
      color: #ffffff;
    }
  }
  
  .job-gpu-col {
    .job-gpu {
      color: #ffffff;
    }
  }
  
  .job-price {
    .price-value {
      color: #ffffff;
    }
  }
  
  .job-docker {
    color: #b0b0b0;
  }
  
  .service-endpoints {
    background-color: #2c2c2c;
    border-top-color: #444;
  }
  
  .endpoint-content {
    background: #2c2c2c;
    border-color: #444;
  }
  
  .endpoint-port {
    color: #ffffff;
  }

  .quick-detail-item {
    /* background-color: #363636; // Keep background for dark mode consistency */
    /* border-color: #555; // Border removed */
    // Ensuring quick detail items don't have a conflicting background if card-content is #2c2c2c
    background-color: transparent; // Or match #2c2c2c if they should be distinct cards

    .quick-detail-label {
      color: #b0b0b0;
    }

    .quick-detail-value,
    .quick-detail-value .icon-text {
      color: #ffffff;
    }
  }
  
  .notification.is-warning.is-light {
    background-color: rgba(255, 221, 87, 0.1);
    color: #fff;
  }

  .card-header.is-clickable:hover + .service-endpoints,
  .card-header.is-clickable:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .arrow-icon {
    filter: brightness(0) invert(1); // Make arrow white in dark mode
  }
}

// Override Bulma's default spacing for tighter layout in specific areas
.card-content.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
        }

// Status tag styling improvements
.tags.has-addons {
  .tag:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  
  .tag:last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}

// Button group spacing
.buttons.are-small {
  .button {
    margin-bottom: 0;
  }
}

.arrow-icon {
  width: 1rem;
  height: 1rem;
  transition: transform 0.3s ease;
  transform: rotate(-90deg);
  
  &.is-rotated {
    transform: rotate(-180deg);
  }
}

.button.is-success.is-small {
  &.px-0.py-0 {
    padding: 0;
    line-height: 1;
    height: auto;
  }
}

.open-service-btn {
  padding: 0 0.25rem !important;
  line-height: 1;
  height: auto;
}

.compact-btn {
  padding: 0 0.5rem !important;
  line-height: 1.2 !important;
  height: 1.5rem !important;
  min-height: unset !important;
}

// Add this new class to remove padding from columns
.no-padding {
  padding: 0 !important;
  
  .column {
    padding: 0 !important;
    margin-bottom: 0.5rem;
  }
}

.content-separator {
  height: 1px;
  background-color: #e8e8e8; // Bulma's $border-light or similar
}

html.dark-mode .content-separator {
  background-color: #444; // Bulma's $grey-darker or similar for dark mode borders
}

.service-button {
  background-color: #e8e8e8 !important;
  border: none !important;
  color: #363636 !important;
  text-decoration: none !important;
  outline: none !important;
  box-shadow: none !important;
  
  &:hover {
    background-color: #d8d8d8 !important;
    border: none !important;
    box-shadow: none !important;
  }
  
  &:focus,
  &:active,
  &:focus-visible {
    background-color: #e8e8e8 !important;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
  }
}

html.dark-mode {
  .service-button {
    background-color: #555555 !important; // Match custom-button dark bg
    color: #ffffff !important; // Match custom-button dark text
    
    &:hover {
      background-color: #656565 !important; // Match custom-button dark hover bg
    }
    
    &:focus,
    &:active,
    &:focus-visible {
      background-color: #555555 !important; // Match custom-button dark bg for focus/active
    }
  }
}

.card {
  border-radius: 8px;
  overflow: hidden; // Ensure inner content doesn't overflow rounded corners
}
</style>



