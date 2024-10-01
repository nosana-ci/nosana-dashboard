<template>
  <div>
    <TopBar :title="'Job Builder'" :subtitle="'Create and deploy job definition files'"></TopBar>
    <div class="box has-background-white-ter">
      <h2 class="title">Set up your Job</h2>
      <h3 class="subtitle">Select a template to get started or start with a blank template.</h3>
      <div v-for="category in categories" class="mb-6">
        <h2 class="title is-4">{{ category }}</h2>
        <h3 class="subtitle is-6">{{ templates.filter(t => t.category.includes(category)).length }} templates</h3>
        <div class="columns is-multiline">
          <div v-for="template in templates.filter(t => t.category.includes(category))" :key="template.name"
            class="column is-4">
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
</template>

<script lang="ts" setup>
const { templates } = useTemplates();
const categories = computed(() => {
  const categoryIds = [...new Set(templates.value.flatMap(({ category }) => category))];

  return categoryIds.sort(function (a, b) {
    if (a == "Featured") return -1;
    if (b == "Featured") return 1;
    return a.localeCompare(b);
  });;
}) 
</script>
<style lang="scss" scoped>
.template-icon {
  box-shadow: 1px 1px rgba(140, 149, 159, 0.15);
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