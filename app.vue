<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Nosana Dashboard',
  ogTitle: 'Nosana Dashboard',
  twitterTitle: 'Nosana Dashboard',
  description: 'Powering the AI revolution',
  ogDescription: 'Powering the AI revolution',
  twitterDescription: 'Powering the AI revolution',
  ogImage: 'https://app.nosana.com/img/screenshot.png',
  twitterImage: 'https://app.nosana.com/img/screenshot.png',
  twitterCard: 'summary_large_image'
})

useHead({
  htmlAttrs: {
    lang: 'en'
  },
  link: [
    {
      rel: 'icon',
      type: 'image/ico',
      href: '/favicon.ico'
    }
  ]
})

</script>