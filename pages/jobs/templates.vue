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

            <div class="category-filters">
              <!-- Main categories -->
              <div class="filter-section">
                <h3 class="is-size-6 mb-2 has-text-weight-semibold">Template Type</h3>
                <label class="checkbox mb-2 is-block" v-for="category in ALL_CATEGORIES" :key="category">
                  <input type="checkbox" 
                         v-model="selectedCategories" 
                         :value="category">
                  <span class="ml-2">{{ category }}</span>
                </label>
              </div>

              <!-- Interface categories -->
              <div class="filter-section mt-4">
                <h3 class="is-size-6 mb-2 has-text-weight-semibold">Interface Type</h3>
                <label class="checkbox mb-2 is-block" v-for="category in INTERFACE_CATEGORIES" :key="category">
                  <input type="checkbox" 
                         v-model="selectedCategories" 
                         :value="category">
                  <span class="ml-2">{{ category }}</span>
                </label>
              </div>

              <!-- Other categories if any -->
              <template v-if="otherCategories.length > 0">
                <div class="filter-section mt-4">
                  <h3 class="is-size-6 mb-2 has-text-weight-semibold">Other</h3>
                  <label class="checkbox mb-2 is-block" v-for="category in otherCategories" :key="category">
                    <input type="checkbox" 
                           v-model="selectedCategories" 
                           :value="category">
                    <span class="ml-2">{{ category }}</span>
                  </label>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div class="column is-9">
        <div class="box has-background-white-ter">
          <template v-if="!selectedCategories.length">
            <h2 class="title is-4 mb-4">Featured Templates</h2>
            <div class="columns is-multiline mb-6">
              <div
                v-for="template in featuredTemplates"
                :key="template.id"
                class="column is-4"
              >
                <nuxt-link class="box template-card" :to="{ 
                  path: '/jobs/create', 
                  query: { 
                    templateId: template.id,
                    randKey: makeRandomKey()
                  } 
                }">
                  <span v-if="getCategoryArray(template.category).includes('New')" class="new-badge">New</span>
                  <div class="template-header">
                    <div class="header-content">
                      <div class="header-title">
                        <h2 class="is-size-4 has-text-weight-semibold mb-0 has-text-black">
                          {{ template.name }}
                        </h2>
                      </div>
                      <div class="header-meta">
                        <span v-if="template.stargazers_count" class="github-stars">
                          <img src="~/assets/img/icons/github.svg" class="github-icon" alt="GitHub">
                          <span class="has-text-warning mr-1" style="font-size: 12px;">★</span>
                          <span class="ml-1">{{ String(template.stargazers_count) }}</span>
                        </span>
                        <span v-else class="star-placeholder"></span>
                        <div v-if="template.icon || template.avatar_url" class="template-icon">
                          <img :src="template.icon || template.avatar_url">
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="template-description">
                    <p>{{ template.description }}</p>
                    <div class="template-tags mt-3">
                      <span v-for="cat in getCategoryArray(template.category).filter(c => !['Featured', 'New'].includes(c))" 
                            :key="cat" 
                            class="tag">
                        {{ cat }}
                      </span>
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
              <nuxt-link class="box template-card" :to="{ 
                path: '/jobs/create', 
                query: { 
                  templateId: template.id,
                  randKey: makeRandomKey()
                } 
              }">
                <span v-if="getCategoryArray(template.category).includes('New')" class="new-badge">New</span>
                <div class="template-header">
                  <div class="header-content">
                    <div class="header-title">
                      <h2 class="is-size-4 has-text-weight-semibold mb-0 has-text-black">
                        {{ template.name }}
                      </h2>
                    </div>
                    <div class="header-meta">
                      <span v-if="template.stargazers_count" class="github-stars">
                        <img src="~/assets/img/icons/github.svg" class="github-icon" alt="GitHub">
                        <span class="has-text-warning mr-1" style="font-size: 12px;">★</span>
                        <span class="ml-1">{{ String(template.stargazers_count) }}</span>
                      </span>
                      <span v-else class="star-placeholder"></span>
                      <div v-if="template.icon || template.avatar_url" class="template-icon">
                        <img :src="template.icon || template.avatar_url">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="template-description">
                  <p>{{ template.description }}</p>
                  <div class="template-tags mt-3">
                    <span v-for="cat in getCategoryArray(template.category).filter(c => !['Featured', 'New'].includes(c))" 
                          :key="cat" 
                          class="tag">
                      {{ cat }}
                    </span>
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
interface Template {
  id: string | number;
  name: string;
  description: string;
  category: string[];
  icon?: string;
  avatar_url?: string;
  stargazers_count?: number;
  jobDefinition: any;
  readme?: string;
}

const { templates, loadingTemplates } = useTemplates();
const selectedCategories = ref<string[]>([]);
const search: Ref<string> = ref('');

// Predefined categories in desired order
const ALL_CATEGORIES = [
  'LLM',
  'LLM Fine-tuning',
  'Image Generation',
  'Image Generation Fine-tuning'
] as const;

const INTERFACE_CATEGORIES = ['API', 'Website'] as const;

type CategoryType = typeof ALL_CATEGORIES[number] | typeof INTERFACE_CATEGORIES[number];

// Add function to generate random key
function makeRandomKey() {
  return Math.random().toString(36).slice(2);
}

const getCategoryArray = (category: string | string[] | undefined): string[] => {
  if (!category) return [];
  if (Array.isArray(category)) {
    return category.map(cat => cat === 'Web UI' ? 'Website' : cat);
  }
  return category.split('|').map(cat => cat === 'Web UI' ? 'Website' : cat);
};

const featuredTemplates = computed(() => {
  if (!templates.value) return [];
  return templates.value
    .filter(t => getCategoryArray(t.category).includes('Featured'));
});

const allCategories = computed(() => {
  if (!templates.value) return [];
  console.log('Raw templates:', templates.value);
  
  const categories = new Set<string>();
  
  templates.value.forEach(template => {
    console.log('Processing template:', template.name, 'Categories:', template.category);
    const categoryArray = getCategoryArray(template.category);
    categoryArray.forEach(cat => {
      if (!['Featured', 'New'].includes(cat)) {
        categories.add(cat);
      }
    });
  });
  
  console.log('All unique categories:', Array.from(categories));
  return Array.from(categories);
});

const otherCategories = computed(() => {
  return allCategories.value.filter(cat => 
    ![...ALL_CATEGORIES, ...INTERFACE_CATEGORIES].includes(cat as CategoryType)
  );
});

const filteredTemplates = computed(() => {
  if (!templates.value) return [];
  
  let templatesList = templates.value;
  console.log('Filtering templates. Selected categories:', selectedCategories.value);

  // Filter by search term
  if (search.value) {
    const searchTerm = search.value.toLowerCase();
    templatesList = templatesList.filter(t => 
      t.name.toLowerCase().includes(searchTerm) ||
      t.description.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by selected categories
  if (selectedCategories.value.length > 0) {
    templatesList = templatesList.filter(t => {
      const categoryArray = getCategoryArray(t.category);
      return selectedCategories.value.some(cat => categoryArray.includes(cat));
    });
  }

  // Remove featured templates from main list if no category filter is active
  if (selectedCategories.value.length === 0) {
    templatesList = templatesList.filter(t => {
      const categoryArray = getCategoryArray(t.category);
      return !categoryArray.includes('Featured');
    });
  }

  console.log('Filtered templates:', templatesList.map(t => ({ name: t.name, categories: t.category })));
  return templatesList.sort((a, b) => {
    const aIsNew = getCategoryArray(a.category).includes('New');
    const bIsNew = getCategoryArray(b.category).includes('New');
    
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    
    return (b.stargazers_count || 0) - (a.stargazers_count || 0);
  });
});
</script>
<style lang="scss" scoped>
.template-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  position: relative;

  .github-stars {
    display: inline-flex;
    align-items: center;
    color: $grey;
    font-size: 0.875rem;
  }

  &:hover {
    // Removed the github-stars opacity transition
  }
}

.template-header {
  margin-bottom: 1rem;
  width: 100%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.header-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  margin-top: 0.8rem;
  
  h2 {
    line-height: 1.2;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
}

.header-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  justify-content: center;
  min-height: 56px;
}

.template-description {
  width: 100%;
  
  p {
    margin: 0;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }
}

.template-icon {
  background-color: #ffffff !important;
  border: 1px solid $grey-lighter;
  width: 38px;
  height: 38px;
  border-radius: 100%;
  padding: 4px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}

.dark-mode {
  .template-icon {
    background-color: $black-bis !important;
    border-color: $grey-darker;
  }
}

// Improve responsive behavior
@media screen and (max-width: 768px) {
  .header-content {
    gap: 0.5rem;
  }
  
  .template-icon {
    width: 34px;
    height: 34px;
    padding: 5px;
  }

  .header-title {
    h2 {
      font-size: 1.25rem !important;
    }
  }
}

// Add this new media query for very small screens
@media screen and (max-width: 480px) {
  .header-content {
    gap: 0.25rem;
  }
  
  .template-icon {
    width: 30px;
    height: 30px;
    padding: 4px;
  }
}

.new-badge {
  position: absolute;
  top: 0.75rem;
  left: .5rem;
  background: $primary;
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

.star-placeholder {
  height: 19px;
}

.github-icon {
  width: 12px;
  height: 12px;
  margin-right: 4px;
  vertical-align: middle;
  opacity: 0.7;
}

html.dark-mode .github-icon {
  filter: invert(1);
}

.github-stars {
  display: inline-flex;
  align-items: center;
  color: $grey;
  font-size: 0.875rem;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;

  .tag {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-weight: 500;
    background-color: rgba($grey, 0.1);
    color: $grey-dark;
  }
}

.category-filters {
  .filter-section {
    &:not(:first-child) {
      border-top: 1px solid $grey-lighter;
      padding-top: 1rem;
    }
  }

  .checkbox {
    cursor: pointer;
    user-select: none;
    
    &:hover {
      color: $primary;
    }
  }
}
</style>