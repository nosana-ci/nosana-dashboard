<template>
  <div class="req-steps">
    <!-- Step: the GPU, picked as its market, which sets the hourly price -->
    <section class="deploy-step">
      <header class="deploy-step-head">
        <span class="deploy-step-num" aria-hidden="true"></span>
        <h3>Choose a GPU</h3>
        <div class="req-toolbar deploy-step-action">
          <label class="req-search">
            <DeployCategoryIcon icon="search" />
            <input
              v-model="gpuQuery"
              type="search"
              placeholder="Search GPUs"
              aria-label="Search GPUs"
            />
          </label>
          <label class="req-search req-sort">
            <span class="req-sort-prefix">Sort</span>
            <select v-model="gpuSort" aria-label="Sort GPUs">
              <option
                v-for="sort in GPU_SORTS"
                :key="sort.value"
                :value="sort.value"
              >
                {{ sort.label }}
              </option>
            </select>
            <svg class="req-caret" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </label>
        </div>
      </header>

      <div class="req-main" role="radiogroup" aria-label="GPU">
        <div v-if="error" class="section-row req-notice">
          <span class="req-dot" />
          <span>Host data is temporarily unavailable</span>
          <button type="button" class="req-link" @click="refresh()">
            Retry
          </button>
        </div>

        <p v-if="pending && !listings.length" class="section-row req-hint">
          Loading GPUs…
        </p>
        <p v-else-if="!listedGpus.length" class="section-row req-hint">
          {{ gpuQuery ? `No GPUs match “${gpuQuery}”` : "No GPUs available" }}
        </p>

        <label
          v-for="row in listedGpus"
          :key="row.listing.market.address"
          class="section-row gpu-row"
          :class="{ 'is-selected': row.selected, 'is-dim': row.dim }"
        >
          <input
            type="radio"
            name="gpu"
            :value="row.listing.market.address"
            :checked="row.selected"
            :disabled="row.dim"
            @change="emit('update:modelValue', row.listing.market.address)"
          />
          <span class="req-gpu-logo" aria-hidden="true">
            <NvidiaIcon class="req-gpu-logo-mark" />
          </span>
          <span class="gpu-row-text">
            <strong>
              {{ row.listing.market.name }}
              <span
                v-if="row.listing.market.address === recommendedMarket"
                class="gpu-row-rec"
              >
                Recommended
              </span>
            </strong>
            <small>{{ row.subline }}</small>
          </span>
          <span class="gpu-row-price">
            <template v-if="row.listing.usd !== null">
              ${{ row.listing.usd.toFixed(2) }}<small>/h</small>
            </template>
            <template v-else>—</template>
          </span>
        </label>

        <div v-if="hiddenGpus.length" class="section-row gpu-row-hidden">
          <span>{{ hiddenNote }}</span>
          <button
            type="button"
            class="req-link"
            @click="showHidden = !showHidden"
          >
            {{ showHidden ? "Hide them" : "Show them" }}
          </button>
        </div>
      </div>
    </section>

    <!-- Step: host requirements, previewed but not yet open -->
    <section class="deploy-step">
      <header class="deploy-step-head">
        <span class="deploy-step-num" aria-hidden="true"></span>
        <h3>Add requirements</h3>
        <span class="deploy-step-tag">Coming soon</span>
      </header>

      <div class="req-main req-teaser" aria-disabled="true">
        <div class="req-tabs" aria-label="Requirements">
          <button
            v-for="category in HOST_CATEGORIES"
            :key="category.id"
            type="button"
            class="req-pill"
            disabled
          >
            <DeployCategoryIcon :icon="category.icon" />
            <span class="req-pill-label">{{ category.label }}</span>
          </button>
        </div>
        <p class="deploy-step-hint req-subtitle">
          Pin down the CUDA version, RAM and CPU, location and bandwidth, and
          free disk your workload needs.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import NvidiaIcon from "@/assets/img/icons/nvidia.svg?component";
import {
  REQUIREMENT_CATEGORIES,
  marketFitsVram,
  useMarketListings,
  type MarketListing,
  type MarketRate,
  type MatchingHosts,
} from "~/composables/useNodeRequirements";

interface Props {
  /** The chosen market's address. */
  modelValue: string | null;
  /** The testgrid `/markets` rows: the markets to list, with their prices. */
  markets: MarketRate[] | null;
  /** The VRAM the job definition asks for; GPUs below it are hidden. */
  requiredVramGb: number | null;
  /** The market the page defaults to, labelled and listed first. */
  recommendedMarket?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: string];
  /** The chosen market's hosts: every one, those free now, and those busy now. */
  matching: [value: MatchingHosts | null];
}>();

// The host requirement categories, previewed below the GPU list.
const HOST_CATEGORIES = REQUIREMENT_CATEGORIES.filter(
  (category) => category.id !== "gpu",
);

// --- GPU: one row per deployable market, with live host counts ---
const { listings, pending, counting, error, refresh } = useMarketListings(
  () => props.markets,
  { live: true },
);
const gpuQuery = ref("");
const showHidden = ref(false);

// The same order as the Markets tab: by model number (3060 < 3070 < 4090 <
// 5090), datacenter cards (A100, H100) after the consumer range, then by name.
function gpuModelRank(name: string) {
  const consumer = name.match(/([3-9]\d{3})/);
  if (consumer) return Number(consumer[1]);
  const other = name.match(/(\d{2,3})/);
  if (other) return 100000 + Number(other[1]);
  return Number.MAX_SAFE_INTEGER;
}

interface GpuRow {
  listing: MarketListing;
  subline: string;
  /** Below the workload's VRAM, or not reporting any: listed only on request, never selectable. */
  dim: boolean;
  selected: boolean;
}

const gpuRows = computed<GpuRow[]>(() =>
  listings.value.map((listing) => {
    const dim = !marketFitsVram(listing, props.requiredVramGb);
    const vram = listing.vramGb === null ? null : `${listing.vramGb} GB`;
    const hosts = counting.value
      ? "checking hosts…"
      : `${listing.available} available · ${listing.working} working`;
    return {
      listing,
      subline: dim
        ? vram
          ? `below ${props.requiredVramGb} GB VRAM`
          : "VRAM not reported"
        : [vram, hosts].filter(Boolean).join(" · "),
      dim,
      selected: listing.market.address === props.modelValue,
    };
  }),
);

const compatibleGpus = computed(() => gpuRows.value.filter((row) => !row.dim));
const hiddenGpus = computed(() =>
  gpuRows.value.filter((row) => row.dim).sort(bySeries),
);
// "3 GPUs hidden: below your workload's 24 GB VRAM, or not reporting VRAM".
const hiddenNote = computed(() => {
  const count = hiddenGpus.value.length;
  const unknown = hiddenGpus.value.some((row) => row.listing.vramGb === null);
  const below = hiddenGpus.value.some((row) => row.listing.vramGb !== null);
  const why = [
    below && `below your workload's ${props.requiredVramGb} GB VRAM`,
    unknown && "not reporting VRAM",
  ]
    .filter(Boolean)
    .join(", or ");
  return `${count} GPU${count === 1 ? "" : "s"} hidden: ${why}`;
});

// --- Sorting the list, as on the Markets tab ---
type GpuSort =
  | "recommended"
  | "series"
  | "price-asc"
  | "price-desc"
  | "vram-desc"
  | "vram-asc"
  | "available";

// A custom deployment has no recommended GPU: its default sort is by
// availability alone.
const GPU_SORTS = computed<Array<{ value: GpuSort; label: string }>>(() => [
  {
    value: "recommended",
    label: props.recommendedMarket ? "Recommended" : "Available first",
  },
  { value: "series", label: "GPU series" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "vram-desc", label: "VRAM: high to low" },
  { value: "vram-asc", label: "VRAM: low to high" },
  { value: "available", label: "Most available" },
]);
const gpuSort = ref<GpuSort>("recommended");

// Prices compared in either direction; an unpriced GPU always goes last.
function byPrice(a: GpuRow, b: GpuRow, direction: 1 | -1) {
  const [usdA, usdB] = [a.listing.usd, b.listing.usd];
  if (usdA === null || usdB === null) {
    return Number(usdA === null) - Number(usdB === null);
  }
  return (usdA - usdB) * direction;
}

// By model: 3060 < 3070 < 4090, datacenter cards after, then by name.
function bySeries(a: GpuRow, b: GpuRow) {
  const [nameA, nameB] = [a.listing.market.name, b.listing.market.name];
  return (
    gpuModelRank(nameA) - gpuModelRank(nameB) || nameA.localeCompare(nameB)
  );
}

// Those with a host free now first, then by series.
function compareGpus(a: GpuRow, b: GpuRow) {
  return (
    Number(b.listing.available > 0) - Number(a.listing.available > 0) ||
    bySeries(a, b)
  );
}

const isRecommended = (row: GpuRow) =>
  Number(row.listing.market.address === props.recommendedMarket);

// Each sort orders by exactly what it names; ties fall back to the series.
const SORTERS: Record<GpuSort, (a: GpuRow, b: GpuRow) => number> = {
  // The recommended GPU first, then those with a host free now, by series.
  recommended: (a, b) =>
    isRecommended(b) - isRecommended(a) || compareGpus(a, b),
  series: bySeries,
  "price-asc": (a, b) => byPrice(a, b, 1),
  "price-desc": (a, b) => byPrice(a, b, -1),
  "vram-desc": (a, b) => (b.listing.vramGb ?? 0) - (a.listing.vramGb ?? 0),
  "vram-asc": (a, b) => (a.listing.vramGb ?? 0) - (b.listing.vramGb ?? 0),
  // Most hosts free now first, then most coming back as jobs finish.
  available: (a, b) =>
    b.listing.available - a.listing.available ||
    b.listing.working - a.listing.working,
};

// The compatible rows in the chosen order, then the hidden ones once
// revealed, all narrowed by the search.
const listedGpus = computed(() => {
  const query = gpuQuery.value.trim().toLowerCase();
  const sorter = SORTERS[gpuSort.value];
  const compatible = [...compatibleGpus.value].sort(
    (a, b) => sorter(a, b) || bySeries(a, b),
  );
  const shown = showHidden.value
    ? [...compatible, ...hiddenGpus.value]
    : compatible;
  return shown.filter(
    (row) => !query || row.listing.market.name.toLowerCase().includes(query),
  );
});

// --- Availability: the chosen market's hosts, for the summary ---
const matching = computed<MatchingHosts | null>(() => {
  const listing = listings.value.find(
    (entry) => entry.market.address === props.modelValue,
  );
  return listing
    ? {
        hosts: listing.available + listing.working,
        available: listing.available,
        working: listing.working,
      }
    : null;
});
watch(matching, (value) => emit("matching", value), { immediate: true });
</script>

<style lang="scss" scoped>
$mono: ui-monospace, "SF Mono", "JetBrains Mono", "Cascadia Code", Menlo,
  Consolas, monospace;

// --- Two steps, one under the other: the GPU list, then the host requirements ---
.req-steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

// --- The requirement categories, as a row of pills ---
.req-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 18px 18px 0;
}

.req-subtitle {
  margin: 12px 18px 0;
}

.req-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 999px;
  border: 1px solid $border-soft;
  background: $white;
  color: $text-muted;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  text-align: left;

  svg {
    flex-shrink: 0;
    font-size: 14px;
  }
}

.req-pill-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// --- Each step's card: rows that run edge to edge (the GPU list), or the
// category pills over a note (the requirements preview) ---
.req-main {
  @include soft-panel;
  padding: 0;
}

// Previewed, not open yet: the pills sit faded over the note, and nothing
// in the card responds. Padded below the note, which has no body under it.
.req-main.req-teaser {
  padding-bottom: 18px;

  .req-pill {
    opacity: 0.55;
    cursor: default;
  }
}

// --- GPU list: one row per market ---
.gpu-row {
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: $surface-hover;
  }

  &.is-selected {
    background: rgba($secondary, 0.07);
    box-shadow: inset 3px 0 0 $secondary;
  }

  &.is-dim {
    opacity: 0.5;
    cursor: default;

    &:hover {
      background: transparent;
    }
  }

  // The radio is the control for assistive tech; the row is the control
  // for everyone else.
  input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: 0;
    opacity: 0;
    pointer-events: none;
  }
}

// Always dark: the tile is the brand mark, in either theme.
.req-gpu-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 11px;
  background: #0a0c0a;
  border: 1px solid rgba($secondary, 0.2);
  color: $secondary;
}

.req-gpu-logo-mark {
  width: 26px;
  height: 26px;
  fill: currentColor;
}

.gpu-row-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;

  strong {
    font-size: 0.95rem;
    font-weight: 600;
    color: $text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    margin-top: 2px;
    font-family: $mono;
    font-size: 0.75rem;
    color: $text-muted;
  }
}

.gpu-row-rec {
  margin-left: 6px;
  font-family: $family-sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: $secondary-text;
}

.gpu-row-price {
  flex-shrink: 0;
  margin-left: auto;
  font-family: $title-family;
  font-size: 1.125rem;
  font-weight: 700;
  color: $text;
  text-align: right;
  white-space: nowrap;

  small {
    font-family: inherit;
    font-size: 0.72rem;
    font-weight: 400;
    color: $text-muted;
  }
}

.gpu-row-hidden {
  font-size: 0.78rem;
  color: $text-muted;

  .req-link {
    margin-left: auto;
  }
}

.req-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  color: $secondary-text;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.req-hint {
  margin: 0;
  font-size: 0.78rem;
  color: $text-muted;
}

.req-notice {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: $text-muted;

  .req-link {
    margin-left: auto;
  }
}

.req-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #b8bcc2;
}

// Search and sort, at the end of the GPU step's heading.
.req-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

// The sort reuses the search field's pill; sized to its choice instead.
.req-search.req-sort {
  position: relative;
  width: auto;
  padding-right: 0;

  select {
    appearance: none;
    padding: 0.5625rem 2rem 0.5625rem 0;
    border: 0;
    background: transparent;
    outline: none;
    font-family: inherit;
    font-size: 0.84rem;
    font-weight: 600;
    color: $text;
    cursor: pointer;
  }

  .req-caret {
    right: 0.75rem;
  }
}

.req-sort-prefix {
  flex-shrink: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: $text-muted;
}

.req-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 240px;
  max-width: 100%;
  padding: 0 0.75rem;
  border-radius: 999px;
  border: 1px solid $border-soft;
  background: $white;
  color: $text-muted;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus-within {
    border-color: $secondary;
    box-shadow: 0 0 0 3px rgba($secondary, 0.15);
  }

  svg {
    flex-shrink: 0;
    font-size: 15px;
  }

  input {
    flex: 1;
    min-width: 0;
    padding: 0.5625rem 0;
    border: 0;
    background: transparent;
    outline: none;
    font-family: inherit;
    font-size: 0.84rem;
    color: $text;

    &::placeholder {
      color: $text-muted;
    }
  }
}

.req-caret {
  position: absolute;
  right: 0.6rem;
  width: 14px;
  height: 14px;
  fill: none;
  stroke: $text-muted;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .gpu-row {
    transition: none;
  }
}

// --- Dark theme ---
html.dark-mode {
  .req-link {
    color: $secondary;
  }

  .gpu-row-rec {
    color: $secondary;
  }

  .gpu-row-text strong,
  .gpu-row-price {
    color: $white;
  }

  .gpu-row {
    &:hover {
      background: rgba($white, 0.04);
    }

    &.is-selected {
      background: rgba($secondary, 0.09);
    }

    &.is-dim:hover {
      background: transparent;
    }
  }

  .req-pill {
    background: rgba($white, 0.04);
    border-color: rgba($white, 0.14);
    color: #d7e0d7;
  }

  .req-search {
    background: rgba($white, 0.04);
    border-color: rgba($white, 0.12);

    input,
    select {
      color: $white;
      color-scheme: dark;
    }
  }

  .req-dot {
    background: #5e6266;
  }
}
</style>
