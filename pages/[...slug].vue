<template>
  <div
    v-if="pageStore.page?.body"
    class="content-host flex h-full min-h-0 w-full flex-col rounded-2xl border border-success/30 bg-success/5"
  >
    <ContentRenderer :value="pageStore.page" />
  </div>

  <div
    v-else-if="pageStore.isLoading"
    class="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-6 text-center"
  >
    <Icon name="kind-icon:spinner" class="h-10 w-10 animate-spin text-info" />
    <p class="text-base font-bold text-info">Loading page…</p>
    <p class="max-w-xl text-sm text-base-content/60">
      Looking for {{ pageStore.currentPage?.path ?? route.path }}
    </p>
  </div>

  <div
    v-else
    class="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-6 text-center"
  >
    <Icon name="kind-icon:alert" class="h-10 w-10 text-warning" />
    <p class="text-base font-bold text-warning">Page not found</p>
    <p class="max-w-xl text-sm text-base-content/60">
      No Nuxt Content page was found for {{ route.path }}.
    </p>
  </div>

  <error-popup />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from '#app'
import type { ContentCollectionItem } from '@nuxt/content'
import { usePageStore } from '@/stores/pageStore'

const route = useRoute()
const pageStore = usePageStore()

const contentPath = computed(() => {
  const path = route.path.replace(/\/+$/, '')
  return path || '/'
})

const { data: pageData, status } = await useAsyncData(
  () => `content:${contentPath.value}`,
  () => queryCollection('content').path(contentPath.value).first(),
  {
    default: () => null,
    watch: [contentPath],
    server: true,
    lazy: false,
    immediate: true,
    dedupe: 'defer',
  },
)

function syncPageStore(): void {
  if (status.value === 'pending' || status.value === 'idle') {
    pageStore.setLoading(true)
    return
  }

  if (pageData.value) {
    pageStore.setPage(pageData.value as ContentCollectionItem)
    return
  }

  if (status.value === 'success') {
    pageStore.clearPage()
    pageStore.setLoading(false)
  }
}

watch([status, pageData], syncPageStore, { immediate: true })
</script>

<style scoped>
.content-host > :deep(*) {
  flex: 1 1 0%;
  min-height: 0;
}
</style>
