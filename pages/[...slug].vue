<template>
  <div
    v-if="activePage?.body"
    class="content-host flex h-full min-h-0 w-full flex-col rounded-2xl border border-success/30 bg-success/5"
  >
    <ContentRenderer :value="activePage" />
  </div>

  <div
    v-else-if="isPageLoading"
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
      {{ pagePayload }}
    </p>
  </div>

  <error-popup />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from '#app'
import type { ContentCollectionItem } from '@nuxt/content'
import { usePageStore } from '@/stores/pageStore'

type PagePayload = {
  path: string
  page: ContentCollectionItem | null
}

const route = useRoute()
const pageStore = usePageStore()

const contentPath = computed(() => {
  const path = route.path.replace(/\/+$/, '')
  return path || '/'
})

const asyncKey = computed(() => `content:${contentPath.value}`)

const { data: pagePayload, status } = await useAsyncData<PagePayload>(
  asyncKey,
  async () => {
    const path = contentPath.value
    const page = await queryCollection('content').path(path).first()

    return {
      path,
      page: page as ContentCollectionItem | null,
    }
  },
  {
    default: () => ({
      path: contentPath.value,
      page: null,
    }),
    watch: [contentPath],
    server: true,
    lazy: false,
    immediate: true,
    dedupe: 'cancel',
  },
)

const activePage = computed(() => {
  if (pagePayload.value?.path !== contentPath.value) {
    return null
  }

  return pagePayload.value.page
})

const isPageLoading = computed(() => {
  if (status.value === 'pending' || status.value === 'idle') {
    return true
  }

  return pagePayload.value?.path !== contentPath.value
})

watch(
  [activePage, status, contentPath],
  () => {
    if (isPageLoading.value) {
      pageStore.setLoading(true)
      return
    }

    if (activePage.value) {
      pageStore.setPage(activePage.value)
      return
    }

    pageStore.clearPage()
    pageStore.setLoading(false)
  },
  { immediate: true },
)
</script>

<style scoped>
.content-host > :deep(*) {
  flex: 1 1 0%;
  min-height: 0;
}
</style>
