<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Nosana Explorer',
  ogTitle: 'Nosana Explorer',
  twitterTitle: 'Nosana Explorer',
  description: 'Powering the AI revolution',
  ogDescription: 'Powering the AI revolution',
  twitterDescription: 'Powering the AI revolution',
  ogImage: 'https://explorer.nosana.io/img/screenshot.png',
  twitterImage: 'https://explorer.nosana.io/img/screenshot.png',
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