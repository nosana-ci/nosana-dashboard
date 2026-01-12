<template>
  <div>
    <NuxtLayout>
      <NuxtPwaManifest />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Nosana Deploy',
  ogTitle: 'Nosana Deploy',
  twitterTitle: 'Nosana Deploy',
  description: 'Powering the AI revolution',
  ogDescription: 'Powering the AI revolution',
  twitterDescription: 'Powering the AI revolution',
  ogImage: 'https://deploy.nosana.com/img/screenshot.png',
  twitterImage: 'https://deploy.nosana.com/img/screenshot.png',
  twitterCard: 'summary_large_image'
})

useHead({
  htmlAttrs: {
    lang: 'en'
  },
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
      sizes: 'any'
    }
  ]
})

</script>