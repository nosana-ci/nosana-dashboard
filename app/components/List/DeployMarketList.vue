<template>
  <div>
    <div v-if="markets.length" class="market-toolbar">
      <div class="market-search">
        <svg
          class="market-search-icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
          <path
            d="m20 20-3.5-3.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <input
          v-model="searchQuery"
          class="market-search-input"
          type="text"
          placeholder="Search GPUs…"
        />
      </div>
      <div class="market-sort-control">
        <span class="market-sort-prefix">Sort</span>
        <select v-model="sortBy" class="market-sort-select" aria-label="Sort">
          <option value="series">GPU series</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="vram-desc">VRAM: High to Low</option>
          <option value="vram-asc">VRAM: Low to High</option>
        </select>
        <svg
          class="market-sort-caret"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>

    <div v-if="!filteredMarkets.length" class="has-text-centered py-5">
      <p class="has-text-grey">
        {{
          searchQuery ? `No GPUs match “${searchQuery}”` : "No GPUs available"
        }}
      </p>
    </div>
    <div v-else class="gpu-grid">
      <nuxt-link
        v-for="market in filteredMarkets"
        :key="market.address?.toString() || market.id"
        :to="`/markets/${market.address?.toString() || ''}`"
        custom
      >
        <template #default="{ navigate }">
          <div
            class="gpu-card"
            :class="{
              'is-selected':
                selectedMarket &&
                selectedMarket.address?.toString() ===
                  market.address?.toString(),
              'is-incompatible': !isMarketCompatible(market),
            }"
            :data-tooltip="
              !isMarketCompatible(market)
                ? 'This GPU does not meet the required VRAM specifications for your job.'
                : null
            "
            @click="
              isMarketCompatible(market) &&
              (select ? (selectedMarket = market) : navigate())
            "
          >
            <div class="gpu-card-top">
              <NvidiaIcon v-if="showLogo" alt="NVIDIA" class="gpu-logo" />
              <h3 class="gpu-name">{{ getMarketName(market) }}</h3>
            </div>

            <div class="gpu-price-row">
              <span class="gpu-price">
                <CurrentMarketPrice
                  :marketAddressOrData="market"
                  :marketsData="testgridMarkets"
                  :decimalPlaces="3"
                />
              </span>
              <span
                class="gpu-status"
                :class="{ 'is-available': hasAvailableGPUs(market) }"
              >
                <span class="gpu-status-dot" />
                {{
                  hasAvailableGPUs(market)
                    ? `${market.queue.length} available`
                    : "Unavailable"
                }}
              </span>
            </div>

            <div v-if="getMarketMetadata(market).length" class="gpu-specs">
              <div
                v-for="meta in getMarketMetadata(market)"
                :key="meta.key"
                class="gpu-spec"
              >
                <span class="gpu-spec-label">{{
                  formatMetadataLabel(meta.key)
                }}</span>
                <span class="gpu-spec-value">{{ meta.value }}</span>
              </div>
            </div>
          </div>
        </template>
      </nuxt-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Market } from "@nosana/kit";
import { useAPI } from "~/composables/useAPI";
import NvidiaIcon from "@/assets/img/icons/nvidia.svg?component";
import CurrentMarketPrice from "~/components/Market/CurrentPrice.vue";

const { data: runningJobs } = await useAPI("/jobs/running");
const tab: Ref<string> = ref("premium");
const config = useRuntimeConfig();

// Define types for market info
interface MarketInfo {
  address: string;
  name?: string;
  type?: string;
  client?: boolean;
  metadata?: Array<{ key: string; value: string }>;
  usd_reward_per_hour?: number;
}

/**
 * Props now accept a jobDefinition object (or similar structure)
 * so we can read the required_vram from the jobDefinition's ops.
 */
const props = defineProps({
  markets: {
    type: Array as PropType<Array<Market>>,
    default: () => [],
  },
  testgridMarkets: {
    type: Array as PropType<Array<MarketInfo>>,
    default: () => [],
  },
  typeFilter: {
    type: Array as PropType<Array<string>>,
    default: () => [],
  },
  select: {
    type: Boolean,
    default: false,
  },
  jobDefinition: {
    type: Object,
    default: null,
  },
  skipAutoSelection: {
    type: Boolean,
    default: false,
  },
  initialMarket: {
    type: Object as PropType<Market | null>,
    default: null,
  },
  showLogo: {
    type: Boolean,
    default: false,
  },
});

// Component setup
const selectedMarket = ref<Market | null>(props.initialMarket || null);
const emit = defineEmits(["selectedMarket"]);
const didInitialSetup = ref(props.initialMarket !== null);

// --- Toolbar state (search / sort) ---
const searchQuery = ref("");
const sortBy = ref<
  "series" | "price-asc" | "price-desc" | "vram-desc" | "vram-asc"
>("series");

// Watch for market selection changes and emit
watch(
  () => selectedMarket.value,
  (newValue: Market | null, oldValue: Market | null) => {
    emit("selectedMarket", newValue);
  },
);

// Watch for external market changes (from parent component)
watch(
  () => props.initialMarket,
  (newInitialMarket, oldInitialMarket) => {
    if (newInitialMarket && newInitialMarket !== selectedMarket.value) {
      selectedMarket.value = newInitialMarket;
    } else if (!newInitialMarket) {
      selectedMarket.value = null;
    }
  },
  { immediate: true },
);

// Compute how much VRAM (in MB) the job definition requires.
// Templates express this as either `vram_total_mb` (MB) or the legacy
// `required_vram` (GB); normalise both to MB so we can compare against markets.
const requiredVRAM = computed(() => {
  const reqs = props.jobDefinition?.meta?.system_requirements;
  if (!reqs) return 0;
  if (reqs.vram_total_mb) return Number(reqs.vram_total_mb);
  if (reqs.required_vram) return Number(reqs.required_vram) * 1024;
  return 0;
});

// Helper function to find market info by address
const findMarketInfo = (market: Market): MarketInfo | undefined => {
  return props.testgridMarkets.find(
    (tgm) => tgm.address === market.address?.toString(),
  );
};

// Helper to get market name
const getMarketName = (market: Market): string => {
  const marketInfo = findMarketInfo(market);
  return marketInfo?.name || market.address?.toString() || "Unknown Market";
};

// Metadata entries to display on a market card
const getMarketMetadata = (
  market: Market,
): Array<{ key: string; value: string }> => {
  return findMarketInfo(market)?.metadata ?? [];
};

// Human-friendly labels for known metadata keys; falls back to title case
const METADATA_LABELS: Record<string, string> = {
  vram: "VRAM",
  gpu: "GPU",
  cpu: "CPU",
  ram: "RAM",
};
const formatMetadataLabel = (key: string): string =>
  METADATA_LABELS[key.toLowerCase()] ??
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Helper to get running job count
const getRunningJobCount = (market: Market): number => {
  if (!runningJobs.value) return 0;
  const address = market.address?.toString();
  return runningJobs.value[address]?.running || 0;
};

/**
 * Filters the list of markets by:
 * - Excluding client markets
 * - The current tab (premium, community, others).
 * - VRAM requirements, if set.
 */
const filteredMarkets = computed(() => {
  if (!props.markets?.length) return [];

  const query = searchQuery.value.trim().toLowerCase();

  const filtered = props.markets.filter((market) => {
    // Search by GPU name
    if (query && !getMarketName(market).toLowerCase().includes(query)) {
      return false;
    }

    const marketInfo = findMarketInfo(market);

    // If no market info exists, show on devnet but filter by others on mainnet
    if (!marketInfo) {
      // On devnet, show all markets regardless of missing testgrid data
      if (config.public.network === "devnet") {
        return true;
      }
      // On mainnet, use the original logic
      return tab.value === "others";
    }

    // Exclude client markets
    if (marketInfo.client === true) {
      return false;
    }

    // Exclude markets that don't meet the job's VRAM requirement
    if (!isMarketCompatible(market)) {
      return false;
    }

    // Filter based on the selected type (PREMIUM or COMMUNITY)
    if (props.typeFilter.length === 1) {
      if (props.typeFilter.includes("PREMIUM")) {
        return marketInfo.type === "PREMIUM";
      }
      if (props.typeFilter.includes("COMMUNITY")) {
        return marketInfo.type === "COMMUNITY";
      }
    }

    return true;
  });

  return sortMarkets(filtered);
});

// Helper to get hourly price for sorting (uses base price without network fee for fair sorting)
const getMarketHourlyPrice = (market: Market) => {
  // Get base USD price from market data (before network fee)
  const marketAddress = market.address?.toString();
  const marketInfo = props.testgridMarkets?.find(
    (m) => m.address === marketAddress,
  );

  if (marketInfo?.usd_reward_per_hour) {
    return marketInfo.usd_reward_per_hour; // Base price for fair sorting
  }

  return Number.MAX_VALUE;
};

// Helper to check if market has available GPUs
const hasAvailableGPUs = (market: Market) => {
  if (market.queueType !== 1) return false;
  return market.queue.length > 0;
};

// Rank a GPU by its model number for sorting (e.g. 3060 < 3070 < 4090).
// Consumer/workstation cards expose a 4-digit number (3060, 4090, 5080, A4000);
// datacenter cards (A100, H100, A40) fall back to their smaller number and
// sort after the consumer range.
const getGpuModelRank = (market: Market): number => {
  const name = getMarketName(market);
  const consumer = name.match(/([3-9]\d{3})/);
  if (consumer) return Number(consumer[1] ?? 0);
  const other = name.match(/(\d{2,3})/);
  if (other) return 100000 + Number(other[1] ?? 0);
  return Number.MAX_SAFE_INTEGER;
};

// Hourly price for sorting; unknown price returns null so it sorts last.
const priceOf = (market: Market): number | null => {
  const price = getMarketHourlyPrice(market);
  return price === Number.MAX_VALUE ? null : price;
};

// Compare two numeric values, always pushing unknown (null) values to the end.
const compareNumbers = (
  a: number | null,
  b: number | null,
  dir: "asc" | "desc",
) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return dir === "asc" ? a - b : b - a;
};

// Sort the filtered markets by the selected toolbar option.
const sortMarkets = (list: Market[]): Market[] => {
  const arr = [...list];

  // Tiebreaker comparator for the selected sort option.
  let comparator: (a: Market, b: Market) => number;
  switch (sortBy.value) {
    case "price-asc":
      comparator = (a, b) => compareNumbers(priceOf(a), priceOf(b), "asc");
      break;
    case "price-desc":
      comparator = (a, b) => compareNumbers(priceOf(a), priceOf(b), "desc");
      break;
    case "vram-desc":
      comparator = (a, b) => compareNumbers(getMarketVram(a), getMarketVram(b), "desc");
      break;
    case "vram-asc":
      comparator = (a, b) => compareNumbers(getMarketVram(a), getMarketVram(b), "asc");
      break;
    case "series":
    default:
      comparator = (a, b) => getGpuModelRank(a) - getGpuModelRank(b);
      break;
  }

  // Unavailable markets always sink below available ones, whatever the sort.
  return arr.sort((a, b) => {
    const availability = Number(hasAvailableGPUs(b)) - Number(hasAvailableGPUs(a));
    if (availability !== 0) return availability;
    return comparator(a, b);
  });
};

// Parse a market metadata VRAM string (e.g. "24GB") into MB.
// The value is stored as a string with a unit suffix; default to GB when
// no unit is present, matching the current backend format.
const parseVramToMb = (value: unknown): number | null => {
  if (value == null) return null;
  const match = String(value).match(/([\d.]+)\s*(GB|MB)?/i);
  if (!match) return null;
  const num = parseFloat(match[1] ?? "");
  if (Number.isNaN(num)) return null;
  return match[2]?.toUpperCase() === "MB" ? num : num * 1024;
};

// Read a market's available VRAM (in MB) from its metadata, if present.
const getMarketVram = (market: Market): number | null => {
  const marketInfo = findMarketInfo(market);
  const entry = marketInfo?.metadata?.find((m) => m.key === "vram");
  return parseVramToMb(entry?.value);
};

/**
 * Check if a market is compatible with the job's VRAM requirements
 * @param market The market to check compatibility for
 * @returns Boolean indicating whether the market meets VRAM requirements
 */
const isMarketCompatible = (market: Market) => {
  const marketVram = getMarketVram(market);

  // If we can't determine the market's VRAM, assume it's compatible
  // (don't auto-mark as incompatible)
  if (marketVram == null) return true;

  return marketVram >= (requiredVRAM.value ?? 0);
};

/**
 * Finds compatible markets of a specific type (Premium or Community)
 * @param gpuType The type of GPU to filter for (PREMIUM or COMMUNITY)
 * @returns Array of compatible markets of the specified type
 */
const findCompatibleMarkets = (gpuType: string) => {
  if (!props.markets?.length) return [];

  return props.markets.filter((market) => {
    const marketInfo = findMarketInfo(market);
    if (!marketInfo) return false;

    return (
      // Must match the requested type (PREMIUM or COMMUNITY)
      marketInfo.type === gpuType &&
      // Must not be a client market
      marketInfo.client !== true &&
      // Must meet VRAM requirements for the job
      isMarketCompatible(market) &&
      // Must have available GPUs
      hasAvailableGPUs(market)
    );
  });
};

/**
 * Main market selection handler - manages auto-selection
 * This is the central function for all selection logic
 */
const selectBestMarket = async () => {
  // Only proceed if we have the markets data
  if (!props.markets?.length) return;

  // Don't attempt auto-selection if the job definition is missing
  if (!props.jobDefinition) return;

  // Try Premium markets first
  let compatibleMarkets = findCompatibleMarkets("PREMIUM");

  // If no Premium markets are available, try Community markets
  if (compatibleMarkets.length === 0) {
    compatibleMarkets = findCompatibleMarkets("COMMUNITY");
  }

  // If we have compatible markets, select the cheapest one
  if (compatibleMarkets.length > 0) {
    const cheapestMarket = compatibleMarkets.sort(
      (a, b) => getMarketHourlyPrice(a) - getMarketHourlyPrice(b),
    )[0];

    // Find the exact reference in the markets array for proper UI highlighting
    const exactRef = props.markets.find(
      (m) => m.address?.toString() === cheapestMarket.address?.toString(),
    );

    // Wait for nextTick to ensure Vue updates the DOM after reactivity changes
    await nextTick();

    // Update the selection
    selectedMarket.value = exactRef || cheapestMarket;
  } else {
    // If no viable market is found, ensure selection is cleared
    selectedMarket.value = null;
  }
};

// Main watcher for auto-selection - DISABLED to preserve user selections
// watch([
//   () => props.markets,
//   () => props.jobDefinition,
//   () => props.testgridMarkets,
//   () => loadingRunningJobs.value,
//   () => stats.value,
//   () => props.isFromRepost,
//   () => props.skipAutoSelection
// ], async () => {
//   // Skip auto-selection if in repost mode or explicitly disabled
//   if (props.isFromRepost ||
//       props.skipAutoSelection ||
//       (props.initialMarket && !didInitialSetup.value)) {
//
//     didInitialSetup.value = true;
//     return;
//   }
//
//   // Auto-select market when appropriate
//   await selectBestMarket();
// }, { immediate: true });
</script>
<style lang="scss" scoped>
@use "sass:color";
.columns {
  position: static;
}

.column {
  position: static;
}

.tabs {
  position: static;
  overflow: visible;
  margin-bottom: 0;

  ul {
    position: static;
    border-bottom: 3px solid $grey-lighter;
    margin-bottom: 0;
    width: 100%;
  }

  li {
    a {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin-bottom: -3px;
      border-bottom-width: 3px;
      border-bottom-color: transparent;
    }

    &.is-active a {
      border-bottom-color: $primary;
    }
  }
}

.has-tooltip-arrow {
  width: 100%;
  display: block;

  &[data-tooltip] {
    &::before,
    &::after {
      z-index: 99999 !important;
    }
  }
}

// Add responsive tooltip styles for mobile
@include touch {
  .tabs {
    li {
      position: relative;

      a {
        flex-wrap: wrap;
      }
    }
  }

  .tooltip-container {
    position: static;

    .has-tooltip-arrow {
      &[data-tooltip] {
        position: static;

        &::before,
        &::after {
          position: absolute !important;
          opacity: 1 !important;
          transform: none !important;
          left: -16px !important;
          right: -16px !important;
          margin: 0 !important;
          width: calc(100% + 32px) !important;
          white-space: normal !important;
          top: 100% !important;
          padding: 0.75rem !important;
          z-index: 99999 !important;
          box-sizing: border-box !important;
          max-width: calc(100vw - 32px) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
        }

        &::before {
          background: $white !important;
          border: 1px solid $grey-lighter !important;
          border-radius: 4px !important;
          color: $grey-dark !important;
          font-size: 0.75rem !important;
          display: block !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          content: attr(data-tooltip) !important;
          margin-top: 4px !important;
        }

        &::after {
          display: none !important;
        }
      }
    }
  }
}

.info-icon {
  width: 14px;
  height: 14px;
  vertical-align: -2px;
  margin-left: 0.25rem;
  opacity: 0.7;
}

td {
  vertical-align: middle;
}

.progress {
  max-width: 100px;

  &::-webkit-progress-bar {
    background-color: color.adjust($secondary, $lightness: 43%);
  }
}

.no-underline {
  text-decoration: none !important;
  border-bottom: none !important;
}

.info-container {
  line-height: 1;
  margin: 0;
  padding: 0;
  height: 20px;
}

.table-container {
  margin-top: 0;
  position: relative;
}

.is-incompatible {
  opacity: 0.5;
  cursor: not-allowed !important;
  background-color: rgba(0, 0, 0, 0.05);
}

.dark-mode .is-incompatible {
  background-color: rgba(255, 255, 255, 0.05);
}

.warning-icon {
  filter: invert(73%) sepia(45%) saturate(5600%) hue-rotate(359deg)
    brightness(101%) contrast(106%);
}

.gpu-logo {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  vertical-align: middle;
}

.table {
  [data-tooltip] {
    position: relative;
    display: inline-block;
    width: 100%;
    text-decoration: none;
    border-bottom: none;
  }

  [data-tooltip]::before,
  [data-tooltip]::after {
    position: absolute;
    z-index: 100;
  }
}

/* Add styles to remove dotted line from all tooltips in the component */
[data-tooltip] {
  text-decoration: none !important;
  border-bottom: none !important;
  cursor: pointer;
}

.dark-mode .is-incompatible {
  background-color: rgba(255, 255, 255, 0.05);
}

.dark-mode .gpu-logo {
  filter: none !important;
}

.warning-icon {
  filter: invert(73%) sepia(45%) saturate(5600%) hue-rotate(359deg)
    brightness(101%) contrast(106%);
}

/* Grid layout */
.gpu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(238px, 1fr));
  gap: 1.15rem;
}

/* Card */
.gpu-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: #ffffff;
  border: 1px solid #e6e8eb;
  border-radius: 14px;
  padding: 1.15rem 1.15rem 1.25rem;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.gpu-card:hover {
  border-color: #10e80c;
  box-shadow: 0 10px 24px rgba(16, 40, 22, 0.1);
  transform: translateY(-2px);
}

.gpu-card.is-selected {
  border-color: #10e80c;
  background: #f5fff4;
  box-shadow: 0 0 0 3px rgba(16, 232, 12, 0.16);
}

.gpu-card.is-incompatible {
  opacity: 0.45;
  cursor: not-allowed;
  border-color: #e6e8eb;
}

.gpu-card.is-incompatible:hover {
  border-color: #e6e8eb;
  box-shadow: none;
  transform: none;
}

/* Card header: model name (wraps to a reserved 2 lines so cards stay aligned) */
.gpu-card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.gpu-logo {
  width: 20px;
  height: 20px;
  margin: 1px 0 0;
  object-fit: contain;
  flex-shrink: 0;
}

.gpu-name {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: #1a1c1e;
  margin: 0;
  min-width: 0;
  min-height: 2.6em;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Price + availability */
.gpu-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.gpu-status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 600;
  color: #80868b;
  padding: 0.2rem 0.5rem 0.2rem 0.4rem;
  border-radius: 999px;
  background: #f1f3f4;
  white-space: nowrap;
}

.gpu-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #bdc1c6;
  flex-shrink: 0;
}

.gpu-status.is-available {
  color: #0a8f19;
  background: #e9fbe8;
}

.gpu-status.is-available .gpu-status-dot {
  background: #10e80c;
  box-shadow: 0 0 0 3px rgba(16, 232, 12, 0.2);
  animation: gpu-pulse 2.4s ease-in-out infinite;
}

@keyframes gpu-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 2px rgba(16, 232, 12, 0.24);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(16, 232, 12, 0.05);
  }
}

@media (prefers-reduced-motion: reduce) {
  .gpu-status.is-available .gpu-status-dot {
    animation: none;
  }
}

/* Price (CurrentMarketPrice inherits size/weight) */
.gpu-price {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: #14161a;
}

/* Spec strip */
.gpu-specs {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-top: 0.85rem;
  border-top: 1px solid #eceef0;
}

.gpu-spec {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
}

.gpu-spec-label {
  color: #80868b;
  font-weight: 500;
}

.gpu-spec-value {
  color: #1a1c1e;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Dark mode card */
.dark-mode .gpu-card {
  background: #242526;
  border-color: #383a3c;
}

.dark-mode .gpu-card:hover {
  border-color: #10e80c;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}

.dark-mode .gpu-card.is-selected {
  background: #14240f;
  border-color: #10e80c;
  box-shadow: 0 0 0 3px rgba(16, 232, 12, 0.22);
}

.dark-mode .gpu-card.is-incompatible {
  border-color: #383a3c;
}

.dark-mode .gpu-name {
  color: #eceef0;
}

.dark-mode .gpu-price {
  color: #ffffff;
}

.dark-mode .gpu-status {
  color: #9aa0a6;
  background: rgba(255, 255, 255, 0.06);
}

.dark-mode .gpu-status-dot {
  background: #6b6f73;
}

.dark-mode .gpu-status.is-available {
  color: #5ce15c;
  background: rgba(16, 232, 12, 0.12);
}

.dark-mode .gpu-status.is-available .gpu-status-dot {
  background: #10e80c;
}

.dark-mode .gpu-specs {
  border-top-color: #383a3c;
}

.dark-mode .gpu-spec-label {
  color: #9aa0a6;
}

.dark-mode .gpu-spec-value {
  color: #eceef0;
}

/* Toolbar */
.market-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.15rem;
}

.market-search {
  position: relative;
  flex: 1 1 220px;
  min-width: 180px;
}

.market-search-icon {
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9aa0a6;
  pointer-events: none;
}

.market-search-input {
  width: 100%;
  height: 40px;
  padding: 0 0.9rem 0 2.35rem;
  font-size: 0.875rem;
  color: #1a1c1e;
  background: #ffffff;
  border: 1px solid #e1e3e6;
  border-radius: 10px;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.market-search-input::placeholder {
  color: #9aa0a6;
}

.market-search-input:focus {
  border-color: #10e80c;
  box-shadow: 0 0 0 3px rgba(16, 232, 12, 0.15);
}

.market-sort-control {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 40px;
  background: #ffffff;
  border: 1px solid #e1e3e6;
  border-radius: 10px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.market-sort-control:focus-within {
  border-color: #10e80c;
  box-shadow: 0 0 0 3px rgba(16, 232, 12, 0.15);
}

.market-sort-prefix {
  display: inline-flex;
  align-items: center;
  align-self: stretch;
  padding: 0 0.7rem 0 0.85rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #80868b;
  border-right: 1px solid #e1e3e6;
}

.market-sort-select {
  appearance: none;
  -webkit-appearance: none;
  height: 100%;
  padding: 0 2rem 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1c1e;
  background: transparent;
  border: none;
  border-radius: 0 10px 10px 0;
  cursor: pointer;
  outline: none;
}

.market-sort-caret {
  position: absolute;
  right: 0.7rem;
  width: 16px;
  height: 16px;
  color: #80868b;
  pointer-events: none;
}

/* Dark mode toolbar */
.dark-mode .market-search-input,
.dark-mode .market-sort-control {
  background: #242526;
  border-color: #3a3a3a;
}

.dark-mode .market-sort-select {
  color: #eceef0;
}

.dark-mode .market-search-input {
  color: #eceef0;
}

.dark-mode .market-search-input::placeholder {
  color: #80868b;
}

.dark-mode .market-search-input:focus,
.dark-mode .market-sort-control:focus-within {
  border-color: #10e80c;
  box-shadow: 0 0 0 3px rgba(16, 232, 12, 0.2);
}

.dark-mode .market-sort-prefix {
  color: #9aa0a6;
  border-right-color: #3a3a3a;
}

.dark-mode .market-search-icon,
.dark-mode .market-sort-caret {
  color: #80868b;
}
</style>
