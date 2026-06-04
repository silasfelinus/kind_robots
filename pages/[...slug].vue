<!-- /pages/[...slug].vue -->
<template>
  <div
    v-if="page"
    class="h-full min-h-0 w-full overflow-hidden rounded-2xl border border-success/30 bg-success/5"
    data-slug-page-rendered
  >
    <ContentRenderer :value="page" />
  </div>

  <div
    v-else-if="contentPending"
    class="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-6 text-center"
  >
    <Icon name="kind-icon:spinner" class="h-10 w-10 animate-spin text-info" />
    <p class="text-base font-bold text-info">Loading page…</p>
    <p class="max-w-xl text-sm text-base-content/60">
      Looking for {{ contentPath }}
    </p>
  </div>

  <div
    v-else
    class="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-6 text-center"
  >
    <Icon name="kind-icon:alert" class="h-10 w-10 text-warning" />
    <p class="text-base font-bold text-warning">Page not found</p>
    <p class="max-w-xl text-sm text-base-content/60">
      No Nuxt Content page was found for {{ contentPath }}.
    </p>
  </div>

  <error-popup />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from '#app'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore, type WorkspacePage } from '@/stores/pageStore'
import { applyQuerySelections } from '@/stores/helpers/applyQuerySelections'

const route = useRoute()
const pageStore = usePageStore()
const displayStore = useDisplayStore()

const contentPath = computed(() => {
  const path = route.path.replace(/\/$/, '')
  return path || '/'
})

const { data: page, status: contentStatus } = await useAsyncData(
  () => `content-page:${contentPath.value}`,
  () => queryCollection('content').path(contentPath.value).first(),
  {
    default: () => null,
    watch: [contentPath],
  },
)

const contentPending = computed(
  () => contentStatus.value === 'pending' || contentStatus.value === 'idle',
)

useSeoMeta({
  title: () => page.value?.title || 'Kind Robots',
  description: () =>
    page.value?.description ||
    'A friendly AI playground for humans and robots.',
})

watch(
  [page, contentPending],
  ([currentPage, pending]) => {
    if (pending) return

    if (!currentPage) {
      pageStore.clearPage()
      return
    }

    pageStore.setPage({
      ...currentPage,
      seo: currentPage.seo ?? {},
      navigation: currentPage.navigation ?? false,
    } as WorkspacePage)
  },
  { immediate: true },
)

watch(
  () => route.query,
  (query) => applyQuerySelections(query, displayStore),
  { immediate: true },
)
</script>
