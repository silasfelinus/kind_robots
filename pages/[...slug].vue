<!-- /pages/[...slug].vue -->
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
    v-else-if="error"
    class="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-error/40 bg-error/5 p-6 text-center"
  >
    <Icon name="kind-icon:alert" class="h-10 w-10 text-error" />

    <p class="text-base font-bold text-error">Content query failed</p>

    <p class="max-w-xl text-sm text-base-content/70">
      Nuxt Content could not load {{ contentPath }}.
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

  <ClientOnly>
    <error-popup />
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
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

const {
  data: pagePayload,
  status,
  error,
} = await useAsyncData<PagePayload>(
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
      path: '',
      page: null,
    }),
    watch: [contentPath],
    server: true,
    lazy: false,
    immediate: true,
    dedupe: 'defer',
  },
)

const hasResolvedCurrentPath = computed(() => {
  return pagePayload.value?.path === contentPath.value
})

const activePage = computed(() => {
  if (!hasResolvedCurrentPath.value) return null

  return pagePayload.value?.page ?? null
})

const isPageLoading = computed(() => {
  return (
    status.value === 'pending' ||
    status.value === 'idle' ||
    !hasResolvedCurrentPath.value
  )
})

function syncPageStore(): void {
  if (isPageLoading.value) {
    pageStore.setLoading(true)
    return
  }

  pageStore.setLoading(false)

  if (error.value) return

  if (activePage.value) {
    pageStore.setPage(activePage.value)
    return
  }

  pageStore.clearPage()
}

onMounted(() => {
  pageStore.initialize()
  syncPageStore()

  watch(
    [activePage, status, error, contentPath, pagePayload],
    () => {
      syncPageStore()
    },
    { flush: 'post' },
  )
})
</script>

<style scoped>
.content-host > :deep(*) {
  flex: 1 1 0%;
  min-height: 0;
}
</style>
