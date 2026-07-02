<script setup lang="ts">
definePageMeta({ layout: false })
import type { Template, TemplateVariant } from '~/composables/useTemplates'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const templateParam = route.params.template as string

type TemplatesResponse = Template[] | { data?: Template[] } | null

const { data: raw } = await useFetch<TemplatesResponse>(
  '/api/jobs/templates/grouped',
  {
    baseURL: config.public.apiBase as string,
    server: true,
  }
)

function normalizeGrouped(value: TemplatesResponse): Template[] {
  if (Array.isArray(value)) return value
  if (Array.isArray((value as any)?.data)) return (value as any).data
  if (value && typeof value === 'object') {
    return Object.values(value).flat() as Template[]
  }
  return []
}

const matched = computed(() => {
  const list = normalizeGrouped(raw.value ?? null)

  // Direct match on parent template
  const direct = list.find(
    (t) => String(t.id) === templateParam || t.name?.toLowerCase() === templateParam.toLowerCase()
  )
  if (direct) return { name: direct.name, description: direct.description, icon: direct.icon }

  // Variant match
  for (const t of list) {
    if (!t.variants?.length) continue
    const variant = t.variants.find(
      (v: TemplateVariant) =>
        String(v.id) === templateParam ||
        `${t.id}-${v.variant_id}` === templateParam ||
        v.variant_id === templateParam
    )
    if (variant) return {
      name: `${t.name} – ${variant.name}`,
      description: variant.description ?? t.description,
      icon: t.icon,
    }
  }

  return null
})

useSeoMeta({
  title: () => matched.value ? `Deploy ${matched.value.name} on Nosana` : 'Create Deployment — Nosana',
  ogTitle: () => matched.value ? `Deploy ${matched.value.name} on Nosana` : 'Create a GPU Deployment on Nosana',
  ogDescription: () => matched.value?.description ?? 'Run GPU workloads on decentralised GPUs',
  ogImage: () => matched.value?.icon || null,
  twitterCard: 'summary_large_image',
  twitterTitle: () => matched.value ? `Deploy ${matched.value.name} on Nosana` : 'Create a GPU Deployment on Nosana',
  twitterDescription: () => matched.value?.description ?? 'Run GPU workloads on decentralised GPUs',
  twitterImage: () => matched.value?.icon || null,
})

onMounted(() => {
  router.replace(`/deployments/create?template=${templateParam}`)
})
</script>

<template>
  <div />
</template>
