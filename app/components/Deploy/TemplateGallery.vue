<template>
  <div class="template-gallery">
    <!-- Bring your own image: the first card, when the grid is unfiltered -->
    <button
      v-if="showConfigureOwn"
      type="button"
      class="deploy-tile template-tile is-custom"
      @click="emit('configure-own')"
    >
      <span class="custom-plus" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <strong class="custom-title">Custom deployment</strong>
      <span class="custom-desc">
        Bring your own Docker image and write the job definition yourself.
      </span>
    </button>

    <article
      v-for="template in orderedTemplates"
      :key="template.id"
      class="deploy-tile template-tile"
    >
      <!-- The whole tile is the action; the variant select sits above it. -->
      <button
        type="button"
        class="tile-hit"
        :aria-label="`Use template ${template.name}`"
        @click="pick(template)"
      />
      <span class="tile-identity">
        <img
          v-if="template.icon"
          class="tile-logo"
          :src="template.icon"
          alt=""
        />
        <span v-else class="tile-logo tile-logo-fallback">
          {{ template.name.charAt(0).toUpperCase() }}
        </span>
        <span class="tile-heading">
          <small>{{ tileLabel(template) }}</small>
          <strong>{{ template.name }}</strong>
        </span>
      </span>
      <p v-if="tileSummary(template)" class="tile-desc">
        {{ tileSummary(template) }}
      </p>
      <DeployVariantSelect
        v-if="template.variants?.length"
        class="tile-variant"
        :variants="template.variants"
        :selected="chosenVariant(template)"
        :label="`${template.name} variant`"
        @select="chooseVariant(template, $event)"
      />
      <span class="tile-foot">
        <span>{{ tileImage(template) }}</span>
        <span>{{ tileVram(template) }}</span>
      </span>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { JobDefinition } from "@nosana/kit";
import {
  descriptiveTags,
  formatVram,
  requiredVramMb,
  templateDockerImage,
  templateReadmeSnippet,
  templateTags,
  withVariant,
  type Template,
  type TemplateVariant,
} from "~/composables/useTemplates";

const props = defineProps<{
  templates: Template[];
  showConfigureOwn?: boolean;
}>();

const emit = defineEmits<{
  select: [template: Template];
  "configure-own": [];
}>();

const isOfficial = (template: Template): boolean =>
  templateTags(template).includes("Official");

const isNew = (template: Template): boolean =>
  templateTags(template).includes("New");

// Official before Community, New first within each; otherwise the given order.
const orderedTemplates = computed(() =>
  [...props.templates].sort(
    (a, b) =>
      Number(isOfficial(b)) - Number(isOfficial(a)) ||
      Number(isNew(b)) - Number(isNew(a)),
  ),
);

// The description, else the readme's first paragraph. Cached per template, as
// the readme fallback scans the whole readme and search re-renders every tile.
const summaries = new WeakMap<Template, string | null>();
const tileSummary = (template: Template): string | null => {
  if (!summaries.has(template)) {
    summaries.set(
      template,
      template.description || templateReadmeSnippet(template),
    );
  }
  return summaries.get(template) ?? null;
};

// The small label above the name: the first one or two descriptive tags, or
// the template's group when it has none.
const tileLabel = (template: Template): string =>
  descriptiveTags(template).slice(0, 2).join(" · ") ||
  (isOfficial(template) ? "Official" : "Community");

// Which variant each template's tile currently shows; the first until picked.
const selectedVariants = ref<Record<string, string>>({});

const chosenVariant = (template: Template): TemplateVariant | undefined => {
  const picked = selectedVariants.value[String(template.id)];
  return (
    template.variants?.find((variant) => variant.variant_id === picked) ??
    template.variants?.[0]
  );
};

const chooseVariant = (template: Template, variant: TemplateVariant) => {
  selectedVariants.value = {
    ...selectedVariants.value,
    [String(template.id)]: variant.variant_id,
  };
};

const tileJobDefinition = (template: Template): JobDefinition | undefined =>
  chosenVariant(template)?.jobDefinition ?? template.jobDefinition;

const tileImage = (template: Template): string =>
  templateDockerImage(tileJobDefinition(template)) ?? String(template.id);

const tileVram = (template: Template): string => {
  const mb = requiredVramMb(tileJobDefinition(template));
  return mb ? formatVram(mb) : "No GPU";
};

// A template with variants is picked with its first variant, flattened the
// same way the template modal does so the rest of the flow sees one shape.
const pick = (template: Template) => {
  const variant = chosenVariant(template);
  emit("select", variant ? withVariant(template, variant) : template);
};
</script>

<style lang="scss" scoped>
.template-gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.template-tile {
  width: 100%;
  padding: 22px;
  text-align: left;
  color: inherit;
}

// The custom card: a plus, a title and a line, on a soft green ground.
.template-tile.is-custom {
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  border-color: rgba($secondary, 0.35);
  background: rgba($secondary, 0.08);
  box-shadow: none;
  font-family: inherit;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: $secondary;
    background: rgba($secondary, 0.14);
  }
}

.custom-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba($secondary, 0.16);
  color: $secondary-text;

  svg {
    width: 24px;
    height: 24px;
  }
}

.custom-title {
  font-family: $title-family;
  font-weight: 600;
  font-size: 19px;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: $text;
}

.custom-desc {
  max-width: 24rem;
  color: $text-muted;
  font-size: 14px;
  line-height: 1.5;
}

// Invisible full-tile button: the click target and the keyboard focus stop.
.tile-hit {
  position: absolute;
  inset: 0;
  border: 0;
  padding: 0;
  background: transparent;
  border-radius: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid $secondary;
    outline-offset: 2px;
  }
}

// Lifted above the hit area so it stays usable, and pinned to the bottom of
// the tile so the selects line up across a row whatever the text above does
// (grid rows stretch every tile to the same height).
.tile-variant {
  position: relative;
  z-index: 1;
  margin-top: auto;
}

.tile-identity {
  display: flex;
  gap: 14px;
  align-items: center;
  min-width: 0;
}

.tile-logo {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid $border-soft;
  object-fit: contain;
  padding: 7px;
  box-sizing: border-box;
}

.tile-logo-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $secondary 0%, #0aa908 100%);
  border-color: transparent;
  color: #05230a;
  font-weight: 700;
  font-size: 1.1rem;
}

.tile-heading {
  min-width: 0;

  small {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $text-muted;
    margin-bottom: 2px;
  }

  strong {
    display: block;
    font-family: $title-family;
    font-weight: 600;
    font-size: 19px;
    line-height: 1.2;
    letter-spacing: -0.01em;
    color: $text;
  }
}

.tile-desc {
  margin: 0;
  color: $text-muted;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tile-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;

  .tile-variant + & {
    margin-top: 0;
  }
  font-family: $family-monospace;
  font-size: 12px;
  color: $text-muted;

  span:first-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span:last-child {
    flex-shrink: 0;
    color: $text;
  }
}

html.dark-mode {
  .template-tile.is-custom {
    background: rgba($secondary, 0.08);
    border-color: rgba($secondary, 0.3);

    &:hover,
    &:focus-visible {
      background: rgba($secondary, 0.14);
      border-color: $secondary;
    }
  }

  .custom-plus {
    color: $secondary;
  }

  .custom-title {
    color: #fff;
  }

  .custom-desc {
    color: #b5b5b5;
  }

  .template-tile:hover {
    background: #1f221f;
  }

  .tile-logo {
    border-color: transparent;
  }

  .tile-heading small {
    color: #7c877b;
  }

  .tile-heading strong {
    color: #fff;
  }

  .tile-desc {
    color: #b5b5b5;
  }

  .tile-foot {
    color: #8a948a;

    span:last-child {
      color: #aeb8ad;
    }
  }
}

@media screen and (max-width: 1100px) {
  .template-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media screen and (max-width: 768px) {
  .template-gallery {
    grid-template-columns: 1fr;
  }
}
</style>
