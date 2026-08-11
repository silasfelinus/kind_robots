<template>
  <div class="kr-unbound h-full min-h-0">
    <LoginPage v-if="isLoginPath" />

    <!-- A redirecting page must not paint its own body first; the prose in a
         legacy stub is a description of the redirect, not content. -->
    <div
      v-else-if="activePage?.body && !redirectTarget"
      class="content-host flex h-full min-h-0 w-full flex-col overflow-y-auto overscroll-contain rounded-2xl"
    >
      <ContentRenderer :value="activePage" />
    </div>

    <div
      v-else-if="isPageLoading"
      class="flex h-full min-h-64 flex-col items-center justify-center gap-3 kr-panel text-center"
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
      class="flex h-full min-h-64 flex-col items-center justify-center gap-3 kr-panel text-center"
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { navigateTo, useRoute } from '#app'
import type { ContentCollectionItem } from '@nuxt/content'
import { preloadModelCards } from '@/stores/helpers/modelCards'
import { usePageStore } from '@/stores/pageStore'

type PagePayload = {
  path: string
  page: ContentCollectionItem | null
}

type NarratedContentPage = ContentCollectionItem & {
  narrator?: unknown
  narratorSlug?: unknown
}

type RedirectingContentPage = ContentCollectionItem & {
  redirect?: unknown
}

type CardContentPage = ContentCollectionItem & {
  cards?: unknown
}

const route = useRoute()
const pageStore = usePageStore()

const contentPath = computed(() => {
  const path = route.path.replace(/\/+$/, '')

  return path || '/'
})

const isLoginPath = computed(() => contentPath.value === '/login')

const asyncKey = computed(() => `content:${contentPath.value}`)

const {
  data: pagePayload,
  status,
  error,
} = await useAsyncData<PagePayload>(
  asyncKey,
  async () => {
    const path = contentPath.value

    if (path === '/login') {
      return {
        path,
        page: null,
      }
    }

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

function normalizePageNarrator(
  page: ContentCollectionItem | null,
): ContentCollectionItem | null {
  if (!page) return null

  const narratedPage = page as NarratedContentPage
  if (narratedPage.narrator) return page

  const narratorSlug =
    typeof narratedPage.narratorSlug === 'string'
      ? narratedPage.narratorSlug.trim()
      : ''

  if (!narratorSlug) return page

  return {
    ...page,
    narrator: {
      type: 'bot',
      slug: narratorSlug,
    },
  } as ContentCollectionItem
}

const activePage = computed(() => {
  if (isLoginPath.value) return null
  if (!hasResolvedCurrentPath.value) return null

  return normalizePageNarrator(pagePayload.value?.page ?? null)
})

/*
 * Honour a `redirect:` frontmatter key on a legacy route.
 *
 * content/facet-gallery.md has carried `redirect: /facets` since the Facet
 * browser was made canonical, and utils/scripts/verifyFacetGallery.ts accepts
 * that key as one of the two valid states for the file -- but nothing ever read
 * it, so the route rendered its own "this legacy route redirects to..." prose
 * instead of redirecting. The contract described an intent the app did not
 * implement.
 *
 * Guarded to same-origin paths only: a content file is data, and following an
 * arbitrary absolute URL from it would turn any future content edit into an
 * open redirect.
 */
const redirectTarget = computed(() => {
  const raw = (activePage.value as RedirectingContentPage | null)?.redirect
  if (typeof raw !== 'string') return ''

  const target = raw.trim()
  if (!target.startsWith('/') || target.startsWith('//')) return ''
  return target === contentPath.value ? '' : target
})

// Redirect during SSR so the legacy URL never paints, and again on client-side
// navigation into it.
if (redirectTarget.value) {
  await navigateTo(redirectTarget.value, { replace: true })
}

watch(redirectTarget, (target) => {
  if (target) void navigateTo(target, { replace: true })
})

const isPageLoading = computed(() => {
  if (isLoginPath.value) return false

  return (
    status.value === 'pending' ||
    status.value === 'idle' ||
    !hasResolvedCurrentPath.value
  )
})

async function syncPageStore(): Promise<void> {
  if (isLoginPath.value) {
    pageStore.clearPage()
    pageStore.setLoading(false)
    return
  }

  if (isPageLoading.value) {
    pageStore.setLoading(true)
    return
  }

  pageStore.setLoading(false)

  if (error.value) return

  const page = activePage.value
  if (page) {
    const resolvedPath = contentPath.value
    const cards = (page as CardContentPage).cards

    if (typeof cards === 'string') {
      await preloadModelCards(cards)
    }

    if (contentPath.value !== resolvedPath || activePage.value !== page) return

    pageStore.setPage(page)
    return
  }

  pageStore.clearPage()
}

/*
 * Populate the store during SETUP, not only on mount.
 *
 * activePage comes from an awaited useAsyncData, so the content is already
 * resolved on the server — but syncPageStore only ran inside onMounted, which
 * never fires there. The store stayed empty through SSR, so anything driven by
 * it rendered nothing until hydration.
 *
 * The page backdrop made that visible: app.vue emits no backdrop element at all
 * when pageStore reports no art, so every page load painted a backdrop-less
 * first frame and then popped the art in. Title and description came from the
 * same store and had the same gap.
 *
 * Workspace card catalogs are also preloaded here before pageStore receives the
 * page. That keeps the card hand synchronous for SSR while allowing each deck to
 * remain a route-local chunk instead of pinning every catalog into app startup.
 *
 * onMounted still runs it, which is a harmless cached re-set on the client and
 * still the right place to start the store's own async initialize and the
 * route watcher.
 */
await syncPageStore()

onMounted(() => {
  pageStore.initialize()
  void syncPageStore()

  watch(
    [activePage, status, error, contentPath, pagePayload, isLoginPath],
    () => {
      void syncPageStore()
    },
    { flush: 'post' },
  )
})
</script>

<style scoped>
.content-host > :deep(:first-child) {
  flex: 1 1 0%;
  min-height: 0;
}
</style>
