<template>
  <div class="req-steps">
    <!-- Step: the GPUs the deployment may run on; each job goes to the cheapest with a host free -->
    <section class="deploy-step">
      <header class="deploy-step-head">
        <span class="deploy-step-num" aria-hidden="true"></span>
        <h3>Choose GPUs</h3>
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
          <DeployVramRange
            v-if="vramSizes.length > 1"
            v-model="vramRange"
            :sizes="vramSizes"
          />
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

      <div class="req-main" role="group" aria-label="GPUs">
        <div v-if="notice" class="section-row req-notice">
          <span class="req-dot" />
          <span>{{ notice.text }}</span>
          <button type="button" class="req-link" @click="notice.retry()">
            Retry
          </button>
        </div>

        <!-- List header: the selection count, and the bulk actions on the right -->
        <div v-if="listedGpus.length" class="section-row gpu-list-head">
          <span title="Each job goes to the cheapest selected GPU with a host free">
            {{ selectionLabel }}
          </span>
          <span class="gpu-list-actions">
            <button
              v-if="!allShownSelected"
              type="button"
              class="req-link"
              @click="selectAllShown"
            >
              Select all
            </button>
            <button
              v-if="modelValue.length"
              type="button"
              class="req-link"
              @click="deselectAll"
            >
              Clear
            </button>
          </span>
        </div>

        <p v-if="pending && !listings.length" class="section-row req-hint">
          Loading GPUs…
        </p>
        <p v-else-if="!listedGpus.length" class="section-row req-hint">
          {{
            gpuQuery || vramRange
              ? "No GPUs match your search"
              : "No GPUs available"
          }}
        </p>

        <!-- The rows scroll inside the card; the header above stays put -->
        <div v-if="listedGpus.length" class="gpu-list">
          <label
            v-for="row in listedGpus"
            :key="row.listing.name"
            class="section-row gpu-row"
            :class="{ 'is-selected': row.selected, 'is-dim': row.dim }"
            @mousedown="keepTextUnselected"
            @click="selectRange(row, $event)"
          >
            <input
              type="checkbox"
              :value="row.listing.name"
              :checked="row.selected"
              :disabled="row.dim && !row.selected"
              @change="onGpuChange(row)"
            />
            <span class="req-gpu-logo" aria-hidden="true">
              <NvidiaIcon class="req-gpu-logo-mark" />
            </span>
            <span class="gpu-row-text">
              <strong>
                {{ row.listing.name }}
                <span
                  v-if="row.listing.name === recommendedGpu"
                  class="gpu-row-rec"
                >
                  Recommended
                </span>
              </strong>
              <small>{{ row.subline }}</small>
            </span>
            <span class="gpu-row-price">
              <template v-if="row.listing.usd">
                {{ formatPriceRange(row.listing.usd) }}<small>/h</small>
              </template>
              <template v-else>—</template>
            </span>
          </label>
        </div>

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

    <!-- Step: optional host requirements, one category at a time (for now: coming soon, no controls) -->
    <section class="deploy-step">
      <header class="deploy-step-head">
        <span class="deploy-step-num" aria-hidden="true"></span>
        <h3>Add requirements</h3>
        <span class="deploy-step-tag">
          {{ REQUIREMENTS_COMING_SOON ? "Coming soon" : "Optional" }}
        </span>
      </header>

      <div v-if="REQUIREMENTS_COMING_SOON" class="req-main">
        <div class="req-tabs">
          <span
            v-for="category in REQUIREMENT_CATEGORIES"
            :key="category.id"
            class="req-pill is-soon"
          >
            <DeployCategoryIcon :icon="category.icon" />
            <span class="req-pill-label">{{ category.label }}</span>
          </span>
        </div>
        <p class="deploy-step-hint req-subtitle req-soon-hint">
          Pin down the CUDA version, RAM and CPU, location and bandwidth, and
          free disk your workload needs.
        </p>
      </div>

      <div v-else class="req-main">
        <template v-if="requirementCategories.length">
          <div class="req-tabs" role="tablist" aria-label="Requirements">
            <button
              v-for="category in requirementCategories"
              :key="category.id"
              type="button"
              role="tab"
              class="req-pill"
              :class="{ 'is-active': activeCategory === category.id }"
              :aria-selected="activeCategory === category.id"
              @click="pickedCategory = category.id"
            >
              <DeployCategoryIcon :icon="category.icon" />
              <span class="req-pill-label">{{ category.label }}</span>
              <span v-if="categoryCounts[category.id]" class="req-badge">
                {{ categoryCounts[category.id] }}
              </span>
            </button>
          </div>
          <p
            v-if="activeCategory && PANEL_SUBTITLES[activeCategory]"
            class="deploy-step-hint req-subtitle"
          >
            {{ PANEL_SUBTITLES[activeCategory] }}
          </p>
        </template>
        <p v-else class="section-row req-hint">
          {{
            optionsPending
              ? "Loading host details…"
              : "Hosts report nothing to filter on yet."
          }}
        </p>

        <div v-if="panelControls.length" class="req-body">
          <div
            v-for="control in panelControls"
            :key="control.key"
            class="req-field"
          >
            <span :id="`req-label-${control.key}`" class="req-field-label">
              {{ control.label }}
              <span v-if="control.note">{{ control.note }}</span>
            </span>

            <div
              v-if="control.kind === 'segments'"
              class="dep-tabs req-segments"
              role="group"
              :aria-labelledby="`req-label-${control.key}`"
            >
              <button
                type="button"
                class="dep-tab"
                :class="{ 'is-active': !(control.key in requirements) }"
                :aria-pressed="!(control.key in requirements)"
                @click="setRequirement(control.key, undefined)"
              >
                Any
              </button>
              <button
                v-for="segment in control.segments"
                :key="String(segment.value)"
                type="button"
                class="dep-tab"
                :class="{
                  'is-active': requirements[control.key] === segment.value,
                }"
                :aria-pressed="requirements[control.key] === segment.value"
                @click="setRequirement(control.key, segment.value)"
              >
                {{ segment.label }}
              </button>
            </div>

            <template v-else-if="control.kind === 'slider'">
              <div class="req-range">
                <div class="range-slider">
                  <div
                    class="range-slider__fill"
                    :style="{ width: `${fillPercent(control)}%` }"
                  ></div>
                  <input
                    type="range"
                    class="range-slider__range"
                    min="0"
                    :max="control.max"
                    :step="control.step"
                    :value="sliderPosition(control)"
                    :aria-label="control.label"
                    :aria-valuetext="boxValue(control)"
                    @input="onSlide(control, $event)"
                  />
                </div>
                <span class="req-num">
                  <input
                    type="text"
                    inputmode="decimal"
                    :value="boxValue(control)"
                    :aria-label="`${control.label} in ${control.unit}`"
                    @change="onBox(control, $event)"
                  />
                  <span>{{ control.unit }}</span>
                </span>
              </div>
              <div class="req-ticks">
                <span v-for="tick in control.ticks" :key="tick.value">
                  {{ tick.label }}
                </span>
              </div>
            </template>

            <div v-else class="req-select">
              <select
                :value="selectedIndex(control)"
                :aria-labelledby="`req-label-${control.key}`"
                @change="onSelect(control, $event)"
              >
                <option value="">{{ control.anyLabel }}</option>
                <option
                  v-for="(choice, index) in control.choices"
                  :key="index"
                  :value="String(index)"
                >
                  {{ choice.label }}
                </option>
              </select>
              <svg class="req-caret" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import NvidiaIcon from "@/assets/img/icons/nvidia.svg?component";
import {
  REQUIREMENT_CATEGORIES,
  categoryOfKey,
  countryName,
  cudaVersions,
  formatPriceRange,
  gpuFitsVram,
  hostsOf,
  keepSupportedRequirements,
  listingsOf,
  useGpuListings,
  useQualifyingHosts,
  useRequirementOptions,
  withGpus,
  type GpuListing,
  type MarketRate,
  type MatchingHosts,
  type RequirementCategoryId,
  type RequirementOption,
  type RequirementValue,
  type Requirements,
} from "~/composables/useNodeRequirements";

interface Props {
  /** The chosen GPUs' names: the deployment runs on any of them. */
  modelValue: string[];
  /** The host requirements beyond the GPUs, which narrow their hosts. */
  requirements: Requirements;
  /** The testgrid `/markets` rows: the markets the GPUs are priced from. */
  markets: MarketRate[] | null;
  /** The VRAM the job definition asks for; GPUs below it are hidden. */
  requiredVramGb: number | null;
  /** The GPU the page defaults to, labelled and listed first. */
  recommendedGpu?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: string[]];
  "update:requirements": [value: Requirements];
  /** The chosen GPUs' hosts: every one, those free now, and those busy now. */
  matching: [value: MatchingHosts | null];
}>();

// Temporary: the host requirements step shows as coming soon, with no
// controls. Set to false to bring the controls back.
const REQUIREMENTS_COMING_SOON = true;

const PANEL_SUBTITLES: Record<RequirementCategoryId, string> = {
  compute: "Set compute related requirements for hosts.",
  network: "Where hosts are and how well they are connected.",
  storage: "Free disk the host must have for your image and model files.",
};

// The requirement category a pill click picked, while it is listed; else the
// first listed one.
const pickedCategory = ref<RequirementCategoryId | null>(null);
const activeCategory = computed<RequirementCategoryId | null>(() => {
  const listed = requirementCategories.value.map((category) => category.id);
  if (pickedCategory.value && listed.includes(pickedCategory.value)) {
    return pickedCategory.value;
  }
  return listed[0] ?? null;
});

// --- GPUs: one row per model in host-manager's catalogue, with live host counts ---
const { listings, pending, error, refresh } = useGpuListings(
  () => props.markets,
  { live: true },
);
const gpuQuery = ref("");
// The VRAM sizes shown, from the filter next to the search; null shows all.
const vramRange = ref<[number, number] | null>(null);
const showHidden = ref(false);

// Every size a listed GPU comes in: the filter's stops.
const vramSizes = computed(() =>
  [...new Set(listings.value.map((listing) => listing.vramGb))].sort(
    (a, b) => a - b,
  ),
);

// Datacenter generations, oldest first: Tesla T4/V100, then A100, L40, H100, B200.
const DATACENTER_GENERATIONS = ["K", "P", "T", "V", "A", "L", "H", "B"];

/**
 * Pure: a GPU's place in the series order, as [tier, rank]. Tiers: consumer
 * (GeForce), workstation (RTX A-series, Ada, PRO), datacenter, then anything
 * unrecognised. Within a tier: generation, then model number (3060 < 3070 <
 * 4090; A4000 < A6000 < 6000 Ada; A100 < L40S < H100 < B200).
 */
function gpuSeries(name: string): [number, number] {
  if (/GeForce|GTX/.test(name)) {
    return [0, Number(name.match(/(\d{3,4})/)?.[1] ?? 0)];
  }
  const workstation = name.match(/RTX (?:PRO )?(A)?(\d{4})/);
  if (workstation) {
    const generation = /Blackwell/.test(name) ? 3 : /Ada/.test(name) ? 2 : workstation[1] ? 1 : 0;
    return [1, generation * 10000 + Number(workstation[2])];
  }
  const datacenter = name.match(/\b([A-Z])(\d{1,3})/);
  const generation = datacenter ? DATACENTER_GENERATIONS.indexOf(datacenter[1] ?? "") : -1;
  if (datacenter && generation >= 0) {
    return [2, generation * 1000 + Number(datacenter[2])];
  }
  return [3, 0];
}

interface GpuRow {
  listing: GpuListing;
  subline: string;
  /** Below the workload's VRAM: listed only on request, never selectable. */
  dim: boolean;
  selected: boolean;
}

const gpuRows = computed<GpuRow[]>(() =>
  listings.value.map((listing) => {
    const dim = !gpuFitsVram(listing, props.requiredVramGb);
    return {
      listing,
      subline: dim
        ? `${listing.vramGb} GB · below ${props.requiredVramGb} GB VRAM`
        : `${listing.vramGb} GB · ${listing.available} available · ${listing.working} working`,
      dim,
      selected: props.modelValue.includes(listing.name),
    };
  }),
);

const compatibleGpus = computed(() => gpuRows.value.filter((row) => !row.dim));
const hiddenGpus = computed(() =>
  gpuRows.value.filter((row) => row.dim).sort(bySeries),
);
// "3 GPUs hidden: below your workload's 24 GB VRAM".
const hiddenNote = computed(() => {
  const count = hiddenGpus.value.length;
  return `${count} GPU${count === 1 ? "" : "s"} hidden: below your workload's ${props.requiredVramGb} GB VRAM`;
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

// A custom deployment has no recommended GPU: its default sort is the same
// without one, hosts free now first, cheapest first.
const GPU_SORTS = computed<Array<{ value: GpuSort; label: string }>>(() => [
  {
    value: "recommended",
    label: props.recommendedGpu ? "Recommended" : "Cheapest available",
  },
  { value: "series", label: "GPU series" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "vram-desc", label: "VRAM: high to low" },
  { value: "vram-asc", label: "VRAM: low to high" },
  { value: "available", label: "Most available" },
]);
const gpuSort = ref<GpuSort>("recommended");

// Prices compared in either direction by the cheapest market; an unpriced
// GPU always goes last.
function byPrice(a: GpuRow, b: GpuRow, direction: 1 | -1) {
  const [usdA, usdB] = [a.listing.usd, b.listing.usd];
  if (usdA === null || usdB === null) {
    return Number(usdA === null) - Number(usdB === null);
  }
  return (usdA.min - usdB.min) * direction;
}

// Consumer, then workstation, then datacenter cards, each in model order;
// then by name.
function bySeries(a: GpuRow, b: GpuRow) {
  const [nameA, nameB] = [a.listing.name, b.listing.name];
  const [[tierA, rankA], [tierB, rankB]] = [gpuSeries(nameA), gpuSeries(nameB)];
  return tierA - tierB || rankA - rankB || nameA.localeCompare(nameB);
}

const isRecommended = (row: GpuRow) =>
  Number(row.listing.name === props.recommendedGpu);

// Each sort orders by exactly what it names; ties fall back to the series.
const SORTERS: Record<GpuSort, (a: GpuRow, b: GpuRow) => number> = {
  // The recommended GPU first, then those with a host free now, cheapest first.
  // Cheapest first is where a deployment on them actually lands.
  recommended: (a, b) =>
    isRecommended(b) - isRecommended(a) ||
    Number(b.listing.available > 0) - Number(a.listing.available > 0) ||
    byPrice(a, b, 1),
  series: bySeries,
  "price-asc": (a, b) => byPrice(a, b, 1),
  "price-desc": (a, b) => byPrice(a, b, -1),
  "vram-desc": (a, b) => b.listing.vramGb - a.listing.vramGb,
  "vram-asc": (a, b) => a.listing.vramGb - b.listing.vramGb,
  // Most hosts free now first, then most coming back as jobs finish.
  available: (a, b) =>
    b.listing.available - a.listing.available ||
    b.listing.working - a.listing.working,
};

// The search and the VRAM filter only narrow what is shown: a chosen GPU
// stays listed (and chosen) whatever they say.
function isShown(row: GpuRow, query: string) {
  if (row.selected) return true;
  const range = vramRange.value;
  const inRange =
    !range ||
    (row.listing.vramGb >= range[0] && row.listing.vramGb <= range[1]);
  return inRange && (!query || row.listing.name.toLowerCase().includes(query));
}

// The compatible rows in the chosen order, then the hidden ones once
// revealed, all narrowed by the search and the VRAM filter.
const listedGpus = computed(() => {
  const query = gpuQuery.value.trim().toLowerCase();
  const sorter = SORTERS[gpuSort.value];
  const compatible = [...compatibleGpus.value].sort(
    (a, b) => sorter(a, b) || bySeries(a, b),
  );
  const shown = showHidden.value
    ? [...compatible, ...hiddenGpus.value]
    : compatible;
  return shown.filter((row) => isShown(row, query));
});

// --- Selecting: a click toggles one GPU, a shift-click a range ---

// Where a shift-click range starts: the GPU clicked last.
const rangeAnchor = ref<string | null>(null);

function onGpuChange(row: GpuRow) {
  const name = row.listing.name;
  emit(
    "update:modelValue",
    props.modelValue.includes(name)
      ? props.modelValue.filter((selected) => selected !== name)
      : [...props.modelValue, name],
  );
  rangeAnchor.value = name;
}

// Shift-click: every listed GPU from the last one clicked to this one goes the
// way this one would (selected, or cleared), skipping those below the
// workload's VRAM. Without an anchor in the list it is a plain click.
function selectRange(row: GpuRow, event: MouseEvent) {
  // The click the label forwards to its checkbox arrives here too.
  if (!event.shiftKey || event.target instanceof HTMLInputElement) return;
  const rows = listedGpus.value;
  const from = rows.findIndex((entry) => entry.listing.name === rangeAnchor.value);
  const to = rows.findIndex((entry) => entry.listing.name === row.listing.name);
  if (from < 0 || to < 0) return;

  event.preventDefault();
  const range = rows
    .slice(Math.min(from, to), Math.max(from, to) + 1)
    .filter((entry) => !entry.dim)
    .map((entry) => entry.listing.name);
  emit(
    "update:modelValue",
    row.selected
      ? props.modelValue.filter((name) => !range.includes(name))
      : [...new Set([...props.modelValue, ...range])],
  );
  rangeAnchor.value = row.listing.name;
}

// Select all takes the list as shown (after search and the VRAM filter), so
// narrowing it first picks a whole range at once; GPUs below the workload's
// VRAM are never selected. Clear deselects every GPU.
const selectableShown = computed(() =>
  listedGpus.value.filter((row) => !row.dim).map((row) => row.listing.name),
);

function selectAllShown() {
  emit("update:modelValue", [...new Set([...props.modelValue, ...selectableShown.value])]);
}

function deselectAll() {
  emit("update:modelValue", []);
}

// Select all is offered while some GPU shown is not selected yet.
const allShownSelected = computed(() =>
  selectableShown.value.every((name) => props.modelValue.includes(name)),
);

// "6 of 23 selected", or "23 GPUs" with none selected.
const selectionLabel = computed(() => {
  const shown = selectableShown.value.length;
  return props.modelValue.length
    ? `${props.modelValue.length} of ${shown} selected`
    : `${shown} GPU${shown === 1 ? "" : "s"}`;
});

// A shift-click would otherwise select the text between the two rows.
function keepTextUnselected(event: MouseEvent) {
  if (event.shiftKey) event.preventDefault();
}

// --- Spec requirements: every usable metric, over every host ---
const {
  options,
  pending: optionsPending,
  error: optionsError,
  refresh: refreshOptions,
} = useRequirementOptions(
  REQUIREMENT_CATEGORIES.flatMap((category) => category.keys),
);
const metrics = computed(() => options.value?.metrics ?? []);

// A restored draft may ask for what no host reports: drop that.
watch(options, (next) => {
  if (!next) return;
  const kept = keepSupportedRequirements(props.requirements, next);
  if (Object.keys(kept).length !== Object.keys(props.requirements).length) {
    emit("update:requirements", kept);
  }
});

const categoryCounts = computed(() => {
  const counts: Partial<Record<RequirementCategoryId, number>> = {};
  for (const key of Object.keys(props.requirements)) {
    const category = categoryOfKey(key);
    if (category) counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
});

// --- Controls, one per metric the active panel edits ---
interface ControlText {
  label: string;
  note?: string;
  unit?: string;
  anyLabel?: string;
}

const CONTROL_TEXT: Record<string, ControlText> = {
  cuda_driver_version: { label: "CUDA version", note: "· minimum" },
  ram_gb: { label: "Minimum RAM", unit: "GB" },
  logical_cores: { label: "CPU cores", note: "· logical", unit: "cores" },
  country: { label: "Country", note: "(optional)", anyLabel: "Any country" },
  download_mbps: { label: "Minimum download", unit: "Mbps" },
  upload_mbps: { label: "Minimum upload", unit: "Mbps" },
  disk_gb: { label: "Minimum disk space", unit: "GB" },
};

// Set as minimums on a slider although host-manager reports them as exact
// matches: a bandwidth is a floor, not a figure to hit.
const MINIMUM_KEYS = new Set(["download_mbps", "upload_mbps"]);

function controlText(key: string): ControlText {
  return CONTROL_TEXT[key] ?? { label: key.replace(/_/g, " ") };
}

interface ControlBase {
  key: string;
  label: string;
  note: string;
}
interface SegmentsControl extends ControlBase {
  kind: "segments";
  segments: Array<{ value: RequirementValue; label: string }>;
}
interface SliderControl extends ControlBase {
  kind: "slider";
  unit: string;
  /** The highest value any host reports; 0 is "Any". */
  max: number;
  /** Slider granularity, coarser on wide ranges so the thumb stays usable. */
  step: number;
  ticks: Array<{ value: number; label: string }>;
}
interface SelectControl extends ControlBase {
  kind: "select";
  anyLabel: string;
  choices: Array<{ value: RequirementValue; label: string }>;
}
type Control = SegmentsControl | SliderControl | SelectControl;

// The slider runs continuously from "Any" to the highest reported value,
// rounded DOWN to its step: a minimum above every host matches none, so the
// end of the slider must always be one the best host meets (62.5 GB of RAM
// gives 62, not 63). Wide ranges move in coarser steps so a drag lands on
// round numbers.
function sliderStep(top: number): number {
  if (top > 2000) return 50;
  if (top > 500) return 10;
  return 1;
}

function sliderMax(option: RequirementOption, step: number): number {
  return Math.floor((option.max ?? 0) / step) * step;
}

const numberFormat = new Intl.NumberFormat("en-US");

// Up to six labels: "Any", then values spread evenly to the top; the top one
// reads "256+" since anything above it qualifies too.
function sliderTicks(max: number) {
  const values = [0, ...[1, 2, 3, 4, 5].map((n) => Math.round((n * max) / 5))];
  return [...new Set(values)].map((value) => {
    const label = value === 0 ? "Any" : numberFormat.format(value);
    return { value, label: value === max ? `${label}+` : label };
  });
}

function choicesOf(option: RequirementOption): SelectControl["choices"] {
  const choices = option.values
    .filter(({ value }) => value !== "missing")
    .map(({ value, nodes }) => ({
      value,
      label: `${option.key === "country" ? countryName(String(value)) : String(value)} · ${nodes} host${nodes === 1 ? "" : "s"}`,
    }));
  return option.key === "country"
    ? choices.sort((a, b) => a.label.localeCompare(b.label))
    : choices;
}

// A spec no host reports is hidden rather than shown disabled.
function buildControl(option: RequirementOption): Control | null {
  const text = controlText(option.key);
  const base: ControlBase = {
    key: option.key,
    label: text.label,
    note: text.note ?? "",
  };
  if (option.key === "cuda_driver_version") {
    const segments = cudaVersions(option).map((version) => ({
      value: version,
      label: `${version}+`,
    }));
    return segments.length ? { ...base, kind: "segments", segments } : null;
  }
  if (
    (option.match === "minimum" || MINIMUM_KEYS.has(option.key)) &&
    option.type !== "text"
  ) {
    const step = sliderStep(option.max ?? 0);
    const max = sliderMax(option, step);
    return max > 0
      ? {
          ...base,
          kind: "slider",
          unit: text.unit ?? "",
          max,
          step,
          ticks: sliderTicks(max),
        }
      : null;
  }
  const choices = choicesOf(option);
  return choices.length
    ? { ...base, kind: "select", anyLabel: text.anyLabel ?? "Any", choices }
    : null;
}

// Every category's controls from the options. A category whose metrics no
// host reports has none and is not listed.
const controlsByCategory = computed(
  () =>
    new Map(
      REQUIREMENT_CATEGORIES.map((category) => [
        category.id,
        category.keys.flatMap((key) => {
          const option = metrics.value.find((metric) => metric.key === key);
          const control = option ? buildControl(option) : null;
          return control ? [control] : [];
        }),
      ]),
    ),
);
// The requirement categories with something to set.
const requirementCategories = computed(() =>
  REQUIREMENT_CATEGORIES.filter((category) =>
    Boolean(controlsByCategory.value.get(category.id)?.length),
  ),
);
const panelControls = computed(() =>
  activeCategory.value
    ? (controlsByCategory.value.get(activeCategory.value) ?? [])
    : [],
);

function setRequirement(key: string, value: RequirementValue | undefined) {
  const { [key]: _, ...rest } = props.requirements;
  emit(
    "update:requirements",
    value === undefined ? rest : { ...rest, [key]: value },
  );
}

function selectedIndex(control: SelectControl) {
  const current = props.requirements[control.key];
  const index = control.choices.findIndex(({ value }) => value === current);
  return index < 0 ? "" : String(index);
}

function onSelect(control: SelectControl, event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) return;
  const index = event.target.value;
  setRequirement(
    control.key,
    index === "" ? undefined : control.choices[Number(index)]?.value,
  );
}

// The slider sits at 0 for "Any"; otherwise at the requirement itself, capped
// at the top so a typed value above every host still shows a full bar.
function sliderPosition(control: SliderControl) {
  const current = props.requirements[control.key];
  return typeof current === "number" ? Math.min(current, control.max) : 0;
}

function onSlide(control: SliderControl, event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return;
  const value = Number(event.target.value);
  setRequirement(control.key, value > 0 ? value : undefined);
}

function fillPercent(control: SliderControl) {
  return control.max > 0 ? (sliderPosition(control) / control.max) * 100 : 0;
}

function boxValue(control: SliderControl) {
  const current = props.requirements[control.key];
  return typeof current === "number" ? String(current) : "Any";
}

function onBox(control: SliderControl, event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return;
  const typed = Number(event.target.value.trim());
  setRequirement(
    control.key,
    Number.isFinite(typed) && typed > 0 ? typed : undefined,
  );
}

// --- Availability: the chosen GPUs' hosts, and how many free ones meet
// every requirement in the markets they post to, for the summary ---
const selectedListings = computed(() => listingsOf(listings.value, props.modelValue));
const {
  qualifying,
  failed: searchFailed,
  refresh: refreshQualifying,
} = useQualifyingHosts(
  () => withGpus(props.requirements, props.modelValue),
  () => [...new Set(selectedListings.value.flatMap((listing) => listing.markets))],
);
const matching = computed<MatchingHosts | null>(() => {
  if (!selectedListings.value.length) return null;
  const { available, working } = hostsOf(selectedListings.value);
  return { hosts: available + working, available, working, qualifying: qualifying.value };
});
watch(matching, (value) => emit("matching", value), { immediate: true });

// One notice, shown above the GPU list: host data down, or a failed match.
// While requirements are coming soon their options are not shown, so their
// failure is not news.
const notice = computed(() => {
  if (error.value || (optionsError.value && !REQUIREMENTS_COMING_SOON)) {
    return {
      text: "Host data is temporarily unavailable",
      retry: () => Promise.all([refresh(), refreshOptions()]),
    };
  }
  if (searchFailed.value) {
    return { text: "Could not look up hosts", retry: refreshQualifying };
  }
  return null;
});
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

// --- The requirement categories, as a row of pills over their controls ---
.req-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 18px 18px 0;
}

.req-subtitle {
  margin: 12px 18px 0;
}

// Coming soon: the category pills are shown, not clickable.
.req-pill.is-soon {
  cursor: default;
  opacity: 0.6;

  &:hover {
    border-color: $border-soft;
    color: $text-muted;
  }
}

.req-soon-hint {
  margin-bottom: 18px;
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
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;

  svg {
    flex-shrink: 0;
    font-size: 14px;
  }

  &:hover {
    border-color: $secondary;
    color: $text;
  }

  &.is-active {
    background: $text;
    color: $white;
    border-color: $text;
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
// category pills over a padded body (a category's controls) ---
.req-main {
  @include soft-panel;
  padding: 0;
}

// --- GPU list: one row per GPU model ---
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

  // The checkbox is invisible, so keyboard focus shows on the row (not a
  // mouse click, which focuses the checkbox too).
  &:has(input:focus-visible) {
    outline: 2px solid rgba($secondary, 0.6);
    outline-offset: -2px;
  }

  &.is-dim {
    opacity: 0.5;
    cursor: default;

    &:hover {
      background: transparent;
    }
  }

  // The checkbox is the control for assistive tech; the row is the control
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

// About eight and a half rows (no more than most of a short screen), so the
// cut-off row shows there is more; the rest scroll inside the card without
// scrolling the page.
.gpu-list {
  max-height: min(45rem, 60vh);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

// The list header: the selection count, and the bulk actions on the right.
.gpu-list-head {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: $text-muted;
}

// "Select all · Clear": spaced, with a dot between them when both show.
.gpu-list-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;

  .req-link {
    font-size: 0.8rem;
  }

  // Inline-block so the link's hover underline skips the dot.
  .req-link + .req-link::before {
    content: "·";
    display: inline-block;
    margin-right: 10px;
    color: $text-muted;
  }
}

// The first row in the scroll area draws no divider of its own, so the header
// draws it, as `.section-row` does between rows.
.gpu-list-head::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 18px;
  right: 18px;
  height: 1px;
  background: $grey-lighter;
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

.req-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: $secondary;
  color: #000;
  font-size: 0.6875rem;
  font-weight: 700;
}

.req-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  padding: 1.25rem 18px;
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

// --- Category panels ---
.req-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.req-field-label {
  font-size: 0.78rem;
  font-weight: 600;

  span {
    font-weight: 400;
    color: $text-muted;
  }
}

// The shared segmented control, compact and left aligned.
.dep-tabs.req-segments {
  margin: 0;
  padding: 3px;
  gap: 2px;
  border-radius: 10px;
  align-self: flex-start;
  flex-wrap: wrap;

  .dep-tab {
    padding: 0.4rem 0.8rem;
    font-size: 0.78rem;
    border-radius: 7px;
  }
}

.req-range {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
}

.req-ticks {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
  font-family: $mono;
  font-size: 0.66rem;
  color: $text-muted;
}

.req-num {
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  border: 1px solid $border-soft;
  background: $white;
  overflow: hidden;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus-within {
    border-color: $secondary;
    box-shadow: 0 0 0 3px rgba($secondary, 0.15);
  }

  input {
    width: 56px;
    padding: 0.45rem 0.5rem;
    border: 0;
    background: transparent;
    outline: none;
    font-family: $mono;
    font-size: 0.78rem;
    color: $text;
    text-align: right;
  }

  span {
    padding: 0.45rem 0.5625rem 0.45rem 0;
    font-size: 0.72rem;
    color: $text-muted;
  }
}

.req-select {
  position: relative;
  display: flex;
  align-items: center;
  height: 38px;
  background: $white;
  border: 1px solid $border-soft;
  border-radius: 9px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus-within {
    border-color: $secondary;
    box-shadow: 0 0 0 3px rgba($secondary, 0.15);
  }

  select {
    appearance: none;
    width: 100%;
    height: 100%;
    padding: 0 2rem 0 0.7rem;
    border: 0;
    background: transparent;
    outline: none;
    font-family: inherit;
    font-size: 0.8125rem;
    color: $text;
    text-overflow: ellipsis;
    cursor: pointer;
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

// The .range-slider pattern from AdvancedGpuSelection, in the brand green.
@mixin thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--req-thumb, #ffffff);
  border: 3px solid $secondary;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.range-slider {
  position: relative;
  height: 6px;
  background: $surface-track;
  border-radius: 3px;

  &__range {
    appearance: none;
    position: absolute;
    top: -5px;
    left: 0;
    width: 100%;
    height: 16px;
    margin: 0;
    background: transparent;
    cursor: pointer;
    outline: none;

    &::-webkit-slider-thumb {
      appearance: none;
      @include thumb;
    }

    &::-moz-range-thumb {
      @include thumb;
    }
  }

  &__fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: $secondary;
    border-radius: 3px;
    pointer-events: none;
  }
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

    &:hover {
      border-color: $secondary;
      color: $white;
    }

    &.is-active {
      background: $white;
      color: #000;
      border-color: $white;
    }
  }

  .req-pill.is-soon:hover {
    border-color: rgba($white, 0.14);
    color: #d7e0d7;
  }

  .req-search,
  .req-num,
  .req-select {
    background: rgba($white, 0.04);
    border-color: rgba($white, 0.12);

    input,
    select {
      color: $white;
      color-scheme: dark;
    }
  }

  .req-select select option {
    background: #242526;
  }

  .req-dot {
    background: #5e6266;
  }

  .gpu-list-head::after {
    background: rgba($white, 0.08);
  }

  .range-slider {
    background: #3a3a3a;
    --req-thumb: #242526;
  }
}
</style>
