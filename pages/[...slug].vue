<!-- /pages/[...slug].vue -->
<template>
  <div
    v-if="activePage?.body"
    class="content-host flex h-full min-h-0 w-full flex-col rounded-2xl border border-success/30 bg-success/5"
  >
    <ContentRenderer :value="activePage" />
  </div>

  <div
    v-else-if="isPageLoading || isRetryingPage"
    class="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-6 text-center"
  >
    <Icon name="kind-icon:spinner" class="h-10 w-10 animate-spin text-info" />

    <p class="text-base font-bold text-info">Loading page…</p>

    <p class="max-w-xl text-sm text-base-content/60">
      Looking for {{ contentPath }}
    </p>

    <p
      v-if="retryCount > 0"
      class="max-w-xl text-xs font-bold uppercase tracking-widest text-warning"
    >
      Retry {{ retryCount }} / {{ maxPageRetries }}
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

    <pre
      class="max-h-64 w-full max-w-3xl overflow-auto rounded-2xl border border-error/30 bg-base-200 p-3 text-left text-xs text-base-content/70"
      >{{ debugPayload }}</pre
    >
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

    <pre
      class="max-h-64 w-full max-w-3xl overflow-auto rounded-2xl border border-base-300 bg-base-200 p-3 text-left text-xs text-base-content/70"
      >{{ debugPayload }}</pre
    >
  </div>

  <error-popup />
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from '#app'
import type { ContentCollectionItem } from '@nuxt/content'
import { usePageStore } from '@/stores/pageStore'

type PagePayload = {
  path: string
  page: ContentCollectionItem | null
}

const route = useRoute()
const pageStore = usePageStore()

const retryCount = ref(0)
const maxPageRetries = 2
const retryDelayMs = 250
const retryTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const isRetryingPage = ref(false)

const contentPath = computed(() => {
  const path = route.path.replace(/\/+$/, '')

  return path || '/'
})

const asyncKey = computed(() => `content:${contentPath.value}`)

function logSlug(action: string, payload: Record<string, unknown> = {}): void {
  if (!import.meta.client) return

  console.groupCollapsed(`[slug-page] ${action}`)
  console.log('payload:', payload)
  console.log('route:', {
    fullPath: route.fullPath,
    path: route.path,
    params: route.params,
    query: route.query,
  })
  console.log('content:', {
    contentPath: contentPath.value,
    asyncKey: asyncKey.value,
    status: status.value,
    error: error.value,
    hasResolvedCurrentPath: hasResolvedCurrentPath.value,
    hasActivePage: Boolean(activePage.value),
    activePagePath: activePage.value?.path ?? null,
    payloadPath: pagePayload.value?.path ?? null,
    payloadHasPage: Boolean(pagePayload.value?.page),
    retryCount: retryCount.value,
    isRetryingPage: isRetryingPage.value,
  })
  console.log('pageStore:', pageStore.debugState)
  console.groupEnd()
}

const {
  data: pagePayload,
  status,
  error,
  refresh,
} = await useAsyncData<PagePayload>(
  asyncKey,
  async () => {
    const path = contentPath.value

    if (import.meta.client) {
      console.groupCollapsed('[slug-page] queryCollection:start')
      console.log('path:', path)
      console.log('asyncKey:', asyncKey.value)
      console.groupEnd()
    }

    const page = await queryCollection('content').path(path).first()

    if (import.meta.client) {
      console.groupCollapsed('[slug-page] queryCollection:done')
      console.log('path:', path)
      console.log('found:', Boolean(page))
      console.log('pagePath:', page?.path ?? null)
      console.log('title:', page?.title ?? null)
      console.log('page:', page)
      console.groupEnd()
    }

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

const canRetryEmptyPage = computed(() => {
  return (
    import.meta.client &&
    status.value === 'success' &&
    hasResolvedCurrentPath.value &&
    !activePage.value &&
    !error.value &&
    retryCount.value < maxPageRetries
  )
})

const hasExhaustedPageRetries = computed(() => {
  return (
    status.value === 'success' &&
    hasResolvedCurrentPath.value &&
    !activePage.value &&
    !error.value &&
    retryCount.value >= maxPageRetries
  )
})

const debugPayload = computed(() => {
  return JSON.stringify(
    {
      routePath: route.path,
      routeFullPath: route.fullPath,
      contentPath: contentPath.value,
      asyncKey: asyncKey.value,
      status: status.value,
      error: error.value,
      hasResolvedCurrentPath: hasResolvedCurrentPath.value,
      activePagePath: activePage.value?.path ?? null,
      pagePayload: pagePayload.value,
      retryCount: retryCount.value,
      pageStore: pageStore.debugState,
    },
    null,
    2,
  )
})

function clearRetryTimer(): void {
  if (!retryTimer.value) return

  clearTimeout(retryTimer.value)
  retryTimer.value = null
}

function scheduleEmptyPageRetry(reason: string): void {
  if (!canRetryEmptyPage.value || retryTimer.value) return

  retryCount.value += 1
  isRetryingPage.value = true
  pageStore.registerLoadAttempt(contentPath.value, reason)

  const attempt = retryCount.value

  logSlug('scheduleEmptyPageRetry', {
    reason,
    attempt,
    retryDelayMs,
  })

  retryTimer.value = setTimeout(() => {
    retryTimer.value = null

    void refresh()
      .then(() => nextTick())
      .finally(() => {
        isRetryingPage.value = false

        logSlug('scheduleEmptyPageRetry:done', {
          reason,
          attempt,
        })
      })
  }, retryDelayMs)
}

watch(
  contentPath,
  (nextPath, previousPath) => {
    retryCount.value = 0
    isRetryingPage.value = false
    clearRetryTimer()

    logSlug('contentPath:changed', {
      previousPath,
      nextPath,
    })

    pageStore.setLoading(
      true,
      `contentPath changed: ${previousPath} -> ${nextPath}`,
    )
  },
  { immediate: true },
)

watch(
  [activePage, status, error, contentPath, pagePayload],
  () => {
    logSlug('watch:evaluate')

    if (isPageLoading.value) {
      pageStore.setLoading(true, 'slug watcher loading')
      return
    }

    if (error.value) {
      clearRetryTimer()
      isRetryingPage.value = false
      pageStore.setLoading(false, 'slug watcher content query error')

      if (import.meta.client) {
        console.error('[slug-page] content query failed', {
          contentPath: contentPath.value,
          status: status.value,
          error: error.value,
          pagePayload: pagePayload.value,
        })
      }

      return
    }

    if (activePage.value) {
      clearRetryTimer()
      isRetryingPage.value = false
      pageStore.setPage(activePage.value, 'slug watcher activePage')
      return
    }

    if (canRetryEmptyPage.value) {
      pageStore.setLoading(true, 'slug watcher empty success retry')
      scheduleEmptyPageRetry('empty success payload')
      return
    }

    if (hasExhaustedPageRetries.value) {
      clearRetryTimer()
      isRetryingPage.value = false
      pageStore.clearPage('slug watcher exhausted retries')
      return
    }

    pageStore.setLoading(false, 'slug watcher no matching branch')
  },
  { immediate: true },
)

onMounted(() => {
  pageStore.initialize()

  logSlug('mounted')

  if (canRetryEmptyPage.value) {
    scheduleEmptyPageRetry('mounted empty page fallback')
  }
})

onBeforeUnmount(() => {
  clearRetryTimer()
  logSlug('beforeUnmount')
})
</script>

<style scoped>
.content-host > :deep(*) {
  flex: 1 1 0%;
  min-height: 0;
}
</style>
