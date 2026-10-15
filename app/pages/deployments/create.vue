<template>
  <div>

    <!-- Show loader for external data only; editor always visible -->
    <Loader v-if="loadingTemplates" />

    <!-- The template picker -->
    <DeployWorkloadStep
      v-else-if="!onWorkloadPage"
      :templates="groupedTemplates || []"
      :recent-deployments="recentDeployments"
      :markets="testgridMarkets"
      :loading-recent="loadingRecent"
      :can-clone="hasAnyAuth"
      @select-template="selectTemplateFromModal"
      @deploy-template="selectTemplateFromModal"
      @configure-own="configureOwnJob"
      @clone="(deployment) => cloneDeployment(deployment)"
      @browse-deployments="showCloneModal = true"
    />

    <!-- A template link before the templates load, or an unknown one -->
    <Loader
      v-else-if="route.query.template && !selectedTemplate && loadingGroupedTemplates"
    />
    <p v-else-if="route.query.template && !selectedTemplate" class="template-missing">
      That template could not be found.
      <button type="button" @click="goToPicker()">Browse templates</button>
    </p>

    <!-- A workload's page: its hero, the configurator and the summary -->
    <DeployTemplateStep
      v-else
      :template="selectedTemplate"
      :job-definition="jobDefinition"
      :listings="gpuListings"
      :required-vram-gb="requiredVramGb"
      :gpus="selectedGpuListings"
      :requirements="requirementChips"
      :qualifying="advancedMatching?.qualifying ?? null"
      :runs="runsSummary"
      :changes="setupChanges"
      :hourly-cost="hourlyCost"
      v-model:deployment-name="deploymentName"
      :deploy-label="deployAction.label"
      :deploy-disabled="deployAction.disabled"
      :deploy-note="deployNote"
      :deploy-notice="deployNotice"
      :show-claim="showClaim"
      @select-variant="selectVariant"
      @edit-job="(mode) => editor?.open(mode)"
      @reset="resetToRecommended"
      @deploy="deployAction.run()"
      @claim="goToClaimCredits"
      @back="goToPicker()"
    >
      <template #job>
        <DeployJobDefinitionBuilder
          :model-value="jobDefinition"
          @update:model-value="setJobDefinition"
        />
      </template>
      <template #compute>
        <DeployRequirementsSelection
          v-model="selectedGpus"
          v-model:requirements="advancedRequirements"
          :markets="testgridMarkets"
          :recommended-gpu="
            selectedTemplate ? (recommendedGpu?.name ?? null) : null
          "
          :required-vram-gb="requiredVramGb"
          @matching="advancedMatching = $event"
        />
      </template>
      <template #settings>
        <DeploySettingsStep
          v-model:replicas="replicas"
          v-model:timeout="timeout"
          v-model:strategy="strategy"
          v-model:schedule="schedule"
          v-model:ssh-public-keys="sshPublicKeys"
          :hide-simple-extend="isSpareCapacityOnly"
          @ssh-error="sshError = $event"
        />
      </template>
    </DeployTemplateStep>

    <Loader v-if="loading" />

    <!-- Clone an existing deployment into this form -->
    <!-- "All deployments" on the workload step; cloning lands on compute. -->
    <CloneDeploymentModal
      v-model:showModal="showCloneModal"
      @select="cloneDeployment"
    />

    <!-- Job definition editor, opened from the hero or by "configure your own" -->
    <DeployJobDefinitionEditorModal ref="editor" v-model="jobDefinition" />

    <VaultModal />
  </div>
</template>

<script lang="ts" setup>
import {
  type JobDefinition,
  type CreateDeployment,
  type Deployment,
  DeploymentStrategy,
  getSshPublicKeys,
  withSshPublicKeys,
} from "@nosana/kit";
import { useToast } from "vue-toastification";
import { useWallet } from "@nosana/solana-vue";
import { useRouter, useRoute } from "vue-router";
import {
  requiredVramMb,
  withVariant,
  type Template,
  type TemplateVariant,
} from "~/composables/useTemplates";
import type { ListedDeployment } from "~/composables/useDeploymentSelection";
import Loader from "~/components/Loader.vue";
import CloneDeploymentModal from "~/components/Deploy/CloneDeploymentModal.vue";
import VaultModal from "~/components/Vault/Modal/VaultModal.vue";
import {
  MAX_TIMEOUT_HOURS,
  MIN_TIMEOUT_HOURS,
  MIN_INFINITE_TIMEOUT_HOURS,
} from "~/composables/useTimeoutConstants";
import { trackPixelEvent } from "~/utils/analytics";
import {
  formatPriceRange,
  gpuFitsVram,
  gpusInMarket,
  gpusOf,
  keepCategorizedRequirements,
  listingsOf,
  listRequirementChips,
  priceOfGpus,
  recommendGpu,
  useGpuListings,
  withGpus,
  type MatchingHosts,
  type Requirements,
} from "~/composables/useNodeRequirements";

// Setup composables
const {
  templates,
  groupedTemplates,
  emptyJobDefinition,
  loadingTemplates,
  loadingGroupedTemplates,
} = useTemplates();
const { nosana } = useKit();
const router = useRouter();
const route = useRoute();
const toast = useToast();

// Two pages share this route: the template picker, and a workload's page.
// The address says which, so a reload and the browser's back button keep it:
// a template (?template=, which marketing links use too), a clone (?clone=)
// or your own image (?custom).
const WORKLOAD_KEYS = ["template", "clone", "custom"];
const onWorkloadPage = computed(() =>
  WORKLOAD_KEYS.some((key) => key in route.query),
);
// The picker and a workload's page share one hero. Moving between them runs
// the change inside a view transition, so the hero morphs in place and the
// body under it swaps (deploy-surface.scss); without support it just switches.
// Either way the new page starts at its top.
const changePage = async (
  toWorkload: boolean,
  change: () => Promise<unknown>,
) => {
  if (toWorkload === onWorkloadPage.value) return change();
  const apply = async () => {
    await change();
    await nextTick();
    window.scrollTo({ top: 0 });
  };
  if (typeof document.startViewTransition !== "function") return apply();
  return document.startViewTransition(apply).updateCallbackDone;
};
// Back to the picker: the address drops the workload, and a clone's name
// and market with it.
const goToPicker = () => {
  const { template, clone, custom, name, market, ...query } = route.query;
  return changePage(false, () => router.replace({ query }));
};
// Your own image, or a clone made on this page: a workload without a template.
const goToCustom = () => {
  const { template, clone, name, market, ...query } = route.query;
  return changePage(true, () =>
    router.replace({ query: { ...query, custom: null } }),
  );
};
const {
  isAuthenticated: superTokensAuth,
  isEmailVerified,
  userData,
  isBanned,
  isSpareCapacityOnly,
} = useSuperTokens();
const { connected, account } = useWallet();
const { openBuyCreditsModal } = useBuyCreditsModal();
const { openBothModal } = useLoginModal();
const {
  save: saveDraft,
  take: takeDraft,
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
// A cloned or restored deployment's GPUs, applied by the GPU default below
// once the catalogue resolves. One made before GPUs were requirements names
// its market instead: its GPUs are the ones that market serves.
const clonedGpus = ref<string[] | null>(null);
const clonedMarketAddress = ref<string | null>(null);
// The GPUs the deployment may run on: each job goes to the cheapest premium
// market with a host free that has one of them.
const selectedGpus = ref<string[]>([]);
// The host requirements beyond the GPUs, which narrow their hosts.
const advancedRequirements = ref<Requirements>({});
// The GPUs' hosts: every one, those free now, and those the requirements match.
const advancedMatching = ref<MatchingHosts | null>(null);
// The VRAM the job definition asks for, so the card can dim GPUs below it.
const requiredVramGb = computed(() => {
  const vramMb = requiredVramMb(jobDefinition.value);
  return vramMb === null ? null : Math.ceil(vramMb / 1024);
});
const selectedTemplate = ref<Template | null>(null);

const INFINITE_TIMEOUT = 6;
// How a deployment runs unless changed: the initial values, what the summary
// marks as changed, and what Reset puts back.
const RECOMMENDED_RUN: {
  replicas: number;
  strategy: DeploymentStrategy;
  timeout: number;
} = { replicas: 1, strategy: "INFINITE", timeout: INFINITE_TIMEOUT };
const DEFAULT_TIMEOUT = 1;
const timeout = ref(RECOMMENDED_RUN.timeout);
const previousStrategyDefault = ref(INFINITE_TIMEOUT);
const isCreatingDeployment = ref(false);
// Set while the form is filled from an existing deployment or your own
// definition, so the template fallback below never overwrites it.
const skipTemplateAutoSelection = ref(false);
const isUpdatingFromJobDef = ref(false);
const isRestoringState = ref(false);

// The timeout as hours, or minutes under an hour.
const durationLabel = computed(() => {
  const hours = timeout.value;
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  const rounded = Math.round(hours * 100) / 100;
  return `${rounded} ${rounded === 1 ? "hour" : "hours"}`;
});
const replicasLabel = computed(() =>
  replicas.value === 1 ? "1 replica" : `${replicas.value} replicas`,
);

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
const replicas = ref(RECOMMENDED_RUN.replicas);
const strategy = ref<DeploymentStrategy>(RECOMMENDED_RUN.strategy);
const schedule = ref("0 0 * * *"); // Default schedule
const preloadedDeployment = useState<Deployment | null>(
  "preloadedDeployment",
  () => null,
);

// Stateful (SIMPLE-EXTEND) has no duration field: each extension runs the
// infinite window, so the timeout is pinned to it whenever that is picked.
watch(
  strategy,
  (newStrategy) => {
    const pinned = newStrategy === "SIMPLE-EXTEND";
    const newDefault =
      newStrategy === "INFINITE" || pinned ? INFINITE_TIMEOUT : DEFAULT_TIMEOUT;
    if (pinned || timeout.value === previousStrategyDefault.value) {
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
// What the job still needs before it can deploy, as the deploy button's
// label: every operation an id, every container an image.
const jobBlocker = computed(() => {
  const ops = jobDefinition.value?.ops ?? [];
  if (ops.some((op) => !op.id.trim())) return "Name each operation to deploy";
  const imageless = ops.some(
    (op) =>
      op.type === "container/run" && !("image" in op.args && op.args.image),
  );
  return imageless ? "Add an image to deploy" : null;
});
const sshPublicKeys = ref<string[]>([]);
// Set by the SSH form while it cannot be used yet (e.g. private key not downloaded).
const sshError = ref("");

// One click: with nothing chosen yet the GPU defaults to the recommended one
// (a clone keeps its own GPUs), and a default that stops fitting the
// workload is replaced. GPUs the user picked stay.
const { listings: gpuListings } = useGpuListings(() => testgridMarkets.value);
// The chosen GPUs as the GPU list shows them, so the template page, which
// has no GPU list mounted, still knows the GPUs, their hosts and the price.
const selectedGpuListings = computed(() =>
  listingsOf(gpuListings.value, selectedGpus.value),
);
// What an hour on one replica costs: from the cheapest chosen GPU's cheapest
// market to the dearest one's dearest. Balances are checked at the top.
const selectedPrice = computed(() => priceOfGpus(selectedGpuListings.value));
const recommendedGpu = computed(() =>
  recommendGpu(gpuListings.value, requiredVramGb.value),
);
const defaultedGpu = ref<string | null>(null);
watch(
  [gpuListings, requiredVramGb, clonedGpus, clonedMarketAddress],
  () => {
    if (!gpuListings.value.length) return;
    // A clone's GPUs count as chosen: applied once the catalogue resolves,
    // then forgotten so a reset goes to the recommendation.
    const cloned = (
      clonedGpus.value ??
      (clonedMarketAddress.value
        ? gpusInMarket(gpuListings.value, clonedMarketAddress.value)
        : [])
    ).filter((name) =>
      gpuListings.value.some((listing) => listing.name === name),
    );
    clonedGpus.value = null;
    clonedMarketAddress.value = null;
    if (cloned.length) {
      defaultedGpu.value = null;
      selectedGpus.value = cloned;
      return;
    }
    const chosen = selectedGpus.value;
    const defaulted =
      !chosen.length ||
      (chosen.length === 1 && chosen[0] === defaultedGpu.value);
    const fits = selectedGpuListings.value.some((listing) =>
      gpuFitsVram(listing, requiredVramGb.value),
    );
    if (!defaulted && fits) return;
    const next = recommendedGpu.value;
    if (!next || (chosen.length === 1 && chosen[0] === next.name)) return;
    defaultedGpu.value = next.name;
    selectedGpus.value = [next.name];
  },
  { immediate: true },
);

// Deployment SSH keys are managed separately by the Deployment Manager. If a
// template or restored draft still contains the legacy job-definition field,
// move it into the deployment-level form state and keep the visible definition
// focused on the workload itself.
watch(
  jobDefinition,
  (definition) => {
    if (!definition) return;
    const embeddedKeys = getSshPublicKeys(definition);
    if (!embeddedKeys.length) return;

    sshPublicKeys.value = [...embeddedKeys];
    jobDefinition.value = withSshPublicKeys(definition, []);
  },
  { deep: true },
);

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

const spareCapacityError = computed(() => {
  if (!isSpareCapacityOnly.value) return null;
  if (strategy.value === DeploymentStrategy["SIMPLE-EXTEND"]) {
    return "Simple Extend is not available for spare capacity accounts.";
  }
  return null;
});

// The price balances are checked at: the dearest the chosen GPUs can cost,
// so a deployment never outruns its funds whichever GPU its jobs land on.
const hourlyPrice = computed(() => selectedPrice.value?.max ?? 0);

const requiredNos = computed(() => {
  if (!selectedGpus.value.length) return 0;

  if (hourlyPrice.value && nosPrice.value) {
    return (hourlyPrice.value * replicas.value) / nosPrice.value;
  }

  return 0;
});

// Total NOS needed for the full configured runtime (timeout is in hours),
// mirroring the credit flow's costUSD = hourlyPrice * replicas * timeout.
const requiredNosTotal = computed(() => requiredNos.value * timeout.value);

// What the configured runtime costs in credits: every replica for the timeout.
const creditCostUsd = computed(
  () => hourlyPrice.value * replicas.value * timeout.value || 0,
);

// Check if user can post job based on authentication and credits
const canPostJob = computed(() => {
  if (superTokensAuth.value) {
    return creditBalance.value >= creditCostUsd.value;
  }
  return false;
});

// Wallet mode's equivalent of canPostJob: the shared vault must be able to
// afford the deployment. Vacuously true when no GPU is selected yet, same
// as the credit check (basicRequirements gates on the GPUs separately).
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

// Cloning lists the signed-in user's own deployments, so it needs either mode.
const hasAnyAuth = computed(() => isCreditMode.value || isWalletMode.value);

const canCreateDeployment = computed(() => {
  const basicRequirements =
    !isBanned.value &&
    selectedGpus.value.length > 0 &&
    jobDefinition.value !== null &&
    !jobBlocker.value &&
    deploymentName.value.trim() !== "" &&
    replicas.value > 0 &&
    timeout.value > 0 &&
    !spareCapacityError.value &&
    !isCreatingDeployment.value;

  if (isCreditMode.value) {
    return basicRequirements && canPostJob.value;
  } else if (isWalletMode.value) {
    return basicRequirements && canAffordDeployment.value;
  }

  return false;
});

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
  if (sshError.value) {
    toast.error(sshError.value);
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
    if (!selectedGpus.value.length) {
      throw new Error("Please select a GPU");
    }
    // No market: host-manager posts each job to the cheapest premium market
    // with a host that has one of the GPUs and meets the requirements.
    const deployment = (await nosana.value.api.deployments.create({
      name: deploymentName.value.trim(),
      replicas: replicas.value,
      timeout: Math.floor(timeout.value * 60),
      strategy: strategy.value,
      ...(strategy.value === DeploymentStrategy.SCHEDULED
        ? { schedule: schedule.value }
        : {}),
      requirements: withGpus(advancedRequirements.value, selectedGpus.value),
      // Start immediately server-side instead of a separate start() call.
      autostart: true,
      ssh_public_keys: sshPublicKeys.value,
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
      const { total_items } = await nosana.value.api.deployments.list({
        limit: 10,
      });
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
    selectedGpus: selectedGpus.value,
    selectedTemplate: selectedTemplate.value,
    jobDefinition: jobDefinition.value,
    deploymentName: deploymentName.value,
    replicas: replicas.value,
    timeout: timeout.value,
    strategy: strategy.value,
    schedule: schedule.value,
    sshPublicKeys: sshPublicKeys.value,
    advancedRequirements: advancedRequirements.value,
  });
};

const restoreDraftIfNeeded = () => {
  const draft = takeDraft();
  if (!draft) return;

  // An explicit ?template= deep link always wins over a stale draft
  const hasTemplateQuery = Boolean(route.query.template);

  isRestoringState.value = true;
  try {
    if (!hasTemplateQuery) {
      if (draft.selectedTemplate)
        selectedTemplate.value = draft.selectedTemplate;
      if (draft.jobDefinition) {
        jobDefinition.value = draft.jobDefinition;
        // Back from logging in: the workload's page, with the template in
        // the address so a reload lands back on it.
        if (draft.selectedTemplate) applyTemplate(draft.selectedTemplate);
        else goToCustom();
      }
    }
    if (draft.deploymentName) deploymentName.value = draft.deploymentName;
    if (typeof draft.replicas === "number") replicas.value = draft.replicas;
    if (typeof draft.timeout === "number") timeout.value = draft.timeout;
    if (draft.strategy) strategy.value = draft.strategy as DeploymentStrategy;
    if (draft.schedule) schedule.value = draft.schedule;
    if (Array.isArray(draft.sshPublicKeys)) {
      sshPublicKeys.value = draft.sshPublicKeys;
    }

    if (draft.selectedGpus?.length) {
      clonedGpus.value = draft.selectedGpus;
    } else if (draft.selectedMarketAddress) {
      clonedMarketAddress.value = draft.selectedMarketAddress;
    }
    if (draft.advancedRequirements) {
      advancedRequirements.value = keepCategorizedRequirements(
        draft.advancedRequirements,
      );
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

// What the deployment costs an hour: every replica, from the cheapest
// chosen GPU's price to the dearest's.
const hourlyCost = computed(() =>
  formatPriceRange(selectedPrice.value ?? { min: 0, max: 0 }, replicas.value),
);
const STRATEGY_NAMES: Record<DeploymentStrategy, string> = {
  SIMPLE: "Run once",
  "SIMPLE-EXTEND": "Stateful",
  SCHEDULED: "Scheduled",
  INFINITE: "Stateless",
};
// "6-hour rotation", "extends every 6 hours", "2 hours per run".
const strategyWindow = computed(() => {
  const hourly = Number.isInteger(timeout.value)
    ? `${timeout.value}-hour`
    : durationLabel.value;
  if (strategy.value === "INFINITE") return `${hourly} rotation`;
  if (strategy.value === "SIMPLE-EXTEND")
    return `extends every ${durationLabel.value}`;
  if (strategy.value === "SCHEDULED") return `${durationLabel.value} per run`;
  return `runs ${durationLabel.value}`;
});
// "1 replica · Stateless · 6-hour rotation": how it runs, for the summary.
const runsSummary = computed(
  () =>
    `${replicasLabel.value} · ${STRATEGY_NAMES[strategy.value]} · ${strategyWindow.value}`,
);
// The one-click button on the template page: what it does depends on who is
// deploying and whether their balance covers it.
const deployAction = computed(() => {
  const idle = () => {};
  if (!hasAnyAuth.value)
    return { label: "Log in to deploy", disabled: false, run: handleLoginClick };
  if (isBanned.value) return { label: "Deploy now", disabled: true, run: idle };
  if (jobBlocker.value)
    return { label: jobBlocker.value, disabled: true, run: idle };
  if (!selectedGpus.value.length)
    return {
      label: gpuListings.value.length ? "Choose a GPU" : "Finding a GPU…",
      disabled: true,
      run: idle,
    };
  if (isCreditMode.value && !canPostJob.value)
    return {
      label: "Buy credits to deploy",
      disabled: isSpareCapacityOnly.value,
      run: () => openBuyCreditsModal(),
    };
  if (isWalletMode.value && !canAffordDeployment.value)
    return { label: "Top up vault to deploy", disabled: false, run: () => topupVault() };
  if (isCreatingDeployment.value)
    return { label: "Creating…", disabled: true, run: idle };
  return {
    label: "Deploy now",
    disabled: !canCreateDeployment.value,
    run: createDeployment,
  };
});

// What differs from the recommended setup, marked in the summary: the
// recommended GPU alone, no host requirements, one stateless replica.
const setupChanges = computed(() => ({
  gpu:
    Boolean(selectedGpus.value.length && recommendedGpu.value) &&
    (selectedGpus.value.length !== 1 ||
      selectedGpus.value[0] !== recommendedGpu.value?.name),
  runs:
    replicas.value !== RECOMMENDED_RUN.replicas ||
    strategy.value !== RECOMMENDED_RUN.strategy ||
    timeout.value !== RECOMMENDED_RUN.timeout,
}));
// Back to all of it, so Deploy now is the one click again.
const resetToRecommended = () => {
  const recommended = recommendedGpu.value?.name ?? null;
  defaultedGpu.value = recommended;
  selectedGpus.value = recommended ? [recommended] : [];
  advancedRequirements.value = {};
  replicas.value = RECOMMENDED_RUN.replicas;
  strategy.value = RECOMMENDED_RUN.strategy;
  timeout.value = RECOMMENDED_RUN.timeout;
};
// The requirements beyond the GPU, as the summary's chips.
const requirementChips = computed(() =>
  listRequirementChips(advancedRequirements.value),
);
const isShort = computed(
  () =>
    selectedGpus.value.length > 0 &&
    ((isCreditMode.value && !canPostJob.value) ||
      (isWalletMode.value && !canAffordDeployment.value)),
);
// Under the deploy button when the balance falls short: by how much.
const deployNote = computed(() => {
  if (!isShort.value) return "";
  if (isCreditMode.value) {
    return `You need $${creditCostUsd.value.toFixed(2)} and have $${creditBalance.value.toFixed(2)}.`;
  }
  return `You need ${requiredNosTotal.value.toFixed(3)} NOS and have ${vaultBalance.value.NOS.toFixed(3)} NOS.`;
});
const showClaim = computed(() => isShort.value && isCreditMode.value);
// Account and capacity problems, above the deploy button.
const deployNotice = computed(() => {
  if (isBanned.value)
    return "Your account is suspended. Creating deployments and topping up funds are disabled.";
  if (spareCapacityError.value) return spareCapacityError.value;
  return "";
});

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

// A ?template= link selects that template (or variant) once they load.
watch(
  () => groupedTemplates.value,
  (newTemplates) => {
    if (
      Array.isArray(newTemplates) &&
      newTemplates.length > 0 &&
      !selectedTemplate.value &&
      !isRestoringState.value &&
      !skipTemplateAutoSelection.value
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
    }
  },
  { immediate: true },
);

// The workload step offers the three most recent deployments to clone; the
// list is the signed-in user's own, so it needs either auth mode.
const recentDeployments = ref<ListedDeployment[]>([]);
const loadingRecent = ref(false);
const loadRecentDeployments = async () => {
  if (!hasAnyAuth.value) {
    recentDeployments.value = [];
    return;
  }
  loadingRecent.value = true;
  try {
    // The workload step offers the latest two as clone shortcuts; the
    // smallest page the API serves is 10.
    const { deployments } = await nosana.value.api.deployments.list({
      limit: 10,
    });
    recentDeployments.value = (deployments || []).slice(0, 2);
  } catch (error) {
    console.error("Error loading recent deployments:", error);
    recentDeployments.value = [];
  } finally {
    loadingRecent.value = false;
  }
};
onMounted(loadRecentDeployments);
watch(hasAnyAuth, loadRecentDeployments);

// Mounted hook
onMounted(async () => {
  // A ?clone= link fills the form from an existing deployment and wins over
  // any stale draft, the same way an explicit ?template= link does.
  const cloneQuery = route.query.clone?.toString();
  if (cloneQuery) {
    await cloneDeployment(
      { id: cloneQuery },
      {
        name: route.query.name?.toString(),
        market: route.query.market?.toString(),
      },
    );
  } else {
    // Restore a persisted draft
    restoreDraftIfNeeded();
  }
  // Your own image, reloaded without a draft: start from an empty job.
  if ("custom" in route.query && !jobDefinition.value) {
    skipTemplateAutoSelection.value = true;
    jobDefinition.value = JSON.parse(JSON.stringify(emptyJobDefinition));
  }

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

// A template's page. Picking a template abandons any clone or own image, so
// their params go too.
const applyTemplate = (template: Template) => {
  const { clone, custom, name, market, ...query } = route.query;
  return changePage(true, () => {
    selectedTemplate.value = template;
    return router.replace({
      query: { ...query, template: String(template.id) },
    });
  });
};
// A gallery tile and the featured card's Use template both open it.
const selectTemplateFromModal = (template: Template) =>
  applyTemplate(template);

// A variant picked in the header: the selected template holds the parent
// spread with the first variant flattened in, so rebuild from the parent.
const selectVariant = (variant: TemplateVariant) => {
  const parent = (groupedTemplates.value || []).find((t: Template) =>
    t.variants?.some((candidate) => candidate.id === variant.id),
  );
  if (!parent) return;
  applyTemplate(withVariant(parent, variant));
};

// Bring your own image: its page, with an empty definition to fill in.
const editor = ref<{ open: (mode?: "builder" | "json") => void } | null>(
  null,
);
const configureOwnJob = async () => {
  skipTemplateAutoSelection.value = true;
  selectedTemplate.value = null;
  jobDefinition.value = JSON.parse(JSON.stringify(emptyJobDefinition));
  await goToCustom();
};
// The builder on the page edits the job live; it only hands back a string
// while JSON is invalid, which it never does itself.
const setJobDefinition = (value: JobDefinition | string | null) => {
  if (typeof value !== "string") jobDefinition.value = value;
};

// Clone an existing deployment: pull its configuration into this form so it
// can be tweaked and deployed as a new one. Nothing is created here.
const showCloneModal = ref(false);
const { getIpfs } = useIpfs();

watch(showCloneModal, (isOpen) => {
  if (isOpen) {
    lockScroll("clone-deployment-modal");
  } else {
    unlockScroll("clone-deployment-modal");
  }
});

// The active revision holds the job definition; older deployments only carry
// the IPFS hash, same fallback the deployment detail page uses.
const loadClonedJobDefinition = async (
  deployment: any,
): Promise<JobDefinition | null> => {
  try {
    const { revisions } = await deployment.getRevisions();
    const active =
      revisions?.find((r: any) => r.revision === deployment.active_revision) ||
      revisions?.[revisions.length - 1];
    if (active?.job_definition) return active.job_definition as JobDefinition;
  } catch (error) {
    console.error("Error loading revisions to clone:", error);
  }

  const ipfsHash = deployment?.ipfs_definition_hash;
  if (!ipfsHash) return null;
  try {
    return (await getIpfs(ipfsHash)) as JobDefinition;
  } catch (error) {
    console.error("Error loading job definition to clone:", error);
    return null;
  }
};

const cloneDeployment = async (
  listed: { id: string; name?: string },
  overrides: { name?: string; market?: string } = {},
) => {
  loading.value = true;
  // A clone brings its own job definition, so never fall back to a template.
  skipTemplateAutoSelection.value = true;
  try {
    const deployment: any = await nosana.value.api.deployments.get(listed.id);
    const definition = await loadClonedJobDefinition(deployment);
    if (!definition) {
      throw new Error("This deployment has no job definition to clone");
    }

    // SSH keys are managed per deployment, so the copy starts without them.
    jobDefinition.value = withSshPublicKeys(definition, []);
    sshPublicKeys.value = [];
    deploymentName.value =
      overrides.name ||
      `${deployment.name || listed.name || "Deployment"} (copy)`;
    if (deployment.replicas) replicas.value = deployment.replicas;
    if (deployment.strategy) strategy.value = deployment.strategy;
    if (deployment.schedule) schedule.value = deployment.schedule;

    // Changing the strategy re-applies its default timeout, so wait for that
    // before restoring the clone's own timeout (stored in minutes, shown in hours).
    await nextTick();
    if (deployment.timeout) timeout.value = deployment.timeout / 60;

    // Its GPUs; one made before GPUs were requirements (or a ?market= link)
    // names a market, whose GPUs it gets.
    const gpus = gpusOf(deployment.requirements);
    const marketAddress = overrides.market || deployment.market;
    if (!overrides.market && gpus.length) clonedGpus.value = gpus;
    else if (marketAddress) clonedMarketAddress.value = String(marketAddress);

    toast.success(`Cloned configuration from ${deployment.name || listed.id}`);
    // A ?clone= link already names its page; a clone made here gets ?custom.
    if (!route.query.clone) goToCustom();
  } catch (error: any) {
    console.error("Clone deployment error:", error);
    toast.error(
      `Error cloning deployment: ${error.message || error.toString()}`,
    );
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
// An unknown template link: one line and a way back to the gallery.
.template-missing {
  padding: 3rem 0;
  text-align: center;
  color: $text-muted;

  button {
    padding: 0;
    border: 0;
    background: transparent;
    color: $secondary-text;
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
  }
}

html.dark-mode .template-missing button {
  color: $secondary;
}

@media screen and (max-width: 768px) {
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
