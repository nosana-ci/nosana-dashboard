<template>
  <div>
    <TopBar
      :title="'Create Deployment'"
      :subtitle="'Configure and manage multiple job instances'"
      ref="topBar"
      :hide-buttons="false"
      v-model="showSettingsModal"
    ></TopBar>

    <!-- Show loader until all critical data is loaded -->
    <Loader v-if="!jobDefinition || loadingTemplates || loadingMarkets" />

    <div v-else class="columns is-multiline">
      <div class="column is-9-fullhd is-12">
        <!-- Name your deployment -->
        <div class="box has-background-white" style="border: none;">
          <h2 class="title is-5 mb-4" style="color: #202124;">Define your deployment</h2>
          <div class="field">
            <div class="control">
              <input 
                class="input" 
                type="text" 
                v-model="deploymentName"
                placeholder="Enter deployment name"
                maxlength="50"
              />
            </div>
          </div>
        </div>

        <!-- Choose model -->
        <DeployJobDefinition
          :selectedTemplate="selectedTemplate"
          v-model:jobDefinition="jobDefinition"
          v-model:isEditorCollapsed="isEditorCollapsed"
          :validator="validator"
          @showTemplateModal="showTemplateModal = true"
          @openReadme="openReadmeModal"
        />

        <!-- Select GPU -->
        <div class="box has-background-white" style="border: none; margin-top: 1.5rem;">
          <h2 class="title is-5 mb-4" style="color: #202124;">Select instance</h2>
          <DeploySimpleGpuSelection
            :markets="markets || null"
            :testgridMarkets="testgridMarkets"
            :loadingMarkets="loadingMarkets"
            :gpuTypeCheckbox="gpuTypeCheckbox"
            :activeFilter="activeFilter"
            :jobDefinition="jobDefinition"
            :skipAutoSelection="skipAutoSelection"
            :selectedMarket="selectedMarket"
            :activeFilterKey="activeFilterKey"
            @selectedMarket="selectedMarket = $event"
            @update:activeFilter="activeFilter = $event"
            @update:gpuTypeCheckbox="gpuTypeCheckbox = $event"
          />
        </div>
      </div>

      <div class="column is-3-fullhd is-12">
        <div class="summary">
          <div class="box has-background-white" style="border: none; padding: 1.5rem;">
            <h2 class="title is-5 mb-4" style="color: #202124;">Summary</h2>
            <!-- Cost Summary -->
            <div class="mb-4">
              <p class="has-text-grey is-size-7 mb-2" style="text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Cost</p>
              <h3 class="title is-3 mb-1" style="color: #202124;" v-if="selectedMarket">
                ${{ (hourlyPrice * replicas * timeout).toFixed(3) }}
              </h3>
              <p class="has-text-grey" v-else>Select a GPU to see pricing</p>
              <p class="has-text-grey is-size-7" v-if="selectedMarket">
                ${{ (hourlyPrice * replicas).toFixed(3) }}/hour
              </p>
            </div>

            <hr style="background-color: #e8eaed; margin: 1.5rem 0;" />

            <!-- Configuration Summary -->
            <div class="mb-4">
              <p class="has-text-grey is-size-7 mb-3" style="text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Configuration</p>
              
              <div class="mb-2" style="display: flex; justify-content: space-between; align-items: start;">
                <span class="has-text-grey is-size-7">Deployment</span>
                <span class="has-text-dark is-size-7" style="text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis;">
                  {{ deploymentName || '-' }}
                </span>
              </div>
              
              <div class="mb-2" style="display: flex; justify-content: space-between; align-items: start;">
                <span class="has-text-grey is-size-7">Model</span>
                <span class="has-text-dark is-size-7" style="text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis;">
                  {{ computedJobTitle || '-' }}
                </span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <span class="has-text-grey is-size-7">GPU</span>
                <span class="has-text-dark is-size-7" style="text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis;">
                  {{ selectedMarket ? marketName : '-' }}
                </span>
              </div>
            </div>

            <hr style="background-color: #e8eaed; margin: 1.5rem 0;" />

            <!-- Advanced Settings Button -->
            <button 
              class="button is-light is-fullwidth mb-4" 
              @click="showDeploymentSettingsModal = true"
              style="border: 1px solid #e8eaed;"
            >
              <span class="icon is-small">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" fill="currentColor"/>
                </svg>
              </span>
              <span>Advanced Deployment Settings</span>
            </button>

            <ClientOnly>
              <!-- Show login button when not authenticated -->
              <button
                v-if="status !== 'authenticated'"
                class="button is-secondary is-fullwidth"
                @click="handleLoginClick"
              >
                Login
              </button>
              <!-- Show swap button for wallet users with insufficient balance -->
              
              <!-- Show insufficient credits message for Google users -->
              <div
                v-else-if="
                  status === 'authenticated' && !canPostJob && selectedMarket
                "
                class="has-text-centered"
              >
                <p class="has-text-grey is-size-7 mb-2">
                  Insufficient credits. Need ${{
                    (estimatedCost || 0).toFixed(2)
                  }}, have ${{ creditBalance.toFixed(2) }}
                </p>
                <p class="has-text-grey is-size-7">
                  Claim credit codes on your account page
                </p>
              </div>
              <!-- Show deploy button if any authentication method allows deployment -->
              <button
                v-else-if="canCreateDeployment && status === 'authenticated'"
                class="button is-secondary is-fullwidth"
                @click="createDeployment"
              >
                <span v-if="isCreatingDeployment">Creating...</span>
                <span v-else>Create Deployment</span>
              </button>
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>

    <Loader v-if="loading" />

    <!-- README Modal -->
    <div class="modal" :class="{ 'is-active': showReadmeModal }">
      <div class="modal-background" @click="showReadmeModal = false"></div>
      <div class="modal-card" style="width: 80%; max-width: 960px">
        <header class="modal-card-head">
          <div class="modal-card-title is-flex is-align-items-center">
            <template v-if="loadingTemplates">
              <span class="icon is-small mr-2">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              <span>Loading template...</span>
            </template>
            <template v-else>
              <img
                v-if="selectedTemplate?.icon"
                :src="selectedTemplate.icon"
                alt="Template Icon"
                class="mr-2"
                style="
                  height: 24px;
                  width: 24px;
                  border-radius: 4px;
                  object-fit: contain;
                  flex-shrink: 0;
                "
              />
              <span>{{ selectedTemplate?.name || "Template" }}</span>
            </template>
          </div>
          <button
            class="delete"
            aria-label="close"
            @click="showReadmeModal = false"
          ></button>
        </header>
        <section
          class="modal-card-body"
          style="max-height: 70vh; overflow-y: auto"
        >
          <ClientOnly>
            <MarkdownFile
              v-if="readmeContentForModal"
              :raw-markdown="readmeContentForModal"
            />
          </ClientOnly>
        </section>
      </div>
    </div>

    <!-- Template Selection Modal -->
    <DeployTemplateModal
      v-model:showModal="showTemplateModal"
      :templates="groupedTemplates || []"
      @select-template="selectTemplateFromModal"
    />

    <!-- Advanced Deployment Settings Modal -->
    <div class="modal" :class="{ 'is-active': showDeploymentSettingsModal }">
      <div class="modal-background" @click="showDeploymentSettingsModal = false"></div>
      <div class="modal-card" style="max-width: 500px;">
        <header class="modal-card-head">
          <p class="modal-card-title">Advanced Deployment Settings</p>
          <button class="delete" aria-label="close" @click="showDeploymentSettingsModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">
              Deployment Strategy
              <span class="icon is-small has-tooltip-arrow has-tooltip-multiline" data-tooltip="How your deployment manages job instances">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" stroke-width="2"/>
                  <path d="M12 16v-4m0-4h.01" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
            </label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="strategy">
                  <option value="SIMPLE">Simple</option>
                  <option value="SIMPLE-EXTEND">Simple Extend</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="INFINITE">Infinite</option>
                </select>
              </div>
            </div>
            <p class="help">Choose how your deployment manages job instances</p>
          </div>
          
          <div v-if="strategy === 'SCHEDULED'" class="field">
            <label class="label">
              Schedule (Cron Expression)
              <span class="icon is-small has-tooltip-arrow has-tooltip-multiline" data-tooltip="Cron expression for scheduling jobs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" stroke-width="2"/>
                  <path d="M12 16v-4m0-4h.01" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
            </label>
            <div class="control">
              <input
                v-model="schedule"
                class="input"
                type="text"
                placeholder="0 0 * * * (daily at midnight)"
                required
              />
            </div>
            <p class="help">Define when jobs should run using cron syntax</p>
          </div>
          
          <div class="field">
            <label class="label">
              Replica Count
              <span class="icon is-small has-tooltip-arrow has-tooltip-multiline" data-tooltip="Number of parallel job instances (1-100)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" stroke-width="2"/>
                  <path d="M12 16v-4m0-4h.01" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
            </label>
            <div class="control">
              <input
                class="input"
                type="number"
                v-model.number="replicas"
                min="1"
                max="100"
              />
            </div>
            <p class="help">Number of parallel instances to run (1-100)</p>
          </div>
          
          <div class="field">
            <label class="label">
              Container Timeout (hours)
              <span class="icon is-small has-tooltip-arrow has-tooltip-multiline" data-tooltip="Maximum runtime before container auto-shutdown">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" stroke-width="2"/>
                  <path d="M12 16v-4m0-4h.01" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
            </label>
            <div class="control">
              <input
                class="input"
                type="number"
                v-model.number="timeout"
                min="1"
              />
            </div>
            <p class="help">Maximum runtime before auto-shutdown</p>
          </div>
        </section>
        <footer class="modal-card-foot" style="justify-content: flex-end;">
          <button class="button" @click="showDeploymentSettingsModal = false">Cancel</button>
          <button class="button is-secondary" @click="showDeploymentSettingsModal = false">Save Settings</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Market, JobDefinition } from "@nosana/sdk";
import JsonEditorVue from "json-editor-vue";
import { Mode, ValidationSeverity } from "vanilla-jsoneditor";
import "vanilla-jsoneditor/themes/jse-theme-dark.css";
import { useToast } from "vue-toastification";
import TopBar from "~/components/TopBar.vue";
import { useRouter, useRoute } from "vue-router";
import { useDebounceFn, useScrollLock } from "@vueuse/core";
import { useEstimatedCost } from "~/composables/useMarketPricing";
import type { Template } from "~/composables/useTemplates";
import Loader from "~/components/Loader.vue";

// Advanced GPU selection types (copied from deploy.vue)
interface FilterValue {
  min: number;
  max: number;
}

interface FilterValues {
  [key: string]: string | FilterValue;
}

interface HostInterface {
  host_address: string;
  label: string;
  USD_per_hour: number;
  market_address?: string;
  market_type?: string;
  specs: {
    CPU_CORES: number;
    RAM_MB?: number;
    MEMORY_GB?: number;
    DISK_SPACE_GB: number;
    DOWNLOAD_SPEED_MB?: number;
    BANDWIDTH_MB?: number;
    PLATFORM_OS?: string;
    UPLOAD_SPEED_MB?: number;
  };
  country?: string;
}

// Setup composables
const { markets, getMarkets, loadingMarkets } = useMarkets();
const {
  templates,
  groupedTemplates,
  loadingTemplates,
  loadingGroupedTemplates,
} = useTemplates();
const { nosana } = useSDK();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const { status, data: userData, token } = useAuth();
const loading = ref(false);

// Initialize redirect composable for authentication flow
useRedirect();

// Scroll lock for README modal
const scrollLockTarget = ref<HTMLElement | null>(null);
const isLocked = useScrollLock(scrollLockTarget);

// State
const config = useRuntimeConfig();
const gpuTab = ref<"simple" | "advanced">("simple");
// Show all markets on devnet, only premium on mainnet
const gpuTypeCheckbox = ref<string[]>(
  config.public.network === "devnet" ? ["PREMIUM", "COMMUNITY"] : ["PREMIUM"]
);
const activeFilter = ref(
  config.public.network === "devnet" ? "ALL" : "PREMIUM"
);
const selectedMarket = ref<Market | null>(null);
const selectedTemplate = ref<Template | null>(null);
const timeout = ref(1);
const isCreatingDeployment = ref(false);
const showSettingsModal = ref(false); // For priority fee settings (TopBar)
const showDeploymentSettingsModal = ref(false); // For deployment settings
const showSwapModal = ref(false);
const skipAutoSelection = ref(false);
const isUpdatingFromJobDef = ref(false);
const isRestoringState = ref(false);
const isEditorCollapsed = ref(true);

// Deployment-specific state
const deploymentName = ref("");
const replicas = ref(1);
const strategy = ref("SIMPLE");
const schedule = ref("0 0 * * *"); // Default schedule

// Balance and price state
const nosPrice = ref(0);

// Credit balance state
const creditBalance = ref<number>(0);
const loadingCreditBalance = ref(false);
const solPrice = ref(0);
const usdcPrice = ref(0);
const usdtPrice = ref(0);

// Initialize filterValues with defaults
const filterValues = ref<FilterValues>({
  PLATFORM_OS: "All",
  CUDA_DRIVER: "All",
  CPU_CORES: { min: 0, max: 128 },
  RAM_MB: { min: 12288, max: 131072 },
  DISK_SPACE_GB: { min: 256, max: 1000 },
  BANDWIDTH_MB: { min: 100, max: 1000 },
});

// Field mappings constants for GPU selection (copied from deploy.vue)
const FIELD_MAPPINGS = {
  API_PARAMS: {
    PLATFORM_OS: "platform_os",
    CUDA_DRIVER: "cuda_drivers",
    CPU_CORES: "cpu_cores",
    RAM_MB: "ram_mb",
    DISK_SPACE_GB: "disk_space_gb",
    BANDWIDTH_MB: "download_speed_mb",
    DOWNLOAD_SPEED_MB: "download_speed_mb",
    UPLOAD_SPEED_MB: "upload_speed_mb",
    REGION: "region",
  },
  LABELS: {
    PLATFORM_OS: "Select OS",
    CUDA_DRIVER: "Select CUDA driver",
    CPU_CORES: "CPU",
    RAM_MB: "Memory",
    DISK_SPACE_GB: "Storage",
    BANDWIDTH_MB: "Download Speed",
    DOWNLOAD_SPEED_MB: "Download Speed",
  },
  DESCRIPTIONS: {
    CPU_CORES: "Select amount of vCPUs",
    RAM_MB: "Set minimum memory in GB",
    DISK_SPACE_GB: "Set minimum storage in GB",
    BANDWIDTH_MB: "Set the minimum download speed in MB/s",
    DOWNLOAD_SPEED_MB: "Set the minimum download speed in MB/s",
  },
  UNITS: {
    CPU_CORES: "vCPU",
    RAM_MB: "GB",
    DISK_SPACE_GB: "GB",
    BANDWIDTH_MB: "MB/s",
    DOWNLOAD_SPEED_MB: "MB/s",
  },
  ZERO_MIN_FIELDS: ["RAM_MB", "CPU_CORES", "DISK_SPACE_GB"],
};

// API data
const { data: stats } = await useAPI("/api/stats");
const { data: testgridMarkets } = await useAPI("/api/markets", {
  default: () => [],
});
const nosApiPrice = computed(() => stats.value?.price || 0);

// Job definition - will be populated when PyTorch template loads
const jobDefinition = ref<JobDefinition | null>(null);

// Cache NOS price data
interface CachedPrice {
  price: number;
  timestamp: number;
}

const cachedNosPrice = useLocalStorage<CachedPrice>("nos-price-cache", {
  price: 0,
  timestamp: 0,
});

// Function to check if cache is valid (less than 1 hour old)
const isCacheValid = () => {
  const oneHour = 60 * 60 * 1000;
  return Date.now() - cachedNosPrice.value.timestamp < oneHour;
};

// Fetch token prices
const { data: priceData } = await useAPI(
  "https://api.coingecko.com/api/v3/simple/price?ids=nosana,solana,usd-coin,tether&vs_currencies=usd",
  {
    default: () => ({
      nosana: { usd: 0 },
      solana: { usd: 0 },
      "usd-coin": { usd: 0 },
      tether: { usd: 0 },
    }),
  }
);

watch(
  () => priceData.value,
  (newPrice) => {
    if (newPrice?.nosana?.usd) {
      nosPrice.value = newPrice.nosana.usd;
      cachedNosPrice.value = {
        price: newPrice.nosana.usd,
        timestamp: Date.now(),
      };
    } else if (isCacheValid()) {
      nosPrice.value = cachedNosPrice.value.price;
    } else {
      nosPrice.value = nosApiPrice.value;
    }
    if (newPrice?.solana?.usd) {
      solPrice.value = newPrice.solana.usd;
    }
    if (newPrice?.["usd-coin"]?.usd) {
      usdcPrice.value = newPrice["usd-coin"].usd;
    }
    if (newPrice?.tether?.usd) {
      usdtPrice.value = newPrice.tether.usd;
    }
  },
  { immediate: true }
);

// Computed properties
const computedJobTitle = computed(() => {
  if (selectedTemplate.value && selectedTemplate.value.id !== "custom") {
    return selectedTemplate.value.name;
  }
  if (jobDefinition.value?.ops?.[0]?.id) {
    return jobDefinition.value.ops[0].id;
  }
  if (computedDockerImage.value) {
    const imageNameParts = computedDockerImage.value.split("/");
    return imageNameParts.pop() || "Custom Job";
  }
  return "Custom Job Definition";
});

const computedDockerImage = computed(() => {
  if (
    selectedTemplate.value &&
    selectedTemplate.value.id !== "custom" &&
    selectedTemplate.value.jobDefinition?.ops?.[0]?.args
  ) {
    const args = selectedTemplate.value.jobDefinition.ops[0].args as any;
    if (args.image) {
      return args.image;
    }
  }
  if (jobDefinition.value?.ops?.[0]?.args) {
    const args = jobDefinition.value.ops[0].args as any;
    if (args.image) {
      return args.image;
    }
  }
  return null;
});

const marketName = computed(() => {
  if (!selectedMarket.value) return null;
  return (
    testgridMarkets.value.find(
      (tgm: any) => tgm.address === selectedMarket.value?.address.toString()
    )?.name || selectedMarket.value.address.toString()
  );
});

// Use centralized pricing system
const selectedMarketAddress = computed(
  () => selectedMarket.value?.address?.toString() || null
);
const testgridMarketsRef = computed(() => testgridMarkets.value);

const { estimatedCost, formattedCost, formattedHourlyRate, usdPricePerHour } =
  useEstimatedCost(
    selectedMarketAddress,
    computed(() => timeout.value),
    testgridMarketsRef
  );

// Legacy computed properties for backward compatibility
const hourlyPrice = computed(() => usdPricePerHour.value || 0);
const totalPrice = computed(() => (estimatedCost.value || 0) * replicas.value);

const requiredNos = computed(() => {
  if (!selectedMarket.value || !timeout.value) return 0;

  if (usdPricePerHour.value && nosPrice.value) {
    return (
      (usdPricePerHour.value * timeout.value * replicas.value) / nosPrice.value
    );
  }

  return 0;
});

// Check if user can post job based on authentication and credits
const canPostJob = computed(() => {
  if (status.value === "authenticated") {
    const costUSD = totalPrice.value || 0;
    return creditBalance.value >= costUSD;
  }
  return false;
});

// Check if user is authenticated via any method
const isAuthenticated = computed(() => {
  return status.value === "authenticated" && token.value;
});

const canCreateDeployment = computed(
  () =>
    selectedMarket.value !== null &&
    jobDefinition.value !== null &&
    deploymentName.value.trim() !== "" &&
    replicas.value > 0 &&
    timeout.value > 0 &&
    !isCreatingDeployment.value &&
    isAuthenticated.value &&
    canPostJob.value
);

const activeFilterKey = computed(
  () => `${selectedTemplate?.value?.id || "default"}-${activeFilter.value}`
);

// Validation function
const validator = (json: any) => {
  const errors: {
    path: string[];
    message: string;
    severity: ValidationSeverity;
  }[] = [];
  return errors;
};
// Credit balance fetch (API)
const refreshCreditBalance = async () => {
  if (status.value !== 'authenticated' || !token.value) return;
  loadingCreditBalance.value = true;
  try {
    const data = await useApiFetch<any>("/api/credits/balance", { method: "GET", auth: true });
    if (data) {
      creditBalance.value =
        (data.assignedCredits || 0) - (data.settledCredits || 0) - (data.reservedCredits || 0);
    }
  } catch (error) {
    console.error("Error fetching credit balance:", error);
  } finally {
    loadingCreditBalance.value = false;
  }
};


// No wallet flow in API mode

const createDeployment = async () => {
  if (!canCreateDeployment.value) return;

  // Validate inputs
  if (!deploymentName.value.trim()) {
    toast.error("Deployment name is required");
    return;
  }
  if (replicas.value <= 0) {
    toast.error("Number of replicas must be greater than 0");
    return;
  }
  if (timeout.value <= 0) {
    toast.error("Timeout must be greater than 0");
    return;
  }

  loading.value = true;
  isCreatingDeployment.value = true;

  try {
    // First, pin the job definition to IPFS
    if (!jobDefinition.value) {
      throw new Error("Job definition is required");
    }
    const ipfsHash = await nosana.value.ipfs.pin(jobDefinition.value);

    // Create deployment via API (authenticated only)
    if (status.value !== 'authenticated' || !token.value) {
      throw new Error("Please sign in to create a deployment");
    }

    const requestBody = {
      name: deploymentName.value.trim(),
      market: selectedMarket.value!.address.toString(),
      replicas: replicas.value,
      timeout: Math.min(timeout.value * 60, 1440), // Convert hours to minutes, max 24 hours
      ...(strategy.value === "SCHEDULED"
        ? { strategy: "SCHEDULED" as const, schedule: schedule.value }
        : { strategy: strategy.value as "SIMPLE" | "SIMPLE-EXTEND" | "INFINITE" }),
      job_definition: jobDefinition.value,
      confidential: true,
    };

    const data = await useApiFetch('/api/deployments/create', {
      method: 'POST',
      body: requestBody,
      auth: true,
    });

    toast.success(`Successfully created deployment ${data.id}`)
    setTimeout(() => {
      router.push(`/deployments/${data.id}`);
    }, 2000);
  } catch (error: any) {
    toast.error(`Error creating deployment: ${error.message || error.toString()}`);
  } finally {
    isCreatingDeployment.value = false;
    loading.value = false;
  }
};

// Handle login click
const handleLoginClick = () => {
  const { openBothModal } = useLoginModal();
  openBothModal();
};

// Template selection handling
watch(
  () => selectedTemplate.value,
  (newTemplate) => {
    if (isUpdatingFromJobDef.value) return;

    if (newTemplate?.jobDefinition) {
      isUpdatingFromJobDef.value = true;
      jobDefinition.value = JSON.parse(
        JSON.stringify(newTemplate.jobDefinition)
      );
      nextTick(() => {
        isUpdatingFromJobDef.value = false;
      });
    }
  },
  { deep: true }
);

// Watch jobDefinition changes to detect custom configurations
watch(
  () => jobDefinition.value,
  (newJobDef, oldJobDef) => {
    if (isUpdatingFromJobDef.value) return;

    if (JSON.stringify(newJobDef) === JSON.stringify(oldJobDef)) {
      return;
    }

    if (selectedTemplate.value && selectedTemplate.value.id !== "custom") {
      if (
        JSON.stringify(newJobDef) !==
        JSON.stringify(selectedTemplate.value.jobDefinition)
      ) {
        isUpdatingFromJobDef.value = true;
        selectedTemplate.value = null;
        nextTick(() => {
          isUpdatingFromJobDef.value = false;
        });
      }
    } else {
      if (groupedTemplates.value) {
        const templateMatchingJobDef = groupedTemplates.value.find(
          (t: Template) =>
            t.jobDefinition &&
            JSON.stringify(t.jobDefinition) === JSON.stringify(newJobDef) &&
            t.id !== "custom"
        );

        if (templateMatchingJobDef) {
          selectedTemplate.value = templateMatchingJobDef as Template;
        }
      }
    }
  },
  { deep: true }
);

// Auto-select PyTorch template when grouped templates load
watch(
  () => groupedTemplates.value,
  (newTemplates) => {
    if (
      Array.isArray(newTemplates) &&
      newTemplates.length > 0 &&
      !selectedTemplate.value &&
      !isRestoringState.value
    ) {
      const pytorchTemplate = newTemplates.find((template: any) =>
        template.jobDefinition?.ops?.[0]?.args?.image?.includes(
          "nosana/pytorch-jupyter"
        )
      );

      if (pytorchTemplate && pytorchTemplate.jobDefinition) {
        selectedTemplate.value = pytorchTemplate as Template;
        jobDefinition.value = pytorchTemplate.jobDefinition;
      }
    }
  },
  { immediate: true }
);

// Update GPU type when market changes
watch(
  () => selectedMarket.value,
  (newMarket) => {
    if (newMarket && testgridMarkets.value && activeFilter.value !== "ALL") {
      const marketInfo = testgridMarkets.value.find(
        (tgm: any) => tgm.address === newMarket.address.toString()
      );
      if (marketInfo && marketInfo.type) {
        gpuTypeCheckbox.value = [marketInfo.type];
        activeFilter.value = marketInfo.type;
      }
    }
  }
);


// Mounted hook
onMounted(async () => {
  if (process.client) {
    scrollLockTarget.value = document.documentElement;
  }

  if (!markets.value && !loadingMarkets.value) {
    await getMarkets();
  }

  // No wallet balances in API mode
  if (status.value === 'authenticated' && token.value) {
    await refreshCreditBalance();
  }
});

// React to auth changes to keep credits fresh
watch([status, token], async () => {
  if (status.value === 'authenticated' && token.value) {
    await refreshCreditBalance();
  } else {
    creditBalance.value = 0;
  }
}, { immediate: true });

// No swap modal in API mode

// README Modal functions
const openReadmeModal = (readme: string) => {
  readmeContentForModal.value = readme;
  showReadmeModal.value = true;
};

// State for modals
const showReadmeModal = ref(false);
const readmeContentForModal = ref<string | undefined>(undefined);
const showTemplateModal = ref(false);

// Template selection handler
const selectTemplateFromModal = (template: Template) => {
  selectedTemplate.value = template;
  showTemplateModal.value = false;
  isEditorCollapsed.value = true;
};

// Watch for README modal state to control body scroll
watch(showReadmeModal, (isOpen) => {
  isLocked.value = isOpen;
});

// Watch for template modal state to control body scroll
watch(showTemplateModal, (isOpen) => {
  if (!showReadmeModal.value) {
    isLocked.value = isOpen;
  }
});
</script>

<style lang="scss" scoped>
// Copied styles from deploy.vue
.nav-tabs-item {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  color: $grey;
  cursor: pointer;
  border: none;
  border-bottom: 0px;

  &.is-active {
    color: var(--text-color, $black);
    border: none;
    border-bottom: 1px solid var(--tab-bottom-color, white);
    margin-bottom: -1px;
  }

  &:hover {
    background-color: $white-ter;
  }
}

.summary {
  position: sticky !important;
  top: 1rem !important;
  align-self: flex-start !important;
  max-height: calc(100vh - 2rem) !important;
  overflow-y: auto !important;
  z-index: 15;
  background: transparent;
}

.dark-mode .summary {
  background: transparent;
}

@media screen and (max-width: 1407px) {
  .summary {
    position: static;
    top: auto;
    align-self: auto;
    max-height: none;
    overflow-y: visible;
    margin-top: 1.5rem !important;
    background: transparent;
  }
}

.summary > .box {
  padding: 1.5rem;
  background: white !important;
}

.dark-mode .summary > .box {
  background: #121212 !important;
}

.dark-mode {
  .box {
    border-color: $grey-darker !important;
  }

  .nav-tabs-item {
    border-color: $grey-darker;
    color: $grey-light;

    &.is-active {
      --text-color: $white;
      --tab-bottom-color: $black;
      border-color: $grey-darker;
    }

    &:hover {
      background-color: $black-ter;
    }
  }

  .tag {
    color: $white !important;
  }
}

@media screen and (max-width: 768px) {
  .summary {
    margin-top: 1rem !important;
  }
}

@media screen and (min-width: 1920px) {
  .summary {
    position: sticky !important;
    top: 1rem !important;
    align-self: flex-start !important;
    max-height: calc(100vh - 2rem) !important;
    overflow-y: auto !important;
    background: transparent !important;
  }
}

@media screen and (max-width: 768px) {
  .columns.is-multiline > .column.is-9-fullhd,
  .columns.is-multiline > .column.is-3-fullhd {
    padding-left: 0;
    padding-right: 0;
  }

  .column.is-9-fullhd > .box,
  .column.is-3-fullhd > .summary > .box {
    padding-left: 0.5rem;
    padding-right: 0.1rem;
  }

  .topbar {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }

  .topbar .button,
  .topbar .navbar-burger {
    margin: 0;
    padding: 0.5rem;
  }
}

.modal.is-active {
  overflow: hidden;
}

.modal.is-active .modal-card-body {
  overflow-y: auto !important;
}
</style>
