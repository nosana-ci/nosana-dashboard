<template>
  <div class="workload-step">
    <section class="deploy-surface workload-hero">
      <span class="deploy-surface-grid" aria-hidden="true"></span>
      <div class="hero-body" :class="{ 'is-single': !featuredTemplate }">
        <div class="hero-text">
          <h2 class="hero-title">
            What would<br />you like to <span class="hero-accent">deploy</span>?
          </h2>
          <p class="hero-lead">
            Pick a template, bring your own image, or clone a deployment.
          </p>

          <div v-if="canClone" class="recent-row">
            <span class="recent-label">Clone a recent deployment</span>
            <div class="recent-pills">
              <button
                v-for="deployment in recentDeployments"
                :key="deployment.id"
                type="button"
                class="recent-pill"
                :title="`${runsOnLabel(deployment)} · ${statusLabel(deployment.status)}`"
                @click="emit('clone', deployment)"
              >
                <span
                  class="dot"
                  :class="{ 'is-live': canStopDeployment(deployment.status) }"
                ></span>
                {{ deployment.name }}
              </button>
              <span v-if="!recentDeployments.length" class="recent-empty">
                {{
                  loadingRecent ? "Loading deployments…" : "No deployments yet"
                }}
              </span>
              <button
                type="button"
                class="recent-pill is-all"
                @click="emit('browse-deployments')"
              >
                All deployments <DeployCategoryIcon icon="arrow" />
              </button>
            </div>
          </div>
        </div>

        <article v-if="featuredTemplate" class="featured">
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
import type { ListedDeployment } from "~/composables/useDeploymentSelection";
import { marketName } from "~/utils/solana";
import { describeRunsOn } from "~/composables/useNodeRequirements";
import { canStopDeployment } from "~/utils/deploymentStatusActions";

const props = defineProps<{
  templates: Template[];
  recentDeployments: ListedDeployment[];
  /** The dashboard API's market list, to name each recent deployment's GPU. */
  markets: Array<{ address?: string; name?: string }>;
  loadingRecent: boolean;
  canClone: boolean;
}>();

// What a recent deployment runs on: its pinned market, its GPUs, or "Any GPU".
function runsOnLabel(deployment: ListedDeployment): string {
  return describeRunsOn(deployment, (address) => marketName(address, props.markets)).main;
}

const emit = defineEmits<{
  "select-template": [template: Template];
  /** The featured card's Use template: skips the template page. */
  "deploy-template": [template: Template];
  "configure-own": [];
  clone: [deployment: ListedDeployment];
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

const statusLabel = (status: ListedDeployment["status"]): string =>
  status.toLowerCase().replace(/_/g, " ");
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

/* Clone a recent deployment: a label and a row of small pills under the lead */
.recent-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  padding-top: 1.5rem;
}

.recent-label {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7c877b;
}

.recent-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

.recent-empty {
  font-family: var(--mono);
  font-size: 11px;
  color: #8a948a;
}

/* Featured template: the showcase card on the right, like the dev page's */
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

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #6b6b6b;

  &.is-live {
    background: $secondary;
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
