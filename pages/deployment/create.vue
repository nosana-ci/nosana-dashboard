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
        <!-- Step 1: Choose model -->
        <DeployJobDefinition
          :selectedTemplate="selectedTemplate"
          v-model:jobDefinition="jobDefinition"
          v-model:isEditorCollapsed="isEditorCollapsed"
          :validator="validator"
          @showTemplateModal="showTemplateModal = true"
          @openReadme="openReadmeModal"
        />

        <!-- Step 2: Configure Deployment -->
        <h2 class="title pt-0 pb-0 mb-3 mt-5">2. Configure Deployment</h2>
        <div class="box has-background-white" style="border: none">
          <div class="columns">
            <div class="column is-6">
              <div class="field">
                <label class="label">Deployment Name</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    placeholder="Enter deployment name"
                    v-model="deploymentName"
                    maxlength="50"
                  />
                </div>
              </div>
            </div>
            <div class="column is-3">
              <div class="field">
                <label class="label">Replicas</label>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    min="1"
                    max="100"
                    v-model.number="replicas"
                  />
                </div>
              </div>
            </div>
            <div class="column is-3">
              <div class="field">
                <label class="label">Timeout (hours)</label>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    min="1"
                    v-model.number="timeout"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">Strategy</label>
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
          </div>

          <div v-if="strategy === 'SCHEDULED'" class="field">
            <label class="label">Schedule (Cron expression)</label>
            <div class="control">
              <input
                v-model="schedule"
                class="input"
                type="text"
                placeholder="0 0 * * * (daily at midnight)"
                required
              />
            </div>
          </div>
        </div>

        <!-- Step 3: Select GPU -->
        <h2 class="title pt-0 pb-0 mb-3 mt-5">3. Select your GPU</h2>
        <div class="nav-tabs is-flex">
          <div
            class="nav-tabs-item p-3 px-5 mr-3"
            :class="{ 'is-active has-background-white': gpuTab === 'simple' }"
            @click="gpuTab = 'simple'"
          >
            Device
          </div>
        </div>
        <div class="box has-background-white" style="border: none">
          <DeploySimpleGpuSelection
            v-if="gpuTab === 'simple'"
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
          <h1 class="title is-4 mb-2">Summary</h1>
          <div class="box has-background-white" style="border: none">
            <div class="is-flex is-justify-content-space-between">
              <h3 class="title is-4">Estimated Cost</h3>
              <h3 class="title is-4" v-if="selectedMarket">
                ${{ (hourlyPrice * replicas * timeout).toFixed(3) }}
              </h3>
              <p v-else>Select a GPU</p>
            </div>

            <div class="is-flex is-justify-content-space-between has-text-grey">
              <p>Deployment:</p>
              <p
                v-if="deploymentName"
                style="
                  text-overflow: ellipsis;
                  text-align: right;
                  flex-basis: 70%;
                "
              >
                {{ deploymentName }}
              </p>
              <p v-else>-</p>
            </div>

            <div class="is-flex is-justify-content-space-between has-text-grey">
              <p>Model:</p>
              <p
                v-if="computedJobTitle"
                style="
                  text-overflow: ellipsis;
                  text-align: right;
                  flex-basis: 70%;
                "
              >
                {{ computedJobTitle }}
              </p>
              <p v-else>-</p>
            </div>

            <div class="is-flex is-justify-content-space-between has-text-grey">
              <p>GPU</p>
              <p v-if="selectedMarket">{{ marketName }}</p>
              <p v-else>-</p>
            </div>

            <div class="is-flex is-justify-content-space-between has-text-grey">
              <p>Replicas</p>
              <p>{{ replicas }}</p>
            </div>

            <div class="is-flex is-justify-content-space-between has-text-grey">
              <p>Strategy</p>
              <p>{{ strategy }}</p>
            </div>

            <div class="is-flex is-justify-content-space-between has-text-grey">
              <p>Timeout (hours)</p>
              <p>{{ timeout }}</p>
            </div>

            <hr />
            <div class="is-flex is-justify-content-space-between">
              <h3 class="title is-4 mb-0">Per Hour</h3>
              <h3 class="title is-4" v-if="selectedMarket">
                ${{ (hourlyPrice * replicas).toFixed(3) }}
              </h3>
            </div>
            <hr />

            <ClientOnly>
              <!-- Show login button when not authenticated -->
              <button
                v-if="!connected && status !== 'authenticated'"
                class="button is-secondary is-fullwidth"
                @click="handleLoginClick"
              >
                Login
              </button>
              <!-- Show swap button for wallet users with insufficient balance -->
              <button
                v-else-if="connected && !canPostJob && selectedMarket"
                class="button is-secondary is-fullwidth"
                @click="openSwapModal"
              >
                Swap
              </button>
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
                v-else-if="
                  canCreateDeployment &&
                  (connected || status === 'authenticated')
                "
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
  </div>
</template>

<script lang="ts" setup>
import type { Market, JobDefinition } from "@nosana/sdk";
import JsonEditorVue from "json-editor-vue";
import { Mode, ValidationSeverity } from "vanilla-jsoneditor";
import "vanilla-jsoneditor/themes/jse-theme-dark.css";
import { useToast } from "vue-toastification";
import {
  WalletMultiButton,
  WalletModalProvider,
  useWallet,
} from "solana-wallets-vue";
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
const { connected, publicKey, wallet } = useWallet();
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
const showSettingsModal = ref(false);
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
const balance = ref<number>(0);
const loadingBalance = ref(false);
const errorBalance = ref<string | null>(null);
const nosPrice = ref(0);

// Credit balance state
const creditBalance = ref<number>(0);
const loadingCreditBalance = ref(false);
const solPrice = ref(0);
const usdcPrice = ref(0);
const usdtPrice = ref(0);
const userBalances = ref({
  nos: 0,
  sol: 0,
  usdc: 0,
  usdt: 0,
});

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

// Check if user can post job based on their authentication method and balance
const canPostJob = computed(() => {
  if (connected.value) {
    return (balance.value || 0) >= requiredNos.value;
  }
  if (status.value === "authenticated") {
    const costUSD = totalPrice.value || 0;
    return creditBalance.value >= costUSD;
  }
  return false;
});

// Check if user is authenticated via any method
const isAuthenticated = computed(() => {
  return connected.value || status.value === "authenticated";
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

// Helper function to ensure wallet is ready for transactions
const ensureWalletReady = async (): Promise<boolean> => {
  if (!connected.value || !publicKey.value) {
    return false;
  }

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    if (wallet.value?.adapter?.connected && wallet.value?.adapter?.publicKey) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  return false;
};

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

    // Create deployment using the SDK
    if (connected.value) {
      // Wallet-based deployment creation
      const walletReady = await ensureWalletReady();
      if (!walletReady) {
        throw new Error(
          "Wallet is not ready for signing. Please reconnect your wallet and try again."
        );
      }

      const deployment = await nosana.value.deployments.create({
        name: deploymentName.value.trim(),
        market: selectedMarket.value!.address.toString(),
        replicas: replicas.value,
        timeout: timeout.value * 3600,
        ...(strategy.value === "SCHEDULED"
          ? {
              strategy: "SCHEDULED" as const,
              schedule: schedule.value,
            }
          : {
              strategy: strategy.value as
                | "SIMPLE"
                | "SIMPLE-EXTEND"
                | "INFINITE",
            }),
        ipfs_definition_hash: ipfsHash,
      });

      toast.success(`Successfully created deployment ${deployment.id}`);
      setTimeout(() => {
        router.push("/deployment");
      }, 3000);
    } else if (status.value === 'authenticated' && token.value) {
      // Credit-based deployment creation via API
      const response = await fetch(`${config.public.apiBase}/api/deployments`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: token.value as string,
        },
        body: JSON.stringify({
          name: deploymentName.value.trim(),
          market: selectedMarket.value!.address.toString(),
          replicas: replicas.value,
          timeout: timeout.value * 3600,
          strategy: strategy.value as
            | "SIMPLE"
            | "SIMPLE-EXTEND"
            | "SCHEDULED"
            | "INFINITE",
          ipfs_definition_hash: ipfsHash,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully created deployment ${data.id}`);
        await refreshCreditBalance();
        setTimeout(() => {
          router.push("/deployment");
        }, 3000);
      } else {
        const errorText = await response.text();
        let errorMessage = "Failed to create deployment";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } else {
      throw new Error("Please connect your wallet or sign in to create a deployment");
    }
  } catch (error: any) {
    if (error.toString().toLowerCase().includes("user rejected")) {
      toast.info("Transaction was cancelled.");
    } else if (error.toString().toLowerCase().includes("wallet is not ready")) {
      toast.error(
        "Wallet connection issue. Please disconnect and reconnect your wallet, then try again."
      );
    } else if (error.toString().toLowerCase().includes("not connected")) {
      toast.error(
        "Wallet is not connected. Please connect your wallet and try again."
      );
    } else {
      toast.error(`Error creating deployment: ${error.toString()}`);
    }
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

// Balance management functions (copied from deploy.vue)
const refreshBalance = async () => {
  if (!publicKey.value || !nosana.value) return;

  loadingBalance.value = true;
  errorBalance.value = null;

  try {
    const balanceData = await nosana.value.solana.getNosBalance(
      publicKey.value.toString()
    );
    balance.value = balanceData?.uiAmount || 0;
  } catch (error: any) {
    errorBalance.value = error.toString();
    console.error("Error fetching NOS balance:", error);
  } finally {
    loadingBalance.value = false;
  }
};

const refreshAllBalances = async () => {
  if (!publicKey.value || !nosana.value) return;

  try {
    const [nosBal, solBal, usdcBal, usdtBal] = await Promise.all([
      nosana.value.solana.getNosBalance(),
      nosana.value.solana.getSolBalance(),
      nosana.value.solana.getUsdcBalance(),
      nosana.value.solana.getUsdtBalance(),
    ]);

    userBalances.value = {
      nos: nosBal?.uiAmount ?? 0,
      sol: solBal / 1e9,
      usdc: usdcBal?.uiAmount ?? 0,
      usdt: usdtBal?.uiAmount ?? 0,
    };
    await refreshBalance();
  } catch (error) {
    console.error("Failed to refresh balances", error);
  }
};

// Watch for wallet connection changes
watch(
  [publicKey, nosana],
  async () => {
    if (publicKey.value && nosana.value) {
      await refreshAllBalances();
    }
  },
  { immediate: true }
);

// Mounted hook
onMounted(async () => {
  if (process.client) {
    scrollLockTarget.value = document.documentElement;
  }

  if (!markets.value && !loadingMarkets.value) {
    await getMarkets();
  }

  if (publicKey.value && nosana.value) {
    await refreshAllBalances();
  }
});

// Swap modal functions
watch(
  () => showSwapModal.value,
  (newValue) => {
    if (newValue === true) {
      setTimeout(async () => {
        await refreshAllBalances();
      }, 50);
    }
  }
);

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
  position: fixed;
  top: 23px;
  right: 20px;
  width: 20%;
  max-width: 400px;
  padding: 1 1rem 1rem;
  z-index: 15;
  background: transparent;
  margin-top: 78px;
}

.dark-mode .summary {
  background: transparent;
}

@media screen and (max-width: 1407px) {
  .summary {
    position: static;
    top: auto;
    right: auto;
    width: 100%;
    max-width: none;
    margin-top: 1.5rem !important;
    padding: 0;
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
    position: static !important;
    top: auto !important;
    right: auto !important;
    width: 100% !important;
    max-width: none !important;
    margin-top: 1.5rem !important;
    padding: 0 !important;
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
