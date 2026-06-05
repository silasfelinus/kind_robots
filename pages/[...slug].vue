<template>
  <div
    v-if="pageStore.page?.body"
    class="h-full min-h-0 w-full overflow-hidden rounded-2xl border border-success/30 bg-success/5"
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
import { useRoute } from '#app'
import { usePageStore } from '@/stores/pageStore'

const route = useRoute()
const pageStore = usePageStore()
</script>
