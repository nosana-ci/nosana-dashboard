<template>
  <div class="has-text-centered mt-6">
    <h1 v-if="error.statusCode === 404" class="title">Page not found</h1>
    <h1 v-else class="title">An error occurred</h1>
    <nuxt-link to="/" class="button">Home page</nuxt-link>
  </div>
</template>

<script>
export default {
  props: {
    error: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {};
  },

  computed: {},

  methods: {},
};
</script>
