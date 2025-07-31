<template>
  <div class="modal" :class="{ 'is-active': showModal }">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-card" style="width: 95vw; max-width: 1600px; height: 90vh;">
      <header class="modal-card-head">
        <div class="modal-card-title">Choose Template</div>
        <button class="delete" aria-label="close" @click="closeModal"></button>
      </header>
      <section class="modal-card-body" style="height: calc(90vh - 120px); overflow-y: auto; padding: 1.5rem;">
        <div class="flex mb-4">
          <div class="field is-flex category-filters">
            <div class="field">
              <div class="control">
                <div class="select" style="width: 120px;">
                  <select v-model="selectedCategory">
                    <option :value="null">All</option>
                    <option
                      v-for="category in COMBINED_CATEGORIES"
                      :key="category"
                      :value="category"
                    >
                      {{ category }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field ml-4">
              <div class="control has-icons-left">
                <input
                  class="input"
                  type="text"
                  v-model="search"
                  placeholder="Search"
                />
                <span class="icon is-small is-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
        <!-- Official Templates Section -->
        <div v-if="officialTemplates.length > 0" class="template-section">
          <h3 class="section-title">Official</h3>
          <div class="templates-grid">
            <div
              v-for="template in officialTemplates"
              :key="template.id"
              class="template-card"
              :class="{ 'has-variants': template.variants && template.variants.length > 0 }"
              @click="handleTemplateClick(template)"
            >
              <div class="template-card-inner">
                <div class="template-header">
                  <div class="template-icon">
                    <img 
                      v-if="template.icon || template.avatar_url" 
                      :src="template.icon || template.avatar_url" 
                      :alt="template.name"
                    />
                    <div v-else class="template-icon-placeholder">
                      <span>{{ template.name.charAt(0).toUpperCase() }}</span>
                    </div>
                  </div>
                  <div class="template-info">
                    <h3 class="template-title">{{ template.name }}</h3>
                    <p class="template-id">{{ getSelectedVariantDockerImage(template) }}</p>
                  </div>
                  
                  <!-- Variant selector in top right -->
                  <div v-if="template.variants && template.variants.length > 0" class="template-variants-header" @click.stop>
                    <div class="variant-select">
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
                  </div>
                </div>
                
                <!-- Tags only -->
                <div class="template-footer">
                  <div class="template-tags">
                    <span
                      v-for="cat in getCategoryArray(template.category).filter((c) => !['Featured', 'New', 'Official'].includes(c))"
                      :key="cat"
                      class="template-tag"
                    >
                      {{ cat }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Community Templates Section -->
        <div v-if="communityTemplates.length > 0" class="template-section">
          <h3 class="section-title">Community</h3>
          <div class="templates-grid">
            <div
              v-for="template in communityTemplates"
              :key="template.id"
              class="template-card"
              :class="{ 'has-variants': template.variants && template.variants.length > 0 }"
              @click="handleTemplateClick(template)"
            >
              <div class="template-card-inner">
                <div class="template-header">
                  <div class="template-icon">
                    <img 
                      v-if="template.icon || template.avatar_url" 
                      :src="template.icon || template.avatar_url" 
                      :alt="template.name"
                    />
                    <div v-else class="template-icon-placeholder">
                      <span>{{ template.name.charAt(0).toUpperCase() }}</span>
                    </div>
                  </div>
                  <div class="template-info">
                    <h3 class="template-title">{{ template.name }}</h3>
                    <p class="template-id">{{ getSelectedVariantDockerImage(template) }}</p>
                  </div>
                </div>
                
                
                <div class="template-tags">
                  <span
                    v-for="cat in getCategoryArray(template.category).filter((c) => !['Featured', 'New', 'Official', 'Community'].includes(c))"
                    :key="cat"
                    class="template-tag"
                  >
                    {{ cat }}
                  </span>
                </div>
                
                <!-- Variant selector for multi-variant templates -->
                <div v-if="template.variants && template.variants.length > 0" class="template-variants" @click.stop>
                  <div class="variant-select">
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
                </div>
              </div>
            </div>
          </div>
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

const getSelectedVariantDescription = (template: Template): string | null => {
  if (!template.variants) return null;
  const selectedVariantId = selectedVariants.value[template.id] || template.variants[0].variant_id;
  const variant = template.variants.find(v => v.variant_id === selectedVariantId);
  return variant?.description || null;
};

const getCategoryArray = (category: string | string[] | undefined): string[] => {
  if (!category) return [];
  if (Array.isArray(category)) {
    return category.map((cat) => (cat === "Web UI" ? "Website" : cat));
  }
  return category.split("|").map((cat) => (cat === "Web UI" ? "Website" : cat));
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

const getTemplateId = (template: Template): string => {
  return getTemplateImage(template) || template.id;
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
  return getTemplateImage(template) || template.id;
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
        t.description.toLowerCase().includes(searchTerm)
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
</script>

<style lang="scss" scoped>
@import '~/assets/styles/variables.scss';

.new-badge {
  position: absolute;
  top: -0.35rem;
  left: -0.55rem;
  background: black;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.65rem;
  font-weight: bold;
  text-transform: uppercase;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  width: fit-content;
  height: fit-content;
  letter-spacing: 0.02em;
}

.category-filters {
  .checkbox {
    cursor: pointer;
    user-select: none;

    &:hover {
      color: #3273dc;
    }
  }
  
  .select::after {
    border-color: #888 !important;
  }
}

/* Template sections */
.template-section {
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
}

/* New template grid layout */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.25rem;
  padding: 0;
}

.template-card {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: $secondary;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($secondary, 0.15);
  }

  &.has-variants {
    min-height: 120px;
  }
}

.template-card-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.4rem;
}

.template-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  justify-content: space-between;
}

.template-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #e0e0e0;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.template-icon-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.template-info {
  flex: 1;
  min-width: 0;
}

.template-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.template-id {
  font-size: 0.85rem;
  color: #7a7a7a;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.template-footer {
  min-height: 32px;
  display: flex;
  align-items: center;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  flex: 1;
  align-items: center;
}

.template-tag {
  background: #ffffff;
  color: #4a4a4a;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #dbdbdb;
  white-space: nowrap;
  flex-shrink: 0;
}

.template-variants {
  flex-shrink: 0;
}

.template-variants-header {
  flex-shrink: 0;
  margin-left: auto;
}

.variant-select {
  flex-shrink: 0;
  
  select {
    min-width: 120px;
    padding: 0.4rem 0.5rem;
    border: 1px solid #dbdbdb;
    border-radius: 4px;
    font-size: 0.85rem;
    background: white;
    color: #4a4a4a;
    
    &:focus {
      border-color: #b5b5b5;
      outline: none;
      box-shadow: 0 0 0 2px rgba(219, 219, 219, 0.2);
    }
  }
}


.dark-mode {
  .section-title {
    color: #f0f0f0;
    border-color: #404040;
  }
  
  .template-card {
    background: #2d2d2d;
    border-color: #404040;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
    }
  }
  
  .template-title {
    color: #f0f0f0;
  }
  
  .template-id {
    color: #a0a0a0;
  }
  
  
  .template-icon {
    background: #1e1e1e;
    border-color: #404040;
  }
  
  .template-tag {
    background: #2d2d2d;
    color: #f5f5f5;
    border-color: #5a5a5a;
  }
  
  .template-variants {
    border-color: #404040;
  }
  
  .variant-select select {
    background: #1e1e1e;
    border-color: #5a5a5a;
    color: #f5f5f5;
    
    &:focus {
      border-color: #7a7a7a;
      box-shadow: 0 0 0 2px rgba(90, 90, 90, 0.2);
    }
  }
}

/* Modal scroll fix - ensure modals can scroll when body is locked */
.modal.is-active {
  overflow: hidden;
}

.modal.is-active .modal-card-body {
  overflow-y: auto !important;
}


/* Responsive styles */
@media screen and (max-width: 768px) {
  .category-filters {
    flex-direction: column;
    width: 100%;
    
    .field.ml-4 {
      margin-left: 0 !important;
      margin-top: 0.75rem;
      width: 100%;
    }
    
    .field {
      width: 100%;
    }
  }
  
  .templates-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
  
  .template-card {
    min-height: 120px;
    
    &.has-variants {
      min-height: 120px;
    }
  }
}
</style> 