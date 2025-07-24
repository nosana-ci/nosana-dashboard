<template>
  <div class="equal-height-boxes">
    <nuxt-link :to="deployLink" class="box has-text-black p-2 mb-2 is-block">
      <div class="is-flex is-align-items-start" style="margin: 8px 8px 0 8px;">
        <slot name="deploy-icon" />
        <div>
          <h4 class="title is-6 mb-0">Getting Started</h4>
          <p class="is-size-6 mb-0" style="line-height: 1.2;">Start your journey by deploying your first AI model on Nosana.</p>
        </div>
      </div>
    </nuxt-link>
    <a :href="docsLink" target="_blank" class="box has-text-black p-2 mb-2 is-block">
      <div class="is-flex is-align-items-start" style="margin: 8px 8px 0 8px;">
        <slot name="docs-icon" />
        <div>
          <h4 class="title is-6 mb-0">Documentation</h4>
          <p class="is-size-6 mb-0" style="line-height: 1.2;">Explore our comprehensive guides and how the network works.</p>
        </div>
      </div>
    </a>
    <nuxt-link :to="supportLink" class="box has-text-black p-2 is-block">
      <div class="is-flex is-align-items-start" style="margin: 8px 8px 0 8px;">
        <slot name="support-icon" />
        <div>
          <h4 class="title is-6 mb-0">Help and Support</h4>
          <p class="is-size-6 mb-0" style="line-height: 1.2;">Connect with our community and support team for assistance.</p>
        </div>
      </div>
    </nuxt-link>
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  deployLink: { type: String, default: '/deploy' },
  docsLink: { type: String, default: 'https://docs.nosana.com/about/intro.html' },
  supportLink: { type: String, default: '/support' }
});
</script> 