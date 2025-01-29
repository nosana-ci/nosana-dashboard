<template>
  <div>
    <TopBar :title="'Explore our Templates'"
      :subtitle="'Select a template to get started with a pre-built Job Definition File'"></TopBar>
    <div class="columns">
      <div class="column is-3">
        <div class="box has-background-white-ter">
          <h2 class="title is-4">Filters</h2>
          <div class="field">
            <div class="control">
              <label class="label">Search</label>
              <input class="input" type="text" v-model="search" placeholder="Search templates" />
            </div>
          </div>
          <div class="field">
            <div class="control">
              <label class="label">Category</label>
              <span v-if="!templates">...</span>
              <div class="menu" v-else>
                <ul class="menu-list">
                  <li>
                    <a :class="{ 'is-active': filterCategory === '' }" @click="filterCategory = ''">
                      <span>All Templates</span>
                      <span class="ml-auto is-size-7">({{ templates.length }})</span>
                    </a>
                  </li>
                  <li v-for="category in categories" :key="category">
                    <a :class="{ 'is-active': filterCategory === category }" 
                       @click="() => {
                         filterSubcategory = '';  // Reset subcategory first
                         filterCategory = category;
                       }">
                      <span>{{ category === 'API Only' ? 'API' : category }}</span>
                      <span class="ml-auto is-size-7">({{ templates.filter(t =>
                        (Array.isArray(t.category) ? t.category : t.category.split("|")).includes(category)).length }})</span>
                    </a>
                    <ul v-if="filterCategory === category && subcategories.length" class="pl-4 mt-2">
                      <li v-for="subcategory in subcategories" :key="subcategory">
                        <a
                          :class="{ 'is-active': filterSubcategory === subcategory }"
                          @click="filterSubcategory = subcategory"
                        >
                          <span>{{ subcategory }}</span>
                          <span class="ml-auto is-size-7">
                            ({{
                              templatesInCategoryAndSubcategory(category, subcategory).length
                            }})
                          </span>
                        </a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="column is-9">
        <div class="box has-background-white-ter">
          <template v-if="filterCategory === ''">
            <h2 class="title is-4 mb-4">Featured Templates</h2>
            <div class="columns is-multiline mb-6">
              <div
                v-for="template in featuredTemplates"
                :key="template.id"
                class="column is-4"
              >
                <nuxt-link class="box template-card" :to="{ path: '/jobs/create', query: { templateId: template.id } }">
                  <div class="template-content">
                    <div class="template-info">
                      <div class="mb-2">
                        <div class="is-flex is-align-items-center">
                          <h2 class="is-size-4 has-text-weight-semibold mb-0 has-text-black">
                            {{ template.name }}
                          </h2>
                          <span v-if="newTemplateIds.includes(String(template.id))" class="new-badge ml-2">New</span>
                        </div>
                      </div>
                      <p>{{ template.description }}</p>
                    </div>
                    <div class="template-meta">
                      <span v-if="template.stargazers_count" class="has-text-grey is-size-7 mb-1">
                        <span class="has-text-warning mr-1" style="font-size: 12px;">★</span>
                        <span class="ml-1">{{ String(template.stargazers_count) }}</span>
                      </span>
                      <div v-if="template.icon || template.avatar_url" class="template-icon is-flex is-justify-content-center">
                        <img :src="template.icon || template.avatar_url">
                      </div>
                    </div>
                  </div>
                </nuxt-link>
              </div>
            </div>

            <h2 class="title is-4 mb-4">All Templates</h2>
          </template>

          <div class="columns is-multiline">
            <div
              v-for="template in filteredTemplates"
              :key="template.id"
              class="column is-4"
            >
              <nuxt-link class="box template-card" :to="{ path: '/jobs/create', query: { templateId: template.id } }">
                <div class="template-content">
                  <div class="template-info">
                    <div class="mb-2">
                      <div class="is-flex is-align-items-center">
                        <h2 class="is-size-4 has-text-weight-semibold mb-0 has-text-black">
                          {{ template.name }}
                        </h2>
                        <span v-if="newTemplateIds.includes(String(template.id))" class="new-badge ml-2">New</span>
                      </div>
                    </div>
                    <p>{{ template.description }}</p>
                  </div>
                  <div class="template-meta">
                    <span v-if="template.stargazers_count" class="has-text-grey is-size-7 mb-1">
                      <span class="has-text-warning mr-1" style="font-size: 12px;">★</span>
                      <span class="ml-1">{{ String(template.stargazers_count) }}</span>
                    </span>
                    <div v-if="template.icon || template.avatar_url" class="template-icon is-flex is-justify-content-center">
                      <img :src="template.icon || template.avatar_url">
                    </div>
                  </div>
                </div>
              </nuxt-link>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
const { templates, loadingTemplates } = useTemplates();
const filterCategory: Ref<string> = ref('');
const filterSubcategory: Ref<string> = ref('');
const search: Ref<string> = ref('');

const featuredTemplateIds = [
  'deepseek-r1-qwen-1.5b',
  'deepseek-r1-qwen-7b',
  'deepseek-r1-qwen-32b',
  'deepseek-janus-pro-1b',
  'deepseek-janus-pro-7b',
  'comfyui'
];

const newTemplateIds = [
  'deepseek-r1-qwen-1.5b',
  'deepseek-r1-qwen-7b',
  'deepseek-r1-llama-8b',
  'deepseek-r1-qwen-14b',
  'deepseek-r1-qwen-32b',
  'deepseek-r1-llama-70b-awq',
  'deepseek-janus-pro-1b',
  'deepseek-janus-pro-7b'
];

const featuredTemplates = computed(() => {
  if (!templates.value) return [];
  return featuredTemplateIds
    .map(id => templates.value.find(t => String(t.id) === id))
    .filter(Boolean);
});

// Watch for changes in filterCategory to reset filterSubcategory
watch(filterCategory, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    filterSubcategory.value = '';
  }
});

const filteredTemplates = computed(() => {
  const templatesList = templates.value
    ? templates.value.filter((t) => {
        if (filterCategory.value === '' && featuredTemplateIds.includes(String(t.id))) {
          return false;
        }

        let found = true;
        let inCategory = true;
        let inSubcategory = true;

        if (search.value !== '') {
          const searchTerm = search.value.toLowerCase();
          found = Boolean(
            t.name.toLowerCase().includes(searchTerm) ||
            t.description.toLowerCase().includes(searchTerm) ||
            (t.readme && t.readme.toLowerCase().includes(searchTerm))
          );
        }

        if (filterCategory.value !== '') {
          const templateCategories = Array.isArray(t.category)
            ? t.category
            : t.category.split("|");
          inCategory = templateCategories.includes(filterCategory.value);

          if (filterSubcategory.value !== '') {
            const templateSubcategories = t.subcategory
              ? Array.isArray(t.subcategory)
                ? t.subcategory
                : t.subcategory.split("|")
              : [];
            inSubcategory = templateSubcategories.includes(filterSubcategory.value);
          } else {
            inSubcategory = true;
          }
        } else {
          inCategory = true;
          inSubcategory = true;
        }

        return found && inCategory && inSubcategory;
      })
    : [];

  // Sort the filtered templates by stargazers_count in descending order
  return templatesList.sort((a, b) => {
    // First sort by new status
    const aIsNew = newTemplateIds.includes(String(a.id));
    const bIsNew = newTemplateIds.includes(String(b.id));
    
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    
    // Then sort by star count
    return (b.stargazers_count || 0) - (a.stargazers_count || 0);
  });
});
const categories = computed(() => {
  const allCategories = templates.value
    ? templates.value.flatMap((t) => {
        const cats = Array.isArray(t.category)
          ? t.category
          : t.category.split("|");
        return cats.map((c) => c.trim());
      })
    : [];
  const categoryIds = [...new Set(allCategories)];

  const desiredCategoryOrder = ['Featured', 'Web UI', 'API Only'];

  // Lowercase versions for comparison
  const desiredCategoryOrderNormalized = desiredCategoryOrder.map((c) => c.toLowerCase());

  return categoryIds.sort((a, b) => {
    const normalizedA = a.toLowerCase();
    const normalizedB = b.toLowerCase();

    const indexA = desiredCategoryOrderNormalized.indexOf(normalizedA);
    const indexB = desiredCategoryOrderNormalized.indexOf(normalizedB);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    } else if (indexA !== -1) {
      return -1;
    } else if (indexB !== -1) {
      return 1;
    } else {
      return normalizedA.localeCompare(normalizedB);
    }
  });
});
const subcategories = computed(() => {
  if (!filterCategory.value) return [];
  const allSubcategories = templates.value
    ? templates.value.flatMap((t) => {
        const templateCategories = Array.isArray(t.category)
          ? t.category
          : t.category.split("|");
        if (templateCategories.includes(filterCategory.value) && t.subcategory) {
          return Array.isArray(t.subcategory)
            ? t.subcategory
            : t.subcategory.split("|");
        }
        return [];
      })
    : [];
  const uniqueSubcategories = [...new Set(allSubcategories)].map((sub) => sub.trim());

  // Define the desired order for subcategories
  const desiredOrder = [
    'Featured',
    'LLM',
    'LLM Fine-tuning',
    'Image Generation',
    'Image Generation Fine-tuning'
  ];

  return uniqueSubcategories.sort((a, b) => {
    const indexA = desiredOrder.indexOf(a);
    const indexB = desiredOrder.indexOf(b);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    } else if (indexA !== -1) {
      return -1;
    } else if (indexB !== -1) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });
});

function subcategoriesForCategory(category: string): string[] {
  const allSubcategories = filteredTemplates.value
    .filter((t) => {
      const templateCategories = Array.isArray(t.category)
        ? t.category
        : t.category.split("|");
      return templateCategories.includes(category);
    })
    .flatMap((t) => {
      const templateSubcategories = t.subcategory
        ? Array.isArray(t.subcategory)
          ? t.subcategory
          : t.subcategory.split("|")
        : [];
      return templateSubcategories.map((sub) => sub.trim());
    });

  // Remove duplicates and normalize subcategory names
  const uniqueSubcategories = [...new Set(allSubcategories)];

  // Desired order with proper casing for display
  const desiredOrder = [
    'LLM',
    'LLM Fine-tuning',
    'Image Generation',
    'Image Generation Fine-tuning',
    'Featured',
  ];

  // Lowercase versions for comparison
  const desiredOrderNormalized = desiredOrder.map((sub) => sub.toLowerCase());

  return uniqueSubcategories.sort((a, b) => {
    const normalizedA = a.trim().toLowerCase();
    const normalizedB = b.trim().toLowerCase();

    const indexA = desiredOrderNormalized.indexOf(normalizedA);
    const indexB = desiredOrderNormalized.indexOf(normalizedB);

    if (indexA !== -1 && indexB !== -1) {
      // Both subcategories are in desiredOrder
      return indexA - indexB;
    } else if (indexA !== -1) {
      // Only 'a' is in desiredOrder
      return -1;
    } else if (indexB !== -1) {
      // Only 'b' is in desiredOrder
      return 1;
    } else {
      // Neither subcategory is in desiredOrder; sort alphabetically
      return normalizedA.localeCompare(normalizedB);
    }
  });
}

function templatesInCategoryAndSubcategory(category: string, subcategory: string): Template[] {
  return templates.value
    ? templates.value.filter((t) => {
        const templateCategories = Array.isArray(t.category)
          ? t.category
          : t.category.split("|");
        const inCategory = templateCategories.includes(category);

        const templateSubcategories = t.subcategory
          ? Array.isArray(t.subcategory)
            ? t.subcategory
            : t.subcategory.split("|")
          : [];
        const inSubcategory = templateSubcategories.includes(subcategory);

        return inCategory && inSubcategory;
      })
    : [];
}

function templatesWithoutSubcategory(category: string): Template[] {
  return filteredTemplates.value
    .filter((t) => {
      const templateCategories = Array.isArray(t.category)
        ? t.category
        : t.category.split("|");
      const inCategory = templateCategories.includes(category);

      const hasSubcategory = t.subcategory && t.subcategory.length > 0;

      return inCategory && !hasSubcategory;
    });
}
</script>
<style lang="scss" scoped>
.template-card {
  height: 100%;
  display: block;
}

.template-content {
  display: flex;
  gap: 1rem;
  height: 100%;
  align-items: flex-start;
}

.template-info {
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.template-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
  padding-left: 0.75rem;
  min-width: 50px;
}

.template-icon {
  background-color: #ffffff !important;
  border: 1px solid $grey-lighter;
  width: 42px;
  height: 42px;
  border-radius: 100%;
  padding: 7px;
  flex-shrink: 0;
  margin-top: 0.25rem;

  img {
    width: 100%;
    height: 100%;
    object-fit: scale-down;
  }
}

// Improve responsive behavior
@media screen and (max-width: 768px) {
  .template-content {
    gap: 0.5rem;
  }
  
  .template-meta {
    padding-left: 0.5rem;
    min-width: 42px;
  }
  
  .template-icon {
    width: 36px;
    height: 36px;
    padding: 5px;
  }

  .template-info h2 {
    font-size: 1.25rem !important;
  }
}

// Add this new media query for very small screens
@media screen and (max-width: 480px) {
  .template-content {
    gap: 0.25rem;
  }
  
  .template-meta {
    padding-left: 0.25rem;
    min-width: 36px;
  }
  
  .template-icon {
    width: 32px;
    height: 32px;
    padding: 4px;
  }
}

.new-badge {
  background: $primary;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
}
</style>