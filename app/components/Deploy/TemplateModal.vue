<template>
  <div class="modal" :class="{ 'is-active': showModal }">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-card is-app-modal is-huge">
      <header class="modal-card-head is-flex-direction-column is-align-items-stretch">
        <div class="is-flex is-align-items-flex-start is-justify-content-space-between is-gap-3">
          <div>
            <p class="eyebrow-label is-uppercase has-text-weight-semibold">
              Template gallery
            </p>
            <p class="modal-card-title title is-4 mb-0">Deploy a ready-made stack</p>
          </div>
          <button class="delete" aria-label="close" @click="closeModal"></button>
        </div>

        <div class="is-flex is-align-items-center is-flex-wrap-wrap is-gap-2 mt-4">
          <p class="control has-icons-left tm-search">
            <input
              class="input"
              type="text"
              v-model="search"
              placeholder="Search templates"
            />
            <span class="icon is-small is-left">
              <i class="fas fa-search"></i>
            </span>
          </p>
          <div class="is-flex is-align-items-center is-flex-wrap-wrap is-gap-1">
            <button
              type="button"
              class="button is-small is-rounded"
              :class="{ 'is-dark': selectedCategory === null }"
              @click="selectedCategory = null"
            >
              All
            </button>
            <button
              v-for="category in COMBINED_CATEGORIES"
              :key="category"
              type="button"
              class="button is-small is-rounded"
              :class="{ 'is-dark': selectedCategory === category }"
              @click="selectedCategory = category"
            >
              {{ category }}
            </button>
          </div>
        </div>
      </header>

      <section class="modal-card-body">
        <template v-for="group in sections" :key="group.title">
          <div v-if="group.items.length > 0" class="mb-6">
            <div class="is-flex is-align-items-center is-gap-2 mb-4">
              <h3 class="title is-6 mb-0">{{ group.title }}</h3>
              <span class="tag is-rounded">{{ group.items.length }}</span>
            </div>
            <div class="tm-grid">
              <article
                v-for="template in group.items"
                :key="template.id"
                class="box tm-tile"
                @click="handleTemplateClick(template)"
              >
                <div class="is-flex is-align-items-flex-start is-gap-3">
                  <span class="tm-tile-icon">
                    <img
                      v-if="template.icon || template.avatar_url"
                      :src="template.icon || template.avatar_url"
                      :alt="template.name"
                    />
                    <span v-else class="tm-tile-icon-fallback">
                      {{ template.name.charAt(0).toUpperCase() }}
                    </span>
                  </span>
                  <div class="is-flex-grow-1" style="min-width: 0">
                    <p class="tm-tile-name" :title="template.name">{{ template.name }}</p>
                    <p class="tm-tile-image has-text-grey is-family-monospace">
                      {{ getSelectedVariantDockerImage(template) }}
                    </p>
                  </div>
                </div>

                <p v-if="template.description" class="tm-tile-desc has-text-grey">
                  {{ template.description }}
                </p>

                <div class="tm-tile-foot">
                  <div
                    v-if="template.variants && template.variants.length > 0"
                    class="select is-small is-fullwidth tm-variant mb-3"
                    @click.stop
                  >
                    <select
                      :value="selectedVariants[template.id] || template.variants[0].variant_id"
                      @change="updateSelectedVariant(template.id, ($event.target as HTMLSelectElement).value)"
                    >
                      <option
                        v-for="variant in template.variants"
                        :key="variant.variant_id"
                        :value="variant.variant_id"
                      >
                        {{ variant.name }}
                      </option>
                    </select>
                  </div>

                  <div class="is-flex is-align-items-center is-justify-content-space-between is-gap-2">
                    <div class="tm-tags">
                      <span
                        v-for="cat in displayTags(template)"
                        :key="cat"
                        class="tag is-rounded"
                      >
                        {{ cat }}
                      </span>
                    </div>
                    <span class="tm-tile-cta">
                      Use template
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </template>

        <div
          v-if="officialTemplates.length === 0 && communityTemplates.length === 0"
          class="has-text-centered py-6"
        >
          <p class="title is-6 mb-1">No templates match “{{ search }}”.</p>
          <p class="has-text-grey">Try a different search or clear the filters.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Template } from '~/composables/useTemplates';

// Define props
const props = defineProps<{
  showModal: boolean;
  templates: Template[];
}>();

// Define emits
const emit = defineEmits<{
  'update:showModal': [value: boolean];
  'select-template': [template: Template];
}>();

// State
const selectedCategory = ref<string | null>(null);
const search = ref("");
const selectedVariants = ref<Record<string, string>>({});

// Predefined categories
const ALL_CATEGORIES = [
  "LLM",
  "LLM Fine-tuning",
  "Image Generation",
  "Image Generation Fine-tuning",
] as const;
const INTERFACE_CATEGORIES = ["API", "Website"] as const;
const COMBINED_CATEGORIES = [...ALL_CATEGORIES, ...INTERFACE_CATEGORIES] as const;

// Methods
const closeModal = () => {
  emit('update:showModal', false);
};

const selectTemplate = (template: Template) => {
  emit('select-template', template);
  closeModal();
};

const handleTemplateClick = (template: Template) => {
  if (template.variants && template.variants.length > 0) {
    // For variants, select the currently selected variant
    const variantId = selectedVariants.value[template.id] || template.variants[0].variant_id;
    selectTemplateVariant(template, variantId);
  } else {
    // For single templates, select directly
    selectTemplate(template);
  }
};

const updateSelectedVariant = (templateId: string, variantId: string) => {
  selectedVariants.value[templateId] = variantId;
};

const selectTemplateVariant = (template: Template, variantId: string) => {
  const variant = template.variants?.find(v => v.variant_id === variantId);
  if (variant) {
    emit('select-template', {
      ...template,
      id: `${template.id}-${variantId}`,
      name: `${template.name} - ${variant.name}`,
      description: variant.description,
      jobDefinition: variant.jobDefinition,
      selectedVariant: variant,
    });
    closeModal();
  }
};

const getCategoryArray = (category: string | string[] | undefined): string[] => {
  if (!category) return [];
  if (Array.isArray(category)) {
    return category.map((cat) => (cat === "Web UI" ? "Website" : cat));
  }
  return category.split("|").map((cat) => (cat === "Web UI" ? "Website" : cat));
};

// Category badges shown on a card — drop the internal grouping flags and
// cap the count so every card's tag row stays a single tidy line.
const displayTags = (template: Template): string[] => {
  return getCategoryArray(template.category)
    .filter((c) => !["Featured", "New", "Official", "Community"].includes(c))
    .slice(0, 3);
};

const getTemplateImage = (template: Template): string | null => {
  try {
    if (template.jobDefinition?.ops?.[0]?.args) {
      const args = template.jobDefinition.ops[0].args as any;
      if (args.image) {
        return args.image;
      }
    }
  } catch (e) {
    console.warn("Could not extract image from template", e);
  }
  return null;
};

const getSelectedVariantDockerImage = (template: Template): string => {
  if (template.variants && template.variants.length > 0) {
    const selectedVariantId = selectedVariants.value[template.id] || template.variants[0].variant_id;
    const selectedVariant = template.variants.find(v => v.variant_id === selectedVariantId);
    if (selectedVariant && selectedVariant.jobDefinition) {
      try {
        const dockerImage = selectedVariant.jobDefinition.ops?.[0]?.args?.image;
        if (dockerImage) {
          return dockerImage;
        }
      } catch (e) {
        console.warn("Could not extract docker image from variant", e);
      }
    }
  }
  // Fallback to original logic for single templates
  return getTemplateImage(template) || String(template.id);
};

const filteredTemplates = computed(() => {
  if (!props.templates) return [];

  let templatesList = props.templates;

  // Filter by search term
  if (search.value) {
    const searchTerm = search.value.toLowerCase();
    templatesList = templatesList.filter(
      (t: any) =>
        t.name.toLowerCase().includes(searchTerm) ||
        (t.description && t.description.toLowerCase().includes(searchTerm))
    );
  }

  // Filter by selected categories
  if (selectedCategory.value) {
    templatesList = templatesList.filter((t: any) => {
      const categoryArray = getCategoryArray(t.category);
      return categoryArray.includes(selectedCategory.value as string);
    });
  }

  // Sort by New flag only
  return templatesList.sort((a: any, b: any) => {
    const aIsNew = getCategoryArray(a.category).includes("New");
    const bIsNew = getCategoryArray(b.category).includes("New");

    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;

    return 0; // Keep original order for templates without New flag
  });
});

const officialTemplates = computed(() => {
  return filteredTemplates.value.filter((template: any) => {
    const categoryArray = getCategoryArray(template.category);
    return categoryArray.includes('Official');
  });
});

const communityTemplates = computed(() => {
  return filteredTemplates.value.filter((template: any) => {
    const categoryArray = getCategoryArray(template.category);
    return !categoryArray.includes('Official');
  });
});

const sections = computed(() => [
  { title: "Official", items: officialTemplates.value },
  { title: "Community", items: communityTemplates.value },
]);
</script>

<style lang="scss" scoped>
.tm-search {
  flex: 1 1 16rem;
  min-width: 0;
  max-width: 24rem;
  margin-bottom: 0;
}

.tm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

/* Tile = Bulma .box + interaction; every slot is fixed so cards line up. */
.tm-tile {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  padding: 1.25rem;
  border: 1px solid $border;
  box-shadow: none;
  transition:
    transform 0.16s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: $secondary;
    box-shadow: 0 16px 34px -20px rgba($secondary, 0.55);
  }
}

.tm-tile-icon {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: $white-bis;
  border: 1px solid $border;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 6px;
  }
}

.tm-tile-icon-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10e80c 0%, #0aa908 100%);
  color: #05230a;
  font-weight: 700;
  font-size: 1.1rem;
}

/* one-line name + image so the header block is a fixed height everywhere */
.tm-tile-name {
  font-family: $title-family;
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.3;
  color: $text;
  margin-bottom: 0.15rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tm-tile-image {
  font-size: 0.72rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0;
}

/* clamp descriptions to two lines when present */
.tm-tile-desc {
  margin: 0.9rem 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tm-tile-foot {
  margin-top: auto;
  padding-top: 0.9rem;
  border-top: 1px solid $border;
}

.tm-variant {
  width: 100%;
}

.tm-tags {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.35rem;
  min-width: 0;
  overflow: hidden;
}

.tm-tile-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: $grey-light;
  transition: color 0.2s ease;

  svg {
    width: 15px;
    height: 15px;
    transition: transform 0.2s ease;
  }
}

.tm-tile:hover .tm-tile-cta {
  color: #0aa908;

  svg {
    transform: translateX(3px);
  }
}

/* dark mode: lift tiles above the modal body, keep dividers subtle */
.dark-mode .tm-tile {
  background-color: #1c1c1c;
  border-color: rgba(255, 255, 255, 0.08);
}

.dark-mode .tm-tile-icon {
  background: #121212;
  border-color: rgba(255, 255, 255, 0.08);
}

.dark-mode .tm-tile-name {
  color: $white;
}

.dark-mode .tm-tile-foot {
  border-top-color: rgba(255, 255, 255, 0.08);
}

@media screen and (max-width: 768px) {
  .tm-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tm-tile:hover {
    transform: none;
  }
}
</style>
