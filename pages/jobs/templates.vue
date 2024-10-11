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
                    <a @click="filterCategory = null" :class="{ 'is-active': filterCategory === null }">
                      <span>All</span>
                      <span class="ml-auto is-size-7">({{ templates.length }})</span>
                    </a>

                  </li>
                  <li v-for="category in categories">
                    <a :class="{ 'is-active': filterCategory === category }" @click="filterCategory = category">
                      <span>{{ category }}</span>
                      <span class="ml-auto is-size-7">({{ templates.filter(t =>
                        t.category.split("|").includes(category)).length }})</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
      <div class="column is-9">
        <div class="box has-background-white-ter">

          <div v-for="category in categories" v-if="filteredTemplates">
            <div v-if="!filterCategory || category === filterCategory" class="mb-6">
              <h2 class="title is-4">{{ category }}</h2>
              <h3 class="subtitle is-6">{{ filteredTemplates.filter(t =>
                t.category.split("|").includes(category)).length }}
                templates</h3>
              <div class="columns is-multiline">
                <div v-for="template in filteredTemplates.filter(t => t.category.split('|').includes(category))"
                  :key="template.name" class="column is-4">
                  <nuxt-link class="box" style="height: 100%;"
                    :to="{ path: '/jobs/create', query: { templateId: template.id } }">
                    <div class="is-flex is-justify-content-space-between">
                      <h2 class="is-size-4 has-text-weight-semibold mb-0 has-text-black">
                        {{ template.name }}
                      </h2>
                      <div v-if="template.icon" class="template-icon is-flex has-text-centered has-background-white">
                        <img :src="template.icon">
                      </div>
                    </div>
                    <p>{{ template.description }}</p>
                  </nuxt-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts" setup>
const { templates, loadingTemplates } = useTemplates();
const filterCategory: Ref<string | null> = ref(null);
const search: Ref<string | null> = ref(null);
const filteredTemplates = computed(() => {
  return templates.value ? templates.value.filter(t => {
    let found = true;
    let inCategory = true;
    if (search.value) {
      found = t.name.toLowerCase().includes(search.value.toLowerCase()) ||
        t.description.toLowerCase().includes(search.value.toLowerCase()) ||
        t.readme.toLowerCase().includes(search.value.toLowerCase());
    }
    if (filterCategory.value) {
      inCategory = t.category.includes(filterCategory.value);
    }
    return found && inCategory;
  }) : null;
});
const categories = computed(() => {
  const categoryIds = [...new Set(templates.value.flatMap(({ category }) => category.split("|")))];

  return categoryIds.sort(function (a, b) {
    if (a == "Featured") return -1;
    if (b == "Featured") return 1;
    return a.localeCompare(b);
  });;
}) 
</script>
<style lang="scss" scoped>
.template-icon {
  border: 1px solid $grey-lighter;
  width: 42px;
  height: 42px;
  border-radius: 100%;
  padding: 7px;
  flex-shrink: 0;

  img {
    object-fit: scale-down;
  }
}
</style>