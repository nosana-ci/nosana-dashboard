<template>
  <div>
    <TopBar
      :title="'Create Deployment'"
      :subtitle="'Configure and manage multiple job instances'"
      ref="topBar"
      :hide-buttons="false"
      v-model="showSettingsModal"
    ></TopBar>

    <!-- Wallet Auth Banner -->
    <div
      v-if="shouldShowWalletAuthBanner"
      class="notification is-light wallet-auth-banner mb-5 clickable-notification"
    >
      <nuxt-link
        to="/deploy"
        class="is-block"
        style="color: inherit; text-decoration: none;"
      >
        <div class="is-flex is-align-items-center">
          <div class="is-flex-grow-1">
            <p class="banner-title">Legacy Job Deploy page</p>
            <p class="mb-0">
              Looking for the classic job deployment experience? Use our legacy
              deploy page click here.
            </p>
          </div>
        </div>
      </nuxt-link>
    </div>

    <!-- Show loader for external data only; editor always visible -->
    <Loader v-if="loadingTemplates || loadingMarkets" />

    <div v-else class="columns is-multiline">
      <div class="column is-9-fullhd is-12">
        <!-- Name your deployment -->
        <div class="box" style="border: none">
          <h2 class="title is-5 mb-4">Define your deployment</h2>
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
          title="Configure deployment"
          :selectedTemplate="selectedTemplate"
          v-model:jobDefinition="jobDefinition"
          v-model:isEditorCollapsed="isEditorCollapsed"
          :validator="validator"
          @showTemplateModal="showTemplateModal = true"
          @openReadme="openReadmeModal"
        />

        <!-- Select GPU -->
        <div class="box" style="border: none; margin-top: 1.5rem">
          <h2 class="title is-5 mb-4">Select instance</h2>
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
              <p
                class="has-text-grey is-size-7 mb-2"
                style="
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  font-weight: 500;
                "
              >
                Cost
              </p>

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
                <p class="has-text-grey">
                  Connect wallet or sign in to see pricing
                </p>
              </div>
            </div>

            <hr style="margin: 1.5rem 0" />

            <!-- Configuration Summary -->
            <div class="mb-4">
              <p
                class="has-text-grey is-size-7 mb-3"
                style="
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  font-weight: 500;
                "
              >
                Configuration
              </p>

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
              >
                <span class="has-text-grey is-size-7">Strategy</span>
                <span
                  class="has-text-weight-medium is-size-7"
                  style="
                    text-align: right;
                    max-width: 60%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ strategy }}
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
                <span
                  class="has-text-weight-medium is-size-7 is-family-monospace"
                  style="
                    text-align: right;
                    max-width: 60%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ schedule || "-" }}
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

              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: start;
                "
              >
                <span class="has-text-grey is-size-7">Timeout (hours)</span>
                <span
                  class="has-text-weight-medium is-size-7"
                  style="
                    text-align: right;
                    max-width: 60%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ timeout }}
                </span>
              </div>
              <div
                v-if="isWalletMode"
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: start;
                "
              >
                <span class="has-text-grey is-size-7">Vault</span>
                <span
                  class="has-text-weight-medium is-size-7"
                  style="
                    text-align: right;
                    max-width: 60%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ modalSelectedVault || "Create new vault" }}
                </span>
              </div>
            </div>

            <hr style="margin: 1.5rem 0" />

            <!-- Advanced Settings Button -->
            <button
              class="button is-light is-fullwidth mb-4"
              @click="showDeploymentSettingsModal = true"
              style="border: 1px solid #e8eaed"
            >
              <span class="icon is-small">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span>Advanced Deployment Settings</span>
            </button>

            <ClientOnly>
              <!-- Credit Mode Actions -->
              <div v-if="isCreditMode">
                <button
                  class="button is-secondary is-fullwidth"
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
                    class="button is-small is-outlined is-fullwidth"
                    @click="goToClaimCredits"
                  >
                    Claim Credit Codes
                  </button>
                </div>
              </div>

              <!-- Wallet Mode Actions -->
              <div v-else-if="isWalletMode">
                <button
                  class="button is-secondary is-fullwidth"
                  :disabled="!canCreateDeployment"
                  @click="createDeployment"
                >
                  <span v-if="isCreatingDeployment">Creating...</span>
                  <span v-else>Create Deployment</span>
                </button>
              </div>

              <!-- No Authentication Actions -->
              <div v-else>
                <button
                  class="button is-secondary is-fullwidth"
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
      <div
        class="modal-background"
        @click="showDeploymentSettingsModal = false"
      ></div>
      <div class="modal-card" style="max-width: 500px">
        <header class="modal-card-head">
          <p class="modal-card-title">Advanced Deployment Settings</p>
          <button
            class="delete"
            aria-label="close"
            @click="showDeploymentSettingsModal = false"
          ></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">
              Deployment Strategy
              <span
                class="icon is-small has-tooltip-arrow has-tooltip-right"
                style="position: relative; z-index: 3000"
                data-tooltip="How your deployment manages job instances"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10" stroke-width="2" />
                  <path
                    d="M12 16v-4m0-4h.01"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
            </label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="strategy">
                  <option value="SIMPLE">Simple</option>
                  <option value="SIMPLE-EXTEND">Simple Extend</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <!-- <option value="INFINITE">Infinite</option> -->
                </select>
              </div>
            </div>
          </div>

          <div v-if="strategy === 'SCHEDULED'" class="field">
            <label class="label">
              Schedule
              <span
                class="icon is-small has-tooltip-arrow has-tooltip-right"
                style="position: relative; z-index: 3000"
                data-tooltip="Cron expression for scheduling jobs"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10" stroke-width="2" />
                  <path
                    d="M12 16v-4m0-4h.01"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
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
          </div>

          <div class="field">
            <label class="label">
              Replica Count
              <span
                class="icon is-small has-tooltip-arrow has-tooltip-right"
                style="position: relative; z-index: 3000"
                data-tooltip="Number of parallel job instances (1-100)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10" stroke-width="2" />
                  <path
                    d="M12 16v-4m0-4h.01"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
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
                @blur="enforceReplicasMax"
              />
            </div>
          </div>

          <div class="field">
            <label class="label">
              Container Timeout
              <span
                class="icon is-small has-tooltip-arrow has-tooltip-right"
                style="position: relative; z-index: 3000"
                data-tooltip="Maximum runtime before container auto-shutdown (minimum 1 hour)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10" stroke-width="2" />
                  <path
                    d="M12 16v-4m0-4h.01"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
            </label>
            <div class="control">
              <input
                class="input"
                type="number"
                v-model="timeout"
                min="1"
                step="0.1"
                @blur="enforceTimeoutMin"
              />
            </div>
          </div>
          <VaultSelector
            v-if="isWalletMode"
            :setSelectedVault="
              (vault: string | undefined) => (modalSelectedVault = vault)
            "
          />
        </section>
        <footer class="modal-card-foot" style="justify-content: flex-end">
          <button class="button" @click="showDeploymentSettingsModal = false">
            Cancel
          </button>
          <button
            class="button is-secondary"
            @click="showDeploymentSettingsModal = false"
          >
            Save Settings
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  type Market,
  type JobDefinition,
  type CreateDeployment,
  DeploymentStrategy,
} from "@nosana/sdk";
import { ValidationSeverity } from "vanilla-jsoneditor";
import "vanilla-jsoneditor/themes/jse-theme-dark.css";
import { useToast } from "vue-toastification";
import { useWallet } from "solana-wallets-vue";
import TopBar from "~/components/TopBar.vue";
import { useRouter } from "vue-router";
import { useEstimatedCost } from "~/composables/useMarketPricing";
import type { Template } from "~/composables/useTemplates";
import Loader from "~/components/Loader.vue";
import VaultSelector from "~/components/Vault/VaultSelector.vue";

// Setup composables
const { markets, getMarkets, loadingMarkets } = useMarkets();
const { templates, groupedTemplates, loadingTemplates } = useTemplates();
const { nosana } = useSDK();
const router = useRouter();
const toast = useToast();
const { status, token } = useAuth();
const { connected, publicKey } = useWallet();
const loading = ref(false);

// Initialize redirect composable for authentication flow
useRedirect();

// Global modal scroll lock
const { lockScroll, unlockScroll } = useModalScrollLock();

// State
const config = useRuntimeConfig();
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
const skipAutoSelection = ref(false);
const isUpdatingFromJobDef = ref(false);
const isRestoringState = ref(false);
const isEditorCollapsed = ref(false);

// Deployment-specific state
const deploymentName = ref("");
const replicas = ref(1);
const strategy = ref<DeploymentStrategy>("SIMPLE");
const schedule = ref("0 0 * * *"); // Default schedule

// Balance and price state
const nosPrice = ref(0);

// Credit balance state
const creditBalance = ref<number>(0);
const loadingCreditBalance = ref(false);
const solPrice = ref(0);
const usdcPrice = ref(0);
const usdtPrice = ref(0);

// Vault selection modal
const showVaultModal = ref(false);
const modalSelectedVault = ref<any>(null);

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
    const costUSD = hourlyPrice.value * replicas.value * timeout.value || 0;
    return creditBalance.value >= costUSD;
  }
  return false;
});

// Authentication mode detection
const isWalletMode = computed(() => {
  return connected.value && publicKey.value && !token.value;
});

const isCreditMode = computed(() => {
  return status.value === "authenticated" && token.value;
});

// Show legacy deploy banner for all users
const shouldShowWalletAuthBanner = computed(() => {
  return true;
});

const canCreateDeployment = computed(() => {
  const basicRequirements =
    selectedMarket.value !== null &&
    jobDefinition.value !== null &&
    deploymentName.value.trim() !== "" &&
    replicas.value > 0 &&
    timeout.value > 0 &&
    !isCreatingDeployment.value;

  if (isCreditMode.value) {
    return basicRequirements && canPostJob.value;
  } else if (isWalletMode.value) {
    // For wallet mode, basic requirements are enough
    // Vault will be created during deployment if needed
    return basicRequirements;
  }

  return false;
});

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
// Credit balance fetch (SDK API)
const refreshCreditBalance = async () => {
  if (status.value !== "authenticated" || !token.value) return;
  loadingCreditBalance.value = true;
  try {
    const data = await nosana.value.api.credits.balance();
    if (data) {
      creditBalance.value =
        (data.assignedCredits || 0) -
        (data.settledCredits || 0) -
        (data.reservedCredits || 0);
    }
  } catch (error) {
    console.error("Error fetching credit balance:", error);
  } finally {
    loadingCreditBalance.value = false;
  }
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
  if (replicas.value > 100) {
    toast.error("Number of replicas cannot exceed 100");
    return;
  }
  if (timeout.value < 1) {
    toast.error("Timeout must be at least 1 hour");
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
    const deployment = await nosana.value.deployments.create({
      name: deploymentName.value.trim(),
      market: selectedMarket.value!.address.toString(),
      replicas: replicas.value,
      timeout: Math.floor(timeout.value * 3600),
      strategy: strategy.value,
      ...(strategy.value === DeploymentStrategy.SCHEDULED
        ? { schedule: schedule.value }
        : {}),
      ...(modalSelectedVault.value ? { vault: modalSelectedVault.value } : {}),
      job_definition: jobDefinition.value,
    });

    toast.success(`Successfully created deployment ${deployment.id}`);
    router.push(`/deployments/${deployment.id}`);
  } catch (error: any) {
    console.error("Deployment creation error:", error);
    toast.error(
      `Error creating deployment: ${error.message || error.toString()}`
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
  if (numValue < 1) {
    timeout.value = 1;
  } else {
    timeout.value = numValue;
  }
};

// Handle login click
const handleLoginClick = () => {
  const { openBothModal } = useLoginModal();
  openBothModal();
};

// Navigate to account page
const goToClaimCredits = () => {
  navigateTo("/account/deployer");
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

    // set deployment name to selected template name if user hasn't customized
    if (newTemplate?.name && isNameTemplateManaged.value) {
      deploymentName.value = newTemplate.name;
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
  if (!markets.value && !loadingMarkets.value) {
    await getMarkets();
  }

  // Load credit balance if authenticated
  if (isCreditMode.value) {
    await refreshCreditBalance();
  }
});

// React to auth changes to keep credit balance fresh
watch(
  [status, token],
  async () => {
    if (isCreditMode.value) {
      await refreshCreditBalance();
    } else {
      creditBalance.value = 0;
    }
  },
  { immediate: true }
);

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
};

// Watch for template modal state to control body scroll
watch(showTemplateModal, (isOpen) => {
  if (isOpen) {
    lockScroll("template-modal");
  } else {
    unlockScroll("template-modal");
  }
});

// Watch for deployment settings modal state to control body scroll
watch(showDeploymentSettingsModal, (isOpen) => {
  if (isOpen) {
    lockScroll("deployment-settings-modal");
  } else {
    unlockScroll("deployment-settings-modal");
  }
});

// Watch for readme modal state to control body scroll
watch(showReadmeModal, (isOpen) => {
  if (isOpen) {
    lockScroll("readme-modal");
  } else {
    unlockScroll("readme-modal");
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
    border-bottom: 1px solid var(--tab-bottom-color, #{$white});
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

.dark-mode .notification {
  background-color: #2f2f2f;
}
</style>
