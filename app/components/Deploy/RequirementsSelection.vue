<template>
  <div class="req-steps">
    <!-- Step: the GPU, which sets the market and the hourly price -->
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
        <div v-if="notice" class="section-row req-notice">
          <span class="req-dot" />
          <span>{{ notice.text }}</span>
          <button type="button" class="req-link" @click="notice.retry()">
            Retry
          </button>
        </div>

        <p v-if="gpuPending && !gpus.length" class="section-row req-hint">
          Loading GPUs…
        </p>
        <p v-else-if="gpuError && !gpus.length" class="section-row req-hint">
          The GPU list needs host data
        </p>
        <p v-else-if="!listedGpus.length" class="section-row req-hint">
          {{ gpuQuery ? `No GPUs match “${gpuQuery}”` : "No GPUs available" }}
        </p>

        <label
          v-for="row in listedGpus"
          :key="`${row.gpu.name}-${row.gpu.vramGb}`"
          class="section-row gpu-row"
          :class="{ 'is-selected': row.selected, 'is-dim': row.dim }"
        >
          <input
            type="radio"
            name="gpu"
            :value="row.gpu.name"
            :checked="row.selected"
            :disabled="row.dim"
            @change="selectGpu(row.gpu)"
          />
          <span class="req-gpu-logo" aria-hidden="true">
            <NvidiaIcon class="req-gpu-logo-mark" />
          </span>
          <span class="gpu-row-text">
            <strong>
              {{ row.gpu.name }}
              <span v-if="row.gpu.name === recommendedName" class="gpu-row-rec">
                Recommended
              </span>
            </strong>
            <small>{{ row.subline }}</small>
          </span>
          <span class="gpu-row-price">
            <template v-if="row.usd !== null">
              ${{ row.usd.toFixed(2) }}<small>/h</small>
            </template>
            <template v-else>—</template>
          </span>
        </label>

        <div v-if="hiddenGpus.length" class="section-row gpu-row-hidden">
          <span>
            {{ hiddenGpus.length }} GPU{{
              hiddenGpus.length === 1 ? "" : "s"
            }}
            hidden: below your workload's {{ requiredVramGb }} GB VRAM
          </span>
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

    <!-- Step: optional host requirements, one category at a time -->
    <section class="deploy-step">
      <header class="deploy-step-head">
        <span class="deploy-step-num" aria-hidden="true"></span>
        <h3>Add requirements</h3>
        <span class="deploy-step-tag">Optional</span>
      </header>

      <div class="req-main">
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
            pending
              ? "Loading host details…"
              : "Hosts with this GPU report nothing to filter on yet."
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
                :class="{ 'is-active': !(control.key in modelValue) }"
                :aria-pressed="!(control.key in modelValue)"
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
                  'is-active': modelValue[control.key] === segment.value,
                }"
                :aria-pressed="modelValue[control.key] === segment.value"
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
import { watchDebounced } from "@vueuse/core";
import NvidiaIcon from "@/assets/img/icons/nvidia.svg?component";
import {
  REQUIREMENT_CATEGORIES,
  categoryOfKey,
  countryName,
  gpuHourlyUsd,
  useGpuModels,
  useRequirementOptions,
  useReservationLookups,
  type GpuModel,
  type MarketRate,
  type RequirementCategoryId,
  type RequirementOption,
  type RequirementValue,
  type Requirements,
} from "~/composables/useNodeRequirements";

interface Props {
  modelValue: Requirements;
  /** The testgrid `/markets` rows, for pricing each GPU. */
  markets: MarketRate[] | null;
  /** The VRAM the job definition asks for; GPUs below it are hidden. */
  requiredVramGb: number | null;
  /** The GPU the page defaults to, labelled and listed first. */
  recommendedName?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: Requirements];
  /** The matching pool: every host, those free now, and those busy now. */
  matching: [
    value: { hosts: number; available: number; working: number } | null,
  ];
}>();

// The host requirement categories: everything but the GPU, which has its own
// step.
const HOST_CATEGORIES = REQUIREMENT_CATEGORIES.filter(
  (category) => category.id !== "gpu",
);

const PANEL_SUBTITLES: Partial<Record<RequirementCategoryId, string>> = {
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

// --- GPU: picked from the catalogue, stored as the `name` requirement ---
const {
  gpus,
  pending: gpuPending,
  error: gpuError,
  refresh: refreshGpus,
} = useGpuModels();
const gpuQuery = ref("");
const showHidden = ref(false);

const selectedGpuName = computed(() => {
  const name = props.modelValue.name;
  return typeof name === "string" ? name : null;
});

function selectGpu(gpu: GpuModel) {
  setRequirement("name", gpu.name);
}

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
  gpu: GpuModel;
  subline: string;
  /** Hourly USD; null when none of its markets is priced. */
  usd: number | null;
  /** Below the workload's VRAM: listed only on request, never selectable. */
  dim: boolean;
  selected: boolean;
}

const gpuRows = computed<GpuRow[]>(() =>
  gpus.value.map((gpu) => {
    const required = props.requiredVramGb;
    const dim = required !== null && gpu.vramGb < required;
    const usd = gpuHourlyUsd(gpu, props.markets);
    return {
      gpu,
      subline: dim
        ? `below ${required} GB VRAM`
        : `${gpu.vramGb} GB · ${gpu.available} available · ${gpu.working} working`,
      usd,
      dim,
      selected: gpu.name === selectedGpuName.value,
    };
  }),
);

const compatibleGpus = computed(() => gpuRows.value.filter((row) => !row.dim));
const hiddenGpus = computed(() =>
  gpuRows.value.filter((row) => row.dim).sort(bySeries),
);

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
    label: props.recommendedName ? "Recommended" : "Available first",
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
  if (a.usd === null || b.usd === null) {
    return Number(a.usd === null) - Number(b.usd === null);
  }
  return (a.usd - b.usd) * direction;
}

// By model: 3060 < 3070 < 4090, datacenter cards after, then by name.
function bySeries(a: GpuRow, b: GpuRow) {
  return (
    gpuModelRank(a.gpu.name) - gpuModelRank(b.gpu.name) ||
    a.gpu.name.localeCompare(b.gpu.name)
  );
}

// Those with a host free now first, then by series.
function compareGpus(a: GpuRow, b: GpuRow) {
  return (
    Number(b.gpu.available > 0) - Number(a.gpu.available > 0) || bySeries(a, b)
  );
}

// Each sort orders by exactly what it names; ties fall back to the series.
const SORTERS: Record<GpuSort, (a: GpuRow, b: GpuRow) => number> = {
  // The recommended GPU first, then those with a host free now, by series.
  recommended: (a, b) =>
    Number(b.gpu.name === props.recommendedName) -
      Number(a.gpu.name === props.recommendedName) || compareGpus(a, b),
  series: bySeries,
  "price-asc": (a, b) => byPrice(a, b, 1),
  "price-desc": (a, b) => byPrice(a, b, -1),
  "vram-desc": (a, b) => b.gpu.vramGb - a.gpu.vramGb,
  "vram-asc": (a, b) => a.gpu.vramGb - b.gpu.vramGb,
  // Most hosts free now first, then most coming back as jobs finish.
  available: (a, b) =>
    b.gpu.available - a.gpu.available || b.gpu.working - a.gpu.working,
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
    (row) => !query || row.gpu.name.toLowerCase().includes(query),
  );
});

// --- Spec requirements: every usable metric, scoped to the GPU ---
const gpuScope = computed<Requirements>(() => {
  const name = selectedGpuName.value;
  const scope: Requirements = name ? { name } : {};
  return scope;
});
const {
  options,
  pending,
  error,
  refresh: refreshOptions,
} = useRequirementOptions(
  HOST_CATEGORIES.flatMap((category) => category.keys),
  gpuScope,
);
const metrics = computed(() => options.value?.metrics ?? []);

function retry() {
  void Promise.all([refreshGpus(), refreshOptions()]);
}

// When the GPU changes, a spec set for the old scope can sit outside the new
// one (a minimum above every available host, a country no host is in, a
// metric no host reports): drop those so the sheet never carries a boundary
// no available host meets. The GPU itself is the scope, so it always stays.
watch(options, (next) => {
  if (!next) return;
  const kept = Object.fromEntries(
    Object.entries(props.modelValue).filter(([key, value]) => {
      if (key === "name") return true;
      const option = next.metrics.find((metric) => metric.key === key);
      if (!option) return false;
      if (option.key === "cuda_driver_version") {
        return cudaVersions(option).includes(String(value));
      }
      if (option.match === "minimum" && typeof value === "number") {
        return option.max !== undefined && value <= option.max;
      }
      return option.values.some((entry) => entry.value === value);
    }),
  );
  if (Object.keys(kept).length !== Object.keys(props.modelValue).length) {
    emit("update:modelValue", kept);
  }
});

const categoryCounts = computed(() => {
  const counts: Record<RequirementCategoryId, number> = {
    gpu: 0,
    compute: 0,
    network: 0,
    storage: 0,
  };
  for (const key of Object.keys(props.modelValue)) {
    const category = categoryOfKey(key);
    if (category) counts[category] += 1;
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
  cpu_model: { label: "CPU model", note: "(optional)", anyLabel: "Any CPU" },
  country: { label: "Country", note: "(optional)", anyLabel: "Any country" },
  download_mbps: { label: "Minimum download", unit: "Mbps" },
  upload_mbps: { label: "Minimum upload", unit: "Mbps" },
  // Labelled as a maximum; host-manager still matches the number as a minimum.
  ping_ms: { label: "Maximum ping", unit: "ms" },
  disk_gb: { label: "Minimum disk space", unit: "GB" },
};

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
  /** The highest value any host in scope reports; 0 is "Any". */
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

// CUDA is picked by major.minor: "12.8" is a minimum, so it covers 12.8 and up.
function cudaVersions(option: RequirementOption): string[] {
  const versions = option.values.flatMap(({ value }) => {
    const version = String(value).match(/^\d+\.\d+/);
    return version ? [version[0]] : [];
  });
  const part = (version: string, index: number) =>
    Number(version.split(".")[index]);
  return [...new Set(versions)].sort(
    (a, b) => part(a, 0) - part(b, 0) || part(a, 1) - part(b, 1),
  );
}

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
// reads "256+" on a minimum since anything above it qualifies too.
function sliderTicks(max: number, plus: boolean) {
  const values = [0, ...[1, 2, 3, 4, 5].map((n) => Math.round((n * max) / 5))];
  return [...new Set(values)].map((value) => {
    const label = value === 0 ? "Any" : numberFormat.format(value);
    return { value, label: plus && value === max ? `${label}+` : label };
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

// A spec no host in scope reports is hidden rather than shown disabled.
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
  if (option.match === "minimum" && option.type !== "text") {
    const step = sliderStep(option.max ?? 0);
    const max = sliderMax(option, step);
    return max > 0
      ? {
          ...base,
          kind: "slider",
          unit: text.unit ?? "",
          max,
          step,
          ticks: sliderTicks(max, option.key !== "ping_ms"),
        }
      : null;
  }
  const choices = choicesOf(option);
  return choices.length
    ? { ...base, kind: "select", anyLabel: text.anyLabel ?? "Any", choices }
    : null;
}

// Every category's controls from the scoped options. A category whose
// metrics no host in scope reports has none and is not listed.
const controlsByCategory = computed(
  () =>
    new Map(
      HOST_CATEGORIES.map((category) => [
        category.id,
        category.keys.flatMap((key) => {
          const option = metrics.value.find((metric) => metric.key === key);
          const control = option ? buildControl(option) : null;
          return control ? [control] : [];
        }),
      ]),
    ),
);
// The requirement categories with something to set for this GPU's hosts.
const requirementCategories = computed(() =>
  HOST_CATEGORIES.filter((category) =>
    Boolean(controlsByCategory.value.get(category.id)?.length),
  ),
);
const panelControls = computed(() =>
  activeCategory.value
    ? (controlsByCategory.value.get(activeCategory.value) ?? [])
    : [],
);

function setRequirement(key: string, value: RequirementValue | undefined) {
  const { [key]: _, ...rest } = props.modelValue;
  emit(
    "update:modelValue",
    value === undefined ? rest : { ...rest, [key]: value },
  );
}

function selectedIndex(control: SelectControl) {
  const current = props.modelValue[control.key];
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
  const current = props.modelValue[control.key];
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
  const current = props.modelValue[control.key];
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

// --- Availability: debounced, only with a GPU picked, latest response wins ---
// Two counts per change: the hosts that match at all (queued or working, the
// pool a deployment draws from) and those a reservation would get right now.
const { countMatchingHosts, findAvailableNodes } = useReservationLookups();
const searchFailed = ref(false);
const searches = useLatestRequest();

async function search(requirements: Requirements) {
  const id = searches.begin();
  if (typeof requirements.name !== "string") {
    emit("matching", null);
    return;
  }
  try {
    const [result, hosts] = await Promise.all([
      findAvailableNodes(requirements),
      countMatchingHosts(requirements),
    ]);
    if (!searches.isCurrent(id)) return;
    emit("matching", {
      hosts,
      available: result.total,
      working: Math.max(hosts - result.total, 0),
    });
    searchFailed.value = false;
  } catch (e) {
    console.error("Error finding available nodes:", e);
    if (!searches.isCurrent(id)) return;
    searchFailed.value = true;
    emit("matching", null);
  }
}

watchDebounced(() => props.modelValue, search, {
  debounce: 300,
  deep: true,
  immediate: true,
});

// One notice, shown above the GPU list: host data down, or a failed match.
const notice = computed(() => {
  if (error.value || gpuError.value) {
    return { text: "Host data is temporarily unavailable", retry };
  }
  if (searchFailed.value) {
    return {
      text: "Could not look up hosts",
      retry: () => search(props.modelValue),
    };
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

// --- GPU list: one row per GPU ---
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

// --- Category body: the baseline note, then the category's controls ---
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

  .range-slider {
    background: #3a3a3a;
    --req-thumb: #242526;
  }
}
</style>
