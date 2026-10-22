<template>
  <div class="workload-step">
    <section class="deploy-surface workload-hero">
      <span class="deploy-surface-grid" aria-hidden="true"></span>
      <div class="hero-body" :class="{ 'is-single': !featuredTemplate && !describing }">
        <div class="hero-text">
          <h2 class="hero-title">
            What would<br />you like to <span class="hero-accent">deploy</span>?
          </h2>
          <p class="hero-lead">
            Pick a template, bring your own image, or clone a deployment.
          </p>

          <!-- Describe it instead: a template, or a written and validated job. -->
          <div v-if="canDescribe" class="describe">
            <form class="describe-form" @submit.prevent="describe.propose(request)">
              <input
                ref="requestInput"
                v-model="request"
                class="describe-input"
                type="text"
                placeholder="Or describe it, e.g. a small chat model with an OpenAI API"
                aria-label="Describe what you want to deploy"
                :disabled="describe.phase.value !== 'idle'"
              />
              <button
                type="submit"
                class="describe-submit"
                :disabled="describe.phase.value !== 'idle' || !request.trim()"
              >
                {{ describeLabel }}
              </button>
            </form>
            <div v-if="describe.progress.value.steps.length" class="describe-progress">
              <ol class="describe-steps" aria-live="polite">
                <li
                  v-for="(step, i) in describe.progress.value.steps"
                  :key="i"
                  class="describe-step"
                  :class="`is-${step.state}`"
                >
                  <span class="describe-mark" aria-hidden="true">
                    <span v-if="step.state === 'active'" class="describe-pulse"></span>
                    <template v-else>{{ step.state === "done" ? "✓" : "✗" }}</template>
                  </span>
                  <span class="describe-label">{{ step.label }}</span>
                  <span v-if="step.state === 'active'" class="describe-meta">
                    {{ activeMeta(step) }}
                  </span>
                  <span v-else-if="step.detail" class="describe-meta">{{ step.detail }}</span>
                </li>
              </ol>
            </div>
            <p v-if="describe.error.value" class="describe-error">{{ describe.error.value }}</p>
            <div
              v-if="describe.phase.value === 'idle' && !describe.proposal.value"
              class="describe-examples"
            >
              <button
                v-for="example in DESCRIBE_EXAMPLES"
                :key="example"
                type="button"
                class="describe-example"
                @click="tryExample(example)"
              >
                “{{ example }}”
              </button>
            </div>
          </div>

          <div v-if="canClone" class="recent-row">
            <button type="button" class="recent-pill is-all" @click="emit('browse-deployments')">
              Clone a deployment <DeployCategoryIcon icon="arrow" />
            </button>
          </div>
        </div>

        <!-- The card on the right: the deployment being built for a description, the one
             built, or the featured template. -->
        <Transition name="featured-swap" mode="out-in">
        <article
          v-if="describing"
          key="described"
          class="featured"
          :class="describe.phase.value !== 'idle' ? 'is-building' : 'is-proposal'"
        >
          <!-- One frame from start to result; only its contents change. -->
          <Transition name="featured-fill" mode="out-in">
            <div v-if="describe.phase.value !== 'idle'" key="building" class="featured-body">
              <span class="featured-head">
                <span class="featured-logo featured-logo-fallback">
                  <span class="describe-pulse" aria-hidden="true"></span>
                </span>
                <span class="featured-heading">
                  <small>Building your template</small>
                  <strong>{{ buildingStep }}</strong>
                </span>
              </span>
              <span class="featured-skeleton" aria-hidden="true">
                <span></span><span></span><span></span>
              </span>
              <div class="featured-foot">
                <span class="featured-meta">“{{ request }}”</span>
              </div>
            </div>
            <div v-else-if="describe.proposal.value" key="result" class="featured-body">
              <span class="featured-head">
                <img v-if="proposalBase?.icon" class="featured-logo" :src="proposalBase.icon" alt="" />
                <span v-else class="featured-logo featured-logo-fallback">
                  {{ describe.proposal.value.name.charAt(0).toUpperCase() }}
                </span>
                <span class="featured-heading">
                  <small>Made for you</small>
                  <strong>{{ describe.proposal.value.name }}</strong>
                </span>
              </span>
              <p class="featured-desc">{{ describe.proposal.value.why }}</p>
              <span class="featured-tags">
                <span v-for="tag in proposalTags" :key="tag" class="featured-tag">{{ tag }}</span>
              </span>
              <div class="featured-foot">
                <span class="featured-meta" :title="proposalLabel">{{ proposalLabel }}</span>
                <button type="button" class="describe-dismiss" @click="describe.reset()">Dismiss</button>
                <button
                  type="button"
                  class="featured-cta"
                  @click="emit('apply-proposal', describe.proposal.value)"
                >
                  Set it up <DeployCategoryIcon icon="arrow" />
                </button>
              </div>
            </div>
          </Transition>
        </article>
        <article v-else-if="featuredTemplate" key="featured" class="featured">
          <span class="featured-head">
            <img
              v-if="featuredTemplate.icon"
              class="featured-logo"
              :src="featuredTemplate.icon"
              alt=""
            />
            <span v-else class="featured-logo featured-logo-fallback">
              {{ featuredTemplate.name.charAt(0).toUpperCase() }}
            </span>
            <span class="featured-heading">
              <small>Featured template</small>
              <strong>{{ featuredTemplate.name }}</strong>
            </span>
          </span>
          <p class="featured-desc">
            {{
              featuredTemplate.description ||
              templateReadmeSnippet(featuredTemplate)
            }}
          </p>
          <span v-if="featuredTags.length" class="featured-tags">
            <span v-for="tag in featuredTags" :key="tag" class="featured-tag">
              {{ tag }}
            </span>
          </span>
          <div class="featured-foot">
            <DeployVariantSelect
              v-if="featuredTemplate.variants?.length"
              class="featured-variant"
              surface
              :variants="featuredTemplate.variants"
              :selected="featuredVariant"
              :label="`${featuredTemplate.name} variant`"
              @select="featuredVariantId = $event.variant_id"
            />
            <button
              type="button"
              class="featured-cta"
              @click="emit('deploy-template', pickFeatured())"
            >
              Use template <DeployCategoryIcon icon="arrow" />
            </button>
          </div>
        </article>
        </Transition>
      </div>
    </section>

    <!-- Templates: each tile is the action -->
    <section class="templates-section">
      <div class="templates-heading">
        <h3>Templates</h3>
        <span class="count-pill">{{ filteredTemplates.length }}</span>
        <div class="filter-row">
          <label class="search-field">
            <DeployCategoryIcon icon="search" class="search-icon" />
            <span class="is-sr-only">Search templates</span>
            <input
              v-model="search"
              type="search"
              placeholder="Search templates, models or images"
            />
          </label>
          <div class="chips">
            <button
              type="button"
              class="chip"
              :class="{ 'is-active': selectedCategory === null }"
              @click="selectedCategory = null"
            >
              All
            </button>
            <button
              v-for="category in categories"
              :key="category"
              type="button"
              class="chip"
              :class="{ 'is-active': selectedCategory === category }"
              @click="selectedCategory = category"
            >
              {{ category }}
            </button>
          </div>
        </div>
      </div>
      <DeployTemplateGallery
        v-if="filteredTemplates.length || showConfigureOwn"
        :templates="filteredTemplates"
        :show-configure-own="showConfigureOwn"
        @select="emit('select-template', $event)"
        @configure-own="emit('configure-own')"
      />
      <p v-else class="templates-empty">
        No templates match{{ search ? ` “${search}”` : " these filters" }}.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  descriptiveTags,
  templateReadmeSnippet,
  templateTags,
  withVariant,
  type Template,
  type TemplateVariant,
} from "~/composables/useTemplates";
import type { GpuListing } from "~/composables/useNodeRequirements";
import { proposalTemplate, type DeployProposal } from "~/utils/deployProposal";
import type { ProposalStep } from "~/composables/useDeployProposal";

const props = defineProps<{
  templates: Template[];
  canClone: boolean;
  /** The GPUs, for a described deployment's VRAM and price. */
  gpus: GpuListing[];
  /** Describing a deployment runs on the sponsored models, which need a session. */
  canDescribe: boolean;
}>();

const request = ref("");
const describe = useDeployProposal(toRef(props, "templates"), toRef(props, "gpus"));
/** Requests to start from: a template, a template at a size, and an adapted one. */
const DESCRIBE_EXAMPLES = [
  "Best LLM that can run on a 4090",
  "Flux images",
  "Qwen3.8 27B on vLLM",
];
// An example goes into the field rather than running, so it can be changed first.
const requestInput = ref<HTMLInputElement | null>(null);
function tryExample(example: string) {
  request.value = example;
  requestInput.value?.focus();
}
const describeLabel = computed(() => (describe.phase.value === "idle" ? "Generate" : "Working…"));
/** The running step's own count: tokens while the model writes, otherwise just the time. */
function activeMeta(step: ProposalStep) {
  const { tokens, seconds } = describe.progress.value;
  const time = `${seconds - step.startSeconds}s`;
  return describe.phase.value === "checking"
    ? time
    : `${(tokens - step.startTokens).toLocaleString()} tokens · ${time}`;
}

/** What the proposal runs: the template and variant, or the job's image. */
const proposalLabel = computed(() => {
  const proposal = describe.proposal.value;
  if (!proposal) return "";
  const picked = proposalTemplate(proposal, props.templates);
  if (picked) return picked.variant ? `${picked.template.name} · ${picked.variant.name}` : picked.template.name;
  const ops = (proposal.jobDefinition?.ops ?? []) as { args?: { image?: string } }[];
  const image = ops[0]?.args?.image ?? "Your own job";
  const base = props.templates.find((t) => String(t.id) === proposal.templateId);
  return base ? `${image} · adapted from ${base.name}` : image;
});

/** Whether the right-hand card is showing a description being built or its result. */
const describing = computed(
  () => describe.phase.value !== "idle" || !!describe.proposal.value,
);
/** What the building card says it is doing: the step in progress. */
const buildingStep = computed(
  () => describe.progress.value.steps.at(-1)?.label ?? "Reading your description",
);
/** The template the proposal deploys or adapts, for its icon and tags. */
const proposalBase = computed(() => {
  const id = describe.proposal.value?.templateId;
  return id ? props.templates.find((t) => String(t.id) === id) : undefined;
});
const proposalTags = computed(() => {
  const proposal = describe.proposal.value;
  if (!proposal) return [];
  const base = proposalBase.value ? descriptiveTags(proposalBase.value) : [];
  const gpu = proposal.gpuName ? [proposal.gpuName.replace(/^NVIDIA (GeForce )?/, "")] : [];
  return proposal.kind === "template"
    ? [...base.slice(0, 3), ...gpu]
    : ["Custom job", ...base.slice(0, 2), ...gpu];
});

const emit = defineEmits<{
  /** A described deployment, checked, for the form to take. */
  "apply-proposal": [proposal: DeployProposal];
  "select-template": [template: Template];
  /** The featured card's Use template: skips the template page. */
  "deploy-template": [template: Template];
  "configure-own": [];
  "browse-deployments": [];
}>();

const search = ref("");
const selectedCategory = ref<string | null>(null);

// The filter chips are the templates' own tags, most used first, so every
// chip matches at least one template and a new tag shows up by itself. The
// grouping tags (Official, Featured, ...) are left out: they do not describe
// what a template does.
const categories = computed(() => {
  const counts = new Map<string, number>();
  for (const template of props.templates) {
    for (const tag of descriptiveTags(template)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    .map(([tag]) => tag);
});

const matchesSearch = (template: Template, term: string): boolean =>
  template.name.toLowerCase().includes(term) ||
  (template.description?.toLowerCase().includes(term) ?? false);

// The banner's showcase: the first template tagged Featured, else the first.
const featuredTemplate = computed(
  () =>
    props.templates.find((template) =>
      templateTags(template).includes("Featured"),
    ) ?? props.templates[0],
);

const featuredTags = computed(() =>
  featuredTemplate.value
    ? descriptiveTags(featuredTemplate.value).slice(0, 4)
    : [],
);

// The variant the featured card will use; the first until picked.
const featuredVariantId = ref<string | null>(null);

const featuredVariant = computed<TemplateVariant | undefined>(
  () =>
    featuredTemplate.value?.variants?.find(
      (variant) => variant.variant_id === featuredVariantId.value,
    ) ?? featuredTemplate.value?.variants?.[0],
);

const pickFeatured = (): Template => {
  const template = featuredTemplate.value;
  if (!template) throw new Error("No featured template to pick");
  const variant = featuredVariant.value;
  return variant ? withVariant(template, variant) : template;
};

// The Configure-your-own card leads the grid only when nothing is filtered.
const showConfigureOwn = computed(
  () => !search.value.trim() && selectedCategory.value === null,
);

const filteredTemplates = computed(() => {
  const term = search.value.trim().toLowerCase();
  return props.templates.filter(
    (template) =>
      (!term || matchesSearch(template, term)) &&
      (!selectedCategory.value ||
        templateTags(template).includes(selectedCategory.value)),
  );
});
</script>

<style lang="scss" scoped>
.workload-step {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Hero: the developers-page hero with the recent deployments beside it */
.workload-hero {
  padding: 3rem;
  // Shared with the template hero: picking a template morphs one into the
  // other (the transition itself is in deploy-surface.scss).
  view-transition-name: deploy-hero;
}

.hero-body {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 46%);
  gap: 2.5rem;
  align-items: stretch;

  &.is-single {
    grid-template-columns: minmax(0, 1fr);
  }
}

.hero-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-top: 16px;
}

.hero-title {
  margin: 0 0 1rem;
  font-family: $title-family;
  font-weight: 600;
  font-size: 2.75rem;
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: #fff;
}

.hero-accent {
  color: $secondary;
}

.hero-lead {
  margin: 0;
  color: #b7c0b6;
  font-size: 1.0625rem;
  line-height: 1.55;
  max-width: 30rem;
}

/* Clone a deployment: one button under the lead, opening the picker */
.recent-row {
  display: flex;
  margin-top: auto;
  padding-top: 1.5rem;
}



.recent-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 220px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
  color: #e8f0e8;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    border-color: $secondary;
    color: #fff;
  }

  &.is-all {
    color: $secondary;
    border-color: rgba($secondary, 0.35);

    svg {
      width: 13px;
      height: 13px;
      transition: transform 0.2s ease;
    }

    &:hover svg {
      transform: translateX(3px);
    }
  }
}


/* Describe it: one line under the lead, and what it comes back with */
.describe {
  margin-top: 1.25rem;
  max-width: 40rem;
}

.describe-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.3rem 0.3rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  transition: border-color 0.2s ease;

  &:focus-within {
    border-color: rgba($secondary, 0.6);
  }
}

.describe-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  color: #fff;
  font: inherit;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: #8a948a;
  }
}

.describe-submit {
  flex: none;
  padding: 7px 14px;
  border: 0;
  border-radius: 999px;
  background: $secondary;
  color: #05230a;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
}

// The examples sit under the field in its own style: buttons that fill it in.
// One row: where the column is too narrow, the examples that do not fit are left out.
.describe-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 6px;
  height: 30px;
  overflow: hidden;
  margin-top: 0.6rem;
}

.describe-example {
  height: 30px;
  padding: 0 11px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: #e8f0e8;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: rgba($secondary, 0.6);
    background: rgba($secondary, 0.08);
  }
}

.describe-progress {
  margin: 0.75rem 0 0 0.9rem;
  font-size: 13px;
}

.describe-steps {
  display: grid;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.describe-step {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 0.6rem;
  color: #8a948a;

  &.is-active {
    color: #e8f0e8;
    font-weight: 600;
  }

  &.is-failed .describe-mark {
    color: #ff9b8a;
  }

  &.is-done .describe-mark {
    color: $secondary;
  }
}

.describe-mark {
  display: inline-flex;
  justify-content: center;
  width: 1rem;
}

.describe-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $secondary;
  animation: describe-pulse 1.2s ease-in-out infinite;
}

@keyframes describe-pulse {
  50% {
    opacity: 0.25;
    transform: scale(0.7);
  }
}

.describe-meta {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 400;
  color: #8a948a;
}

@media (prefers-reduced-motion: reduce) {
  .describe-pulse {
    animation: none;
  }
}

.describe-error {
  margin: 0.6rem 0 0 0.9rem;
  font-size: 13px;
  color: #ff9b8a;
}





.describe-dismiss {
  border: 0;
  background: none;
  color: #8a948a;
  font: inherit;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    color: #e8f0e8;
  }
}

/* Featured template: the showcase card on the right, like the dev page's. A described
   deployment takes its place, first while it is built and then as the result. */
.featured-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.featured-fill-enter-active,
.featured-fill-leave-active {
  transition: opacity 0.15s ease;
}

.featured-fill-enter-from,
.featured-fill-leave-to {
  opacity: 0;
}

.featured-swap-enter-active,
.featured-swap-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.3s ease;
}

.featured-swap-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.featured-swap-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.featured.is-building {
  border-color: rgba($secondary, 0.45);
  animation: featured-glow 2s ease-in-out infinite;

  .featured-heading strong {
    font-size: 17px;
  }
}

@keyframes featured-glow {
  50% {
    box-shadow:
      0 18px 40px -24px rgba(0, 0, 0, 0.8),
      0 0 0 4px rgba($secondary, 0.08);
  }
}

.featured.is-proposal {
  border-color: rgba($secondary, 0.55);
}

// Lines standing in for the description while it is written.
.featured-skeleton {
  display: grid;
  gap: 9px;

  span {
    height: 11px;
    border-radius: 6px;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 25%,
      rgba(255, 255, 255, 0.13) 50%,
      rgba(255, 255, 255, 0.05) 75%
    );
    background-size: 200% 100%;
    animation: featured-shimmer 1.4s linear infinite;

    &:nth-child(2) {
      width: 85%;
    }

    &:nth-child(3) {
      width: 60%;
    }
  }
}

@keyframes featured-shimmer {
  to {
    background-position: -200% 0;
  }
}

.featured-meta {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--mono);
  font-size: 12px;
  color: #8a948a;
}

@media (prefers-reduced-motion: reduce) {
  .featured.is-building,
  .featured-skeleton span {
    animation: none;
  }
}


.featured {
  align-self: center;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.8);
  color: #e8f0e8;
  transition: border-color 0.2s ease;

  &:hover,
  &:focus-within {
    border-color: $secondary;
  }
}

.featured-head {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.featured-logo {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 13px;
  background: #fff;
  object-fit: contain;
  padding: 8px;
  box-sizing: border-box;
}

.featured-logo-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba($secondary, 0.12);
  color: $secondary;
  font-family: $title-family;
  font-weight: 700;
  font-size: 1.2rem;
}

.featured-heading {
  min-width: 0;

  small {
    display: block;
    font-family: var(--mono);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: $secondary;
    margin-bottom: 3px;
  }

  strong {
    display: block;
    font-family: $title-family;
    font-weight: 600;
    font-size: 20px;
    line-height: 1.2;
    letter-spacing: -0.01em;
    color: #fff;
  }
}

.featured-desc {
  margin: 0;
  color: #b7c0b6;
  font-size: 14px;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.featured-tag {
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 11.5px;
  font-weight: 600;
  color: #d7e0d7;
}

.featured-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

// The variant picker takes the room left of the Use template button.
.featured-variant {
  flex: 1;
  min-width: 0;
}

.featured-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: auto;
  padding: 0.6rem 1.1rem;
  border: 0;
  border-radius: 9px;
  background: $secondary;
  color: #05230a;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 8px 24px -8px rgba($secondary, 0.6);
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;

  svg {
    width: 14px;
    height: 14px;
    transition: transform 0.2s ease;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px -8px rgba($secondary, 0.75);

    svg {
      transform: translateX(3px);
    }
  }
}

/* Search + categories: on the page surface, beside the Templates heading */
.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-left: auto;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 280px;
  max-width: 100%;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid $border-soft;
  background: $white;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus-within {
    border-color: $secondary;
    box-shadow: 0 0 0 3px rgba($secondary, 0.18);
  }

  input {
    flex: 1;
    min-width: 0;
    padding: 7px 0;
    border: 0;
    outline: none;
    background: transparent;
    color: $text;
    font-family: inherit;
    font-size: 13.5px;

    &::placeholder {
      color: $text-muted;
    }
  }
}

.search-icon {
  flex-shrink: 0;
  width: 15px;
  height: 15px;
  color: $text-muted;
}

.chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid $border-soft;
  background: $white;
  color: $text-muted;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    border-color: $secondary;
    color: $text;
  }

  // The chosen chip lights green, like the page's actions.
  &.is-active {
    background: $secondary;
    color: #05230a;
    border-color: $secondary;
  }
}

/* Templates */
.templates-section {
  view-transition-name: deploy-body;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.templates-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  h3 {
    margin: 0;
    font-family: $title-family;
    font-weight: 600;
    font-size: 16px;
    letter-spacing: -0.01em;
    color: $text;
  }
}

.count-pill {
  padding: 1px 9px;
  border-radius: 999px;
  background: $surface-sunken;
  font-size: 12px;
  font-weight: 600;
  color: $text;
}

.templates-empty {
  margin: 0;
  color: $text-muted;
}

html.dark-mode {
  .templates-heading h3 {
    color: #fff;
  }

  .search-field {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);

    input {
      color: #fff;

      &::placeholder {
        color: #6f7a6e;
      }
    }
  }

  .search-icon {
    color: #7c877b;
  }

  .chip {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.14);
    color: #d7e0d7;

    &:hover {
      border-color: $secondary;
      color: #fff;
    }

    &.is-active {
      background: $secondary;
      color: #05230a;
      border-color: $secondary;
    }
  }

  .count-pill {
    background: rgba(255, 255, 255, 0.08);
    color: #c9d3c9;
  }

  .templates-empty {
    color: #8a948a;
  }
}

@media screen and (max-width: 768px) {
  .workload-hero {
    padding: 2rem 1.5rem;
  }

  .hero-title {
    font-size: 2.1rem;
  }

  .hero-body {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .recent-pill.is-all:hover svg,
  .featured-cta:hover,
  .featured-cta:hover svg {
    transform: none;
  }
}
</style>
