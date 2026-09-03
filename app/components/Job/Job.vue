<template>
  <div class="job-detail">
    <!-- Header Section -->
    <div class="dep-header">
      <!-- Back link -->
      <button
        type="button"
        class="back-link"
        @click="
          deploymentId
            ? router.push(`/deployments/${deploymentId}`)
            : router.push(`/deployments?tab=jobs`)
        "
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span>{{ deploymentId ? "Deployment" : "Jobs" }}</span>
      </button>

      <!-- Title row + actions -->
      <div class="header-main">
        <div class="header-title-section">
          <div class="title-row">
            <h1 class="dep-name">{{ jobTitle }}</h1>
            <DeploymentStatusPill :status="jobStatusString" />
          </div>

          <p class="id-line">
            <span class="is-family-monospace">{{
              shortAddress(props.job.address)
            }}</span>
            <button
              type="button"
              class="copy-btn"
              :class="{ 'is-copied': addrCopied }"
              title="Copy job address"
              @click="copyAddress"
            >
              <svg
                v-if="addrCopied"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path
                  d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                />
              </svg>
            </button>
            <template v-if="props.job.timeStart">
              <span class="id-sep">·</span>
              <span class="updated-time"
                >Started {{ formatTimeAgo(new Date(props.job.timeStart * 1000)) }}</span
              >
            </template>
            <template v-if="jobDurationData">
              <span class="id-sep">·</span>
              <span class="updated-time">
                <SecondsFormatter
                  :seconds="jobDurationData.actualSeconds"
                  :showSeconds="true"
                />
              </span>
            </template>
          </p>
        </div>

        <!-- Actions Dropdown - Only show for standalone job pages (not deployment job pages) -->
        <div
          v-if="!deploymentId && hasAnyActions"
          class="dropdown is-right"
          :class="{ 'is-active': showActionsDropdown }"
          ref="actionsDropdown"
        >
          <div class="dropdown-trigger">
            <button
              class="button header-action-btn"
              @click="toggleActionsDropdown"
              :class="{ 'is-loading': loading }"
            >
              <span>Actions</span>
              <span
                class="icon is-small dropdown-arrow ml-1"
                :class="{ 'is-rotated': showActionsDropdown }"
              >
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
                v-if="
                  (props.job.isRunning || props.job.state === 0) &&
                  props.isJobPoster
                "
                class="dropdown-item is-danger-item"
                @click="handleActionClick(stopJob)"
                :disabled="loading"
              >
                <span class="icon is-small mr-2">
                  <SquareIcon />
                </span>
                <span>{{ props.job.state === 0 ? "Delist" : "Stop" }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab bar (segmented control) -->
      <div class="dep-tabs">
        <button
          v-for="tab in availableTabs"
          :key="tab"
          type="button"
          class="dep-tab"
          :class="{ 'is-active': activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ getTabLabel(tab) }}
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="p-5">
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="tab-pane">
        <!-- Job Details Section -->
        <div>
          <h2 class="title is-5 mb-3">Job details</h2>
          <div class="dep-card details">
            <div class="stat-band">
              <!-- Node -->
              <div class="stat">
                <span class="k">Node</span>
                <a
                  v-if="hasRealNode"
                  :href="`https://explore.nosana.com/hosts/${props.job.node}`"
                  target="_blank"
                  class="v mono has-text-link"
                  :title="props.job.node"
                  >{{ shortAddress(props.job.node) }}</a
                >
                <span v-else class="v mono has-text-grey">--</span>
              </div>

              <!-- Market (hidden on deployment job pages) -->
              <div class="stat" v-if="!props.hideFields?.marketAddress">
                <span class="k">Market</span>
                <a
                  :href="`https://explore.nosana.com/markets/${props.job.market}`"
                  target="_blank"
                  class="v mono has-text-link"
                  :title="props.job.market?.toString()"
                  >{{ shortAddress(props.job.market?.toString() ?? "") }}</a
                >
              </div>

              <!-- Price (hidden on deployment job pages) -->
              <div class="stat" v-if="!props.hideFields?.price">
                <span class="k">Price</span>
                <span class="v">{{
                  totalNos ? `${totalNos.toFixed(3)} NOS` : "--"
                }}</span>
                <span class="s" v-if="totalCostUsd"
                  >${{ totalCostUsd.toFixed(3) }}</span
                >
              </div>

              <!-- Node / host specs -->
              <div class="stat" v-for="field in resolvedMetricFields" :key="field.key">
                <span class="k">{{ field.label }}</span>
                <span class="v" :title="field.displayValue">{{
                  field.displayValue
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="
            props.isJobPoster &&
            props.job.isRunning &&
            props.job.jobDefinition?.ops
          "
        >
          <SystemUsageCharts
            :jobAddress="props.job.address"
            :node="props.job.node"
            :opIds="props.job.jobDefinition.ops.map((op) => op.id)"
          />
        </div>
        <!-- On-chain activity, hidden when the API has no events endpoint -->
        <div v-if="jobEventsSupported && !loadingJobEvents">
          <JobEventTimeline :events="jobEvents" :markets="testgridMarkets" />
        </div>
      </div>

      <!-- Configuration Tab -->
      <div v-if="activeTab === 'configuration'">
        <div v-if="jobDefinitionForTab">
          <JobDefinitionTab :job-definition="jobDefinitionForTab" />
        </div>
        <div v-else class="notification is-light has-text-centered">
          <p class="has-text-grey">No job configuration available</p>
        </div>
      </div>

      <!-- Container Controls Tab -->
      <div v-if="activeTab === 'container-controls'">
        <div v-if="props.job.jobDefinition">
          <JobOverview
            :job="props.job"
            :isJobPoster="props.isJobPoster"
            :opIds="flogTabs.filter((t) => t !== 'system')"
            :activeLogs="flogActiveLogs"
            :selectOp="
              (opId: string | null) => setFlogActiveTab(opId ?? 'system')
            "
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
            :loadingJobNodeSpecs="loadingNodeSpecs"
            :isQueuedJob="isQueuedJob"
            :activeLogs="flogActiveLogs"
            :opIds="flogTabs.filter((t) => t !== 'system')"
            :filters="{
              value: {
                opId: flogActiveTab === 'system' ? null : flogActiveTab,
                types: new Set(['container', 'info', 'error']),
              },
            }"
            :selectOp="
              (opId: string | null) => setFlogActiveTab(opId ?? 'system')
            "
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
          <JobResult :ipfs-result="props.job.results" :ipfs-job="props.job" />
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
import JobDefinitionTab from "~/components/Job/Tabs/JobDefinition.vue";
import JobEventTimeline from "~/components/Job/EventTimeline.vue";
import SecondsFormatter from "~/components/SecondsFormatter.vue";
import DeploymentStatusPill from "~/components/Deployment/DeploymentStatusPill.vue";
import { formatTimeAgo } from "~/utils/relativeTime";
import {
  resolveMetricFields,
  type MetricField,
} from "~/components/UI/AdaptiveMetricsGrid.vue";

import LogSubscription from "./LogSubscription.vue";
import { useFLogs } from "~/composables/jobs/useFLogs";
import { isCvmMarket } from "~/utils/cvm";
import { useTemplates } from "~/composables/useTemplates";
import { useToast } from "vue-toastification";
import { useNosanaWallet } from "~/composables/useNosanaWallet";
import { useAPI } from "~/composables/useAPI";
import { useJobPricing } from "~/composables/useMarketPricing";
import { useJobEvents } from "~/composables/jobs/useJobEvents";

// Import icons as components
import ChevronDownIcon from "@/assets/img/icons/chevron-down.svg?component";
import ClockIcon from "@/assets/img/icons/clock.svg?component";
import SquareIcon from "@/assets/img/icons/square.svg?component";
import RunningIcon from "@/assets/img/icons/status/running.svg?component";
import StoppedIcon from "@/assets/img/icons/status/stopped.svg?component";
import FailedIcon from "@/assets/img/icons/status/failed.svg?component";
import QueuedIcon from "@/assets/img/icons/status/queued.svg?component";
import DoneIcon from "@/assets/img/icons/status/done.svg?component";
import { useStatus } from "~/composables/useStatus";

import type { UseModal } from "~/composables/jobs/useModal";
import type { Endpoints, UseJob } from "~/composables/jobs/useJob";
import type { JobInfo, OpState } from "~/composables/jobs/types";
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
} from "@nosana/kit";
import type { ProgressBar } from "~/composables/jobs/logTypes";
import SystemUsageCharts from "./SystemUsageCharts.vue";

// Type definitions
interface TestgridMarket {
  address: string;
  name: string;
  usd_reward_per_hour?: number;
}

interface GpuDevice {
  name: string;
  memory?: {
    total_mb?: number;
  };
  network_architecture?: {
    major: number;
    minor: number;
  };
}

interface NodeInfoGpus {
  devices?: GpuDevice[];
  cuda_driver_version?: string;
  nvml_driver_version?: string;
}

interface NodeInfoData {
  gpus?: NodeInfoGpus;
  cpu?: {
    model?: string;
  };
  ram_mb?: number;
  disk_gb?: number;
  country?: string;
  version?: string;
  system_environment?: string;
}

interface NodeInfoResponse {
  info?: NodeInfoData;
}

interface CombinedSpecs {
  ram: number;
  diskSpace: number;
  cpu?: string;
  country?: string;
  download?: number;
  upload?: number;
  ping?: number;
  gpu?: string;
  cudaVersion?: string;
  systemEnvironment?: string | null;
}

interface JobTabsComponent {
  logsView?: {
    scrollToBottomOnOpen?: () => void;
  };
}

interface ResourceProgressBar extends ProgressBar {
  metadata?: Record<string, unknown>;
}

const jobDefinitionForTab = computed<JobDefinition | null>(() => {
  return (
    (props.jobInfo?.jobDefinition as JobDefinition | undefined) ??
    props.job.jobDefinition ??
    null
  );
});

interface Props {
  job: UseJob;
  modal: UseModal;
  endpoints: Endpoints;
  nosPrice: number;
  isJobPoster: boolean;
  jobInfo?: JobInfo | null;
  deploymentId?: string | null;
  hideFields?: {
    marketAddress?: boolean;
    price?: boolean;
    gpuPoolName?: boolean;
  };
}

const props = defineProps<Props>();
const { userBalances } = useNosanaWallet();
const { getAuthHeader, getJobAuthHeader } = useDeploymentAuth();
const getAuth = async () => {
  return await getAuthHeader(props.deploymentId ?? undefined);
};
const isCvmJob = computed(() => isCvmMarket(props.job.market));
const { templates } = useTemplates();
const { markets } = useMarkets();
const { saveState } = useDeployPageState();

// Fetch markets data needed for centralized pricing
const { data: testgridMarkets, execute: executeMarkets } = useAPI<
  TestgridMarket[]
>("/markets", { default: () => [] });

// Execute the markets API call on mount
onMounted(() => {
  if (!testgridMarkets.value || testgridMarkets.value.length === 0) {
    executeMarkets();
  }
});
const toast = useToast();
const router = useRouter();

// On-chain job lifecycle events from the indexer; keeps polling while the job
// can still produce new ones (queued or running).
const {
  events: jobEvents,
  loading: loadingJobEvents,
  supported: jobEventsSupported,
} = useJobEvents(props.job.address, {
  isActive: computed(() => Boolean(props.job.isActive)),
});

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
const hasRealNode = computed<boolean>(() =>
  Boolean(
    props.job.node && props.job.node !== "11111111111111111111111111111111",
  ),
);
// Do not gate on hasAuth; auth will be ensured during WS open
const shouldConnect = computed(
  () => props.isJobPoster && props.job.isRunning && hasRealNode.value,
);

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
  return props.jobInfo?.jobDefinition || props.job.jobDefinition || null;
});

// Computed properties for job info
const dockerImage = computed(() => {
  const jd = titleJobDefinition.value;
  if (!jd?.ops?.length) return null;
  const firstOp = jd.ops[0];
  if (firstOp.type === "container/run") {
    const args = firstOp.args as OperationArgsMap["container/run"];
    if (args.image) return args.image;
  }
  return null; // Will show loading state
});

// Helper function to get job image (same as JobList)
const getJobImage = (job: UseJob) => {
  const jd = props.jobInfo?.jobDefinition || job.jobDefinition;
  if (!jd?.ops?.length) return null;
  const firstOp = jd.ops[0];
  if (firstOp.type === "container/run" && firstOp.args?.image) {
    return firstOp.args.image;
  }
  return null;
};

// Extract all Docker images from all operations for job title
const jobImages = computed(() => {
  const jd = titleJobDefinition.value;
  if (!jd?.ops?.length) return null;

  const images: string[] = [];
  jd.ops.forEach((op: Operation) => {
    if (op.type === "container/run") {
      const args = op.args as OperationArgsMap["container/run"];
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

// Header title: the container image gives the job a meaningful name; fall back
// to a generic label while the definition is still loading.
const jobTitle = computed(() => formattedDockerImage.value || "Job");

// Job state (number) → status string the shared DeploymentStatusPill understands.
const jobStatusString = computed(() => {
  const s = props.job.state;
  if (typeof s === "number") {
    switch (s) {
      case 0:
        return "QUEUED";
      case 1:
        return "RUNNING";
      case 2:
        return "COMPLETED";
      case 3:
        return "STOPPED";
    }
  }
  return String(s ?? "");
});

// Middle-truncate the job address for the id line; the copy button copies it whole.
const shortAddress = (address: string): string =>
  address && address.length > 16
    ? `${address.slice(0, 8)}…${address.slice(-6)}`
    : address;

const addrCopied = ref(false);
const copyAddress = () => {
  navigator.clipboard?.writeText(props.job.address);
  addrCopied.value = true;
  setTimeout(() => (addrCopied.value = false), 1400);
};

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
      JSON.stringify(props.job.jobDefinition),
  );
});

const isGHCR = (image: string) => {
  return image.startsWith("ghcr.io");
};

// Get host specs for actual GPU info (skip when node is placeholder)
const nodeSpecsUrl = computed(() =>
  hasRealNode.value ? `/nodes/${props.job.node}/metrics` : "",
);
const { data: nodeMetrics, pending: loadingNodeSpecs } = useAPI(nodeSpecsUrl);

const nodeInfoUrl = computed(() =>
  hasRealNode.value
    ? `https://${props.job.node}.${useRuntimeConfig().public.nodeDomain}/node/info`
    : "",
);
const { data: nodeInfo } = useAPI<NodeInfoResponse | null>(nodeInfoUrl, {
  credentials: false,
});

const jobDataForPriceComponent = computed(() => {
  return {
    usdRewardPerHour: props.job.usdRewardPerHour,
    timeStart: props.job.timeStart,
    timeEnd: props.job.timeEnd,
    timeout: props.job.timeout,
    price: props.job.price,
    market:
      typeof props.job.market === "string"
        ? props.job.market
        : props.job.market?.toString(),
    state:
      props.job.state ??
      (props.job.isCompleted ? 2 : props.job.timeStart ? 1 : 0),
  };
});

const jobOptionsForPriceComponent = computed(() => {
  return { showPerHour: !props.job.isCompleted };
});

// Get accurate pricing using the same method as job list
const marketsDataRef = computed(() => testgridMarkets.value);
const { totalNos, totalCostUsd, usdPricePerHour } = useJobPricing(
  jobDataForPriceComponent,
  { showPerHour: false },
  marketsDataRef,
);

// Duration data for SecondsFormatter
const jobDurationData = ref<{
  actualSeconds: number;
  maxDurationHours?: string;
} | null>(null);

const formatMaxDurationInHours = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "Invalid duration";
  const hours = seconds / 3600;
  const formattedHours = parseFloat(hours.toFixed(1));
  return `${formattedHours}h`;
};

// Helper function to format relative dates
const formatDateRelative = (timestamp: number) => {
  if (!timestamp || timestamp === 0) return "--";
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};

watch(
  [() => props.job, currentTime],
  ([newJob, newCurrentTimeVal]) => {
    if (newJob.timeStart === undefined) {
      jobDurationData.value = null;
      return;
    }

    const maxDurationInHoursFormatted =
      typeof newJob.timeout === "number"
        ? formatMaxDurationInHours(newJob.timeout)
        : undefined;

    if (newJob.isCompleted && newJob.timeEnd !== undefined) {
      const actualDuration = newJob.timeEnd - newJob.timeStart;
      const data: { actualSeconds: number; maxDurationHours?: string } = {
        actualSeconds: actualDuration,
      };
      if (maxDurationInHoursFormatted)
        data.maxDurationHours = maxDurationInHoursFormatted;
      jobDurationData.value = data;
    } else if (newJob.isRunning && newJob.timeStart) {
      const currentDuration = newCurrentTimeVal - newJob.timeStart;
      const data: { actualSeconds: number; maxDurationHours?: string } = {
        actualSeconds: currentDuration,
      };
      if (maxDurationInHoursFormatted)
        data.maxDurationHours = maxDurationInHoursFormatted;
      jobDurationData.value = data;
    } else if (newJob.state === 0 && newJob.timeStart === 0) {
      jobDurationData.value = null;
    } else {
      // Fallback or other states
      const data: { actualSeconds: number; maxDurationHours?: string } = {
        actualSeconds: 0,
      };
      if (maxDurationInHoursFormatted)
        data.maxDurationHours = maxDurationInHoursFormatted;
      jobDurationData.value = data;
    }
  },
  { immediate: true, deep: true },
);

const formatPing = (ping?: number) => {
  if (typeof ping !== "number" || Number.isNaN(ping)) return null;
  return `${Math.round(ping)} ms`;
};

const gpuSummary = computed(() => {
  const model = combinedSpecs.value?.gpu;
  if (!model) return null;

  let shortModel = model;
  if (shortModel.startsWith("NVIDIA GeForce ")) {
    shortModel = "Nvidia " + shortModel.substring("NVIDIA GeForce ".length);
  } else if (/^NVIDIA /i.test(shortModel)) {
    shortModel = shortModel.replace(/^NVIDIA /i, "Nvidia ");
  }

  const cuda = combinedSpecs.value?.cudaVersion;
  return cuda ? `${shortModel} (CUDA ${cuda})` : shortModel;
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
const combinedSpecs = computed<CombinedSpecs | null>(() => {
  const metrics = nodeMetrics.value?.metrics;
  const nodeInfoData = nodeInfo.value?.info;

  if (!metrics && !nodeInfoData) return null;

  const gpusArray = nodeInfoData?.gpus?.devices
    ? nodeInfoData.gpus.devices.map((gpu: GpuDevice) => ({
        gpu: gpu.name,
        memory: gpu.memory?.total_mb,
        architecture: `${gpu.network_architecture?.major}.${gpu.network_architecture?.minor}`,
      }))
    : (metrics?.gpu?.devices ?? []).map((gpu: any) => ({
        gpu: gpu?.name,
        memory: gpu?.vram_total_mb,
        architecture:
          gpu?.network_architecture?.major !== undefined &&
          gpu?.network_architecture?.minor !== undefined
            ? `${gpu.network_architecture.major}.${gpu.network_architecture.minor}`
            : undefined,
      }));

  const firstGpu = gpusArray.length > 0 ? gpusArray[0] : undefined;
  const cpuModel = nodeInfoData?.cpu?.model ?? metrics?.cpu?.cpu_model;
  const metricRamMb =
    typeof metrics?.ram_mb === "number"
      ? metrics.ram_mb
      : typeof metrics?.ram_gb === "number"
        ? metrics.ram_gb * 1024
        : undefined;
  const metricDiskGb =
    typeof metrics?.disk_gb === "number" ? metrics.disk_gb : undefined;
  const metricCountry = metrics?.network?.country ?? metrics?.country;
  const metricDownload =
    metrics?.network?.download_mbps ?? metrics?.download_mbps;
  const metricUpload = metrics?.network?.upload_mbps ?? metrics?.upload_mbps;
  const metricPing = metrics?.network?.ping_ms ?? metrics?.ping_ms;
  const metricCudaVersion =
    nodeInfoData?.gpus?.cuda_driver_version ??
    metrics?.gpu?.cuda_driver_version ??
    metrics?.gpu?.runtime_version ??
    metrics?.cuda_driver_version ??
    metrics?.cuda_runtime_version;
  const metricSystemEnvironment =
    nodeInfoData?.system_environment ?? metrics?.system_environment;

  return {
    ram: nodeInfoData?.ram_mb
      ? Math.round(nodeInfoData.ram_mb)
      : Math.round(Number(metricRamMb)),
    diskSpace: nodeInfoData?.disk_gb
      ? Math.round(Number(nodeInfoData.disk_gb))
      : Math.round(Number(metricDiskGb)),
    cpu: cpuModel,
    country: nodeInfoData?.country ?? metricCountry,
    download: metricDownload,
    upload: metricUpload,
    ping: metricPing,
    gpu: firstGpu?.gpu,
    cudaVersion: metricCudaVersion ? String(metricCudaVersion) : undefined,
    systemEnvironment: metricSystemEnvironment
      ? metricSystemEnvironment.toLowerCase().includes("wsl")
        ? "WSL"
        : metricSystemEnvironment
          ? "Linux"
          : null
      : null,
  };
});

const metricFields: MetricField[] = [
  {
    key: "gpu",
    label: "GPU",
    paths: ["derived.gpuSummary", "derived.gpuName"],
  },
  {
    key: "cpu",
    label: "CPU",
    paths: ["nodeInfo.info.cpu.model", "metrics.cpu.cpu_model"],
  },
  {
    key: "ram",
    label: "RAM",
    paths: ["nodeInfo.info.ram_mb", "metrics.ram_gb", "metrics.ram_mb"],
    transformPaths: {
      "metrics.ram_gb": "gbToMb",
    },
    formatter: "mb",
  },
  {
    key: "diskSpace",
    label: "Disk Space",
    paths: ["nodeInfo.info.disk_gb", "metrics.disk_gb"],
    formatter: "gb",
  },
  {
    key: "country",
    label: "Country",
    paths: [
      "nodeInfo.info.country",
      "metrics.network.country",
      "metrics.country",
    ],
    formatter: "country",
  },
  {
    key: "download",
    label: "Download Speed",
    paths: ["metrics.network.download_mbps", "metrics.download_mbps"],
    formatter: "mbps",
  },
  {
    key: "upload",
    label: "Upload Speed",
    paths: ["metrics.network.upload_mbps", "metrics.upload_mbps"],
    formatter: "mbps",
  },
  {
    key: "ping",
    label: "Ping",
    paths: ["derived.ping"],
  },
  {
    key: "os",
    label: "OS",
    paths: ["derived.systemEnvironment", "metrics.system_environment"],
  },
];

const metricSources = computed(() => ({
  nodeInfo: nodeInfo.value,
  metrics: nodeMetrics.value?.metrics,
  derived: {
    gpuName: combinedSpecs.value?.gpu,
    gpuSummary: gpuSummary.value,
    ping: formatPing(combinedSpecs.value?.ping),
    systemEnvironment: combinedSpecs.value?.systemEnvironment,
  },
}));

const resolvedMetricFields = computed(
  () => resolveMetricFields(metricFields, metricSources.value).secondary,
);

// Check if the job is queued (state 0 and no start time, or placeholder node)
const isQueuedJob = computed(() => {
  return (
    (props.job.state === 0 && props.job.timeStart === 0) ||
    props.job.node === "11111111111111111111111111111111"
  );
});

// Check if any actions are available for the job
const hasAnyActions = computed(() => {
  // Extend action: available for running jobs if user is job poster
  const canExtend = props.job.isRunning && props.isJobPoster;

  // Stop/Delist action: available for running or queued jobs if user is job poster
  const canStop =
    (props.job.isRunning || props.job.state === 0) && props.isJobPoster;

  return canExtend || canStop;
});

// Check if job has results to show
const hasResults = computed(() => {
  return (
    props.job.results && (props.job.hasResultsRegex || props.job.isCompleted)
  );
});

const hasContainerControls = computed(() => {
  if (!props.job.jobDefinition) return false;

  const isStopped = props.job.state === 3;
  if (props.job.isCompleted || isStopped) {
    try {
      const haveJobInfo = Boolean(props.jobInfo);
      const haveResults = Boolean(props.job.results);
      const haveEndpoints = (() => {
        try {
          return props.endpoints?.size > 0;
        } catch {
          return false;
        }
      })();
      if (haveJobInfo || haveResults || haveEndpoints) return true;

      // Fallback: if any logs exist in final opStates, also show
      const opStatesFromJob = props.job.results?.opStates;
      const opStatesFromInfo = props.jobInfo?.results?.opStates;
      const liveOpStates = props.jobInfo?.operations?.opStates;
      const allStates: OpState[] = [
        ...(Array.isArray(opStatesFromJob) ? opStatesFromJob : []),
        ...(Array.isArray(opStatesFromInfo) ? opStatesFromInfo : []),
        ...(Array.isArray(liveOpStates) ? liveOpStates : []),
      ];
      return allStates.some(
        (s: OpState) => Array.isArray(s?.logs) && s.logs.length > 0,
      );
    } catch {
      return false;
    }
  }

  const operationTabs = flogTabs.value.filter((t) => t !== "system");
  const hasOperationLogs = operationTabs.some((tab) => {
    const logs = flogLogsByOp.value.get(tab);
    return logs && logs.length > 0;
  });
  return operationTabs.length > 0 && hasOperationLogs;
});

// Check if system logs tab should be available
const hasSystemLogs = computed(() => {
  if (!props.job.jobDefinition) return false;

  if (props.job.isCompleted) return false;

  const hasLiveLogs = (() => {
    const hasSystem = flogSystemLogs.value.length > 0;
    const hasOps = Array.from(flogLogsByOp.value.values()).some(
      (logs) => logs && logs.length > 0,
    );
    return hasSystem || hasOps;
  })();

  if (props.job.isRunning) {
    return Boolean(connectionEstablished.value && hasLiveLogs);
  }

  return hasLiveLogs;
});

// Available tabs based on job state and data
const availableTabs = computed(() => {
  const tabs = ["overview"];
  if (props.jobInfo?.jobDefinition || props.job.jobDefinition) {
    tabs.push("configuration");
  }

  if (hasContainerControls.value) {
    tabs.push("container-controls");
  }

  if (hasSystemLogs.value) {
    tabs.push("system-logs");
  }

  if (hasResults.value) {
    tabs.push("results");
  }

  return tabs;
});

// Get display label for tab
const getTabLabel = (tab: string) => {
  switch (tab) {
    case "system-logs":
      return "Logs";
    case "configuration":
      return "Configuration";
    case "container-controls":
      return "Containers";
    case "results":
      return "Results";
    default:
      return tab.charAt(0).toUpperCase() + tab.slice(1);
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
  const selectedMarket =
    markets.value?.find(
      (m) => m.address.toString() === props.job.market.toString(),
    ) || null;

  // Find the matching template
  const selectedTemplate =
    templates.value?.find(
      (t) =>
        JSON.stringify(t.jobDefinition) ===
        JSON.stringify(props.job.jobDefinition),
    ) || null;

  // Save job data using unified state persistence
  saveState({
    selectedMarket,
    selectedTemplate,
    jobDefinition: props.job.jobDefinition,
    hours: props.job.timeout / 3600, // Convert from seconds to hours
    gpuTab: "simple",
    gpuTypeCheckbox: ["PREMIUM"], // Default, will be updated by market type
    activeFilter: "PREMIUM", // Default, will be updated by market type
  });

  // Navigate to deploy page (no URL parameters needed)
  router.push("/deploy");
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
            typeof e === "object" && e !== null && "health_checks" in e,
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
                    if (
                      body.model &&
                      body.messages &&
                      Array.isArray(body.messages)
                    ) {
                      return true;
                    }
                  } catch (e) {
                    // If body parsing fails, fall back to path-based detection
                    if (
                      httpCheck.path.includes("/chat") ||
                      httpCheck.path.includes("/v1")
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
    }
  }
  return false;
});

const isConfidential = computed<boolean>(() => {
  try {
    const jd = props.job.jobDefinition;
    return Boolean(
      jd &&
        "logistics" in jd &&
        (jd as JobDefinition & { logistics?: unknown }).logistics,
    );
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
  getAuth,
  isCvmJob.value
    ? { cvm: { getAuth: () => getJobAuthHeader(props.job.address) } }
    : undefined,
);

// Expose flog progress bars (directly from useFLogs)
function getFlogProgressBars(): Map<string, ProgressBar> {
  return flogProgressBarsRef.value;
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
              typeof e === "object" && e !== null && "health_checks" in e,
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
                      if (
                        body.model &&
                        body.messages &&
                        Array.isArray(body.messages)
                      ) {
                        chatServiceUrl.value = url;
                        chatApiConfig.value = {
                          path: httpCheck.path,
                          model: body.model,
                          headers: httpCheck.headers || {},
                        };
                        return; // Found our chat service with configuration
                      }
                    } catch (e) {
                      // If body parsing fails, fall back to path-based detection
                      if (
                        httpCheck.path.includes("/chat") ||
                        httpCheck.path.includes("/v1")
                      ) {
                        chatServiceUrl.value = url;
                        chatApiConfig.value = {
                          path: httpCheck.path,
                          model: "unknown",
                          headers: httpCheck.headers || {},
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
  { deep: true },
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

const activeTab = ref("system-logs");

// Watch for changes in available tabs and ensure active tab is valid
watch(
  availableTabs,
  (newTabs) => {
    if (!newTabs.includes(activeTab.value)) {
      // Prefer system-logs (Logs tab) as default, fallback to overview
      activeTab.value = newTabs.includes("system-logs")
        ? "system-logs"
        : newTabs[0] || "overview";
    }
  },
  { immediate: true },
);
const jobTabsRef = ref<JobTabsComponent | null>(null); // Ref for the JobTabs component

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
  if (typeof status === "number") {
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
  if (typeof status === "number") {
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
const marketAddress = computed(() => String(props.job.market ?? "").trim());

// Market name from API (match by address)
const marketName = computed(() => {
  const address = marketAddress.value;
  if (!address || !testgridMarkets.value?.length) return null;
  const market = testgridMarkets.value.find(
    (m: TestgridMarket) => String(m.address).trim() === address,
  );
  return market?.name ?? null;
});

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
  if (!target.closest(".dropdown")) {
    showActionsDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
/* Page wrapper: header sits on the page ground, tab content below in cards —
   matches the redesigned deployment detail page. */
.job-detail {
  color: $text;
}

/* ---- Header (mirrors DeploymentHeader) ---- */
.dep-header {
  padding: 1.25rem 1.5rem 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: 0;
  padding: 0;
  margin-bottom: 1rem;
  cursor: pointer;
  color: $grey;
  font-family: $family-sans-serif;
  font-size: 0.9rem;
  transition: color 0.15s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    color: $text;
  }
}

html.dark-mode .back-link:hover {
  color: $white;
}

.header-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-title-section {
  min-width: 0;
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.dep-name {
  font-family: $title-family;
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0;
  color: $text;
  word-break: break-word;
}

html.dark-mode .dep-name {
  color: $white;
}

.id-line {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  font-size: 0.78rem;
  color: $grey;
}

.id-line .is-family-monospace {
  word-break: break-all;
}

.id-sep {
  color: $grey-light;
}

.updated-time {
  white-space: nowrap;
}

.copy-btn {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 0;
  background: transparent;
  color: $grey;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    background: $white-ter;
    color: $text;
  }

  &.is-copied {
    color: $secondary;
  }
}

html.dark-mode .copy-btn:hover {
  background: rgba($white, 0.08);
  color: $white;
}

/* Actions button — grey, matching the segmented control; the width override
   defeats the app-wide `.dropdown { width: 100% }` that breaks the flex row. */
.header-main .dropdown {
  width: auto;
  flex-shrink: 0;
}

.header-action-btn {
  font-family: $title-family;
  font-weight: 500;
  font-size: 0.9rem;
  border-radius: 10px;
  border: 1px solid $grey-lighter;
  background: $white-ter;
  color: $text;
  box-shadow: none;

  &:hover {
    background: $grey-lightest;
    border-color: $grey-light;
  }
}

html.dark-mode .header-action-btn {
  background: rgba($white, 0.06);
  border-color: rgba($white, 0.1);
  color: $white;

  &:hover {
    background: rgba($white, 0.1);
  }
}

.dropdown-arrow {
  transition: transform 0.2s ease;
}

.dropdown-arrow.is-rotated {
  transform: rotate(180deg);
}

.header-main .dropdown-menu {
  min-width: 200px;
  padding-top: 8px;
}

.header-main .dropdown-content {
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba($black, 0.14);
  padding: 6px;
}

.header-main .dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.7rem;
  border-radius: 9px;
  font-size: 0.9rem;
  color: $text;
  background: transparent;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  .icon {
    color: $grey;
    transition: color 0.15s ease;
  }

  &:hover {
    background: $white-ter;
    color: $text;

    .icon {
      color: $secondary;
    }
  }
}

.header-main .dropdown-item.is-danger-item {
  color: $danger;

  .icon {
    color: $danger;
  }

  &:hover {
    background: rgba($danger, 0.1);
    color: $danger;

    .icon {
      color: $danger;
    }
  }
}

html.dark-mode .header-main .dropdown-content {
  background: $black-ter;
  border-color: rgba($white, 0.1);
  box-shadow: 0 14px 44px rgba($black, 0.55);
}

html.dark-mode .header-main .dropdown-item {
  color: $white;

  &:hover {
    background: rgba($white, 0.06);
  }
}

html.dark-mode .header-main .dropdown-item.is-danger-item {
  color: $danger;

  &:hover {
    background: rgba($danger, 0.16);
    color: $danger;
  }
}

/* Segmented tab control */
.dep-tabs {
  display: inline-flex;
  gap: 3px;
  padding: 5px;
  margin: 1.75rem 0 0.25rem;
  border-radius: 13px;
  background: $grey-lightest;
  max-width: 100%;
  overflow-x: auto;
}

html.dark-mode .dep-tabs {
  background: rgba($white, 0.08);
}

.dep-tab {
  font-family: $title-family;
  font-weight: 500;
  font-size: 0.9rem;
  color: $grey-dark;
  border: 0;
  background: none;
  padding: 0.6rem 1.35rem;
  border-radius: 9px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.15s ease,
    background 0.15s ease;

  &:hover {
    color: $text;
  }

  &.is-active {
    background: $secondary;
    color: #05230a;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba($black, 0.12);
  }
}

html.dark-mode .dep-tab {
  color: $grey-light;
}

html.dark-mode .dep-tab:hover {
  color: $white;
}

html.dark-mode .dep-tab.is-active {
  background: $secondary;
  color: #05230a;
  box-shadow: 0 1px 3px rgba($black, 0.5);
}

/* ---- Tab content ---- */
.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
}

.tab-pane > * {
  margin-bottom: 0 !important;
}

/* Card surface — matches the deployment detail cards, with the same soft
   elevation the deployment page applies to its section cards. */
.dep-card {
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 14px;
  overflow: hidden;
  color: $text;
  box-shadow:
    0 1px 3px rgba($black, 0.06),
    0 14px 38px -6px rgba($black, 0.14);
}

html.dark-mode .dep-card {
  background: $black-ter;
  border-color: rgba($white, 0.1);
  color: $white;
  box-shadow:
    0 1px 3px rgba($black, 0.4),
    0 16px 40px -8px rgba($black, 0.6);
}

/* Job details — stat band mirroring the deployment details section: a grid of
   label-over-value cells with hairline dividers between columns. */
.details {
  padding: 22px 0;
}

.stat-band {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  row-gap: 26px;
}

.stat {
  padding: 0 22px;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
}

/* Vertical divider between columns (suppressed on each row's first cell). */
.stat::before {
  content: "";
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 1px;
  background: $grey-lighter;
}

.stat:nth-child(4n + 1)::before {
  display: none;
}

html.dark-mode .stat::before {
  background: rgba($white, 0.08);
}

.k {
  font-size: 12px;
  color: $grey;
  margin-bottom: 7px;
}

.v {
  font-family: $title-family;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.v.mono {
  font-family: $family-monospace;
  font-size: 14px;
  font-weight: 500;
}

.s {
  font-size: 12px;
  color: $grey;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

html.dark-mode .k,
html.dark-mode .s {
  color: $grey-light;
}

@media screen and (max-width: 920px) {
  .stat-band {
    grid-template-columns: repeat(3, 1fr);
  }

  .stat:nth-child(4n + 1)::before {
    display: block;
  }

  .stat:nth-child(3n + 1)::before {
    display: none;
  }
}

@media screen and (max-width: 560px) {
  .stat-band {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat:nth-child(3n + 1)::before {
    display: block;
  }

  .stat:nth-child(2n + 1)::before {
    display: none;
  }
}

/* Empty-state notifications inside tabs. */
.notification.is-light.has-text-centered {
  border-radius: 14px;
}

@media screen and (max-width: 768px) {
  .dep-header {
    padding: 1rem 1rem 0;
  }

  .dep-name {
    font-size: 1.35rem;
  }
}
</style>
