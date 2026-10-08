<template>
  <div class="template-step">
    <!-- Hero: the chosen workload and its deploy card -->
    <section class="deploy-surface template-hero">
      <span class="deploy-surface-grid" aria-hidden="true"></span>
      <div class="hero-body">
        <div class="hero-text">
          <button type="button" class="hero-back" @click="emit('back')">
            ← All templates
          </button>
          <div class="hero-identity">
            <img
              v-if="template?.icon"
              class="hero-logo"
              :src="template.icon"
              alt=""
            />
            <span v-else-if="template" class="hero-logo hero-logo-fallback">
              {{ title.charAt(0).toUpperCase() }}
            </span>
            <span v-else class="hero-logo hero-logo-fallback">
              <DeployCategoryIcon icon="code" />
            </span>
            <div class="hero-heading">
              <div v-if="tags.length" class="hero-tags">
                <span v-for="tag in tags" :key="tag" class="hero-tag">{{
                  tag
                }}</span>
              </div>
              <h2 class="hero-title">{{ title }}</h2>
            </div>
          </div>
          <p v-if="lead" class="hero-lead">{{ lead }}</p>
          <div class="hero-chips">
            <span v-if="image" class="hero-chip">{{ image }}</span>
            <span v-else-if="!template" class="hero-chip is-muted">
              No image yet
            </span>
            <span v-if="ports.length" class="hero-chip is-plain">
              Port {{ ports.join(", ") }}
            </span>
            <span v-if="vram" class="hero-chip is-plain">{{ vram }}</span>
            <button
              v-if="template"
              type="button"
              class="hero-chip is-action"
              @click="emit('edit-job', 'builder')"
            >
              Edit job definition
            </button>
          </div>
        </div>

        <!-- The deploy card: the summary of everything chosen, and the action -->
        <aside class="deploy-card">
          <span class="deploy-eyebrow">Your deployment</span>
          <label v-if="template?.variants?.length" class="deploy-field">
            <span>Variant</span>
            <select
              :value="selectedVariantId"
              aria-label="Variant"
              @change="chooseVariant"
            >
              <option
                v-for="variant in template.variants"
                :key="variant.id"
                :value="variant.id"
              >
                {{ variantLabel(variant) }}
              </option>
            </select>
          </label>

          <button type="button" class="deploy-line" @click="openCompute('gpu')">
            <template v-if="gpu">
              <span class="deploy-gpu-logo" aria-hidden="true">
                <NvidiaIcon class="deploy-gpu-mark" />
              </span>
              <span class="deploy-line-value">
                <strong>
                  {{ gpuName }}
                  <span v-if="recommended" class="deploy-gpu-rec"
                    >Recommended</span
                  >
                </strong>
                <small class="is-mono">
                  {{ gpu.vramGb }} GB ·
                  {{ hosts?.available ?? gpu.available }} available ·
                  {{ hosts?.working ?? gpu.working }} working
                </small>
              </span>
              <span v-if="gpuPrice !== null" class="deploy-gpu-price">
                ${{ gpuPrice.toFixed(2) }}<small>/h</small>
              </span>
            </template>
            <template v-else>
              <span class="deploy-line-label">GPU</span>
              <span class="deploy-line-value"
                ><small>{{ runsOn }}</small></span
              >
            </template>
            <DeployCategoryIcon icon="arrow" class="deploy-line-chevron" />
          </button>

          <button
            type="button"
            class="deploy-line"
            @click="openCompute('requirements')"
          >
            <span class="deploy-line-label">Requirements</span>
            <span class="deploy-line-value">
              <template v-if="requirements.length">
                <span
                  v-for="item in requirements"
                  :key="item.key"
                  class="deploy-chip"
                >
                  {{ item.text }}
                </span>
              </template>
              <small v-else>None · add requirements</small>
            </span>
            <DeployCategoryIcon icon="arrow" class="deploy-line-chevron" />
          </button>

          <button
            type="button"
            class="deploy-line"
            @click="emit('open', 'settings')"
          >
            <span class="deploy-line-label">Settings</span>
            <span class="deploy-line-value">
              <strong>{{ settingsLine }}</strong>
              <small>{{ settingsNote }}</small>
            </span>
            <DeployCategoryIcon icon="arrow" class="deploy-line-chevron" />
          </button>

          <p v-if="deployNotice" class="deploy-notice">{{ deployNotice }}</p>
          <p v-if="deployNote" class="deploy-note">{{ deployNote }}</p>
          <button
            ref="deployCta"
            type="button"
            class="deploy-cta"
            :disabled="deployDisabled"
            @click="emit('deploy')"
          >
            {{ deployLabel }}
          </button>
          <button
            v-if="showClaim"
            type="button"
            class="deploy-link deploy-claim"
            @click="emit('claim')"
          >
            Have a code? Claim it
          </button>
        </aside>

        <!-- The readme, under the template's identity: cut at about the
             card's height until opened -->
        <div v-if="readmeHtml" class="hero-readme">
          <div
            class="hero-readme-fold"
            :class="{
              'is-folded': !readmeOpen,
              'is-faded': !readmeOpen && readmeOverflows,
            }"
          >
            <div
              ref="readmeBody"
              class="hero-readme-body"
              v-html="readmeHtml"
            />
          </div>
          <button
            v-if="readmeOpen || readmeOverflows"
            type="button"
            class="hero-readme-toggle"
            :aria-expanded="readmeOpen"
            @click="readmeOpen = !readmeOpen"
          >
            {{ readmeOpen ? "Show less" : "Read more" }}
            <svg
              viewBox="0 0 24 24"
              :class="{ 'is-open': readmeOpen }"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- The page body, under the hero: for your own image the container
         first, then the GPU choice -->
    <div class="template-body">
      <section v-if="!template" ref="inlineJob" class="job-section">
        <header class="job-head">
          <h3>Container</h3>
          <button
            type="button"
            class="job-json"
            @click="emit('edit-job', 'json')"
          >
            Edit as JSON
          </button>
        </header>
        <slot name="job" />
      </section>
      <div ref="inlineCompute">
        <slot name="compute" />
      </div>
    </div>

    <!-- Once the deploy card has scrolled away, its action follows. The
         holder keeps the bar's height at the end of the page, so the page
         never jumps when it shows and never hides the last content. -->
    <div class="deploy-bar-holder">
      <Transition name="deploy-bar">
        <div v-if="!ctaInView && !panel" class="deploy-bar">
          <span class="deploy-bar-text">
            <strong>{{ title }}</strong>
            <small>{{ barSummary }}</small>
          </span>
          <button
            type="button"
            class="deploy-cta deploy-bar-cta"
            :disabled="deployDisabled"
            @click="emit('deploy')"
          >
            {{ deployLabel }}
          </button>
        </div>
      </Transition>
    </div>

    <!-- Editors slide in from the right, opened from the deploy card -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="panel" class="sheet-layer" @click.self="emit('close')">
          <aside
            class="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
          >
            <header class="sheet-head">
              <div>
                <h3>Settings</h3>
                <p>
                  How your deployment runs. The defaults suit most workloads.
                </p>
              </div>
              <button
                type="button"
                class="sheet-close"
                aria-label="Close"
                @click="emit('close')"
              >
                ×
              </button>
            </header>
            <div class="sheet-body">
              <slot name="settings" />
            </div>
            <footer class="sheet-foot">
              <span>{{ defaults }}</span>
              <button type="button" class="sheet-done" @click="emit('close')">
                Done
              </button>
            </footer>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { JobDefinition } from "@nosana/kit";
import { marked } from "marked";
import {
  formatVram,
  requiredVramMb,
  templateDockerImage,
  templateReadmeSnippet,
  templateTags,
  variantLabel,
  type Template,
  type TemplateVariant,
} from "~/composables/useTemplates";
import {
  gpuHourlyUsd,
  type GpuModel,
  type MarketRate,
} from "~/composables/useNodeRequirements";
import NvidiaIcon from "@/assets/img/icons/nvidia.svg?component";
import {
  onKeyStroke,
  useIntersectionObserver,
  useResizeObserver,
} from "@vueuse/core";

type ComputeFocus = "gpu" | "requirements";

const props = defineProps<{
  /** The selected template, flattened onto its variant; null for your own. */
  template: Template | null;
  jobDefinition: JobDefinition | null;
  markets: MarketRate[] | null;
  /** The GPU catalogue and the VRAM the job asks for, to price the fit. */
  gpus: GpuModel[];
  requiredVramGb: number | null;
  /** The editor sliding in from the right, or none. */
  panel: "settings" | null;
  /** The GPU a deploy uses, with its short name, price and live host counts. */
  gpu: GpuModel | null;
  gpuName: string;
  gpuPrice: number | null;
  recommended: boolean;
  hosts: { available: number; working: number } | null;
  /** The requirements set beyond the GPU, as removable chips. */
  requirements: Array<{ key: string; text: string }>;
  /** The deploy button and the lines around it, decided by the page. */
  deployLabel: string;
  deployDisabled: boolean;
  deployNote: string;
  deployNotice: string;
  showClaim: boolean;
  /** "1 replica · Stateless · 6-hour rotation": what a deploy will use. */
  defaults: string;
  settingsLine: string;
  settingsNote: string;
}>();

const emit = defineEmits<{
  "select-variant": [variant: TemplateVariant];
  "remove-requirement": [key: string];
  "edit-job": [mode: "builder" | "json"];
  deploy: [];
  claim: [];
  /** The GPU and Requirements lines open the same editor at different places. */
  open: [panel: "compute" | "settings", focus?: ComputeFocus];
  close: [];
  back: [];
}>();

// The GPU and Requirements lines scroll to the selector under the hero; the
// page points it at the GPU list or the requirement categories.
const inlineCompute = ref<HTMLElement | null>(null);
function openCompute(focus: ComputeFocus) {
  emit("open", "compute", focus);
  inlineCompute.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Your own image starts on the container's image field, the one thing it
// needs before it can deploy.
const inlineJob = ref<HTMLElement | null>(null);
onMounted(async () => {
  if (props.template || image.value) return;
  await nextTick();
  inlineJob.value
    ?.querySelector<HTMLInputElement>("input.jinput")
    ?.focus({ preventScroll: true });
});

// The bar under the page shows once the card's deploy button is no longer
// fully in view, so the action is always one click away.
const deployCta = ref<HTMLElement | null>(null);
const ctaInView = ref(true);
useIntersectionObserver(
  deployCta,
  ([entry]) => {
    ctaInView.value = (entry?.intersectionRatio ?? 1) > 0.99;
  },
  { threshold: [0, 1] },
);
const barSummary = computed(() =>
  [
    props.gpu
      ? `${props.gpuName}${props.gpuPrice !== null ? ` · $${props.gpuPrice.toFixed(2)}/h` : ""}`
      : "No GPU chosen yet",
    props.settingsLine,
  ].join(" · "),
);

// Escape closes the panel; the page behind does not scroll while it is open.
const { lockScroll, unlockScroll } = useModalScrollLock();
watch(
  () => props.panel,
  (panel) =>
    panel ? lockScroll("workload-panel") : unlockScroll("workload-panel"),
  { immediate: true },
);
onBeforeUnmount(() => unlockScroll("workload-panel"));
onKeyStroke("Escape", () => {
  if (props.panel) emit("close");
});

// The flattened name carries " - <variant>"; the page names the template.
const title = computed(() => {
  const template = props.template;
  if (!template) return "Custom deployment";
  const variant = template.selectedVariant;
  const suffix = variant ? ` - ${variant.name}` : "";
  return suffix && template.name.endsWith(suffix)
    ? template.name.slice(0, -suffix.length)
    : template.name;
});

const GROUPING_TAGS = ["Featured", "New", "Community"];
const tags = computed(() =>
  props.template
    ? templateTags(props.template).filter((tag) => !GROUPING_TAGS.includes(tag))
    : [],
);

// The parent description, or the first readme paragraph when there is none.
const lead = computed(() => {
  const template = props.template;
  if (!template) return "Run your own container image on a Nosana GPU.";
  return template.description?.trim() || templateReadmeSnippet(template) || "";
});

const image = computed(() => templateDockerImage(props.jobDefinition));

// Every port the job exposes, whichever shape `expose` takes.
const ports = computed(() =>
  (props.jobDefinition?.ops ?? []).flatMap((op) => {
    const args: unknown = op.args;
    if (!args || typeof args !== "object" || !("expose" in args)) return [];
    const exposed: unknown = args.expose;
    const entries: unknown[] = Array.isArray(exposed) ? exposed : [exposed];
    return entries.flatMap((entry) => {
      if (typeof entry === "number" || typeof entry === "string")
        return [String(entry)];
      if (entry && typeof entry === "object" && "port" in entry)
        return [String(entry.port)];
      return [];
    });
  }),
);

const selectedVariantId = computed(
  () =>
    props.template?.selectedVariant?.id ?? props.template?.variants?.[0]?.id,
);

function chooseVariant(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) return;
  const id = event.target.value;
  const variant = props.template?.variants?.find(
    (candidate) => candidate.id === id,
  );
  if (variant) emit("select-variant", variant);
}

// Before a GPU resolves: "GPUs with 12 GB VRAM or more · from $0.14/h".
const cheapestFit = computed(() => {
  const needed = props.requiredVramGb ?? 0;
  const prices = props.gpus
    .filter((gpu) => gpu.vramGb >= needed)
    .flatMap((gpu) => {
      const price = gpuHourlyUsd(gpu, props.markets);
      return price === null ? [] : [price];
    });
  return prices.length ? Math.min(...prices) : null;
});
const runsOn = computed(() => {
  const fit = props.requiredVramGb
    ? `GPUs with ${props.requiredVramGb} GB VRAM or more`
    : "Any GPU";
  return cheapestFit.value === null
    ? fit
    : `${fit} · from $${cheapestFit.value.toFixed(2)}/h`;
});

// The readme as HTML, without its leading "# Title" (the hero names it).
const readmeHtml = computed(() => {
  const readme = props.template?.readme?.replace(/^\s*#\s+[^\n]*\n/, "") ?? "";
  return readme.trim() ? String(marked(readme)) : "";
});

// "12 GB VRAM": what the chosen variant asks of the GPU.
const vram = computed(() => {
  const mb = requiredVramMb(props.jobDefinition);
  return mb ? formatVram(mb) : null;
});

// Folded, the readme shows only its start; the toggle appears once there is
// more to show, and a new template starts folded again.
const readmeOpen = ref(false);
const readmeBody = ref<HTMLElement | null>(null);
const readmeOverflows = ref(false);
useResizeObserver(readmeBody, () => {
  const fold = readmeBody.value?.parentElement;
  readmeOverflows.value = Boolean(
    fold &&
      readmeBody.value &&
      readmeBody.value.offsetHeight > fold.clientHeight,
  );
});
watch(
  () => props.template?.id,
  () => {
    readmeOpen.value = false;
  },
);
</script>

<style lang="scss" scoped>
.template-step {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* ---------- Hero: the developers-page hero ---------- */
.template-hero {
  padding: 3rem;
  // Clipped, not a scroll container, so the deploy card can stick.
  overflow: clip;
  // The same name as the workload hero: switching steps morphs one into the
  // other (the transition itself is in deploy-surface.scss).
  view-transition-name: deploy-hero;
}

.template-body {
  view-transition-name: deploy-body;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* ---------- Your own image: the container, edited in place ---------- */
.job-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  h3 {
    margin: 0;
    font-family: $title-family;
    font-weight: 600;
    font-size: 18px;
    letter-spacing: -0.01em;
    color: $text;
  }
}

.job-json {
  padding: 0;
  border: 0;
  background: transparent;
  color: $secondary-text;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

html.dark-mode {
  .job-head h3 {
    color: #fff;
  }

  .job-json {
    color: $secondary;
  }
}

// The template's identity, then its readme, beside the deploy card, which
// spans both and sticks to the top of the window while the readme scrolls.
.hero-body {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 400px);
  grid-template-areas:
    "text card"
    "readme card";
  grid-template-rows: auto 1fr;
  column-gap: 3rem;
}

// Top-aligned with the deploy card: the back link starts on the line of the
// card's "Your deployment" header, and the template info follows it.
.hero-text {
  grid-area: text;
  min-width: 0;
}

.hero-back {
  display: block;
  // The deploy card's border and padding, so both start on one line.
  margin-top: 23px;
  margin-bottom: 1.4rem;
  line-height: 1.5;
  padding: 0;
  border: 0;
  background: transparent;
  color: $secondary;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: #8bf58f;
  }
}

.hero-identity {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 1.25rem;
}

.hero-heading {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.hero-logo {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #fff;
  object-fit: contain;
  padding: 10px;
  box-sizing: border-box;
}

.hero-logo-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba($secondary, 0.12);
  color: $secondary;
  font-family: $title-family;
  font-weight: 700;
  font-size: 1.5rem;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hero-tag {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 12px;
  font-weight: 600;
  color: #d7e0d7;
}

.hero-title {
  margin: 0;
  font-family: $title-family;
  font-weight: 600;
  font-size: 2.75rem;
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: #fff;
}

.hero-lead {
  margin: 0 0 1.4rem;
  max-width: 34rem;
  color: #b7c0b6;
  font-size: 1.0625rem;
  line-height: 1.55;
}

.hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-chip {
  padding: 5px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-family: var(--mono);
  font-size: 12px;
  color: #8bf58f;
  word-break: break-all;

  &.is-plain {
    color: #e8f0e8;
  }

  &.is-muted {
    color: #8a948a;
    font-family: inherit;
    border-style: dashed;
  }
}

/* The glass deploy card */
.deploy-card {
  grid-area: card;
  align-self: start;
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.8);
}

.deploy-eyebrow {
  font-family: var(--mono, $family-monospace);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $secondary;
}

.deploy-field {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 2.75rem;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);

  span {
    font-size: 12px;
    color: #8a948a;
  }

  select {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: #fff;
    color-scheme: dark;
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
  }

  &:focus-within {
    border-color: $secondary;
    box-shadow: 0 0 0 3px rgba($secondary, 0.18);
  }
}

.deploy-gpu-logo {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #0a0c0a;
  border: 1px solid rgba($secondary, 0.2);
  color: $secondary;
}

.deploy-gpu-mark {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.deploy-gpu-rec {
  margin-left: 4px;
  font-family: $family-sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: $secondary;
}

.deploy-gpu-price {
  font-family: $title-family;
  font-weight: 700;
  font-size: 16px;
  color: #fff;

  small {
    font-family: $family-sans-serif;
    font-size: 11px;
    font-weight: 400;
    color: #8a948a;
  }
}

.deploy-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: $secondary;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    color: #8bf58f;
  }
}

.deploy-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 18px;
  border: 0;
  border-radius: 10px;
  background: $secondary;
  color: #05230a;
  font-family: inherit;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 8px 24px -8px rgba($secondary, 0.6);
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;

  svg {
    width: 15px;
    height: 15px;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px -8px rgba($secondary, 0.75);
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
    box-shadow: none;
  }
}

/* ---------- Readme, in the always-dark hero ---------- */
.hero-readme {
  grid-area: readme;
  min-width: 0;
  max-width: 46rem;
  margin-top: 1.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-readme-fold {
  &.is-folded {
    max-height: 11rem;
    overflow: hidden;
  }

  // The text itself fades out, so the hero's glow and dot grid show through
  // rather than a painted band of one colour.
  &.is-faded {
    mask-image: linear-gradient(to bottom, #000 45%, transparent);
  }
}

.hero-readme-body {
  color: #c3ccc2;
  font-size: 15px;
  line-height: 1.7;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 1.5rem 0 0.5rem;
    font-family: $title-family;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: #fff;
  }

  :deep(h1) {
    font-size: 1.3rem;
  }

  :deep(h2) {
    font-size: 1.15rem;
  }

  :deep(h3) {
    font-size: 1.05rem;
  }

  :deep(> :first-child) {
    margin-top: 0;
  }

  :deep(p),
  :deep(ul),
  :deep(ol) {
    margin: 0 0 0.85rem;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 1.25rem;
  }

  :deep(ul) {
    list-style: disc;
  }

  :deep(ol) {
    list-style: decimal;
  }

  :deep(strong) {
    color: #fff;
  }

  :deep(a) {
    color: $secondary;
  }

  :deep(code) {
    padding: 1px 6px;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.08);
    font-family: $family-monospace;
    font-size: 13px;
    color: #e8f0e8;
  }

  :deep(pre) {
    @include code-surface-frame;
    padding: 1rem 1.15rem;
    margin: 0 0 1rem;
    overflow-x: auto;

    code {
      padding: 0;
      background: transparent;
      color: #e6edf3;
    }
  }
}

.hero-readme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 0.6rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: $secondary;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: #8bf58f;
  }

  svg {
    width: 15px;
    height: 15px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 0.2s ease;

    &.is-open {
      transform: rotate(180deg);
    }
  }
}

@media screen and (max-width: 1100px) {
  // Stacked: identity, the card, then the readme; nothing sticks.
  .hero-body {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "text"
      "card"
      "readme";
    grid-template-rows: auto;
    row-gap: 2rem;
  }

  .deploy-card {
    position: static;
  }

  // Stacked, the card sits below: nothing to line up with.
  .hero-back {
    margin-top: 0;
  }
}

@media screen and (max-width: 768px) {
  .template-hero {
    padding: 2rem 1.5rem;
  }

  .hero-title {
    font-size: 2.1rem;
  }
}

/* ---------- Deploy card extras ---------- */
.deploy-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px 2px 9px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  font-family: var(--mono);
  font-size: 11.5px;
  color: #fff;

  button {
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #8a948a;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  }
}

.deploy-notice,
.deploy-note {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.45;
}

.deploy-notice {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 181, 71, 0.1);
  border: 1px solid rgba(255, 181, 71, 0.3);
  color: #ffd38a;
}

.deploy-note {
  color: #d7e0d7;
}

.deploy-claim {
  align-self: center;
}

.hero-chip.is-action {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: transparent;
  color: $secondary;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: $secondary;
  }
}

.hero-logo-fallback svg {
  width: 26px;
  height: 26px;
}

/* ---------- Deploy card lines: each opens its editor ---------- */
.deploy-line {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.28);
  color: #fff;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover,
  &:focus-visible {
    border-color: $secondary;
    background: rgba($secondary, 0.06);
    outline: none;

    .deploy-line-chevron {
      color: $secondary;
      transform: translateX(2px);
    }
  }
}

.deploy-line-label {
  flex-shrink: 0;
  width: 92px;
  font-size: 12px;
  color: #8a948a;
}

.deploy-line-value {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    width: 100%;
    font-family: $title-family;
    font-weight: 600;
    font-size: 14.5px;
    color: #fff;
  }

  small {
    display: block;
    width: 100%;
    font-size: 12px;
    color: #8a948a;

    &.is-mono {
      font-family: var(--mono);
      font-size: 11.5px;
    }
  }
}

.deploy-line-chevron {
  flex-shrink: 0;
  font-size: 15px;
  color: #6f7a6e;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

/* ---------- Slide-over editors ---------- */
.sheet-layer {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.55);
}

.sheet {
  display: flex;
  flex-direction: column;
  width: min(720px, 100vw);
  height: 100%;
  background: $white;
  border-left: 1px solid $border-soft;
  box-shadow: -30px 0 60px -20px rgba(0, 0, 0, 0.35);
}

.sheet-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 22px 26px;
  border-bottom: 1px solid $border-soft;

  h3 {
    margin: 0;
    font-family: $title-family;
    font-weight: 600;
    font-size: 20px;
    color: $text;
  }

  p {
    margin: 2px 0 0;
    font-size: 13px;
    color: $text-muted;
  }
}

.sheet-close {
  margin-left: auto;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: $text-muted;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: $surface-hover;
    color: $text;
  }
}

.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 26px;
}

.sheet-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 26px;
  border-top: 1px solid $border-soft;
  background: $surface-sunken;

  span {
    min-width: 0;
    font-size: 13px;
    color: $text-muted;
  }
}

.sheet-done {
  margin-left: auto;
  flex-shrink: 0;
  padding: 11px 24px;
  border: 0;
  border-radius: 10px;
  background: $text;
  color: $white;
  font-family: inherit;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: background-color 0.25s ease;

  .sheet {
    transition: transform 0.25s ease;
  }
}

.sheet-enter-from,
.sheet-leave-to {
  background: rgba(0, 0, 0, 0);

  .sheet {
    transform: translateX(100%);
  }
}

html.dark-mode {
  .sheet {
    background: #1c1c1c;
    border-color: rgba($white, 0.1);
  }

  .sheet-head {
    border-color: rgba($white, 0.1);

    h3 {
      color: $white;
    }

    p {
      color: #8a948a;
    }
  }

  .sheet-close:hover {
    background: rgba($white, 0.06);
    color: $white;
  }

  .sheet-foot {
    background: #191919;
    border-color: rgba($white, 0.1);

    span {
      color: #8a948a;
    }
  }

  .sheet-done {
    background: $white;
    color: #000;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active .sheet,
  .sheet-leave-active .sheet {
    transition: none;
  }
}

/* ---------- The deploy bar, once the card has scrolled away ---------- */
// As tall as the bar, so the end of the page always has room for it and it
// never covers the last content; clicks pass through everywhere but the bar.
.deploy-bar-holder {
  position: sticky;
  bottom: 16px;
  z-index: 5;
  height: 66px;
  pointer-events: none;
}

.deploy-bar {
  pointer-events: auto;
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 14px 12px 20px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(20, 24, 19, 0.94);
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 50px -18px rgba(0, 0, 0, 0.9);
  color: #fff;
}

.deploy-bar-text {
  flex: 1;
  min-width: 0;

  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  }

  small {
    font-family: var(--mono, $family-monospace);
    font-size: 12px;
    color: #8a948a;
  }
}

.deploy-cta.deploy-bar-cta {
  flex-shrink: 0;
  width: auto;
  padding: 11px 18px;
  font-size: 14px;
}

.deploy-bar-enter-active,
.deploy-bar-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.deploy-bar-enter-from,
.deploy-bar-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  .deploy-bar-enter-active,
  .deploy-bar-leave-active {
    transition: none;
  }
}
</style>
