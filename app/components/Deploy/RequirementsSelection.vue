<template>
  <div class="req-layout" :class="{ 'is-flat': flat }">
    <!-- Left card: one pill per requirement category, the GPU first -->
    <aside class="req-nav">
      <div
        class="req-nav-list"
        role="tablist"
        aria-label="Requirements"
        aria-orientation="vertical"
      >
        <button
          v-for="category in REQUIREMENT_CATEGORIES"
          :key="category.id"
          type="button"
          role="tab"
          class="req-pill"
          :class="{ 'is-active': activeCategory === category.id }"
          :aria-selected="activeCategory === category.id"
          @click="activeCategory = category.id"
        >
          <DeployCategoryIcon :icon="category.icon" />
          <span class="req-pill-label">{{ category.label }}</span>
          <span v-if="categoryCounts[category.id]" class="req-badge">
            {{ categoryCounts[category.id] }}
          </span>
        </button>
      </div>
    </aside>

    <!-- Centre card: the active category's header, then the GPU list or the
         category's controls -->
    <section class="req-main">
      <!-- The GPU list needs no heading (the drawer names it); the other
           categories say what they filter. -->
      <div v-if="!isGpuPanel || showSearch" class="req-head">
        <div v-if="!isGpuPanel" class="req-heading">
          <h3>{{ activePanel.label }}</h3>
          <p v-if="PANEL_SUBTITLES[activePanel.id]">
            {{ PANEL_SUBTITLES[activePanel.id] }}
          </p>
        </div>
        <label v-if="isGpuPanel && showSearch" class="req-search">
          <DeployCategoryIcon icon="search" />
          <input
            v-model="gpuQuery"
            type="search"
            placeholder="Search GPUs"
            aria-label="Search GPUs"
          />
        </label>
      </div>

      <div
        :role="isGpuPanel ? 'radiogroup' : undefined"
        :aria-label="isGpuPanel ? 'GPU' : undefined"
      >
        <div v-if="notice" class="section-row req-notice">
          <span class="req-dot" />
          <span>{{ notice.text }}</span>
          <button type="button" class="req-link" @click="notice.retry()">
            Retry
          </button>
        </div>

        <template v-if="isGpuPanel">
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
                <span
                  v-if="row.gpu.name === recommendedName"
                  class="gpu-row-rec"
                >
                  Recommended
                </span>
              </strong>
              <small>{{ row.subline }}</small>
            </span>
            <span class="gpu-row-price">
              <template v-if="row.price !== null">
                ${{ row.price }}<small>/h</small>
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
        </template>

        <div v-else class="req-body">
          <div
            v-if="activePanel.id === 'benchmarks' && benchmarkModels.length"
            class="req-field"
          >
            <span class="req-field-label">Benchmark model</span>
            <div class="req-select">
              <select
                :value="benchmarkModel ?? ''"
                aria-label="Benchmark model"
                @change="onBenchmarkModel"
              >
                <option
                  v-for="model in benchmarkModels"
                  :key="model.id"
                  :value="model.id"
                >
                  {{ model.label }} · {{ model.measured }} hosts measured
                </option>
              </select>
              <svg class="req-caret" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <p v-if="!panelControls.length" class="req-hint">
            {{ pending ? "Loading requirements…" : "Nothing here yet" }}
          </p>

          <div
            v-for="control in panelControls"
            :key="control.key"
            class="req-field"
          >
            <div v-if="control.kind === 'toggle'" class="req-toggle-row">
              <span>
                <strong>{{ control.label }}</strong>
                <small>{{ control.note }}</small>
              </span>
              <button
                type="button"
                class="req-toggle"
                :class="{ 'is-on': modelValue[control.key] === true }"
                role="switch"
                :aria-checked="modelValue[control.key] === true"
                :aria-label="control.label"
                @click="
                  setRequirement(
                    control.key,
                    modelValue[control.key] === true ? undefined : true,
                  )
                "
              />
            </div>

            <template v-else>
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

              <p v-if="control.hint" class="req-hint">{{ control.hint }}</p>
            </template>
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
  benchmarkModelLabel,
  benchmarkModelOf,
  categoryKeys,
  categoryOfKey,
  countryName,
  gpuHourlyUsd,
  useGpuModels,
  useRequirementOptions,
  useReservationLookups,
  type GpuModel,
  type MarketRate,
  type RequirementCategory,
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
  /** Where to start: the GPU list, or the first requirement category. */
  focus?: "gpu" | "requirements";
  /** Inside a panel that is already a card: the categories sit on it flat. */
  flat?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: Requirements];
  /** The matching pool: every host, those free now, and those busy now. */
  matching: [
    value: { hosts: number; available: number; working: number } | null,
  ];
}>();

const PANEL_SUBTITLES: Partial<Record<RequirementCategoryId, string>> = {
  gpu: "The GPU sets the hourly price. Add requirements to narrow which hosts qualify.",
  compute: "Set compute related requirements for hosts.",
  network: "Where hosts are and how well they are connected.",
  storage: "Free disk the host must have for your image and model files.",
  compliance: "Only hosts an admin has verified for the flag.",
  benchmarks: "Require a measured throughput, not just a spec sheet.",
};

// Opened from the Requirements line, start on the first real requirement
// category rather than the GPU list.
const firstRequirementCategory =
  REQUIREMENT_CATEGORIES.find((category) => category.id !== "gpu")?.id ?? "gpu";
const activeCategory = ref<RequirementCategoryId>("gpu");
watch(
  () => props.focus,
  (focus) => {
    activeCategory.value =
      focus === "requirements" ? firstRequirementCategory : "gpu";
  },
  { immediate: true },
);
const activePanel = computed<RequirementCategory>(
  () =>
    REQUIREMENT_CATEGORIES.find(
      (category) => category.id === activeCategory.value,
    ) ?? { id: "gpu", label: "GPU", icon: "gpu", keys: ["name"] },
);
// The GPU category is the list itself; every other one is a set of controls.
const isGpuPanel = computed(() => activePanel.value.id === "gpu");

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
  /** Hourly USD, formatted; null when none of its markets is priced. */
  price: string | null;
  /** Below the workload's VRAM: listed only on request, never selectable. */
  dim: boolean;
  selected: boolean;
}

// Available first, then by model rank, then by name.
function compareGpus(a: GpuRow, b: GpuRow) {
  return (
    Number(b.gpu.available > 0) - Number(a.gpu.available > 0) ||
    gpuModelRank(a.gpu.name) - gpuModelRank(b.gpu.name) ||
    a.gpu.name.localeCompare(b.gpu.name)
  );
}

const gpuRows = computed<GpuRow[]>(() =>
  gpus.value
    .map((gpu) => {
      const required = props.requiredVramGb;
      const dim = required !== null && gpu.vramGb < required;
      const usd = gpuHourlyUsd(gpu, props.markets);
      return {
        gpu,
        subline: dim
          ? `below ${required} GB VRAM`
          : `${gpu.vramGb} GB · ${gpu.available} available · ${gpu.working} working`,
        price: usd === null ? null : usd.toFixed(2),
        dim,
        selected: gpu.name === selectedGpuName.value,
      };
    })
    .sort(compareGpus),
);

const compatibleGpus = computed(() => gpuRows.value.filter((row) => !row.dim));
const hiddenGpus = computed(() => gpuRows.value.filter((row) => row.dim));

// A search field only once the list is long; the query never applies without it.
const showSearch = computed(() => compatibleGpus.value.length > 12);

// The recommended GPU first, then the other compatible rows, then the hidden
// ones once revealed.
const listedGpus = computed(() => {
  const query = showSearch.value ? gpuQuery.value.trim().toLowerCase() : "";
  const compatible = [...compatibleGpus.value].sort(
    (a, b) =>
      Number(b.gpu.name === props.recommendedName) -
      Number(a.gpu.name === props.recommendedName),
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
} = useRequirementOptions(null, gpuScope);
const metrics = computed(() => options.value?.metrics ?? []);

function retry() {
  void Promise.all([refreshGpus(), refreshOptions()]);
}

// When the GPU changes, a spec set for the old scope can sit outside the new
// one (a minimum above every available host, a country no host is in): drop
// those so the sheet never carries a boundary no available host meets.
watch(options, (next) => {
  if (!next) return;
  const kept = Object.fromEntries(
    Object.entries(props.modelValue).filter(([key, value]) => {
      const option = next.metrics.find((metric) => metric.key === key);
      if (!option) return true;
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
    compliance: 0,
    benchmarks: 0,
    other: 0,
  };
  for (const key of Object.keys(props.modelValue)) {
    counts[categoryOfKey(key, metrics.value)] += 1;
  }
  return counts;
});

// --- Controls, one per metric the active panel edits ---
interface ControlText {
  label: string;
  note?: string;
  unit?: string;
  anyLabel?: string;
  hint?: string;
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
  CC: {
    label: "Confidential computing",
    note: "Hosts with CC-capable GPUs and attestation",
  },
  soc_2: { label: "SOC 2", note: "Hosts in SOC 2 audited data centres" },
};

function controlText(key: string): ControlText {
  const fixed = CONTROL_TEXT[key];
  if (fixed) return fixed;
  if (key.endsWith("__tokens_per_second")) {
    return { label: "Minimum tokens per second", unit: "tok/s" };
  }
  if (key.endsWith("__gpu_temperature_avg")) {
    return {
      label: "Thermal headroom",
      note: "(optional)",
      hint: "Uses the average GPU temperature recorded during the benchmark.",
    };
  }
  return { label: key.replace(/_/g, " ") };
}

interface ControlBase {
  key: string;
  label: string;
  note: string;
  hint: string;
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
interface ToggleControl extends ControlBase {
  kind: "toggle";
}
type Control = SegmentsControl | SliderControl | SelectControl | ToggleControl;

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

// The slider runs continuously from "Any" to the highest reported value;
// wide ranges move in coarser steps so a drag lands on round numbers.
function sliderMax(option: RequirementOption): number {
  const top = option.max ?? 0;
  return top > 0 ? Math.ceil(top) : 0;
}

function sliderStep(max: number): number {
  if (max > 2000) return 50;
  if (max > 500) return 10;
  return 1;
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
    hint: text.hint ?? "",
  };
  if (option.type === "boolean") return { ...base, kind: "toggle" };
  if (option.key === "cuda_driver_version") {
    const segments = cudaVersions(option).map((version) => ({
      value: version,
      label: `${version}+`,
    }));
    return segments.length ? { ...base, kind: "segments", segments } : null;
  }
  if (option.key.endsWith("__gpu_temperature_avg")) {
    const segments = [75, 65].map((celsius) => ({
      value: celsius,
      label: `GPU under ${celsius} °C`,
    }));
    return option.values.length
      ? { ...base, kind: "segments", segments }
      : null;
  }
  if (option.match === "minimum" && option.type !== "text") {
    const max = sliderMax(option);
    return max > 0
      ? {
          ...base,
          kind: "slider",
          unit: text.unit ?? "",
          max,
          step: sliderStep(max),
          ticks: sliderTicks(max, option.key !== "ping_ms"),
        }
      : null;
  }
  const choices = choicesOf(option);
  return choices.length
    ? { ...base, kind: "select", anyLabel: text.anyLabel ?? "Any", choices }
    : null;
}

// Benchmarks: one model at a time; its throughput floor and thermal headroom.
const benchmarkModels = computed(() =>
  metrics.value
    .filter(
      (option) =>
        option.group === "benchmarks" &&
        option.key.endsWith("__tokens_per_second"),
    )
    .map((option) => ({
      id: benchmarkModelOf(option.key),
      label: benchmarkModelLabel(option.key),
      measured: option.values.reduce(
        (sum, { value, nodes }) =>
          typeof value === "number" ? sum + nodes : sum,
        0,
      ),
    })),
);
const pickedBenchmarkModel = ref<string | null>(null);
const benchmarkModel = computed(() => {
  const ids = benchmarkModels.value.map((model) => model.id);
  const picked = pickedBenchmarkModel.value;
  if (picked && ids.includes(picked)) return picked;
  const set = Object.keys(props.modelValue)
    .map(benchmarkModelOf)
    .find((id) => ids.includes(id));
  return set ?? ids[0] ?? null;
});

function onBenchmarkModel(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) return;
  pickedBenchmarkModel.value = event.target.value;
}

const panelKeys = computed(() => {
  const keys = categoryKeys(activePanel.value, metrics.value);
  if (activePanel.value.id !== "benchmarks") return keys;
  const model = benchmarkModel.value;
  return model ? keys.filter((key) => benchmarkModelOf(key) === model) : [];
});

const panelControls = computed(() =>
  panelKeys.value.flatMap((key) => {
    const option = metrics.value.find((metric) => metric.key === key);
    const control = option ? buildControl(option) : null;
    return control ? [control] : [];
  }),
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

// One notice, shown above whichever category is open: host data down, or a
// failed match.
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

// --- Two cards side by side: the category list, then the active category ---
.req-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

@media screen and (max-width: 767px) {
  .req-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

// --- Left card: categories ---
.req-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0.75rem 0.5rem;
}

.req-layout:not(.is-flat) .req-nav {
  @include soft-panel;
}

.req-layout.is-flat .req-nav {
  padding: 0;
}

.req-nav-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.req-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
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

// --- Centre card: a header with a hairline under it, then rows that run
// edge to edge (the GPU list) or a padded body (a category's controls) ---
.req-main {
  @include soft-panel;
  padding: 0;
}

.req-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 18px;
  border-bottom: 1px solid $border-soft;
}

// On the GPU list the head holds only the search, kept to the right.
.req-head .req-search {
  margin-left: auto;
}

.req-heading {
  min-width: 0;

  h3 {
    margin: 0;
    font-family: $title-family;
    font-weight: 600;
    font-size: 16px;
    letter-spacing: -0.01em;
    color: $text;
  }

  p {
    margin: 3px 0 0;
    font-size: 0.8125rem;
    color: $text-muted;
  }
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

// A notice above the body sits on its own row, like one above the GPU list.
.section-row + .req-body {
  border-top: 1px solid $border-soft;
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

// The slim search on the right of the centre card's header
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

.req-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 10px;
  border: 1px solid $border-soft;
  background: $white;

  strong {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
  }

  small {
    display: block;
    margin-top: 1px;
    font-size: 0.72rem;
    color: $text-muted;
  }
}

.req-toggle {
  position: relative;
  flex-shrink: 0;
  width: 38px;
  height: 21px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #c3c7cd;
  cursor: pointer;
  transition: background 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: $white;
    transition: left 0.2s ease;
  }

  &.is-on {
    background: $secondary;

    &::after {
      left: 20px;
      background: #000;
    }
  }
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
  .gpu-row,
  .req-toggle,
  .req-toggle::after {
    transition: none;
  }
}

// --- Dark theme ---
html.dark-mode {
  .req-link {
    color: $secondary;
  }

  .req-head,
  .section-row + .req-body {
    border-color: rgba($white, 0.1);
  }

  .req-heading h3 {
    color: $white;
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

  .req-toggle-row {
    background: #1c1c1c;
    border-color: rgba($white, 0.08);
  }

  .req-dot {
    background: #5e6266;
  }

  .req-toggle {
    background: rgba($white, 0.15);

    &.is-on {
      background: $secondary;
    }
  }

  .range-slider {
    background: #3a3a3a;
    --req-thumb: #242526;
  }
}
</style>
