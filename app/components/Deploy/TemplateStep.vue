<template>
  <div class="template-step">
    <!-- Once the hero has scrolled away, a slim header keeps which template
         and which variant in view. The holder takes no height. -->
    <div class="slim-holder">
      <Transition name="slim">
        <div v-if="!heroInView" class="deploy-surface slim-header">
          <span class="deploy-surface-grid" aria-hidden="true"></span>
          <div class="slim-body">
            <img
              v-if="template?.icon"
              class="slim-logo"
              :src="template.icon"
              alt=""
            />
            <span v-else class="slim-logo hero-logo-fallback">
              <DeployCategoryIcon v-if="!template" icon="code" />
              <template v-else>{{ title.charAt(0).toUpperCase() }}</template>
            </span>
            <strong class="slim-title">{{ title }}</strong>
            <DeployVariantSelect
              v-if="template?.variants?.length"
              class="slim-variant"
              surface
              :variants="template.variants"
              :selected="selectedVariant"
              :label="`${title} variant`"
              @select="emit('select-variant', $event)"
            />
          </div>
        </div>
      </Transition>
    </div>

    <!-- Hero: only the template, what it is and what it does -->
    <section ref="hero" class="deploy-surface template-hero">
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
        </div>

        <!-- The readme across the hero, folded until opened -->
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

      <!-- Everything about running it, on one bar along the hero's foot -->
      <div class="hero-specs">
        <DeployVariantSelect
          v-if="template?.variants?.length"
          class="hero-variant"
          surface
          :variants="template.variants"
          :selected="selectedVariant"
          :label="`${title} variant`"
          @select="emit('select-variant', $event)"
        />
        <div class="hero-spec">
          <span>Image</span>
          <span :class="{ 'is-muted': !image }">{{
            image ?? "No image yet"
          }}</span>
        </div>
        <div v-if="ports.length" class="hero-spec">
          <span>Exposes</span>
          <span>Port {{ ports.join(", ") }}</span>
        </div>
        <!-- With variants the picker shows the VRAM; without, it's a spec -->
        <div v-if="vram && !template?.variants?.length" class="hero-spec">
          <span>GPU memory</span>
          <span>{{ vram }}</span>
        </div>
        <button
          v-if="template"
          type="button"
          class="hero-edit"
          @click="emit('edit-job', 'builder')"
        >
          <DeployCategoryIcon icon="code" />
          Edit job definition
        </button>
      </div>
    </section>

    <!-- Deploying: the configurator, and the summary beside it -->
    <div class="template-body">
      <div class="configurator">
        <header class="configurator-head">
          <h2>Customise your deployment</h2>
        </header>

        <section v-if="!template" ref="inlineJob" class="deploy-step">
          <header class="deploy-step-head">
            <span class="deploy-step-num">01</span>
            <h3>Container</h3>
            <span class="deploy-step-hint">What runs on the GPU</span>
            <button
              type="button"
              class="deploy-step-action job-json"
              @click="emit('edit-job', 'json')"
            >
              Edit as JSON
            </button>
          </header>
          <slot name="job" />
        </section>

        <slot name="compute" :first-step="firstComputeStep" />

        <section class="deploy-step">
          <header class="deploy-step-head">
            <span class="deploy-step-num">{{ settingsStep }}</span>
            <h3>How it runs</h3>
          </header>
          <div class="settings-panel">
            <slot name="settings" />
          </div>
        </section>
      </div>

      <!-- Your deployment: the recommended setup by default, so Deploy now
           is one click; it follows every change and sticks while you scroll -->
      <aside class="summary-card">
        <div class="summary-head">
          <span class="deploy-eyebrow">Your deployment</span>
          <span v-if="isRecommended" class="summary-rec">
            ✓ Recommended setup
          </span>
          <button
            v-else
            type="button"
            class="deploy-link summary-reset"
            @click="emit('reset')"
          >
            Reset to recommended
          </button>
        </div>
        <dl class="summary-rows">
          <div>
            <dt>GPU</dt>
            <dd>
              <template v-if="gpu">
                <b>{{ gpuName }}</b> · {{ gpu.vramGb }} GB
              </template>
              <template v-else>{{ runsOn }}</template>
              <span v-if="changes.gpu" class="summary-changed">Changed</span>
            </dd>
          </div>
          <div v-if="requirements.length">
            <dt>Requirements</dt>
            <dd>
              <span
                v-for="item in requirements"
                :key="item.key"
                class="summary-chip"
                >{{ item.text }}</span
              >
            </dd>
          </div>
          <div v-if="gpu">
            <dt>Matching</dt>
            <dd>
              {{ hosts?.available ?? gpu.available }} available ·
              {{ hosts?.working ?? gpu.working }} working
            </dd>
          </div>
          <div>
            <dt>Runs</dt>
            <dd>
              {{ runs }}
              <span v-if="changes.runs" class="summary-changed">Changed</span>
            </dd>
          </div>
        </dl>
        <div class="summary-price">
          <span>Price</span>
          <strong>{{ hourlyCost }}<small>/h</small></strong>
        </div>
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
    </div>

    <!-- On narrow screens the summary sits below the settings: once its
         button is out of view, the action follows in a bar. The holder keeps
         the bar's height at the end of the page, so nothing jumps. -->
    <div class="deploy-bar-holder">
      <Transition name="deploy-bar">
        <div v-if="!ctaInView" class="deploy-bar">
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
  type Template,
  type TemplateVariant,
} from "~/composables/useTemplates";
import {
  gpuHourlyUsd,
  type GpuModel,
  type MarketRate,
} from "~/composables/useNodeRequirements";
import { useIntersectionObserver, useResizeObserver } from "@vueuse/core";

const props = defineProps<{
  /** The selected template, flattened onto its variant; null for your own. */
  template: Template | null;
  jobDefinition: JobDefinition | null;
  markets: MarketRate[] | null;
  /** The GPU catalogue and the VRAM the job asks for, to price the fit. */
  gpus: GpuModel[];
  requiredVramGb: number | null;
  /** The GPU a deploy uses, with its short name, price and live host counts. */
  gpu: GpuModel | null;
  gpuName: string;
  gpuPrice: number | null;
  hosts: { available: number; working: number } | null;
  /** The requirements set beyond the GPU, as chips. */
  requirements: Array<{ key: string; text: string }>;
  /** "1 replica · Stateless · 6-hour rotation": how it runs. */
  runs: string;
  /** What differs from the recommended setup, marked in the summary. */
  changes: { gpu: boolean; hosts: boolean; runs: boolean };
  /** "$0.28": every replica's hourly price together. */
  hourlyCost: string;
  /** The deploy button and the lines around it, decided by the page. */
  deployLabel: string;
  deployDisabled: boolean;
  deployNote: string;
  deployNotice: string;
  showClaim: boolean;
}>();

const emit = defineEmits<{
  "select-variant": [variant: TemplateVariant];
  "edit-job": [mode: "builder" | "json"];
  /** Back to the recommended GPU, no host requirements, default settings. */
  reset: [];
  deploy: [];
  claim: [];
  back: [];
}>();

// The steps are numbered; your own image starts with its container.
const firstComputeStep = computed(() => (props.template ? 1 : 2));
const settingsStep = computed(() =>
  String(firstComputeStep.value + 2).padStart(2, "0"),
);

const isRecommended = computed(
  () => !props.changes.gpu && !props.changes.hosts && !props.changes.runs,
);

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

// The slim header shows once the hero has scrolled out of view.
const hero = ref<HTMLElement | null>(null);
const heroInView = ref(true);
useIntersectionObserver(hero, ([entry]) => {
  heroInView.value = entry?.isIntersecting ?? true;
});

// The bar under the page shows once the summary's deploy button is no longer
// fully in view (on narrow screens, where the summary is not beside you).
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
    props.runs,
  ].join(" · "),
);

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

// The variant the template was flattened onto, else its first.
const selectedVariant = computed(
  () => props.template?.selectedVariant ?? props.template?.variants?.[0],
);

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
// Without its opening paragraph, too, when that only repeats the lead under
// the title beside it (templates often open with their own description).
const readmeHtml = computed(() => {
  const body =
    props.template?.readme?.replace(/^\s*#\s+[^\n]*\n/, "").trim() ?? "";
  const [first = "", ...rest] = body.split(/\n\s*\n/);
  const lede = plainText(lead.value).replace(/…$/, "");
  const readme =
    lede && plainText(first).startsWith(lede) ? rest.join("\n\n") : body;
  return readme.trim() ? String(marked(readme)) : "";
});

// Markdown and spacing set aside, for comparing a paragraph with the lead.
function plainText(text: string) {
  return text.replace(/[*_`]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

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

/* ---------- Slim header: pinned once the hero has scrolled away ---------- */
// No height of its own, so the page never moves when the header shows.
.slim-holder {
  position: sticky;
  top: 16px;
  z-index: 6;
  height: 0;
}

.slim-header {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  padding: 10px 12px 10px 16px;
  border-radius: 16px;
  box-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.85);
}

.slim-body {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
}

.slim-logo {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #fff;
  object-fit: contain;
  padding: 6px;
  box-sizing: border-box;
}

.slim-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: $title-family;
  font-weight: 600;
  font-size: 17px;
  color: #fff;
}

.slim-variant {
  flex-shrink: 0;
  width: min(340px, 40%);
  margin-left: auto;
}

.slim-enter-active,
.slim-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.slim-enter-from,
.slim-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ---------- Hero: only the template ---------- */
.template-hero {
  // Shared with the spec bar, which runs to the hero's edges.
  --hero-pad-x: 3rem;
  padding: 2.5rem var(--hero-pad-x) 0;
  // The same name as the workload hero: switching steps morphs one into the
  // other (the transition itself is in deploy-surface.scss).
  view-transition-name: deploy-hero;
}

// The template's identity, then its readme across the full width.
.hero-body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.hero-text {
  min-width: 0;
}

.hero-back {
  display: block;
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
  margin: 0;
  max-width: 34rem;
  color: #b7c0b6;
  font-size: 1.0625rem;
  line-height: 1.55;
}

/* ---------- Spec bar: the variant, image, port and the editor ---------- */
.hero-specs {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 2rem;
  margin: 2rem calc(-1 * var(--hero-pad-x)) 0;
  padding: 1.1rem var(--hero-pad-x);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.22);
}

.hero-variant {
  flex: 0 1 360px;
  min-width: 240px;
}

.hero-spec {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  span:first-child {
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #7c877b;
  }

  span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--mono);
    font-size: 13px;
    color: #e8f0e8;

    &.is-muted {
      color: #8a948a;
    }
  }
}

.hero-edit {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 2.75rem;
  margin-left: auto;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: transparent;
  color: #fff;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.2s ease;

  svg {
    color: $secondary;
  }

  &:hover {
    border-color: $secondary;
  }
}

.hero-logo-fallback svg {
  width: 26px;
  height: 26px;
}

/* ---------- Readme, in the hero's right half ---------- */
.hero-readme {
  min-width: 0;
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

/* ---------- Body: the configurator, and the summary beside it ---------- */
.template-body {
  view-transition-name: deploy-body;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 28px;
  align-items: start;
}

.configurator {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 0;
}

.configurator-head {
  h2 {
    margin: 0;
    font-family: $title-family;
    font-weight: 600;
    font-size: 1.5rem;
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
  .configurator-head h2 {
    color: #fff;
  }

  .job-json {
    color: $secondary;
  }
}

.settings-panel {
  @include soft-panel;
  padding: 1.5rem;
}

/* ---------- The summary: your deployment, on the same panel as the steps ---------- */
.summary-card {
  @include soft-panel;
  // Under the slim header, which pins at the top while the settings scroll.
  position: sticky;
  top: 96px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px;
  overflow: visible;
}

.summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.summary-rec {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba($secondary, 0.12);
  color: $secondary-text;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

// A quiet way back, not a second call to action.
.deploy-link.summary-reset {
  color: $text-muted;

  &:hover {
    color: $text;
  }
}

.summary-rows {
  margin: 0;

  > div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 0;
    border-top: 1px solid $border-soft;
    font-size: 13.5px;

    &:first-child {
      padding-top: 0;
      border-top: 0;
    }
  }

  dt {
    flex-shrink: 0;
    color: $text-muted;
  }

  dd {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
    text-align: right;
    color: $text;

    b {
      font-weight: 600;
    }
  }
}

.summary-chip {
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid $border-soft;
  background: $surface-sunken;
  font-family: $family-monospace;
  font-size: 11.5px;
}

.summary-changed {
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 170, 30, 0.16);
  color: #9a5b00;
  font-size: 10.5px;
  font-weight: 700;
}

.summary-price {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid $border-soft;

  span {
    color: $text-muted;
    font-size: 13px;
  }

  strong {
    font-family: $title-family;
    font-weight: 700;
    font-size: 1.6rem;
    color: $text;

    small {
      font-family: $family-sans-serif;
      font-size: 0.8rem;
      font-weight: 400;
      color: $text-muted;
    }
  }
}

html.dark-mode {
  .summary-rec {
    color: $secondary;
  }

  .deploy-link.summary-reset {
    color: #8a948a;

    &:hover {
      color: #fff;
    }
  }

  .summary-rows {
    > div {
      border-color: rgba(255, 255, 255, 0.08);
    }

    dt {
      color: #8a948a;
    }

    dd {
      color: #fff;
    }
  }

  .summary-chip {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
  }

  .summary-changed {
    background: rgba(255, 190, 60, 0.14);
    color: #ffc24a;
  }

  .summary-price {
    border-color: rgba(255, 255, 255, 0.08);

    span {
      color: #8a948a;
    }

    strong {
      color: #fff;
    }
  }
}

.deploy-eyebrow {
  font-family: var(--mono, $family-monospace);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $secondary-text;
}

.deploy-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: $secondary-text;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
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

.deploy-notice,
.deploy-note {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.45;
}

.deploy-notice {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 181, 71, 0.12);
  border: 1px solid rgba(255, 181, 71, 0.4);
  color: #8a5300;
}

.deploy-note {
  color: $text-muted;
}

html.dark-mode {
  .deploy-eyebrow,
  .deploy-link {
    color: $secondary;
  }

  .deploy-notice {
    background: rgba(255, 181, 71, 0.1);
    border-color: rgba(255, 181, 71, 0.3);
    color: #ffd38a;
  }

  .deploy-note {
    color: #d7e0d7;
  }
}

.deploy-claim {
  align-self: center;
}

@media screen and (max-width: 1100px) {
  // Stacked: the summary under the settings (the bar carries the action).
  .template-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .summary-card {
    position: static;
  }

  .slim-variant {
    display: none;
  }
}

@media screen and (max-width: 768px) {
  .template-hero {
    --hero-pad-x: 1.5rem;
    padding-top: 2rem;
  }

  .hero-edit {
    margin-left: 0;
  }

  .hero-title {
    font-size: 2.1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .slim-enter-active,
  .slim-leave-active {
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
