<template>
  <div>
    <TopBar
      :title="'Create Deployment'"
      :subtitle="'Configure and manage multiple job instances'"
      ref="topBar"
      :hide-buttons="false"
      v-model="showSettingsModal"
    ></TopBar>

    <!-- Show loader for external data only; editor always visible -->
    <Loader v-if="loadingTemplates || loadingMarkets" />

    <div v-else class="columns is-multiline">
      <div class="column is-9-fullhd is-12">
        <!-- Choose model -->
        <ConfigurationModal
          title="Configure Deployment"
          :selectedTemplate="selectedTemplate"
          v-model:jobDefinition="jobDefinition"
          v-model:isEditorCollapsed="isEditorCollapsed"
          @showTemplateModal="showTemplateModal = true"
          :strategy="strategy"
          @update:strategy="strategy = $event"
          :schedule="schedule"
          @update:schedule="schedule = $event"
          :replicas="replicas"
          @update:replicas="replicas = $event"
          :timeout="timeout"
          @update:timeout="timeout = $event"
          :deployment-name="deploymentName"
          @update:deploymentName="deploymentName = $event"
        />

        <!-- Select GPU -->
        <div class="box" style="border: none; margin-top: 1.5rem">
          <h2 class="title is-5 mb-4">Select GPU</h2>
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
          <div class="box" style="border: none; padding: 1.5rem">
            <h2 class="title is-5 mb-4">Summary</h2>
            <!-- Cost Summary -->
            <div class="mb-4">
              <p class="section-header">Cost</p>

              <!-- Credit User Cost -->
              <div v-if="isCreditMode">
                <h3 class="title is-3 mb-1" v-if="selectedMarket">
                  ${{ (hourlyPrice * replicas).toFixed(3) }}/h
                </h3>
                <p class="has-text-grey" v-else>Select a GPU to see pricing</p>
              </div>

              <!-- Wallet User Cost -->
              <div v-else-if="isWalletMode">
                <h3
                  class="title is-3 mb-1"
                  v-if="selectedMarket && requiredNos"
                >
                  {{ requiredNos.toFixed(3) }} NOS/h
                </h3>
                <p
                  class="has-text-grey is-size-7 mb-1"
                  v-if="selectedMarket && hourlyPrice"
                >
                  ≈ ${{ (hourlyPrice * replicas).toFixed(3) }}/h
                </p>
                <p class="has-text-grey" v-else>Select a GPU to see pricing</p>
              </div>

              <!-- No Auth -->
              <div v-else>
                <p class="has-text-grey">-</p>
              </div>
            </div>

            <hr style="margin: 0.5rem 0" />

            <!-- Configuration Summary -->
            <div class="mb-4">
              <p class="section-header">Configuration</p>

              <div
                class="mb-2"
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: start;
                "
              >
                <span class="has-text-grey is-size-7">Deployment name</span>
                <span
                  class="has-text-weight-medium is-size-7"
                  style="
                    text-align: right;
                    max-width: 60%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ deploymentName || "-" }}
                </span>
              </div>

              <div
                class="mb-2"
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: start;
                "
              >
                <span class="has-text-grey is-size-7">Container(s)</span>
                <span
                  class="has-text-weight-medium is-size-7"
                  style="
                    text-align: right;
                    max-width: 60%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ computedDeploymentName || "-" }}
                </span>
              </div>

              <div
                class="mb-2"
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: start;
                "
              >
                <span class="has-text-grey is-size-7">GPU</span>
                <span
                  class="has-text-weight-medium is-size-7"
                  style="
                    text-align: right;
                    max-width: 60%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ selectedMarket ? marketName : "-" }}
                </span>
              </div>

              <div
                class="mb-2"
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: start;
                "
                v-if="strategy === 'SCHEDULED'"
              >
                <span class="has-text-grey is-size-7">Schedule</span>
                <div style="text-align: right; max-width: 60%">
                  <div
                    class="has-text-weight-medium is-size-7 is-family-monospace"
                    style="overflow: hidden; text-overflow: ellipsis"
                  >
                    {{ schedule || "-" }}
                  </div>
                  <div
                    v-if="schedule"
                    class="has-text-grey is-size-8 mt-1"
                    style="
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    "
                  >
                    {{ parseCronExpression(schedule) }}
                  </div>
                </div>
              </div>

              <div
                class="mb-2"
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: start;
                "
              >
                <span class="has-text-grey is-size-7">Replicas</span>
                <span
                  class="has-text-weight-medium is-size-7"
                  style="
                    text-align: right;
                    max-width: 60%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ replicas }}
                </span>
              </div>
            </div>

            <ClientOnly>
              <div v-if="isBanned" class="notification is-danger is-light mb-4">
                Your account is suspended. Creating deployments and topping up
                funds are disabled.
              </div>

              <!-- Credit Mode Actions -->
              <div v-if="isCreditMode">
                <button
                  class="button is-secondary is-fullwidth is-glow"
                  :disabled="!canCreateDeployment"
                  @click="createDeployment"
                >
                  <span v-if="isCreatingDeployment">Creating...</span>
                  <span v-else>Create Deployment</span>
                </button>

                <!-- Show insufficient credits message -->
                <div
                  v-if="!canPostJob && selectedMarket"
                  class="has-text-centered mb-3 mt-3"
                >
                  <p class="has-text-grey is-size-7 mb-2">
                    Insufficient credits. Need ${{
                      (hourlyPrice * replicas * timeout).toFixed(3)
                    }}, have ${{ creditBalance.toFixed(2) }}
                  </p>
                  <button
                    type="button"
                    class="button is-primary is-fullwidth mb-2"
                    :disabled="isBanned"
                    @click="openBuyCreditsModal"
                  >
                    Buy Credits
                  </button>
                  <button
                    class="button is-outlined is-fullwidth has-text-grey"
                    @click="goToClaimCredits"
                  >
                    Have a code? Claim it
                  </button>
                </div>
              </div>

              <!-- Wallet Mode Actions -->
              <div v-else-if="isWalletMode">
                <button
                  class="button is-secondary is-fullwidth is-glow"
                  :disabled="!canCreateDeployment"
                  @click="createDeployment"
                >
                  <span v-if="isCreatingDeployment">Creating...</span>
                  <span v-else>Create Deployment</span>
                </button>

                <!-- Show insufficient vault balance message -->
                <div
                  v-if="!canAffordDeployment && selectedMarket"
                  class="has-text-centered mb-3 mt-3"
                >
                  <p class="has-text-grey is-size-7 mb-2">
                    Insufficient vault balance. Need
                    {{ requiredNosTotal.toFixed(3) }} NOS, have
                    {{ vaultBalance.NOS.toFixed(3) }} NOS
                  </p>
                  <button
                    type="button"
                    class="button is-primary is-fullwidth mb-2"
                    :disabled="isBanned"
                    @click="topupVault"
                  >
                    Top Up Vault
                  </button>
                </div>
              </div>

              <!-- No Authentication Actions -->
              <div v-else>
                <button
                  class="button is-secondary is-fullwidth is-glow"
                  @click="handleLoginClick"
                >
                  Login or Connect Wallet
                </button>
              </div>
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>

    <Loader v-if="loading" />

    <!-- Template Selection Modal -->
    <DeployTemplateModal
      v-model:showModal="showTemplateModal"
      :templates="groupedTemplates || []"
      @select-template="selectTemplateFromModal"
    />

    <VaultModal />
  </div>
</template>

<script lang="ts" setup>
import {
  type Market,
  type JobDefinition,
  type CreateDeployment,
  type Deployment,
  DeploymentStrategy,
} from "@nosana/kit";
import { useToast } from "vue-toastification";
import { useWallet } from "@nosana/solana-vue";
import TopBar from "~/components/TopBar.vue";
import { useRouter, useRoute } from "vue-router";
import { useEstimatedCost } from "~/composables/useMarketPricing";
import type { Template } from "~/composables/useTemplates";
import Loader from "~/components/Loader.vue";
import ConfigurationModal from "~/components/Deploy/ConfigurationModal.vue";
import VaultModal from "~/components/Vault/Modal/VaultModal.vue";
import { parseCronExpression } from "~/utils/parseCronExpression";
import {
  MAX_TIMEOUT_HOURS,
  MIN_TIMEOUT_HOURS,
  MIN_INFINITE_TIMEOUT_HOURS,
} from "~/composables/useTimeoutConstants";
import { trackPixelEvent } from "~/utils/analytics";

// Setup composables
const { markets, getMarkets, loadingMarkets } = useMarkets();
const { templates, groupedTemplates, loadingTemplates } = useTemplates();
const { nosana } = useKit();
const router = useRouter();
const route = useRoute();
const toast = useToast();

const {
  isAuthenticated: superTokensAuth,
  isEmailVerified,
  userData,
  isBanned,
} = useSuperTokens();
const { connected, account } = useWallet();
const { openBuyCreditsModal } = useBuyCreditsModal();
const { openBothModal } = useLoginModal();
const {
  save: saveDraft,
  load: loadDraft,
  clear: clearDraft,
} = useCreateDeployDraft();

// Compatibility: create publicKey-like object from account
const publicKey = computed(() => {
  if (!account.value?.address) return null;
  return {
    toString: () => account.value!.address,
    toBase58: () => account.value!.address,
  };
});
const loading = ref(false);

// Initialize redirect composable for authentication flow
useRedirect();

// Global modal scroll lock
const { lockScroll, unlockScroll } = useModalScrollLock();

// State
const config = useRuntimeConfig();
// Show all markets on devnet, only premium on mainnet
const gpuTypeCheckbox = ref<string[]>(
  config.public.network === "devnet" ? ["PREMIUM", "COMMUNITY"] : ["PREMIUM"],
);
const activeFilter = ref(
  config.public.network === "devnet" ? "ALL" : "PREMIUM",
);
const selectedMarket = ref<Market | null>(null);
const selectedTemplate = ref<Template | null>(null);

const INFINITE_TIMEOUT = 6;
const DEFAULT_TIMEOUT = 1;
const timeout = ref(INFINITE_TIMEOUT);
const previousStrategyDefault = ref(INFINITE_TIMEOUT);
const isCreatingDeployment = ref(false);
const showSettingsModal = ref(false); // For priority fee settings (TopBar)
const skipAutoSelection = ref(false);
const isUpdatingFromJobDef = ref(false);
const isRestoringState = ref(false);
const isEditorCollapsed = ref(false);

// Generate funny random deployment name
const generateFunnyDeploymentName = (): string => {
  const adjectives = [
    "efficient",
    "reliable",
    "robust",
    "scalable",
    "secure",
    "optimized",
    "advanced",
    "modern",
    "intelligent",
    "adaptive",
    "dynamic",
    "flexible",
    "precise",
    "streamlined",
    "enhanced",
    "refined",
    "innovative",
    "strategic",
    "systematic",
    "methodical",
    "comprehensive",
    "integrated",
    "modular",
    "unified",
    "resilient",
    "durable",
    "stable",
    "consistent",
    "proven",
    "tested",
    "validated",
    "certified",
  ];

  const secondAdjectives = [
    "enterprise",
    "cloud",
    "distributed",
    "microservice",
    "containerized",
    "serverless",
    "edge",
    "hybrid",
    "realtime",
    "eventdriven",
    "apifirst",
    "datadriven",
    "aipowered",
    "mlenhanced",
    "highperformance",
    "lowlatency",
    "production",
    "staging",
    "development",
    "testing",
    "monitoring",
    "analytics",
    "security",
    "compliance",
    "global",
    "regional",
    "multizone",
    "faulttolerant",
    "autoscaling",
    "loadbalanced",
    "replicated",
    "backup",
  ];

  const nouns = [
    "banana",
    "penguin",
    "robot",
    "ninja",
    "wizard",
    "dragon",
    "unicorn",
    "panda",
    "koala",
    "otter",
    "sloth",
    "hedgehog",
    "raccoon",
    "squirrel",
    "hamster",
    "bunny",
    "puppy",
    "kitten",
    "duckling",
    "chick",
    "turtle",
    "frog",
    "butterfly",
    "bee",
    "donut",
    "pizza",
    "taco",
    "burger",
    "cookie",
    "cake",
    "icecream",
    "pancake",
  ];

  const randomAdjective1 =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomAdjective2 =
    secondAdjectives[Math.floor(Math.random() * secondAdjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${randomAdjective1}_${randomAdjective2}_${randomNoun}`;
};

// Deployment-specific state
const deploymentName = ref(generateFunnyDeploymentName());
const replicas = ref(1);
const strategy = ref<DeploymentStrategy>("INFINITE");
const schedule = ref("0 0 * * *"); // Default schedule
const preloadedDeployment = useState<Deployment | null>(
  "preloadedDeployment",
  () => null,
);

watch(
  strategy,
  (newStrategy) => {
    const newDefault =
      newStrategy === "INFINITE" ? INFINITE_TIMEOUT : DEFAULT_TIMEOUT;
    if (timeout.value === previousStrategyDefault.value) {
      timeout.value = newDefault;
    }
    previousStrategyDefault.value = newDefault;
  },
  { immediate: true },
);

// Balance and price state
const nosPrice = ref(0);

// Credit balance state - shared single source of truth (see useCreditBalance).
const {
  creditBalance,
  fetchBalance: refreshCreditBalance,
  reset: resetCreditBalance,
} = useCreditBalance();
const solPrice = ref(0);
const usdcPrice = ref(0);
const usdtPrice = ref(0);

// API data
const { data: stats } = await useAPI("/stats");
const { data: testgridMarkets } = await useAPI("/markets", {
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
    credentials: false,
    default: () => ({
      nosana: { usd: 0 },
      solana: { usd: 0 },
      "usd-coin": { usd: 0 },
      tether: { usd: 0 },
    }),
  },
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
  { immediate: true },
);

const computedDeploymentName = computed(() => {
  // Collect all Docker images from job definition
  const images = new Set<string>();

  if (jobDefinition.value?.ops) {
    jobDefinition.value.ops.forEach((op: any) => {
      if (op.args?.image) {
        images.add(op.args.image);
      }
    });
  }

  // If we have images, return them as a comma-separated list
  if (images.size > 0) {
    return Array.from(images).join(", ");
  }

  // Fallback to template name or job ID
  if (selectedTemplate.value && selectedTemplate.value.id !== "custom") {
    return selectedTemplate.value.name;
  }
  if (jobDefinition.value?.ops?.[0]?.id) {
    return jobDefinition.value.ops[0].id;
  }
  return "Custom Deployment";
});

const templateNames = computed(() => {
  const names = new Set<string>();
  (groupedTemplates.value || []).forEach((t: Template) => {
    if (t?.name) names.add(t.name);
  });
  (templates.value || []).forEach((t: Template) => {
    if (t?.name) names.add(t.name);
  });
  return names;
});

// Only auto update the name if it's empty or still equal to another template name
const isNameTemplateManaged = computed(() => {
  const name = deploymentName.value?.trim();
  return !name || templateNames.value.has(name);
});

const marketName = computed(() => {
  if (!selectedMarket.value) return null;
  return (
    testgridMarkets.value.find(
      (tgm: any) => tgm.address === selectedMarket.value?.address.toString(),
    )?.name || selectedMarket.value.address.toString()
  );
});

// Use centralized pricing system
const selectedMarketAddress = computed(
  () => selectedMarket.value?.address?.toString() || null,
);
const testgridMarketsRef = computed(() => testgridMarkets.value);

const { estimatedCost, formattedCost, formattedHourlyRate, usdPricePerHour } =
  useEstimatedCost(
    selectedMarketAddress,
    computed(() => timeout.value),
    testgridMarketsRef,
  );

// Legacy computed properties for backward compatibility
const hourlyPrice = computed(() => usdPricePerHour.value || 0);

const requiredNos = computed(() => {
  if (!selectedMarket.value) return 0;

  if (usdPricePerHour.value && nosPrice.value) {
    return (usdPricePerHour.value * replicas.value) / nosPrice.value;
  }

  return 0;
});

// Total NOS needed for the full configured runtime (timeout is in hours),
// mirroring the credit flow's costUSD = hourlyPrice * replicas * timeout.
const requiredNosTotal = computed(() => requiredNos.value * timeout.value);

// Check if user can post job based on authentication and credits
const canPostJob = computed(() => {
  if (superTokensAuth.value) {
    const costUSD = hourlyPrice.value * replicas.value * timeout.value || 0;
    return creditBalance.value >= costUSD;
  }
  return false;
});

// Wallet mode's equivalent of canPostJob: the shared vault must be able to
// afford the deployment. Vacuously true when no market is selected yet, same
// as the credit check (basicRequirements gates on selectedMarket separately).
const {
  balance: vaultBalance,
  ensureSharedVault,
  topup: topupVault,
} = useSharedVault();

const canAffordDeployment = computed(() => {
  if (!isWalletMode.value) return true;
  return vaultBalance.value.NOS >= requiredNosTotal.value;
});

// Authentication mode detection
const isWalletMode = computed(() => {
  return Boolean(connected.value && publicKey.value && !superTokensAuth.value);
});

const isCreditMode = computed(() => {
  return superTokensAuth.value;
});

const canCreateDeployment = computed(() => {
  const basicRequirements =
    !isBanned.value &&
    selectedMarket.value !== null &&
    jobDefinition.value !== null &&
    deploymentName.value.trim() !== "" &&
    replicas.value > 0 &&
    timeout.value > 0 &&
    !isCreatingDeployment.value;

  if (isCreditMode.value) {
    return basicRequirements && canPostJob.value;
  } else if (isWalletMode.value) {
    return basicRequirements && canAffordDeployment.value;
  }

  return false;
});

const activeFilterKey = computed(
  () => `${selectedTemplate?.value?.id || "default"}-${activeFilter.value}`,
);

const { onCreditRefresh } = useCreditRefresh();
onCreditRefresh(() => {
  if (superTokensAuth.value) {
    refreshCreditBalance();
  }
});

const createDeployment = async () => {
  if (!canCreateDeployment.value) return;
  if (isBanned.value) {
    toast.error("Your account is suspended and cannot create deployments.");
    return;
  }

  // Validate inputs
  if (!deploymentName.value.trim()) {
    toast.error("Deployment name is required");
    return;
  }
  if (replicas.value <= 0) {
    toast.error("Number of replicas must be greater than 0");
    return;
  }
  if (replicas.value > 100) {
    toast.error("Number of replicas cannot exceed 100");
    return;
  }
  const effectiveMinTimeout =
    strategy.value === DeploymentStrategy.INFINITE
      ? MIN_INFINITE_TIMEOUT_HOURS
      : MIN_TIMEOUT_HOURS;
  if (timeout.value < effectiveMinTimeout) {
    toast.error(
      `Timeout must be at least ${effectiveMinTimeout} hour${effectiveMinTimeout === 1 ? "" : "s"}`,
    );
    return;
  }
  if (timeout.value > MAX_TIMEOUT_HOURS) {
    toast.error(`Timeout cannot exceed ${MAX_TIMEOUT_HOURS} hours`);
    return;
  }
  if (!jobDefinition.value) {
    toast.error("Job definition is required");
    return;
  }

  loading.value = true;
  isCreatingDeployment.value = true;

  try {
    if (!isCreditMode.value && !isWalletMode.value) {
      throw new Error("Please connect wallet or sign in");
    }
    if (isCreditMode.value && isEmailVerified.value === false) {
      throw new Error("Please verify your email before creating a deployment");
    }
    if (!selectedMarket.value) {
      throw new Error("Please select a market");
    }
    const deployment = (await nosana.value.api.deployments.create({
      name: deploymentName.value.trim(),
      market: selectedMarket.value.address.toString(),
      replicas: replicas.value,
      timeout: Math.floor(timeout.value * 60),
      strategy: strategy.value,
      ...(strategy.value === DeploymentStrategy.SCHEDULED
        ? { schedule: schedule.value }
        : {}),
      // Start immediately server-side instead of a separate start() call.
      // Not yet in the vendored @nosana/types, hence the assertion.
      autostart: true,
      job_definition: jobDefinition.value,
    } as Parameters<
      typeof nosana.value.api.deployments.create
    >[0])) as Deployment;

    toast.success(`Successfully created deployment ${deployment.id}`);

    preloadedDeployment.value = deployment;

    trackEvent("workload_created", {
      user_id: userData.value?.generatedAddress,
      auth_method: userData.value?.loginMethod,
    });

    try {
      const { total_items } = await nosana.value.api.deployments.list({ limit: 10 });
      if (total_items === 1) {
        trackPixelEvent("workload_created", {
          user_id: userData.value?.generatedAddress,
        });
      }
    } catch (e) {
      console.warn("Error checking first-deployment status:", e);
    }

    clearDraft();

    router.push(`/deployments/${deployment.id}`);
  } catch (error: any) {
    console.error("Deployment creation error:", error);
    toast.error(
      `Error creating deployment: ${error.message || error.toString()}`,
    );
  } finally {
    isCreatingDeployment.value = false;
    loading.value = false;
  }
};

const enforceReplicasMax = () => {
  if (replicas.value > 100) {
    replicas.value = 100;
  }
  if (replicas.value < 1) {
    replicas.value = 1;
  }
};

const enforceTimeoutMin = () => {
  const numValue = parseFloat(timeout.value as any) || 0;
  if (numValue < MIN_TIMEOUT_HOURS) {
    toast.error(`Timeout must be at least ${MIN_TIMEOUT_HOURS} hours`);
  } else if (numValue > MAX_TIMEOUT_HOURS) {
    toast.error(`Timeout cannot exceed ${MAX_TIMEOUT_HOURS} hours`);
  }
};

const persistDraft = () => {
  saveDraft({
    selectedMarketAddress: selectedMarketAddress.value,
    selectedTemplate: selectedTemplate.value,
    jobDefinition: jobDefinition.value,
    deploymentName: deploymentName.value,
    replicas: replicas.value,
    timeout: timeout.value,
    strategy: strategy.value,
    schedule: schedule.value,
    gpuTypeCheckbox: gpuTypeCheckbox.value,
    activeFilter: activeFilter.value,
  });
};

const restoreDraftIfNeeded = () => {
  const draft = loadDraft();
  if (!draft) return;

  // An explicit ?template= deep link always wins over a stale draft
  const hasTemplateQuery = Boolean(route.query.template);

  isRestoringState.value = true;
  skipAutoSelection.value = true;
  try {
    if (!hasTemplateQuery) {
      if (draft.jobDefinition) jobDefinition.value = draft.jobDefinition;
      if (draft.selectedTemplate)
        selectedTemplate.value = draft.selectedTemplate;
    }
    if (draft.deploymentName) deploymentName.value = draft.deploymentName;
    if (typeof draft.replicas === "number") replicas.value = draft.replicas;
    if (typeof draft.timeout === "number") timeout.value = draft.timeout;
    if (draft.strategy) strategy.value = draft.strategy as DeploymentStrategy;
    if (draft.schedule) schedule.value = draft.schedule;
    if (Array.isArray(draft.gpuTypeCheckbox))
      gpuTypeCheckbox.value = draft.gpuTypeCheckbox;
    if (draft.activeFilter) activeFilter.value = draft.activeFilter;

    if (draft.selectedMarketAddress && markets.value) {
      const match = markets.value.find(
        (m: Market) => m.address?.toString() === draft.selectedMarketAddress,
      );
      if (match) selectedMarket.value = match;
    }
  } finally {
    nextTick(() => {
      isRestoringState.value = false;
    });
  }
};

const handleLoginClick = () => {
  persistDraft();
  openBothModal(route.fullPath);
};

// Navigate to account page
const goToClaimCredits = () => {
  navigateTo("/account");
};

// Template selection handling
watch(
  () => selectedTemplate.value,
  (newTemplate) => {
    if (isUpdatingFromJobDef.value) return;

    if (newTemplate?.jobDefinition) {
      isUpdatingFromJobDef.value = true;
      jobDefinition.value = JSON.parse(
        JSON.stringify(newTemplate.jobDefinition),
      );
      nextTick(() => {
        isUpdatingFromJobDef.value = false;
      });
    }

    // set deployment name to selected template name if user hasn't customized
    if (newTemplate?.name && isNameTemplateManaged.value) {
      deploymentName.value = newTemplate.name;
    }
  },
  { deep: true },
);

// State for modals
const showTemplateModal = ref(false);

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
            t.id !== "custom",
        );

        if (templateMatchingJobDef) {
          selectedTemplate.value = templateMatchingJobDef as Template;
        }
      }
    }
  },
  { deep: true },
);

// Auto-select template from URL query param or fall back to PyTorch
watch(
  () => groupedTemplates.value,
  (newTemplates) => {
    if (
      Array.isArray(newTemplates) &&
      newTemplates.length > 0 &&
      !selectedTemplate.value &&
      !isRestoringState.value
    ) {
      const templateQuery = route.query.template as string | undefined;

      if (templateQuery) {
        // Direct match on parent template ID or name
        const directMatch = newTemplates.find(
          (t: any) =>
            String(t.id) === templateQuery ||
            t.name?.toLowerCase() === templateQuery.toLowerCase(),
        );
        if (directMatch?.jobDefinition) {
          // Deep link: select the template and land straight on the
          // configured page — don't pop the README modal.
          selectedTemplate.value = directMatch as Template;
          jobDefinition.value = directMatch.jobDefinition;
          return;
        }

        // Variant match: check inside each parent's variants array.
        // The URL stores either the variant's full `id` or the compound
        // `${parentId}-${variantId}` that selectTemplateVariant emits.
        for (const t of newTemplates as any[]) {
          if (!t.variants?.length) continue;
          const variant = t.variants.find(
            (v: any) =>
              String(v.id) === templateQuery ||
              `${t.id}-${v.variant_id}` === templateQuery ||
              v.variant_id === templateQuery,
          );
          if (variant?.jobDefinition) {
            const variantTemplate: Template = {
              ...t,
              id: variant.id ?? `${t.id}-${variant.variant_id}`,
              name: `${t.name} - ${variant.name}`,
              description: variant.description,
              jobDefinition: variant.jobDefinition,
              selectedVariant: variant,
            };
            // Deep link: select the variant and land straight on the
            // configured page — don't pop the README modal.
            selectedTemplate.value = variantTemplate;
            jobDefinition.value = variant.jobDefinition;
            return;
          }
        }
      }

      const pytorchTemplate = newTemplates.find((template: any) =>
        template.jobDefinition?.ops?.[0]?.args?.image?.includes(
          "nosana/pytorch-jupyter",
        ),
      );

      if (pytorchTemplate && pytorchTemplate.jobDefinition) {
        selectedTemplate.value = pytorchTemplate as Template;
        jobDefinition.value = pytorchTemplate.jobDefinition;
      }
    }
  },
  { immediate: true },
);

// Update GPU type when market changes
watch(
  () => selectedMarket.value,
  (newMarket) => {
    if (newMarket && testgridMarkets.value && activeFilter.value !== "ALL") {
      const marketInfo = testgridMarkets.value.find(
        (tgm: any) => tgm.address === newMarket.address.toString(),
      );
      if (marketInfo && marketInfo.type) {
        gpuTypeCheckbox.value = [marketInfo.type];
        activeFilter.value = marketInfo.type;
      }
    }
  },
);

// Mounted hook
onMounted(async () => {
  if (!markets.value && !loadingMarkets.value) {
    await getMarkets();
  }

  // Restore a persisted draft
  restoreDraftIfNeeded();

  // Load credit balance if authenticated
  if (isCreditMode.value) {
    await refreshCreditBalance();
  }

  trackEvent("workload_create_start", {
    user_id: userData.value?.generatedAddress,
    auth_method: userData.value?.loginMethod,
  });
});

// React to auth changes to keep credit balance fresh
watch(
  superTokensAuth,
  async () => {
    if (isCreditMode.value) {
      await refreshCreditBalance();
    } else {
      resetCreditBalance();
    }
  },
  { immediate: true },
);

// React to wallet connection to keep the shared vault balance fresh, so the
// affordability check reflects the current balance as soon as it's known.
watch(
  isWalletMode,
  () => {
    if (isWalletMode.value) {
      ensureSharedVault();
    }
  },
  { immediate: true },
);

// No swap modal in API mode

// Template selection handler
const selectTemplateFromModal = (template: Template) => {
  selectedTemplate.value = template;
  showTemplateModal.value = false;
  router.replace({ query: { ...route.query, template: String(template.id) } });
};

// Watch for template modal state to control body scroll
watch(showTemplateModal, (isOpen) => {
  if (isOpen) {
    lockScroll("template-modal");
  } else {
    unlockScroll("template-modal");
  }
});

</script>

<style lang="scss" scoped>
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
}

.dark-mode {
  .box {
    border-color: $grey-darker !important;
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

.dark-mode .notification {
  background-color: #2f2f2f;
}
</style>
