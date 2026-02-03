<template>
  <div>
    <TopBar
      :title="'Deploy a Job'"
      :subtitle="'Run a single job on the Nosana network'"
      ref="topBar"
      :hide-buttons="false"
      v-model="showSettingsModal"
    ></TopBar>
    
    <!-- Show loader until critical async data is loaded (templates/markets) -->
    <Loader v-if="loadingTemplates || loadingMarkets" />
    
    <div v-else class="columns is-multiline">
      <div class="column is-9-fullhd is-12">
        <!-- Job Definition and GPU Selection -->
        <DeployJobDefinition
          title="Configure job"
          :selectedTemplate="selectedTemplate"
          v-model:jobDefinition="jobDefinition"
          v-model:isEditorCollapsed="isEditorCollapsed"
          :markets="markets || null"
          :testgridMarkets="testgridMarkets"
          :loadingMarkets="loadingMarkets"
          :gpuTypeCheckbox="gpuTypeCheckbox"
          :activeFilter="activeFilter"
          :skipAutoSelection="skipAutoSelection"
          :selectedMarket="selectedMarket"
          :gpuFilters="gpuFilters"
          :selectedGpuGroup="selectedGpuGroup"
          :filterValues="filterValues"
          :availableHosts="availableHosts"
          :loadingHosts="loadingHosts"
          :selectedHostAddress="selectedHostAddress"
          :forceUpdateCounter="forceUpdateCounter"
          :activeFilterKey="activeFilterKey"
          @showTemplateModal="showTemplateModal = true"
          @openReadme="openReadmeModal"
          @selectedMarket="selectedMarket = $event"
          @update:activeFilter="activeFilter = $event"
          @update:gpuTypeCheckbox="gpuTypeCheckbox = $event"
          @update:selectedGpuGroup="selectedGpuGroup = $event"
          @update:filterValues="filterValues = $event"
          @update:selectedHostAddress="selectedHostAddress = $event"
          @update:forceUpdateCounter="forceUpdateCounter = $event"
          @searchGpus="searchGpus"
        />
      </div>
      <div class="column is-3-fullhd is-12">
        <div class="summary">
          <h1 class="title is-4 mb-2">Summary</h1>
          <div class="box has-background-white" style="border: none;">
            <div class="is-flex is-justify-content-space-between">
              <h3 class="title is-4">Price</h3>
              <h3 class="title is-4" v-if="selectedMarket">
                ${{ hourlyPrice.toFixed(3) }} / h
              </h3>
              <p v-else>Select a GPU</p>
            </div>
            <div class="is-flex is-justify-content-space-between has-text-grey">
              <p>Model:</p>
              <p v-if="computedJobTitle" style="text-overflow: ellipsis; text-align: right; flex-basis: 70%;">
                {{ computedJobTitle }}
              </p>
              <p v-else>-</p>
            </div>
            <div class="is-flex is-justify-content-space-between has-text-grey">
              <p>GPU</p>
              <p v-if="selectedMarket">{{ marketName }}</p>
              <p v-else>-</p>
            </div>
            <hr />
            
            <!-- Job Settings -->
            <h3 class="title is-6 mt-4 mb-3">Job Settings</h3>
            
            <div class="field">
              <label class="label is-small">Container timeout (hours)</label>
              <div class="control">
                <input
                  class="input is-small"
                  type="number"
                  v-model.number="hours"
                  min="0"
                  max="500"
                  step="0.1"
                />
              </div>
              <p class="help is-size-7">Auto-shutdown time</p>
            </div>
            <hr />
            <div class="is-flex is-justify-content-space-between">
              <h3 class="title is-4 mb-0">Estimated costs</h3>
              <h3 class="title is-4" v-if="selectedMarket">
                ${{ totalPrice.toFixed(3) }}
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
                v-else-if="status === 'authenticated' && !canPostJob && selectedMarket"
                class="has-text-centered"
              >
                <p class="has-text-grey is-size-7 mb-2">
                  Insufficient credits. Need ${{ (estimatedCost || 0).toFixed(2) }}, have ${{ creditBalance.toFixed(2) }}
                </p>
                <p class="has-text-grey is-size-7">
                  Claim credit codes on your account page
                </p>
              </div>
              <!-- Show deploy button if any authentication method allows job creation -->
              <button
                v-else-if="canCreateJob && (connected || status === 'authenticated')"
                class="button is-secondary is-fullwidth"
                @click="createJob"
              >
                <span v-if="isCreatingJob">Creating...</span>
                <span v-else>Run Job</span>
              </button>
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add Swap Modal -->
    <SwapModal
      v-model:showModal="showSwapModal"
      :totalNosNeeded="requiredNos"
      :nosPrice="nosPrice"
      :solPrice="solPrice"
      :usdcPrice="usdcPrice"
      :usdtPrice="usdtPrice"
      :userBalances="userBalances"
      @refresh-balances="refreshAllBalances"
    />

    <Loader v-if="loading" />
    
    <!-- README Modal -->
    <div class="modal" :class="{ 'is-active': showReadmeModal }">
      <div class="modal-background" @click="showReadmeModal = false"></div>
      <div class="modal-card" style="width: 80%; max-width: 960px;">
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
                v-if="selectedTemplate?.icon || selectedTemplate?.avatar_url"
                :src="selectedTemplate.icon || selectedTemplate.avatar_url"
                alt="Template Icon"
                class="mr-2" 
                style="height: 24px; width: 24px; border-radius: 4px; object-fit: contain; flex-shrink: 0;"
              />
              <span>{{ selectedTemplate?.name || 'Template' }}</span>
            </template>
          </div>
          <button class="delete" aria-label="close" @click="showReadmeModal = false"></button>
        </header>
        <section class="modal-card-body" style="max-height: 70vh; overflow-y: auto;">
          <ClientOnly>
            <MarkdownFile v-if="readmeContentForModal" :raw-markdown="readmeContentForModal" />
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
import type { Market, JobDefinition } from "@nosana/kit";
import { trackEvent } from "~/utils/analytics";
import { useToast } from "vue-toastification";
import { useWallet } from "@nosana/solana-vue";
import TopBar from '~/components/TopBar.vue';
import { useRouter, useRoute } from 'vue-router';
import { useDebounceFn, useScrollLock } from "@vueuse/core";
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import { useEstimatedCost } from '~/composables/useMarketPricing';
import { MAX_TIMEOUT_HOURS, MIN_TIMEOUT_HOURS } from '~/composables/useTimeoutConstants';
import SwapModal from '~/components/SwapModal.vue';
import type { Template } from '~/composables/useTemplates';
import Loader from '~/components/Loader.vue';

// Initialize the countries library with English locale
countries.registerLocale(en);

// Country name helper function
const getCountryName = (code: string): string => {
  const countryName = countries.getName(code, 'en') || code;
  
  // Custom country name overrides
  if (code === 'TW') return 'Taiwan';
  if (code === 'US') return 'United States';
  if (code === 'RU') return 'Russia';
  if (code === 'CN') return 'China';
  
  return countryName;
};

// Advanced GPU selection types
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
const { templates, groupedTemplates, loadingTemplates, loadingGroupedTemplates } = useTemplates();
const { nosana } = useKit();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const { connected, account, wallet } = useWallet();

// Compatibility: create publicKey-like object from account
const publicKey = computed(() => {
  if (!account.value?.address) return null;
  return {
    toString: () => account.value!.address,
    toBase58: () => account.value!.address,
  };
});
const { status, data: userData, token } = useAuth();
const loading = ref(false);

// Initialize redirect composable for authentication flow
useRedirect();

// Deploy page state persistence
const {
  saveState: saveDeployState,
  loadState: loadDeployState,
  clearState: clearDeployState,
  shouldRestoreState,
  debouncedSave,
  cleanup: cleanupDeployState,
  hasValidStoredState
} = useDeployPageState();

// Scroll lock for README modal
const scrollLockTarget = ref<HTMLElement | null>(null);
const isLocked = useScrollLock(scrollLockTarget);

// State
const config = useRuntimeConfig();
const gpuTab = ref<"simple" | "advanced">("simple");
// Show all markets on devnet, only premium on mainnet
const gpuTypeCheckbox = ref<string[]>(config.public.network === 'devnet' ? ["PREMIUM", "COMMUNITY"] : ["PREMIUM"]);
const activeFilter = ref(config.public.network === 'devnet' ? "ALL" : "PREMIUM");
const selectedMarket = ref<Market | null>(null);
const selectedTemplate = ref<Template | null>(null);
const hours = ref(1);
const isCreatingJob = ref(false);
const showSettingsModal = ref(false);
const showSwapModal = ref(false);
const skipAutoSelection = ref(false);
const isUpdatingFromJobDef = ref(false); // This flag will now be used by both watchers
const isRestoringState = ref(false); // Flag to prevent auto-selection during state restoration
const isEditorCollapsed = ref(true); // Default to collapsed

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
  usdt: 0
});

// Advanced GPU selection state
const selectedGpuGroup = ref<string>('all');
const selectedMarketType = ref<'all' | 'premium' | 'community'>('premium');
const gpuFilters = ref<any>(null);
const availableHosts = ref<HostInterface[]>([]);
const loadingHosts = ref(false);
const selectedHostAddress = ref<string | null>(null);
const forceUpdateCounter = ref(0);

// Initialize filterValues with defaults
const filterValues = ref<FilterValues>({
  PLATFORM_OS: 'All',
  CUDA_DRIVER: 'All',
  CPU_CORES: { min: 0, max: 128 },
  RAM_MB: { min: 12288, max: 131072 }, // 12 GB in MB (default)
  DISK_SPACE_GB: { min: 256, max: 1000 }, // 256 GB (default)
  BANDWIDTH_MB: { min: 100, max: 1000 } // 100 MB/s (default)
});

// Field mappings constants for GPU selection
const FIELD_MAPPINGS = {
  // Frontend to backend parameter mapping
  API_PARAMS: {
    'PLATFORM_OS': 'platform_os',
    'CUDA_DRIVER': 'cuda_drivers',
    'CPU_CORES': 'cpu_cores',
    'RAM_MB': 'ram_mb',
    'DISK_SPACE_GB': 'disk_space_gb',
    'BANDWIDTH_MB': 'download_speed_mb',
    'DOWNLOAD_SPEED_MB': 'download_speed_mb',
    'UPLOAD_SPEED_MB': 'upload_speed_mb',
    'REGION': 'region'
  },
  // Display labels for filters
  LABELS: {
    'PLATFORM_OS': 'Select OS',
    'CUDA_DRIVER': 'Select CUDA driver',
    'CPU_CORES': 'CPU',
    'RAM_MB': 'Memory',
    'DISK_SPACE_GB': 'Storage',
    'BANDWIDTH_MB': 'Download Speed',
    'DOWNLOAD_SPEED_MB': 'Download Speed'
  },
  // Descriptions for sliders
  DESCRIPTIONS: {
    'CPU_CORES': 'Select amount of vCPUs',
    'RAM_MB': 'Set minimum memory in GB',
    'DISK_SPACE_GB': 'Set minimum storage in GB',
    'BANDWIDTH_MB': 'Set the minimum download speed in MB/s',
    'DOWNLOAD_SPEED_MB': 'Set the minimum download speed in MB/s'
  },
  // Units for display values
  UNITS: {
    'CPU_CORES': 'vCPU',
    'RAM_MB': 'GB',
    'DISK_SPACE_GB': 'GB',
    'BANDWIDTH_MB': 'MB/s',
    'DOWNLOAD_SPEED_MB': 'MB/s'
  },
  // Special fields that should start at 0
  ZERO_MIN_FIELDS: ['RAM_MB', 'CPU_CORES', 'DISK_SPACE_GB']
};

// API data
const { data: stats } = await useAPI("/api/stats");
const { data: testgridMarkets } = await useAPI("/api/markets", { default: () => [] });
const nosApiPrice = computed(() => stats.value?.price || 0);

// Job definition - will be populated when PyTorch template loads
const jobDefinition = ref<JobDefinition | null>(null);

// Cache NOS price data
interface CachedPrice {
  price: number;
  timestamp: number;
}

const cachedNosPrice = useLocalStorage<CachedPrice>('nos-price-cache', { price: 0, timestamp: 0 });

// Function to check if cache is valid (less than 1 hour old)
const isCacheValid = () => {
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  return Date.now() - cachedNosPrice.value.timestamp < oneHour;
};

// Fetch token prices
const { data: priceData } = await useAPI(
  'https://api.coingecko.com/api/v3/simple/price?ids=nosana,solana,usd-coin,tether&vs_currencies=usd',
  {
    default: () => ({
      nosana: { usd: 0 },
      solana: { usd: 0 },
      'usd-coin': { usd: 0 },
      tether: { usd: 0 }
    })
  }
);

watch(() => priceData.value, (newPrice) => {
  if (newPrice?.nosana?.usd) {
    nosPrice.value = newPrice.nosana.usd;
    // Update cache with new price and timestamp
    cachedNosPrice.value = {
      price: newPrice.nosana.usd,
      timestamp: Date.now()
    };
  } else if (isCacheValid()) {
    // Use cached price if available and valid
    nosPrice.value = cachedNosPrice.value.price;
  } else {
    nosPrice.value = nosApiPrice.value;
  }
  if (newPrice?.solana?.usd) {
    solPrice.value = newPrice.solana.usd;
  }
  if (newPrice?.['usd-coin']?.usd) {
    usdcPrice.value = newPrice['usd-coin'].usd;
  }
  if (newPrice?.tether?.usd) {
    usdtPrice.value = newPrice.tether.usd;
  }
}, { immediate: true });

// Computed properties
const showTemplateInfo = computed(() => 
  selectedTemplate.value !== null
);

const computedJobTitle = computed(() => {
  if (selectedTemplate.value && selectedTemplate.value.id !== 'custom') {
    return selectedTemplate.value.name;
  }
  // Try to get from jobDefinition.ops[0].id
  if (jobDefinition.value?.ops?.[0]?.id) {
    return jobDefinition.value.ops[0].id;
  }
  // Fallback to a generic name or derive from image if ops[0].id is not present
  if (computedDockerImage.value) {
    const imageNameParts = computedDockerImage.value.split('/');
    return imageNameParts.pop() || 'Custom Job';
  }
  return 'Custom Job Definition';
});

const computedDockerImage = computed(() => {
  // If an actual template (not the 'custom' placeholder) is selected, use its image
  if (selectedTemplate.value && selectedTemplate.value.id !== 'custom' && selectedTemplate.value.jobDefinition?.ops?.[0]?.args) {
    const args = selectedTemplate.value.jobDefinition.ops[0].args as any;
    if (args.image) {
      return args.image;
    }
  }
  // Otherwise, derive from the live jobDefinition
  if (jobDefinition.value?.ops?.[0]?.args) {
    const args = jobDefinition.value.ops[0].args as any;
    if (args.image) {
      return args.image;
    }
  }
  return null;
});

const marketName = computed(() => {
  if (!selectedMarket.value?.address) return null;

try {
  trackEvent('gpu_selected', {
    user_id: userData.value?.generatedAddress || publicKey.value?.toString(),
    market: testgridMarkets.value.find(
      (tgm: any) => tgm.address === selectedMarket.value.address.toString())?.name || selectedMarket.value.address.toString()});
} catch (error) {
  console.error("Error tracking GPU job created:", error);
}
  
  return testgridMarkets.value.find(
    (tgm: any) => tgm.address === selectedMarket.value.address.toString()
  )?.name || selectedMarket.value.address.toString();
});

// Use centralized pricing system
const selectedMarketAddress = computed(() => selectedMarket.value?.address?.toString() || null);
const testgridMarketsRef = computed(() => testgridMarkets.value);

const { estimatedCost, formattedCost, formattedHourlyRate, usdPricePerHour } = useEstimatedCost(
  selectedMarketAddress,
  hours,
  testgridMarketsRef
);

// Legacy computed properties for backward compatibility
const hourlyPrice = computed(() => usdPricePerHour.value || 0);
const totalPrice = computed(() => estimatedCost.value || 0);

const requiredNos = computed(() => {
  if (!selectedMarket.value || !hours.value) return 0;
  
  // Use the usdPricePerHour from the already initialized useEstimatedCost composable
  if (usdPricePerHour.value && nosPrice.value) {
    // Convert USD price to NOS amount
    return (usdPricePerHour.value * hours.value) / nosPrice.value;
  }
  
  // If centralized pricing fails, return 0 to prevent deployment
  return 0;
});

// Check if user can post job based on their authentication method and balance
const canPostJob = computed(() => {
  // For wallet users: check NOS token balance
  if (connected.value) {
    return (balance.value || 0) >= requiredNos.value;
  }
  // For Google authenticated users: check credit balance using centralized pricing
  if (status.value === 'authenticated') {
    const costUSD = estimatedCost.value || 0;
    return creditBalance.value >= costUSD;
  }
  return false;
});

// Check if user is authenticated via any method
const isAuthenticated = computed(() => {
  return connected.value || status.value === 'authenticated';
});

const canCreateJob = computed(() => 
  selectedMarket.value !== null &&
  jobDefinition.value !== null &&
  !isCreatingJob.value &&
  hours.value > 0 &&
  isAuthenticated.value &&
  canPostJob.value
);

const activeFilterKey = computed(() => 
  `${selectedTemplate?.value?.id || 'default'}-${activeFilter.value}`
);


// Category constants moved to components

// Methods
const toggleGpuType = (type: string) => {
  activeFilter.value = type;
  if (type === 'ALL') {
    gpuTypeCheckbox.value = ['PREMIUM', 'COMMUNITY'];
    selectedMarketType.value = 'all';
  } else {
    gpuTypeCheckbox.value = [type];
    selectedMarketType.value = type.toLowerCase() as 'premium' | 'community';
  }
};

// Helper function to ensure wallet is ready for transactions
const ensureWalletReady = async (): Promise<boolean> => {
  if (!connected.value || !publicKey.value) {
    return false;
  }
  
  // Wait for wallet adapter to be fully connected
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    if (wallet.value?.adapter?.connected && wallet.value?.adapter?.publicKey) {
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  return false;
};

const createJob = async () => {
  if (!canCreateJob.value) return;
  
  // Double-check hours value is valid
  if (hours.value < MIN_TIMEOUT_HOURS) {
    console.error(`Auto-shutdown time must be at least ${MIN_TIMEOUT_HOURS} hours`);
    return;
  }
  if (hours.value > MAX_TIMEOUT_HOURS) {
    console.error(`Auto-shutdown time cannot exceed ${MAX_TIMEOUT_HOURS} hours`);
    return;
  }
  
  loading.value = true;
  isCreatingJob.value = true;
  try {
    const ipfsHash = await nosana.value.ipfs.pin(jobDefinition.value);
    
    // Check authentication method and use appropriate posting method
    if (status.value === 'authenticated') {
      // Credit-based posting for Google authenticated users
      // Determine market address (with fallback for advanced mode)
      let marketAddress = selectedMarket.value?.address?.toString();
      if (!marketAddress && selectedHostAddress.value) {
        const hostData = availableHosts.value?.find(host => host.host_address === selectedHostAddress.value);
        if (hostData?.market_address && markets.value) {
          const market = markets.value.find(m => m.address?.toString() === hostData.market_address);
          if (market) marketAddress = market.address?.toString();
        }
      }
      if (!marketAddress) {
        throw new Error('No valid market selected. Please select a GPU from the list.');
      }
      
      const { job, credits } = await nosana.value.api.jobs.list({
          ipfsHash: ipfsHash,
        market: marketAddress,
        timeout: Math.min(hours.value * 3600, MAX_TIMEOUT_HOURS * 3600),
        node: selectedHostAddress.value || undefined
      });

      toast.success(`Successfully created job ${job}`);
        clearDeployState();
        await refreshCreditBalance();
        try {
          trackEvent('credit_used', {
            user_id: userData.value?.generatedAddress,
          job_id: job,
            market: marketName.value,
          credits_used: credits.creditsUsed,
          cost_usd: credits.costUSD,
            remaining_credits: creditBalance.value,
          });
          trackEvent('gpu_job_created', {
            user_id: userData.value?.generatedAddress,
          job_id: job,
            market: marketName.value,
          credits_used: credits.creditsUsed,
          cost_usd: credits.costUSD,
            hours: hours.value,
            remaining_credits: creditBalance.value,
            type: 'credit',
          });
        } catch (error) {
          console.error("Error tracking credit used:", error);
        }
        setTimeout(() => {
        router.push('/jobs/' + job);
        }, 3000);
    } else if (connected.value) {
      // Wallet-based posting for wallet users
      // Ensure wallet is fully ready for signing
      const walletReady = await ensureWalletReady();
      if (!walletReady) {
        throw new Error('Wallet is not ready for signing. Please reconnect your wallet and try again.');
      }
      
      // Determine deployment mode: market vs specific host
      let marketAddress;
      let hostAddress = undefined;
      
      if (selectedMarket.value?.address) {
        marketAddress = selectedMarket.value.address;
        
        // Only pass host address if we're in advanced mode AND have a specific host selected
        if (selectedHostAddress.value && gpuTab.value === 'advanced') {
          hostAddress = selectedHostAddress.value;
        }
        // For device tab (simple mode), we deploy to the market (any available host)
        // For advanced tab, we deploy to specific host if selected, otherwise to market
        
      } else if (selectedHostAddress.value) {
        // Fallback: If we have a host but no market, find the market from available hosts
        const hostData = availableHosts.value?.find(host => host.host_address === selectedHostAddress.value);
        if (hostData?.market_address && markets.value) {
          const market = markets.value.find(m => m.address?.toString() === hostData.market_address);
          if (market) {
            marketAddress = market.address;
            hostAddress = selectedHostAddress.value; // This is definitely advanced mode
            selectedMarket.value = market; // Update selectedMarket for UI consistency
          }
        }
      }
      
      if (!marketAddress) {
        throw new Error('No valid market selected. Please select a GPU from the list.');
      }
      
      // Create the post instruction using new kit API
      const postInstruction = await nosana.value.jobs.post({
        market: marketAddress as any,
        timeout: Math.min(hours.value * 3600, MAX_TIMEOUT_HOURS * 3600),
        ipfsHash: ipfsHash,
        node: hostAddress as any,
      });
      
      // Build, sign and send the transaction
      const signature = await nosana.value.solana.buildSignAndSend(postInstruction);
      
      toast.success(`Successfully posted job (tx: ${signature})`);

      try {
        trackEvent('gpu_job_created', {
          user_id: publicKey.value?.toString(),
          job_id: signature, // Use transaction signature as identifier
          market: marketName.value,
          cost_usd: estimatedCost.value,
          hours: hours.value,
          type: 'wallet',
        });
      } catch (error) {
        console.error("Error tracking GPU job created:", error);
      }

      // Clear saved deploy state after successful job creation
      clearDeployState();
      // Note: With the new kit, we don't get the job address directly
      // Navigate to deployments page instead
      setTimeout(() => {
        router.push('/deployments');
      }, 3000);
    } else {
      throw new Error('No authentication method available');
    }
  } catch (error: any) {
    if (error.toString().toLowerCase().includes('user rejected')) {
      toast.info('Transaction was cancelled.');
    } else if (error.toString().toLowerCase().includes('wallet is not ready')) {
      console.error('Wallet connection issue. Please disconnect and reconnect your wallet, then try again.');
    } else if (error.toString().toLowerCase().includes('not connected')) {
      console.error('Wallet is not connected. Please connect your wallet and try again.');
    } else {
      console.error(`Error creating job: ${error.toString()}`);
    }
  } finally {
    isCreatingJob.value = false;
    loading.value = false;
  }
};

// Handle login click with state persistence
const handleLoginClick = () => {
  // Save current deploy page state before redirecting to login
  const currentState = {
    selectedMarket: selectedMarket.value,
    selectedTemplate: selectedTemplate.value,
    jobDefinition: jobDefinition.value,
    hours: hours.value,
    gpuTab: gpuTab.value,
    gpuTypeCheckbox: gpuTypeCheckbox.value,
    activeFilter: activeFilter.value
  };
  
  saveDeployState(currentState, 'user');
  
  // Store redirect path in sessionStorage (for useRedirect composable)
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('redirectAfterLogin', route.path);
  }
  
  // Open login modal instead of navigating to login page
  const { openBothModal } = useLoginModal();
  openBothModal();
};

// Redeploy functionality now handled by unified state persistence

// Old redeploy cleanup functionality removed (no longer needed)

// Template selection handling
watch(() => selectedTemplate.value, (newTemplate) => {
  if (isUpdatingFromJobDef.value) return; // If this change is due to the jobDefinition watcher, do nothing here

  if (newTemplate?.jobDefinition) {
    isUpdatingFromJobDef.value = true; // Indicate that the jobDefinition is being updated programmatically
    jobDefinition.value = JSON.parse(JSON.stringify(newTemplate.jobDefinition));
    nextTick(() => {
      isUpdatingFromJobDef.value = false;
    });

    // Preserve user's GPU selection when changing templates
    // No longer clear selectedMarket and selectedHostAddress on template change
  } 
  // No specific action if newTemplate is null, as jobDefinition (editor) should retain custom values.
}, { deep: true });

// Watch jobDefinition changes to detect custom configurations or reverting to a template ID
watch(() => jobDefinition.value, (newJobDef, oldJobDef) => {
  if (isUpdatingFromJobDef.value) return; // If this change is due to the selectedTemplate watcher, do nothing here

  // Avoid processing if the change was programmatic and identical (can happen with deep watchers)
  if (JSON.stringify(newJobDef) === JSON.stringify(oldJobDef)) {
      return;
  }

  const currentEditorOpId = newJobDef?.ops?.[0]?.id;

  if (selectedTemplate.value && selectedTemplate.value.id !== 'custom') {
    // If the editor content no longer matches the selected template's definition,
    // we consider it a custom job and deselect the template.
    if (JSON.stringify(newJobDef) !== JSON.stringify(selectedTemplate.value.jobDefinition)) {
      isUpdatingFromJobDef.value = true;
      selectedTemplate.value = null;
      nextTick(() => {
        isUpdatingFromJobDef.value = false;
      });
    }
  } else {
    // No template is currently selected (it's custom or was deselected)
    // Try to find a template that matches the new content in the editor
    if (groupedTemplates.value) {
      const templateMatchingJobDef = groupedTemplates.value.find(
        (t: Template) => t.jobDefinition && JSON.stringify(t.jobDefinition) === JSON.stringify(newJobDef) && t.id !== 'custom'
      );

      if (templateMatchingJobDef) {
        // A template matches the current content. Set selectedTemplate.
        // The other watcher will then update the jobDefinition editor to this template's content,
        // which is fine since they are identical.
        selectedTemplate.value = templateMatchingJobDef as Template;
      }
    }
  }
}, { deep: true });

// Auto-select PyTorch template when grouped templates load
watch(() => groupedTemplates.value, (newTemplates) => {
  if (Array.isArray(newTemplates) && newTemplates.length > 0 && !selectedTemplate.value && !isRestoringState.value && !hasValidStoredState.value) {
    // Find the PyTorch Jupyter template by matching the docker image
    const pytorchTemplate = newTemplates.find((template: any) => 
      template.jobDefinition?.ops?.[0]?.args?.image?.includes("nosana/pytorch-jupyter")
    );
    
    if (pytorchTemplate) {
      selectedTemplate.value = pytorchTemplate as Template;
      // Set the job definition from the template
      jobDefinition.value = pytorchTemplate.jobDefinition;
    }
  }
}, { immediate: true });

// Update GPU type when market changes
watch(() => selectedMarket.value, (newMarket) => {
  if (newMarket && newMarket.address && testgridMarkets.value && activeFilter.value !== 'ALL') {
    const marketInfo = testgridMarkets.value.find((tgm: any) => tgm.address === newMarket.address.toString());
    if (marketInfo && marketInfo.type) {
      gpuTypeCheckbox.value = [marketInfo.type];
      activeFilter.value = marketInfo.type;
    }
  }
});

// Advanced GPU selection utility functions moved to component

// Create a fetchGpuFilters function
const fetchGpuFilters = async (resetValues = true) => {
  try {
    loadingHosts.value = true;
    const response = await fetch(`${config.public.backend_url}/api/markets/filters?market_type=${selectedMarketType.value}`);
    const data = await response.json();
    
    // Fix the duplicate "All GPUs" issue
    if (data.groups && data.groups.length > 0) {
      // Handle the case where 'all' value might be duplicated
      const allValues = data.groups.filter((group: any) => group.value === 'all');
      if (allValues.length > 1) {
        // Keep only the first 'all' entry
        data.groups = data.groups.filter((group: any, index: number) => {
          if (group.value === 'all') {
            return index === data.groups.findIndex((g: any) => g.value === 'all');
          }
          return true;
        });
      }
      
      // Handle any entries with "All GPUs" label but different values
      const allGpuLabels = data.groups.filter((group: any) => group.label === 'All GPUs');
      if (allGpuLabels.length > 1) {
        // Keep only the first "All GPUs" label
        data.groups = data.groups.filter((group: any, index: number) => {
          if (group.label === 'All GPUs') {
            return index === data.groups.findIndex((g: any) => g.label === 'All GPUs');
          }
          return true;
        });
      }
      
      // Make sure "All GPUs" is always first in the list
      data.groups.sort((a: any, b: any) => {
        if (a.label === 'All GPUs') return -1;
        if (b.label === 'All GPUs') return 1;
        return a.order - b.order;
      });
    }
    
    // Fix filter options to always have "All" at the top of the values list
    if (data['filter-options'] && data['filter-options'].length > 0) {
      data['filter-options'].forEach((option: any) => {
        if (option.filters) {
          Object.values(option.filters).forEach((filter: any) => {
            if (filter.type === 'select' && filter.values && filter.values.length > 0) {
              // Remove any existing 'All' value
              const values = filter.values.filter((v: string) => v !== 'All');
              // Add 'All' at the beginning
              filter.values = ['All', ...values];
            }
          });
        }
      });
    }
    
    gpuFilters.value = data;
    
    // Initialize filter values based on the all group, but only if resetValues is true
    if (resetValues && data['filter-options'] && data['filter-options'].length > 0) {
      const allOption = data['filter-options'].find((opt: any) => opt.value === 'all');
      if (allOption && allOption.filters) {
        // Reset filter values with proper defaults from API
        Object.entries(allOption.filters).forEach(([key, filterConfig]: [string, any]) => {
          if (filterConfig.type === 'select') {
            // Always default select-type filters to 'All'
            filterValues.value[key] = 'All';
          } else if (filterConfig.type === 'min-max') {
            // Set our custom default values regardless of API min values
            if (key === 'RAM_MB') {
              filterValues.value[key] = { min: 12288, max: filterConfig.max_value || 131072 }; // 12 GB
            } else if (key === 'DISK_SPACE_GB') {
              filterValues.value[key] = { min: 256, max: filterConfig.max_value || 1000 }; // 256 GB
            } else if (key === 'BANDWIDTH_MB' || key === 'DOWNLOAD_SPEED_MB') {
              filterValues.value[key] = { min: 100, max: filterConfig.max_value || 1000 }; // Default 100 MB/s
            } else {
              // For other fields like CPU_CORES, use 0 as min
              filterValues.value[key] = { 
                min: key === 'CPU_CORES' ? 0 : filterConfig.min_value || 0,
                max: filterConfig.max_value || 1000 
              };
            }
          }
        });
      }
    }
    
    // Fetch initial hosts with current settings
    await debouncedSearch();
  } catch (error) {
    console.error('Error fetching filters:', error);
    console.error('Could not load GPU filter options');
  } finally {
    loadingHosts.value = false;
  }
};

// Update the debouncedSearch function to include market_type
const debouncedSearch = useDebounceFn(async () => {
  loadingHosts.value = true;
  
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('group', selectedGpuGroup.value || 'all');
    
    // Add market_type parameter
    queryParams.append('market_type', selectedMarketType.value);
    
    // Add filter values to query
    Object.entries(filterValues.value).forEach(([key, value]) => {
      const paramName = FIELD_MAPPINGS.API_PARAMS[key as keyof typeof FIELD_MAPPINGS.API_PARAMS] || key.toLowerCase();
      
      if (typeof value === 'string') {
        if (value !== 'All') {
          // Keep case for REGION parameter
          const paramValue = key === 'REGION' ? value : value.toLowerCase();
          queryParams.append(paramName, paramValue);
        }
      } else if (value && typeof value === 'object') {
        const filterValue = value as FilterValue;
        if (filterValue.min > 0) {
          // Make sure we're only adding each parameter once
          queryParams.set(paramName, filterValue.min.toString());
        }
      }
    });
    
    // Fetch available hosts
    const response = await fetch(`${config.public.backend_url}/api/markets/hosts?${queryParams}`);
    const data = await response.json();
    
    // Process host data
    if (data.hosts) {
      const processedHosts = data.hosts
        .map((host: any) => {
          // Normalize host data
          if (host.specs && host.specs.RAM_MB) {
            host.specs.RAM_MB = Number(host.specs.RAM_MB);
            if (!host.specs.MEMORY_GB) {
              host.specs.MEMORY_GB = Math.round(host.specs.RAM_MB / 1024 * 100) / 100;
            }
          }
          
          // Only set market_type if not provided by the API
          if (!host.market_type) {
            host.market_type = selectedMarketType.value;
          }
          
          return host;
        })
        // Sort by price (low to high)
        .sort((a: any, b: any) => a.USD_per_hour - b.USD_per_hour);
      
      // Wait a small delay before updating to ensure smooth transition
      setTimeout(() => {
        availableHosts.value = processedHosts;
        loadingHosts.value = false;
      }, 100);
    } else {
      setTimeout(() => {
        availableHosts.value = [];
        loadingHosts.value = false;
      }, 100);
    }
  } catch (error) {
    console.error('Error fetching hosts:', error);
    console.error('Failed to fetch available GPUs');
    setTimeout(() => {
      availableHosts.value = [];
      loadingHosts.value = false;
    }, 100);
  }
}, 300);

// Add watchers for selectedMarketType
watch(selectedMarketType, () => {
  // Reset the selected host when market type changes
  selectedHostAddress.value = null;
  // Only fetch filters, don't reset the values
  fetchGpuFilters(false);
});

// Watch for changes to selectedGpuGroup
watch(selectedGpuGroup, async (newValue) => {
  if (newValue !== undefined) {
    // Get the filter configuration for the newly selected group
    if (gpuFilters.value && gpuFilters.value['filter-options']) {
      const groupOption = gpuFilters.value['filter-options'].find(
        (opt: any) => opt.value === newValue
      );
      
      if (groupOption && groupOption.filters) {
        // Check each filter and adjust values if they exceed the new maximum
        Object.entries(groupOption.filters).forEach(([key, filterConfig]: [string, any]) => {
          if (filterConfig.type === 'min-max' && filterValues.value[key]) {
            const currentValue = filterValues.value[key] as FilterValue;
            
            // Special handling for bandwidth - don't update min unless it's above max
            if (key === 'BANDWIDTH_MB' || key === 'DOWNLOAD_SPEED_MB') {
              // Only adjust min if it exceeds max
              if (currentValue.min > filterConfig.max_value) {
                (filterValues.value[key] as FilterValue).min = filterConfig.max_value;
              }
              (filterValues.value[key] as FilterValue).max = filterConfig.max_value;
            }
            // For other filters, if current min value exceeds the new max, adjust it
            else if (currentValue.min > filterConfig.max_value) {
              (filterValues.value[key] as FilterValue).min = filterConfig.max_value;
              (filterValues.value[key] as FilterValue).max = filterConfig.max_value;
            }
            
            // Update the max value to match the filter's max
            (filterValues.value[key] as FilterValue).max = filterConfig.max_value;
          }
        });
      }
    }
    
    // Trigger search with adjusted values
    debouncedSearch();
  }
});


// Search GPUs function for advanced GPU selection
const searchGpus = () => {
  debouncedSearch();
};
// Restore state if needed (following handleRepost pattern)
const restoreStateIfNeeded = async () => {
  if (!shouldRestoreState()) {
    return;
  }
  
  const savedState = loadDeployState();
  if (!savedState) {
    return;
  }
  
  
  // Set flags to prevent auto-selection interference (same as handleRepost)
  isRestoringState.value = true;
  skipAutoSelection.value = true;
  
  try {
    // Restore non-market state first
    if (savedState.selectedTemplate) selectedTemplate.value = savedState.selectedTemplate;
    if (savedState.jobDefinition) jobDefinition.value = savedState.jobDefinition;
    if (savedState.hours) hours.value = savedState.hours;
    if (savedState.gpuTab) gpuTab.value = savedState.gpuTab;
    if (savedState.gpuTypeCheckbox) gpuTypeCheckbox.value = savedState.gpuTypeCheckbox;
    if (savedState.activeFilter) activeFilter.value = savedState.activeFilter;
    
    // Restore market selection (following handleRepost pattern)
    if (savedState.selectedMarket && markets.value) {
      const foundMarket = markets.value.find((m: Market) => 
        m.address?.toString() === savedState.selectedMarket?.address?.toString()
      );
      
      if (foundMarket) {
        // Delay the assignment to let the component fully initialize first
        setTimeout(() => {
          selectedMarket.value = foundMarket;
        }, 100);
        
        // Update GPU type filters based on market (same as handleRepost)
        if (testgridMarkets.value.length > 0) {
          const marketInfo = testgridMarkets.value.find((tgm: any) => 
            tgm.address === foundMarket.address?.toString()
          );
          if (marketInfo && marketInfo.type) {
            gpuTypeCheckbox.value = [marketInfo.type];
            activeFilter.value = marketInfo.type;
          }
        }
      }
    }
    
    // Show notification for redeploy operations
    if (savedState.source === 'redeploy') {
      setTimeout(() => {
        toast.info('Job configuration restored. Please select a GPU to continue.');
      }, 500);
    }
    
  } finally {
    // Reset flags after restoration is complete
    setTimeout(() => {
      isRestoringState.value = false;
      skipAutoSelection.value = false;
    }, 100);
  }
};

// Update the onMounted hook to include debugging
onMounted(async () => {
  if (process.client) {
    scrollLockTarget.value = document.documentElement;
  }
  
  if (!markets.value && !loadingMarkets.value) {
    await getMarkets();
  }
  
  // Restore state after markets are loaded
  await restoreStateIfNeeded();

  await fetchGpuFilters(true);
  
  if (publicKey.value && nosana.value) {
    await refreshAllBalances();
  }
});

// Watch for tab changes to sync market type
watch(gpuTab, (newTab) => {
  if (newTab === 'simple') {
    // Update the active filter to match the selected market type
    if (selectedMarketType.value === 'all') {
      activeFilter.value = 'ALL';
      gpuTypeCheckbox.value = ['PREMIUM', 'COMMUNITY'];
    } else if (selectedMarketType.value === 'premium') {
      activeFilter.value = 'PREMIUM';
      gpuTypeCheckbox.value = ['PREMIUM'];
    } else if (selectedMarketType.value === 'community') {
      activeFilter.value = 'COMMUNITY';
      gpuTypeCheckbox.value = ['COMMUNITY'];
    }
  }
});

// Refresh NOS balance
const refreshBalance = async () => {
  if (!publicKey.value || !nosana.value) return;
  
  loadingBalance.value = true;
  errorBalance.value = null;
  
  try {
    const balanceData = await nosana.value.nos.getBalance(publicKey.value.toString());
    balance.value = balanceData || 0;
  } catch (error: any) {
    errorBalance.value = error.toString();
    console.error('Error fetching NOS balance:', error);
  } finally {
    loadingBalance.value = false;
  }
};

// Refresh all token balances
const refreshAllBalances = async () => {
  if (!publicKey.value || !nosana.value) return;
  
  try {
    const [nosBal, solBal] = await Promise.all([
      nosana.value.nos.getBalance(),
      nosana.value.solana.getBalance()
    ]);

    userBalances.value = {
      nos: nosBal ?? 0,
      sol: solBal / 1e9,
      usdc: 0,
      usdt: 0
    };
    await refreshBalance();
  } catch (error) {
    console.error('Failed to refresh balances', error);
  }
};

// Refresh credit balance for Google authenticated users
const refreshCreditBalance = async () => {
  if (status.value !== 'authenticated' || !token.value) return;
  
  loadingCreditBalance.value = true;
  
  try {
    const data = await nosana.value.api.credits.balance();
    creditBalance.value = (data.assignedCredits || 0) - (data.settledCredits || 0) - (data.reservedCredits || 0);
  } catch (error) {
    console.error('Error fetching credit balance:', error);
  } finally {
    loadingCreditBalance.value = false;
  }
};

// Watch for wallet connection changes
watch([publicKey, nosana], async () => {
  if (publicKey.value && nosana.value) {
    await refreshAllBalances();
  }
}, { immediate: true });

// Watch for wallet connection state changes
watch([connected, wallet], ([isConnected, walletInstance]) => {
  // Wallet connection state monitoring (no user feedback needed)
}, { immediate: true });

// Watch for Google authentication changes
watch([status, token], async () => {
  if (status.value === 'authenticated' && token.value) {
    await refreshCreditBalance();
  }
}, { immediate: true });

// Cleanup on component unmount
onBeforeUnmount(() => {
  // Clean up deploy state persistence
  cleanupDeployState();
});

// Add a watch for navTab
watch(() => showSwapModal.value, (newValue) => {
  if (newValue === true) {
    // Force a small delay before refreshing balances
    setTimeout(async () => {
      // Refresh balances before showing the modal
      await refreshAllBalances();
    }, 50);
  }
});

// Auto-save deploy state when key values change
watch([selectedMarket, selectedTemplate, hours, gpuTab, activeFilter], () => {
  // Only auto-save if user is not restoring state from localStorage
  if (!isRestoringState.value) {
    debouncedSave({
      selectedMarket: selectedMarket.value,
      selectedTemplate: selectedTemplate.value,
      jobDefinition: jobDefinition.value,
      hours: hours.value,
      gpuTab: gpuTab.value,
      gpuTypeCheckbox: gpuTypeCheckbox.value,
      activeFilter: activeFilter.value
    });
  }
}, { deep: true });

// Auto-save job definition changes separately (with longer debounce)
watch(jobDefinition, () => {
  // Only auto-save if user is not restoring state from localStorage  
  if (!isRestoringState.value) {
    debouncedSave({
      selectedMarket: selectedMarket.value,
      selectedTemplate: selectedTemplate.value,
      jobDefinition: jobDefinition.value,
      hours: hours.value,
      gpuTab: gpuTab.value,
      gpuTypeCheckbox: gpuTypeCheckbox.value,
      activeFilter: activeFilter.value
    }, 1000); // Longer delay for job definition
  }
}, { deep: true });

// Market restoration is now handled in restoreStateIfNeeded function


// Add this function to the script section
const openSwapModal = () => {
  // Make sure balances are refreshed before opening the modal
  refreshAllBalances();
  // Set showSwapModal to true
  showSwapModal.value = true;
};

// Open README Modal
const openReadmeModal = (readme: string) => {
  readmeContentForModal.value = readme;
  showReadmeModal.value = true;
};

// State
// const selectedCategory = ref<string | null>(null); // This line was duplicated and is now removed/commented

// README Modal state
const showReadmeModal = ref(false);
const readmeContentForModal = ref<string | undefined>(undefined);

// Template Modal state
const showTemplateModal = ref(false);

// Computed property to get Docker image from job definition
const selectedTemplateImage = computed(() => {
  try {
    // First, try to get it from the selectedTemplate's jobDefinition if available
    if (selectedTemplate.value && selectedTemplate.value.jobDefinition && selectedTemplate.value.jobDefinition.ops && selectedTemplate.value.jobDefinition.ops[0] && selectedTemplate.value.jobDefinition.ops[0].args) {
      const args = selectedTemplate.value.jobDefinition.ops[0].args as any;
      if (args.image) {
        return args.image;
      }
    }
    // Fallback to the current jobDefinition in the editor
    if (jobDefinition.value && jobDefinition.value.ops && jobDefinition.value.ops[0] && jobDefinition.value.ops[0].args) {
      const args = jobDefinition.value.ops[0].args as any;
      if (args.image) {
        return args.image;
      }
    }
  } catch (e) {
    console.error("Could not extract image from job definition", e);
  }
  return null; // Return null if not found or error
});

// Function to get Docker image from any template
const getTemplateImage = (template: Template): string | null => {
  try {
    if (template.jobDefinition && template.jobDefinition.ops && template.jobDefinition.ops[0] && template.jobDefinition.ops[0].args) {
      const args = template.jobDefinition.ops[0].args as any;
      if (args.image) {
        return args.image;
      }
    }
  } catch (e) {
    console.error("Could not extract image from template", e);
  }
  return null;
};

// Watch for README modal state to control body scroll using useScrollLock
watch(showReadmeModal, (isOpen) => {
  isLocked.value = isOpen;
});

// Watch for template modal state to control body scroll
watch(showTemplateModal, (isOpen) => {
  if (!showReadmeModal.value) { // Only lock if README modal isn't already open
    isLocked.value = isOpen;
  }
});


// Template selection handler
const selectTemplateFromModal = (template: Template) => {
  selectedTemplate.value = template;
  showTemplateModal.value = false;
  isEditorCollapsed.value = true; // Collapse editor when a new template is selected
};

// Advanced GPU selection market handler
const handleAdvancedMarketSelection = (marketInfo: any) => {
  if (!marketInfo) {
    selectedMarket.value = null;
    return;
  }
  
  // If it's already a proper market object with address property, use it directly
  if (marketInfo.address) {
    selectedMarket.value = marketInfo;
    return;
  }
  
  // If it's just market address info, find the proper market object
  if (marketInfo.market_address && markets.value) {
    const matchingMarket = markets.value.find((m: Market) => 
      m.address?.toString() === marketInfo.market_address
    );
    
    if (matchingMarket) {
      selectedMarket.value = matchingMarket;
    } else {
      console.error('Could not find matching market for address:', marketInfo.market_address);
      // Don't set to null here - we might still be able to use the market_address directly
      // The job creation logic will handle finding the market when needed
    }
  }
};

// CSS rules below were mistakenly placed here and will be moved to the <style> block

</script>
<style lang="scss" scoped>


/* Category filter styles moved to components */

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
  top: 23px; /* Move it even lower */
  right: 20px;
  width: 20%;
  max-width: 400px;
  padding: 1 1rem 1rem;
  z-index: 15;
  background: transparent; /* Remove background from container */
  margin-top: 78px; /* Add margin for fixed positioning on larger screens */
}

/* Dark mode background */
.dark-mode .summary {
  background: transparent;
}

/* Responsive adjustments for summary */
@media screen and (max-width: 1407px) { // Below fullhd (1408px)
  .summary {
    position: static;
    top: auto;
    right: auto;
    width: 100%;
    max-width: none;
    margin-top: 1.5rem !important; /* Override the fixed positioning margin */
    padding: 0;
    background: transparent;
  }
}

/* New rule to adjust padding for the box inside summary */
.summary > .box {
  padding: 1.5rem; /* Increased padding all around */
  background: white !important; /* Ensure the box has background */
}

/* Dark mode background for the box */
.dark-mode .summary > .box {
  background: #121212 !important;
}

.h-100, .full-height {
  height: 100%;
  display: flex;
  flex-direction: column;
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

/* Mobile specific adjustments */
@media screen and (max-width: 768px) {
  .summary {
    margin-top: 1rem !important; /* Reduce margin even more on mobile */
  }
}

/* Custom breakpoint for 3 columns */
@media screen and (min-width: 1600px) {
  .columns.is-multiline > .column.is-6-fullhd {
    flex: none;
    width: calc(100% / 3);
  }
}

/* Ultrawide screen adjustments for deploy page */
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


/* Adjust column padding on mobile */
@media screen and (max-width: 768px) {
  .columns.is-multiline > .column.is-9-fullhd,
  .columns.is-multiline > .column.is-3-fullhd {
    padding-left: 0;
    padding-right: 0;
  }

  /* Reduce padding inside the main content boxes on mobile */
  .column.is-9-fullhd > .box,
  .column.is-3-fullhd > .summary > .box {
    padding-left: 0.5rem;
    padding-right: 0.1rem;
  }

  /* Make TopBar more compact on mobile */
  .topbar {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }

  /* Target any buttons or nav items in the TopBar */
  .topbar .button,
  .topbar .navbar-burger {
    margin: 0;
    padding: 0.5rem;
  }
}

/* Mobile styles moved to individual components */


.warning-icon {
  filter: invert(73%) sepia(45%) saturate(5600%) hue-rotate(359deg) brightness(101%) contrast(106%);
}





/* Modal scroll fix - ensure modals can scroll when body is locked */
.modal.is-active {
  overflow: hidden;
}

.modal.is-active .modal-card-body {
  overflow-y: auto !important;
}



</style> 
