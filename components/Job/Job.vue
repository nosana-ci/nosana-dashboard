<template>
  <!-- Header Section -->
  <div class="box is-borderless">
    <!-- Header Section -->
    <div class="p-5 deployment-header">
        <div class="is-flex is-justify-content-space-between is-align-items-start">
          <div class="header-left-section">
            <div class="is-flex is-align-items-center mb-2">
              <NuxtLink :to="props.deploymentId ? `/deployments/${props.deploymentId}` : '/explorer'" class="button is-ghost back-button mr-4">
                <span class="icon is-small">
                  <ArrowUpIcon class="icon-16 transform-rotate-270" style="color: black;" />
                </span>
              </NuxtLink>
              <div class="header-title-section">
                <div v-if="jobImages && jobImages.length > 0" class="job-images-list">
                  <div v-for="(image, index) in jobImages" :key="index" class="title is-5 has-text-weight-normal mb-1">
                    {{ image }}
                  </div>
                </div>
                <div v-else-if="dockerImage" class="job-images-list">
                  <div class="title is-5 has-text-weight-normal mb-1">
                    {{ dockerImage }}
                  </div>
                </div>
                <div v-else-if="formattedDockerImage" class="job-images-list">
                  <div class="title is-5 has-text-weight-normal mb-1">
                    {{ formattedDockerImage }}
                  </div>
                </div>
                <h1 v-else class="title is-5 has-text-weight-normal mb-1">Job</h1>
                <p class="subtitle is-7 has-text-grey is-family-monospace mb-0">{{ props.job.address }}</p>
              </div>
              <StatusTag class="ml-4" :status="props.job.state" />
            </div>
          </div>
          <div class="deployment-tabs">
          <button 
            v-for="tab in availableTabs"
            :key="tab"
            @click="activeTab = tab"
            :class="{ 'is-active': activeTab === tab }"
            class="tab-button"
          >
            {{ getTabLabel(tab) }}
          </button>
          <!-- Actions Dropdown -->
          <div v-if="hasAnyActions" class="dropdown is-right" :class="{ 'is-active': showActionsDropdown }" ref="actionsDropdown">
            <div class="dropdown-trigger">
              <button 
                class="tab-button actions-button" 
                @click="toggleActionsDropdown"
                :class="{ 'is-loading': loading }"
              >
                <span>Actions</span>
                <span class="icon is-small dropdown-arrow ml-1" :class="{ 'is-rotated': showActionsDropdown }">
                  <ChevronDownIcon />
                </span>
              </button>
            </div>
            <div class="dropdown-menu">
              <div class="dropdown-content">
                <a 
                  v-if="props.job.isRunning && props.isJobPoster"
                  class="dropdown-item"
                  @click="handleActionClick(openExtendModal)"
                  :disabled="loadingExtend"
                >
                  <span class="icon is-small mr-2">
                    <ClockIcon />
                  </span>
                  <span>Extend</span>
                </a>

                <a 
                  v-if="(props.job.isRunning || props.job.state === 0) && props.isJobPoster"
                  class="dropdown-item"
                  @click="handleActionClick(stopJob)"
                  :disabled="loading"
                >
                  <span class="icon is-small mr-2">
                    <SquareIcon />
                  </span>
                  <span>{{ props.job.state === 0 ? 'Delist' : 'Stop' }}</span>
                </a>
                
                <div v-if="!hasAnyActions" class="dropdown-item has-text-grey">
                  <span>No actions available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="p-5">
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'">
        <!-- Job Details Section -->
        <div>
          <h2 class="title is-5 mb-3">Job details</h2>
          <div class="box is-borderless">
            <div class="table-container">
              <table class="table is-fullwidth mb-0">
              <tbody>
                <tr>
                  <td class="has-min-width-250">Job address</td>
                  <td>
                    <a :href="`https://solscan.io/account/${props.job.address}`" target="_blank" class="has-text-link is-family-monospace">
                      {{ props.job.address }}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>Deployer address</td>
                  <td>
                    <nuxt-link :to="`/deployer/${props.job.project}`" class="has-text-link is-family-monospace">
                      {{ props.job.project?.toString() }}
                    </nuxt-link>
                  </td>
                </tr>
                <tr>
                  <td>Node address</td>
                  <td>
                    <span v-if="props.job.node && props.job.node !== '11111111111111111111111111111111'">
                      <nuxt-link :to="`/host/${props.job.node}`" class="has-text-link is-family-monospace">
                        {{ props.job.node }}
                      </nuxt-link>
                    </span>
                    <span v-else class="has-text-grey">--</span>
                  </td>
                </tr>
                <tr>
                  <td>Market address</td>
                  <td>
                    <nuxt-link :to="`/markets/${props.job.market}`" class="has-text-link is-family-monospace">
                      {{ props.job.market?.toString() }}
                    </nuxt-link>
                  </td>
                </tr>
                <tr>
                  <td>Price</td>
                  <td>{{ formatPrice(props.job.price, props.nosPrice) }}</td>
                </tr>
                <tr v-if="combinedSpecs?.gpuCount">
                  <td>GPU Count</td>
                  <td>{{ combinedSpecs.gpuCount }}</td>
                </tr>
                <tr v-if="combinedSpecs?.gpuModel">
                  <td>GPU Model</td>
                  <td>{{ combinedSpecs.gpuModel }}</td>
                </tr>
                <tr v-if="combinedSpecs?.vram">
                  <td>VRAM</td>
                  <td>{{ combinedSpecs.vram }} GB</td>
                </tr>
                <tr v-if="combinedSpecs?.cpuModel">
                  <td>CPU Model</td>
                  <td>{{ combinedSpecs.cpuModel }}</td>
                </tr>
                <tr v-if="combinedSpecs?.cudaVersion">
                  <td>CUDA Driver</td>
                  <td>{{ combinedSpecs.cudaVersion }}</td>
                </tr>
                <tr v-if="combinedSpecs?.download">
                  <td>Internet Speed</td>
                  <td>{{ combinedSpecs.download }} Mbps</td>
                </tr>
                
                <!-- Additional details from Quick Details and More Details -->
                <tr v-if="jobDurationData">
                  <td>Duration</td>
                  <td>
                    <span v-if="jobDurationData.actualSeconds > 0">
                      <SecondsFormatter :seconds="jobDurationData.actualSeconds" :showSeconds="true" />
                      <span v-if="jobDurationData.maxDurationHours" class="has-text-grey"> (max {{ jobDurationData.maxDurationHours }})</span>
                    </span>
                    <span v-else-if="jobDurationData.maxDurationHours" class="has-text-grey">
                      (max {{ jobDurationData.maxDurationHours }})
                    </span>
                  </td>
                </tr>
                <tr v-if="countryInfo || isQueuedJob">
                  <td>Country</td>
                  <td>
                    <span v-if="countryInfo">{{ countryInfo }}</span>
                    <span v-else-if="isQueuedJob" class="has-text-grey">Not assigned yet</span>
                    <span v-else class="has-text-grey">--</span>
                  </td>
                </tr>
                <tr v-if="combinedSpecs?.ram">
                  <td>RAM</td>
                  <td>{{ combinedSpecs.ram }} MB</td>
                </tr>
                <tr v-if="combinedSpecs?.diskSpace">
                  <td>Disk Space</td>
                  <td>{{ combinedSpecs.diskSpace }} GB</td>
                </tr>
                <tr v-if="combinedSpecs?.upload">
                  <td>Upload Speed</td>
                  <td>{{ combinedSpecs.upload }} Mbps</td>
                </tr>
                <tr v-if="combinedSpecs?.nvmlVersion">
                  <td>NVIDIA Driver</td>
                  <td>{{ combinedSpecs.nvmlVersion }}</td>
                </tr>
                <tr v-if="combinedSpecs?.systemEnvironment">
                  <td>System Environment</td>
                  <td>{{ combinedSpecs.systemEnvironment }}</td>
                </tr>
                <tr v-if="props.job.timeStart && formatStartTime">
                  <td>Started</td>
                  <td>
                    {{ formatStartTime(props.job.timeStart) }}
                    <span class="has-text-grey is-size-7"> ({{ formatTimeAgo(props.job.timeStart) }})</span>
                  </td>
                </tr>
                <tr v-if="marketName">
                  <td>GPU Pool Name</td>
                  <td>{{ marketName }}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>

      </div>

      <!-- Container Controls Tab -->
      <div v-if="activeTab === 'container-controls'">
        <div v-if="props.job.jobDefinition">
          <JobOverview
            :job="props.job"
            :isJobPoster="props.isJobPoster"
            :opIds="flogTabs.filter(t => t !== 'system')"
            :activeLogs="(flogActiveLogs as unknown as any[])"
            :selectOp="(opId: string | null) => setFlogActiveTab(opId ?? 'system')"
            :logsByOp="flogLogsByOp"
            :systemLogsMap="flogSystemLogs"
            :jobInfo="props.jobInfo"
          />
        </div>
      </div>

      <!-- System Logs Tab -->
      <div v-if="activeTab === 'system-logs'">
        <div v-if="props.job.jobDefinition">
          <JobTabs
            :job="props.job"
            :endpoints="props.endpoints"
            :isJobPoster="props.isJobPoster"
            :jobInfo="props.jobInfo"
            :isConfidential="isConfidential"
            :jobDefinition="props.job.jobDefinition"
            :hasArtifacts="false"
            :isConnecting="isConnecting"
            :logConnectionEstablished="connectionEstablished"
            :systemLogs="[]"
            :containerLogs="[]"
            :progressBars="getFlogProgressBars()"
            :resourceProgressBars="flogResourceBarsRef"
            :showChatTab="isChatServiceReady"
            :chatServiceUrl="chatServiceUrl"
            :chatApiConfig="chatApiConfig"
            :jobCombinedSpecs="combinedSpecs"
            :jobNodeReport="jobNodeReport"
            :loadingJobNodeSpecs="loadingNodeSpecs"
            :isQueuedJob="isQueuedJob"
            :activeLogs="(flogActiveLogs as unknown as any[])"
            :opIds="flogTabs.filter(t => t !== 'system')"
            :filters="{ value: { opId: flogActiveTab === 'system' ? null : flogActiveTab, types: new Set(['container','info','error']) } }"
            :selectOp="(opId: string | null) => setFlogActiveTab(opId ?? 'system')"
            :toggleType="() => {}"
            :logsByOp="flogLogsByOp"
            :systemLogsMap="flogSystemLogs"
            :activeTab="'logs'"
            ref="jobTabsRef"
          />
        </div>
      </div>
      
      <!-- Results Tab -->
      <div v-if="activeTab === 'results'">
        <div v-if="props.job.results">
          <JobResult 
            :ipfs-result="props.job.results"
            :ipfs-job="props.job"
          />
        </div>
        <div v-else class="notification is-light has-text-centered">
          <p class="has-text-grey">No results available</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <ExtendModal
    v-if="props.modal.isOpen.value && props.job"
    :job="props.job"
    :nosPrice="props.nosPrice"
    :closeExtendModal="props.modal.close"
    :userBalances="userBalances"
  />
  <!-- Legacy log subscription removed for flog-only logs -->

  <!-- Chat Popup -->
  <div v-if="showChatPopup" class="modal is-active">
    <div class="modal-background" @click="showChatPopup = false"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Test Chat Available</p>
        <button
          class="delete"
          aria-label="close"
          @click="showChatPopup = false"
        ></button>
      </header>
      <footer class="modal-card-foot">
        <button class="button is-success" @click="activateChatAndClosePopup">
          Open Test Chat
        </button>
        <button class="button" @click="showChatPopup = false">Dismiss</button>
      </footer>
    </div>
  </div>
</template>
<script setup lang="ts">
import JobStatus from "~/components/Job/Status.vue";
import JobPrice from "~/components/Job/Price.vue";
import ExtendModal from "~/components/Job/Modals/Extend.vue";
import JobTabs from "~/components/Job/Tabs.vue";
import JobOverview from "~/components/Job/Tabs/Overview.vue";
import JobResult from "~/components/Job/Result.vue";
import SecondsFormatter from "~/components/SecondsFormatter.vue";
import StatusTag from "~/components/Common/StatusTag.vue";

import LogSubscription from "./LogSubscription.vue";
import { useFLogs } from "~/composables/jobs/useFLogs";
import { useTemplates } from "~/composables/useTemplates";
import { useToast } from "vue-toastification";
import { useNosanaWallet } from "~/composables/useNosanaWallet";
import { useAuthHeader } from "~/composables/useAuthHeader";
import { useAPI } from "~/composables/useAPI";

// Import icons as components
import ChevronDownIcon from '@/assets/img/icons/chevron-down.svg?component';
import ClockIcon from '@/assets/img/icons/clock.svg?component';
import SquareIcon from '@/assets/img/icons/square.svg?component';
import ArrowUpIcon from '@/assets/img/icons/arrow-up.svg?component';
import RunningIcon from '@/assets/img/icons/status/running.svg?component';
import StoppedIcon from '@/assets/img/icons/status/stopped.svg?component';
import FailedIcon from '@/assets/img/icons/status/failed.svg?component';
import QueuedIcon from '@/assets/img/icons/status/queued.svg?component';
import DoneIcon from '@/assets/img/icons/status/done.svg?component';
import { useStatus } from '~/composables/useStatus';

import type { UseModal } from "~/composables/jobs/useModal";
import type { Endpoints, UseJob } from "~/composables/jobs/useJob";
import type { JobInfo } from "~/composables/jobs/types";
import {
  computed,
  ref,
  watch,
  watchEffect,
  nextTick,
  onMounted,
  onUnmounted,
} from "vue";
import type {
  JobDefinition,
  ExposedPort,
  Operation,
  OperationArgsMap,
  HttpHealthCheck,
} from "@nosana/sdk";

interface Props {
  job: UseJob;
  modal: UseModal;
  endpoints: Endpoints;
  nosPrice: number;
  isJobPoster: boolean;
  jobInfo?: JobInfo | null;
  deploymentId?: string | null;
}

const props = defineProps<Props>();
const { userBalances } = useNosanaWallet();
const { hasAuth, ensureAuth } = useAuthHeader();
const getAuth = async () => ensureAuth();
const { templates } = useTemplates();
const { markets } = useMarkets();
const { saveState } = useDeployPageState();

// Fetch markets data needed for centralized pricing
const { data: testgridMarkets, pending: marketsPending, execute: executeMarkets } = useAPI('/api/markets', { default: () => [] });

// Execute the markets API call on mount
onMounted(() => {
  if (!testgridMarkets.value || testgridMarkets.value.length === 0) {
    executeMarkets();
  }
});
const toast = useToast();
const router = useRouter();

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

// Single boolean to drive connection
const hasRealNode = computed<boolean>(() => Boolean(props.job.node && props.job.node !== '11111111111111111111111111111111'));
// Do not gate on hasAuth; auth will be ensured during WS open
const shouldConnect = computed(() => props.isJobPoster && props.job.isRunning && hasRealNode.value);

// No local WS watchers; lifecycle handled inside useJobLogs

const isChatServiceReady = ref(false); // Controls chat tab visibility

const showChatPopup = ref(false);
const chatServiceUrl = ref<string | null>(null);
const popupAlreadyShown = ref(false);

const isDetailsOpen = ref(false);

const isMainContentOpen = ref(true);

// Loading states for buttons
const loading = ref<boolean>(false);
const loadingExtend = ref<boolean>(false);

// Choose job-definition for title: prefer live node info (confidential jobs), fallback to REST jobDefinition
const titleJobDefinition = computed(() => {
  return (props.jobInfo as any)?.jobDefinition || props.job.jobDefinition || null;
});

// Computed properties for job info
const dockerImage = computed(() => {
  const jd = titleJobDefinition.value as any;
  if (!jd?.ops?.length) return null;
  const firstOp = jd.ops[0];
  if (firstOp.type === "container/run") {
    const args = firstOp.args as OperationArgsMap["container/run"];
    if (args.image) return args.image;
  }
  return null; // Will show loading state
});

// Helper function to get job image (same as JobList)
const getJobImage = (job: any) => {
  const jd = (props.jobInfo as any)?.jobDefinition || job.jobDefinition;
  if (!jd?.ops?.length) return null;
  const firstOp = jd.ops[0];
  if (firstOp.type === 'container/run' && firstOp.args?.image) {
    return firstOp.args.image;
  }
  return null;
};

// Extract all Docker images from all operations for job title
const jobImages = computed(() => {
  const jd = titleJobDefinition.value as any;
  if (!jd?.ops?.length) return null;

  const images: string[] = [];
  jd.ops.forEach((op: any) => {
    if (op.type === 'container/run') {
      const args = op.args as OperationArgsMap['container/run'];
      if (args?.image && !images.includes(args.image)) images.push(args.image);
    }
  });

  return images.length > 0 ? images : null;
});

// Fallback to single image if multiple images logic fails
const singleJobImage = computed(() => {
  return getJobImage(props.job);
});

const formattedDockerImage = computed(() => {
  if (!dockerImage.value) return null;
  if (dockerImage.value.startsWith("docker.io/")) {
    return dockerImage.value.substring(10); // Length of "docker.io/"
  }
  return dockerImage.value;
});

const jobDefinitionId = computed(() => {
  if (!props.job.jobDefinition?.ops?.length) return null;
  const firstOp = props.job.jobDefinition.ops[0];
  return firstOp.id || null;
});

const templateForJob = computed(() => {
  if (!templates.value || !props.job.jobDefinition) return null;
  return templates.value.find(
    (t) =>
      JSON.stringify(t.jobDefinition) ===
      JSON.stringify(props.job.jobDefinition)
  );
});

const isGHCR = (image: string) => {
  return image.startsWith("ghcr.io");
};

// Get host specs for actual GPU info (skip when node is placeholder)
const nodeSpecsUrl = computed(() =>
  hasRealNode.value ? `/api/nodes/${props.job.node}/specs` : ''
);
const { data: nodeSpecs, pending: loadingNodeSpecs } = useAPI(nodeSpecsUrl);

const nodeInfoUrl = computed(() =>
  hasRealNode.value
    ? `https://${props.job.node}.${useRuntimeConfig().public.nodeDomain}/node/info`
    : ''
);
const { data: nodeInfo } = useAPI(nodeInfoUrl);

// Get node report
const jobNodeReportUrl = computed(() => {
  if (!props.job.node || props.job.node.toString() === '11111111111111111111111111111111') return '';
  return `/api/benchmarks/node-report?node=${props.job.node.toString()}`;
});
const { data: jobNodeReport, pending: loadingJobNodeReport } = useAPI(
  jobNodeReportUrl,
  {
    default: () => null,
    watch: [jobNodeReportUrl],
  }
);

const actualGpuInfo = computed(() => {
  // Try to get GPU info from node info first
  if (nodeInfo.value?.info?.gpus?.devices?.length) {
    const gpu = nodeInfo.value.info.gpus.devices[0];
    return gpu.name || "GPU";
  }

  // Fallback to node specs
  if (nodeSpecs.value?.gpus?.length) {
    return nodeSpecs.value.gpus[0].gpu || "GPU";
  }

  return "GPU";
});

const countryInfo = computed(() => {
  // Try to get country from node info first
  if (nodeInfo.value?.info?.country) {
    try {
      return (
        new Intl.DisplayNames(["en"], { type: "region" }).of(
          nodeInfo.value.info.country
        ) || nodeInfo.value.info.country
      );
    } catch {
      return nodeInfo.value.info.country;
    }
  }

  // Fallback to node specs
  if (nodeSpecs.value?.country) {
    try {
      return (
        new Intl.DisplayNames(["en"], { type: "region" }).of(
          nodeSpecs.value.country
        ) || nodeSpecs.value.country
      );
    } catch {
      return nodeSpecs.value.country;
    }
  }

  return null;
});

const jobDataForPriceComponent = computed(() => {
  return {
    usdRewardPerHour: props.job.usdRewardPerHour,
    timeStart: props.job.timeStart,
    timeEnd: props.job.timeEnd,
    timeout: props.job.timeout,
    market: typeof props.job.market === 'string' ? props.job.market : props.job.market?.toString(),
    state:
      props.job.state ??
      (props.job.isCompleted ? 2 : props.job.timeStart ? 1 : 0),
  };
});

const jobOptionsForPriceComponent = computed(() => {
  return { showPerHour: !props.job.isCompleted };
});

// Duration data for SecondsFormatter
const jobDurationData = ref<{ actualSeconds: number; maxDurationHours?: string } | null>(null);

const formatMaxDurationInHours = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "Invalid duration";
  const hours = seconds / 3600;
  const formattedHours = parseFloat(hours.toFixed(1));
  return `${formattedHours}h`;
};

// Helper function to format relative dates
const formatDateRelative = (timestamp: number) => {
  if (!timestamp || timestamp === 0) return '--';
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

// Helper function to format price
const formatPrice = (price: number, nosPrice: number) => {
  if (!price || !nosPrice) return '--';
  const usdPrice = (price * nosPrice).toFixed(4);
  return `$${usdPrice}`;
};

watch(
  [() => props.job, currentTime],
  ([newJob, newCurrentTimeVal]) => {
    if (newJob.timeStart === undefined || newJob.timeout === undefined) {
      jobDurationData.value = null;
      return;
    }

    const maxDurationInHoursFormatted = formatMaxDurationInHours(
      newJob.timeout
    );

    if (newJob.isCompleted && newJob.timeEnd !== undefined) {
      const actualDuration = newJob.timeEnd - newJob.timeStart;
      jobDurationData.value = {
        actualSeconds: actualDuration,
        maxDurationHours: maxDurationInHoursFormatted
      };
    } else if (newJob.isRunning && newJob.timeStart) {
      const currentDuration = newCurrentTimeVal - newJob.timeStart;
      jobDurationData.value = {
        actualSeconds: currentDuration,
        maxDurationHours: maxDurationInHoursFormatted
      };
    } else if (newJob.state === 0 && newJob.timeStart === 0) {
      // Queued - show only max duration
      jobDurationData.value = {
        actualSeconds: 0,
        maxDurationHours: maxDurationInHoursFormatted
      };
    } else {
      // Fallback or other states
      jobDurationData.value = {
        actualSeconds: 0,
        maxDurationHours: maxDurationInHoursFormatted
      };
    }
  },
  { immediate: true, deep: true }
);

const cleanGpuName = computed(() => {
  if (actualGpuInfo.value.startsWith("NVIDIA GeForce")) {
    return actualGpuInfo.value.substring(15);
  }
  return actualGpuInfo.value;
});

// Format time started
const timeStartFormatted = computed(() => {
  if (!props.job.timeStart) return null;
  const date = new Date(props.job.timeStart * 1000);
  return date.toISOString().replace("T", " ").substring(0, 19);
});

// Get time ago
const timeAgo = computed(() => {
  if (!props.job.timeStart) return null;
  try {
    const now = Date.now();
    const startTime = props.job.timeStart * 1000;
    const diffMs = now - startTime;

    // Convert to appropriate time unit
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec} seconds ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } catch (e) {
    return null;
  }
});

// Combined node specs
const combinedSpecs = computed(() => {
  if (!nodeSpecs.value) return null;

  const nodeInfoData = nodeInfo.value?.info;

  return {
    nodeAddress: props.job.node,
    marketAddress: nodeSpecs.value.marketAddress,
    ram: nodeInfoData?.ram_mb
      ? Math.round(nodeInfoData.ram_mb)
      : Math.round(Number(nodeSpecs.value.ram)),
    diskSpace: nodeInfoData?.disk_gb
      ? Math.round(Number(nodeInfoData.disk_gb))
      : Math.round(Number(nodeSpecs.value.diskSpace)),
    cpu: nodeInfoData?.cpu?.model ?? nodeSpecs.value.cpu,
    country: nodeInfoData?.country ?? nodeSpecs.value.country,
    download: nodeSpecs.value.avgDownload10,
    upload: nodeSpecs.value.avgUpload10,
    ping: nodeSpecs.value.avgPing10,
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


// Check if the job is queued (state 0 and no start time, or placeholder node)
const isQueuedJob = computed(() => {
  return (
    props.job.state === 0 && 
    props.job.timeStart === 0
  ) || props.job.node === '11111111111111111111111111111111';
});

// Check if any actions are available for the job
const hasAnyActions = computed(() => {
  // Extend action: available for running jobs if user is job poster
  const canExtend = props.job.isRunning && props.isJobPoster;
  
  // Stop/Delist action: available for running or queued jobs if user is job poster
  const canStop = (props.job.isRunning || props.job.state === 0) && props.isJobPoster;
  
  return canExtend || canStop;
});

// Check if job has results to show
const hasResults = computed(() => {
  return props.job.results && (props.job.hasResultsRegex || props.job.isCompleted);
});

// Check if container controls tab has content
const hasContainerControls = computed(() => {
  if (!props.job.jobDefinition) return false;
  
  // Check if there are any operation tabs with actual logs
  const operationTabs = flogTabs.value.filter(t => t !== 'system');
  const hasOperationLogs = operationTabs.some(tab => {
    const logs = flogLogsByOp.value.get(tab);
    return logs && logs.length > 0;
  });
  
  return operationTabs.length > 0 && hasOperationLogs;
});

// Check if system logs tab has content
const hasSystemLogs = computed(() => {
  if (!props.job.jobDefinition) return false;
  
  // Check if there are actual system log entries
  const hasSystemLogEntries = flogSystemLogs.value.length > 0;
  
  // Check if there are any operation logs
  const hasAnyOperationLogs = Array.from(flogLogsByOp.value.values()).some(logs => logs.length > 0);
  
  return hasSystemLogEntries || hasAnyOperationLogs;
});

// Available tabs based on job state and data
const availableTabs = computed(() => {
  const tabs = ['overview'];
  
  if (hasContainerControls.value) {
    tabs.push('container-controls');
  }
  
  if (hasSystemLogs.value) {
    tabs.push('system-logs');
  }
  
  if (hasResults.value) {
    tabs.push('results');
  }
  
  return tabs;
});

// Get display label for tab
const getTabLabel = (tab: string) => {
  switch (tab) {
    case 'system-logs': return 'Logs';
    case 'container-controls': return 'Container Controls';
    case 'results': return 'Results';
    default: return tab.charAt(0).toUpperCase() + tab.slice(1);
  }
};


const toggleDetails = () => {
  isDetailsOpen.value = !isDetailsOpen.value;
};


// Job action functions (moved from JobToolbar)
async function stopJob() {
  loading.value = true;

  // Ensure we can sign (or use credit header); attempts header generation
  try {
    await getAuth();
  } catch (error) {
    loading.value = false;
    toast.error("Failed to verify wallet.");
    return;
  }

  try {
    await props.job.stopJob();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      !message.includes("Job is already COMPLETED") &&
      !message.includes("Job is already STOPPED")
    ) {
      toast.error(`Failed to initiate stop/delist: ${message}`);
    }
    console.error("Error calling job.stopJob():", error);
  } finally {
    loading.value = false;
  }
}

function repostJob() {
  // Find the matching market object
  const selectedMarket = markets.value?.find(m => m.address.toString() === props.job.market.toString()) || null;
  
  // Find the matching template
  const selectedTemplate = templates.value?.find(
    (t) => JSON.stringify(t.jobDefinition) === JSON.stringify(props.job.jobDefinition)
  ) || null;

  // Save job data using unified state persistence
  saveState({
    selectedMarket,
    selectedTemplate,
    jobDefinition: props.job.jobDefinition,
    hours: props.job.timeout / 3600, // Convert from seconds to hours
    gpuTab: 'simple',
    gpuTypeCheckbox: ["PREMIUM"], // Default, will be updated by market type
    activeFilter: "PREMIUM", // Default, will be updated by market type
  });

  // Navigate to deploy page (no URL parameters needed)
  router.push('/deploy');
}

function openExtendModal() {
  props.modal.open();
}

const hasOpenaiEndpoint = computed(() => {
  if (!props.job.jobDefinition || !props.job.jobDefinition.ops) {
    return false;
  }

  for (const op of props.job.jobDefinition.ops) {
    if (op.type === "container/run") {
      const args = op.args as OperationArgsMap["container/run"];
      if (args.expose && Array.isArray(args.expose)) {
        const exposedPorts = args.expose.filter(
          (e): e is ExposedPort =>
            typeof e === "object" && e !== null && "health_checks" in e
        );
        for (const exposedPort of exposedPorts) {
          if (exposedPort.health_checks) {
            for (const healthCheck of exposedPort.health_checks) {
              if (healthCheck.type === "http") {
                const httpCheck = healthCheck as HttpHealthCheck;
                // Check for LLM chat endpoints - both vLLM and Ollama formats
                if (httpCheck.method === "POST" && httpCheck.body) {
                  try {
                    const body = JSON.parse(httpCheck.body);
                    // Check if it has LLM-style request format (model + messages)
                    if (body.model && body.messages && Array.isArray(body.messages)) {
                      return true;
                    }
                  } catch (e) {
                    // If body parsing fails, fall back to path-based detection
                    if (httpCheck.path.includes("/chat") || httpCheck.path.includes("/v1")) {
                      return true;
                    }
                  }
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

const jobType = computed(() => props.job.jobDefinition?.state?.["nosana/job-type"] || null);
const isParallelByEndpoints = computed(() => {
  try {
    const ids = new Set<string>();
    for (const [, endpoint] of props.endpoints.entries()) {
      if (endpoint.opId) ids.add(endpoint.opId);
      if (ids.size > 1) return true;
    }
    return false;
  } catch {
    return false;
  }
});
const logsMode = computed<'legacy' | 'parallel'>(() => {
  const explicit = jobType.value === 'parallel';
  const opsCount = props.job.jobDefinition?.ops?.length || 0;
  return explicit || opsCount > 1 || isParallelByEndpoints.value ? 'parallel' : 'legacy';
});

const isConfidential = computed<boolean>(() => {
  try {
    return Boolean((props.job.jobDefinition as any)?.logistics);
  } catch {
    return false;
  }
});

const {
  tabs: flogTabs,
  activeTab: flogActiveTab,
  setActiveTab: setFlogActiveTab,
  activeLogs: flogActiveLogs,
  isConnecting,
  connectionEstablished,
  progressBars: flogProgressBarsRef,
  resourceProgressBars: flogResourceBarsRef,
  logsByOp: flogLogsByOp,
  systemLogs: flogSystemLogs,
} = useFLogs(
  props.job.address,
  computed(() => props.job.node),
  shouldConnect,
  getAuth
);

// Expose flog progress bars (directly from useFLogs)
function getFlogProgressBars(): Map<string, any> {
  return flogProgressBarsRef.value as unknown as Map<string, any>;
}

// Structure to hold API configuration extracted from health check
const chatApiConfig = ref<{
  path: string;
  model: string;
  headers?: Record<string, string>;
} | null>(null);

watchEffect(() => {
  if (hasOpenaiEndpoint.value && props.job?.jobDefinition && props.endpoints) {
    for (const [url, endpointData] of props.endpoints.entries()) {
      const op = props.job.jobDefinition.ops[endpointData.opIndex];
      if (op && op.type === "container/run") {
        const args = op.args as OperationArgsMap["container/run"];
        if (args.expose && Array.isArray(args.expose)) {
          const exposedPorts = args.expose.filter(
            (e): e is ExposedPort =>
              typeof e === "object" && e !== null && "health_checks" in e
          );
          for (const exposedPort of exposedPorts) {
            if (exposedPort.health_checks) {
              for (const healthCheck of exposedPort.health_checks) {
                if (healthCheck.type === "http") {
                  const httpCheck = healthCheck as HttpHealthCheck;
                  if (httpCheck.method === "POST" && httpCheck.body) {
                    try {
                      const body = JSON.parse(httpCheck.body);
                      // Check if it has LLM-style request format
                      if (body.model && body.messages && Array.isArray(body.messages)) {
                        chatServiceUrl.value = url;
                        chatApiConfig.value = {
                          path: httpCheck.path,
                          model: body.model,
                          headers: httpCheck.headers || {}
                        };
                        return; // Found our chat service with configuration
                      }
                    } catch (e) {
                      // If body parsing fails, fall back to path-based detection
                      if (httpCheck.path.includes("/chat") || httpCheck.path.includes("/v1")) {
                        chatServiceUrl.value = url;
                        chatApiConfig.value = {
                          path: httpCheck.path,
                          model: "unknown",
                          headers: httpCheck.headers || {}
                        };
                        return;
                      }
                    }
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

watch(
  [
    chatServiceUrl,
    props.endpoints,
    () => props.job.isRunning,
    () => props.job.isCompleted,
  ],
  ([newUrl, currentEndpoints, isRunning, isCompleted]) => {
    if (newUrl && currentEndpoints.has(newUrl)) {
      const serviceInfo = currentEndpoints.get(newUrl);
      if (
        serviceInfo &&
        serviceInfo.status === "ONLINE" &&
        isRunning &&
        !isCompleted
      ) {
        isChatServiceReady.value = true; // Enable the chat tab
        if (!popupAlreadyShown.value) {
          showChatPopup.value = true;
          popupAlreadyShown.value = true; // Ensure popup is shown only once
        }
      } else {
        isChatServiceReady.value = false; // Disable chat tab
      }
    } else {
      isChatServiceReady.value = false;
    }
  },
  { deep: true }
); // deep true for endpoints map

function activateChatAndClosePopup() {
  showChatPopup.value = false;
  isMainContentOpen.value = true; // Expand the job card
  activeTab.value = "chat"; // Switch to chat tab

  // Scroll to bottom to show the chat UI properly
  nextTick(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  });
}

const activeTab = ref("overview");

// Watch for changes in available tabs and ensure active tab is valid
watch(availableTabs, (newTabs) => {
  if (!newTabs.includes(activeTab.value)) {
    activeTab.value = newTabs[0] || 'overview';
  }
}, { immediate: true });
const jobTabsRef = ref<any>(null); // Ref for the JobTabs component

// Watch for changes in table content (for real-time updates) - REMOVING THIS SECTION

watch(isMainContentOpen, (newValue) => {
  if (newValue && activeTab.value === "logs") {
    nextTick(() => {
      if (
        jobTabsRef.value &&
        jobTabsRef.value.logsView &&
        jobTabsRef.value.logsView.scrollToBottomOnOpen
      ) {
        jobTabsRef.value.logsView.scrollToBottomOnOpen();
      }
    });
  }
});

const getStatusIcon = (status: string | number) => {
  // Handle both string (endpoint status) and number (job state)
  if (typeof status === 'number') {
    // Job state mapping
    switch (status) {
      case 0: // QUEUED
        return QueuedIcon;
      case 1: // RUNNING
        return RunningIcon;
      case 2: // COMPLETED
        return DoneIcon;
      case 3: // STOPPED
        return StoppedIcon;
      default:
        return StoppedIcon;
    }
  }
  
  // Endpoint status mapping (legacy)
  if (!props.job.isRunning || props.job.isCompleted) {
    return StoppedIcon;
  }
  
  if (status === "ONLINE") {
    return DoneIcon;
  } else if (status === "UNKNOWN") {
    return RunningIcon;
  } else if (status === "OFFLINE") {
    return FailedIcon;
  }
  
  return FailedIcon;
};

const getStatusText = (status: string | number) => {
  // Handle both string (endpoint status) and number (job state)
  if (typeof status === 'number') {
    // Job state mapping
    switch (status) {
      case 0:
        return "QUEUED";
      case 1:
        return "RUNNING";
      case 2:
        return "COMPLETED";
      case 3:
        return "STOPPED";
      default:
        return "UNKNOWN";
    }
  }
  
  // Endpoint status mapping (legacy)
  if (!props.job.isRunning || props.job.isCompleted) {
    return "OFFLINE";
  }
  
  if (status === "ONLINE") {
    return "ONLINE";
  } else if (status === "UNKNOWN") {
    return "LOADING";
  } else if (status === "OFFLINE") {
    return "OFFLINE";
  }
  return "OFFLINE";
};

// Market address as a simple string
const marketAddress = computed(() => String(props.job.market ?? '').trim());

// Market name from API (match by address)
const marketName = computed(() => {
  const address = marketAddress.value;
  if (!address || !testgridMarkets.value?.length) return null;
  const market = testgridMarkets.value.find((m: any) => String(m.address).trim() === address);
  return market?.name ?? null;
});

const formatStartTime = (timeStart: number) => {
  const date = new Date(timeStart * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

const formatTimeAgo = (timeStart: number) => {
  const now = Date.now();
  const startTime = timeStart * 1000;
  const diffMs = now - startTime;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const showActionsDropdown = ref(false);
const headerIconRef = ref<HTMLElement | null>(null);

const toggleActionsDropdown = () => {
  showActionsDropdown.value = !showActionsDropdown.value;
};

const handleActionClick = (actionFn: () => void) => {
  showActionsDropdown.value = false;
  actionFn();
};

// Use global status system
const { getStatusClass: statusClass } = useStatus();

// getStatusText function already exists above, removed duplicate

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.dropdown')) {
    showActionsDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
// Improved header layout
.deployment-header > .is-flex {
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left-section {
  min-width: 0; // Allow text to truncate
  flex: 1;
}

.header-title-section {
  min-width: 0; // Allow text to truncate
  max-width: 400px; // Prevent extremely long addresses from stretching too much
  display: flex !important;
  flex-direction: column !important;
}

.header-title-section .title {
  display: block !important;
  margin-bottom: 0.25rem !important;
}

.job-images-list {
  display: flex;
  flex-direction: column;
}

.header-title-section .subtitle {
  display: block !important;
  word-break: break-all; // Allow long addresses to wrap
  line-height: 1.2;
  margin-top: 0 !important;
}

.deployment-header .status-tag { 
  white-space: nowrap; 
  flex-shrink: 0;
}

// Mobile responsive
@media screen and (max-width: 768px) {
  .deployment-header > .is-flex {
    flex-direction: column !important;
    align-items: stretch !important;
    flex-wrap: nowrap !important;
  }
  
  .header-left-section {
    width: 100%;
    margin-bottom: 1rem;
  }
  
  .deployment-tabs {
    width: 100% !important;
    justify-content: flex-start;
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .header-title-section {
    max-width: none;
  }
  
  .header-title-section .subtitle {
    font-size: 0.75rem;
  }
  
  .tab-button {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
}

// Extra small screens
@media screen and (max-width: 480px) {
  .deployment-tabs {
    gap: 0.25rem;
  }
  
  .tab-button {
    font-size: 0.75rem;
    padding: 0.375rem 0.5rem;
  }
}

// Job header styling - matches deployment page
.job-header {
  border-bottom: 1px solid $grey-lighter;
}

html.dark-mode .job-header {
  border-bottom-color: $grey-dark;
}


.box.is-borderless {
  padding: 0 !important;
}

// Remove old grid styling - now using tables

// Actions dropdown styling - matches deployment page pattern
// (Most styling comes from global dropdown classes)

// Remove old grid layouts - now using table format

// Minimal cleanup styles

// Dark mode for new compact header
html.dark-mode {
  .card {
    background: transparent;
  }
  
  .compact-job-header {
    background: $black-ter;
  }
  
  .actions-dropdown-btn {
    background: $black;
    border-color: $grey-dark;
    color: $white;
    
    &:hover {
      background: $black-bis;
      border-color: $grey;
    }
  }
  
  .actions-dropdown-menu {
    background: $black-ter;
    border-color: $grey-dark;
    box-shadow: $box-shadow;
  }
  
  .dropdown-item {
    background: $black-ter;
    border-bottom-color: $grey-dark;
    color: $white;
    
    &:hover:not(.is-disabled) {
      background: $grey-darker;
    }
    
    &.is-disabled {
      opacity: 0.3;
    }
  }
  
  .address-grid {
    .address-label {
      color: $text-light;
    }
    
    .address-link,
    .address-value {
      color: $white;
      
      &:hover {
        color: $secondary;
      }
    }
    
    .address-value.has-text-grey-light {
      color: $grey;
    }
  }
  
  .service-endpoints-new {
    background: $black-ter;
    
    .endpoint-port {
      color: $white;
    }
    
    .action-button {
      background: $black-ter;
      border-color: $grey-dark;
      color: $white;
      
      &:hover {
        background: $grey-darker;
        border-color: $grey;
      }
    }
  }
  
  .title-section {
    .job-main-title {
      color: $white;
    }
  }
  
  .address-section {
    .address-label {
      color: #999;
    }
    
    .address-link,
    .address-value {
      color: $white;
      
      &:hover {
        color: $secondary;
      }
    }
    
    .address-value.has-text-grey-light {
      color: $grey;
    }
  }
  
  .spec-item {
    .spec-label {
      color: $text-light;
    }
    
    .spec-value {
      color: $white;
      
      .market-link {
        color: $white;
        
        &:hover {
          color: $secondary;
        }
      }
      
      .time-ago {
        color: $text-light;
      }
      
      :deep(.job-price) {
        color: inherit;
      }
    }
  }
  
  .spec-grid-item {
    .spec-grid-label {
      color: #999;
    }
    
    .spec-grid-value {
      color: $white;
    }
  }
}

// Utility class for full width
.w-100 {
  width: 100%;
}

// Spinner animation
@keyframes spinAround {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.has-text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Card header container styling
.card-header-container {
  cursor: pointer;
  background-color: $white;
  border-radius: 8px 8px 0 0; // Round top corners

  // When this container is directly followed by card-content (i.e., no service endpoints)
  &:has(+ .card-content) {
    & > .card-header {
      // Target the .card-header *inside* this specific .card-header-container
      box-shadow: none !important;
      border-bottom-color: transparent !important;
    }
  }
}

.job-header-grid {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
    justify-content: flex-start;
    align-items: stretch;
  }
}

.job-header-left-group {
  display: flex;
  align-items: center;
  gap: 1rem; /* Maintain gap between title, gpu, price */
  flex-shrink: 0; /* Prevent this group from shrinking if space is tight */
  min-width: 0; /* Allow flex items to shrink below their content size if needed */

  @media (max-width: 768px) {
    flex-direction: column; /* Stack title, gpu, price on mobile */
    align-items: flex-start; /* Align them left on mobile */
    width: 100%; /* Take full width to align with actions below */
    gap: 0.75rem; /* Match mobile gap */
  }
}

.job-title-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  min-width: 200px; /* Example: Set minimum width for the title column here */
  flex-shrink: 0; // Prevent title from shrinking too much

  .job-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: $text;
    line-height: 1.2;
  }

  .job-docker {
    font-size: 0.8rem;
    font-family: monospace;
    color: $text-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    position: absolute; /* Positioned relative to job-title-col */
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
    font-size: 1.1rem;
    color: $text;
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
    font-size: 1.1rem;
    font-weight: 600;
    color: $text;
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

  .action-button {
    display: inline-flex;
    align-items: center;
    background-color: #ffffff !important;
    border: 1px solid #e8e8e8 !important;
    color: #363636 !important;
    padding: 0.4rem 0.6rem !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    line-height: 1;
    transition: all 0.2s ease;

    &:hover {
      background-color: #f5f5f5 !important;
      border-color: #dadada !important;
    }

    .icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-right: 0.5rem;

      svg {
        width: 16px;
        height: 16px;
        display: block;
      }
    }

    &.is-loading {
      position: relative;
      color: transparent !important;
      pointer-events: none;

      &:after {
        position: absolute;
        left: calc(50% - 0.5em);
        top: calc(50% - 0.5em);
        width: 1em;
        height: 1em;
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
  background-color: $white;
  border-top: 0px solid $grey-lighter;
  transition: background-color 0.2s ease;
}

.endpoint-content {
  background-color: $white;
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
  padding: 0rem;
  background: $white;
  gap: 0.5rem;
}

.endpoint-port {
  font-weight: 500;
  color: $text;
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
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .quick-detail-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #7a7a7a;
    text-transform: uppercase;
    margin-bottom: 0.1rem;
  }

  .quick-detail-value {
    font-size: 0.85rem;
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
    background-color: $black-ter;
    border-color: #444;
  }

  .card-header {
    background-color: $black-ter;
  }

  .card-header-container {
    background-color: $black-ter;
  }

  .card-content {
    background-color: transparent;
    
    :deep(.job-tabs-condensed) {
      background: $black-ter;
    }

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

  .job-title-col {
    .job-title {
      color: $white;
    }
  }

  .job-gpu-col {
    .job-gpu {
      color: $white;
    }
  }

  .job-price {
    .price-value {
      color: $white;
    }
  }

  .job-docker {
    color: $grey-light;
  }

  .service-endpoints {
    background-color: $black-ter;
    border-top-color: #444;
  }

  .endpoint-content {
    background: $black-ter;
    border-color: #444;
  }

  .endpoint-port {
    color: $white;
  }

  .quick-detail-item {
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
    filter: brightness(0) invert(1);
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
  width: 1.5rem;
  height: 1.5rem;
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
  display: none;
}

html.dark-mode .content-separator {
  background-color: #444;
}

.service-button {
  background-color: $grey-lightest !important;
  border: none !important;
  color: $text !important;
  text-decoration: none !important;
  outline: none !important;
  box-shadow: none !important;

  &:hover {
    background-color: $grey-lighter !important;
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
    background-color: $grey !important;
    color: $white !important;

    &:hover {
      background-color: $grey-light !important;
    }

    &:focus,
    &:active,
    &:focus-visible {
      background-color: $grey !important;
    }
  }
}

</style>
