<!-- /app.vue -->
<template>
  <div class="min-h-dvh bg-base-200 text-base-content">
    <div
      class="pointer-events-none fixed inset-0 overflow-hidden opacity-40"
      aria-hidden="true"
    >
      <div
        class="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
      />
      <div
        class="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-secondary/20 blur-3xl"
      />
      <div
        class="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
      />
    </div>

    <main
      class="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-4 p-3 sm:p-4 lg:p-6"
    >
      <header
        class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl"
      >
        <div
          class="grid gap-4 bg-linear-to-br from-primary/15 via-base-100 to-secondary/15 p-4 sm:grid-cols-[1fr_auto] sm:p-6"
        >
          <section class="min-w-0">
            <p
              class="text-xs font-black uppercase tracking-[0.3em] text-primary"
            >
              Kind Robots Content + PageStore Probe
            </p>

            <h1
              class="mt-2 wrap-break-word text-3xl font-black leading-tight sm:text-5xl"
            >
              {{ pageStore.title }}
            </h1>

            <p
              class="mt-3 max-w-3xl text-sm leading-relaxed text-base-content/65 sm:text-base"
            >
              {{ pageStore.description || pageStore.subtitle }}
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <span class="badge badge-primary badge-lg">
                route: {{ route.fullPath }}
              </span>

              <span
                class="badge badge-lg"
                :class="page ? 'badge-success' : 'badge-warning'"
              >
                {{ page ? 'content found' : 'content missing' }}
              </span>

              <span
                class="badge badge-lg"
                :class="pageStore.page ? 'badge-success' : 'badge-warning'"
              >
                {{ pageStore.page ? 'store has page' : 'store empty' }}
              </span>

              <span class="badge badge-outline badge-lg">
                status: {{ status }}
              </span>

              <span
                class="badge badge-lg"
                :class="pageStore.ready ? 'badge-info' : 'badge-neutral'"
              >
                ready: {{ pageStore.ready ? 'true' : 'false' }}
              </span>

              <span
                class="badge badge-lg"
                :class="pageStore.isLoading ? 'badge-warning' : 'badge-success'"
              >
                loading: {{ pageStore.isLoading ? 'true' : 'false' }}
              </span>

              <span v-if="errorMessage" class="badge badge-error badge-lg">
                error detected
              </span>
            </div>
          </section>

          <section
            class="grid min-h-48 place-items-center rounded-2xl border border-base-300 bg-base-100/70 p-4 text-center shadow-inner sm:w-72"
          >
            <img
              v-if="friendlyImage"
              :src="friendlyImage"
              :alt="pageStore.title"
              class="h-40 w-full rounded-2xl object-cover shadow-lg"
              @error="friendlyImageFailed = true"
            />

            <div v-else class="flex flex-col items-center gap-3">
              <div class="text-7xl">
                {{ friendlyEmoji }}
              </div>

              <p
                class="max-w-56 text-sm font-bold leading-relaxed text-base-content/60"
              >
                PageStore is now in the test tube. Goggles on.
              </p>
            </div>
          </section>
        </div>
      </header>

      <section
        class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(18rem,24rem)_1fr]"
      >
        <aside class="flex min-h-0 flex-col gap-4">
          <section
            class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-lg"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p
                  class="text-xs font-black uppercase tracking-[0.25em] text-primary"
                >
                  Slit
                </p>

                <h2 class="text-xl font-black">Store Scanner</h2>
              </div>

              <div class="text-4xl">🧪</div>
            </div>

            <div class="mt-4 space-y-3 text-sm">
              <div class="rounded-2xl bg-base-200 p-3">
                <p
                  class="text-xs font-black uppercase tracking-widest text-base-content/45"
                >
                  Normalized path
                </p>

                <p class="mt-1 break-all font-mono text-xs">
                  {{ contentPath }}
                </p>
              </div>

              <div class="rounded-2xl bg-base-200 p-3">
                <p
                  class="text-xs font-black uppercase tracking-widest text-base-content/45"
                >
                  Hydrated
                </p>

                <p class="mt-1 font-black">
                  {{ hydrated ? 'yes, browser goblin awake' : 'not yet' }}
                </p>
              </div>

              <div class="rounded-2xl bg-base-200 p-3">
                <p
                  class="text-xs font-black uppercase tracking-widest text-base-content/45"
                >
                  pageStore.initialized
                </p>

                <p class="mt-1 font-black">
                  {{ pageStore.initialized ? 'true' : 'false' }}
                </p>
              </div>

              <div class="rounded-2xl bg-base-200 p-3">
                <p
                  class="text-xs font-black uppercase tracking-widest text-base-content/45"
                >
                  pageStore.page?.path
                </p>

                <p class="mt-1 break-all font-mono text-xs">
                  {{ pageStore.currentPage?.path || '—' }}
                </p>
              </div>

              <div
                v-if="errorMessage"
                class="rounded-2xl border border-error/30 bg-error/10 p-3 text-error"
              >
                <p class="text-xs font-black uppercase tracking-widest">
                  Error
                </p>

                <p class="mt-1 wrap-break-word text-sm">
                  {{ errorMessage }}
                </p>
              </div>

              <button
                type="button"
                class="btn btn-primary btn-sm w-full rounded-2xl"
                @click="forceRefresh"
              >
                Refresh content + store
              </button>

              <button
                type="button"
                class="btn btn-outline btn-sm w-full rounded-2xl"
                @click="logStoreReport"
              >
                Log pageStore report
              </button>
            </div>
          </section>

          <section
            class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-lg"
          >
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-xl font-black">PageStore Meta</h2>

              <span class="badge badge-primary"> live </span>
            </div>

            <dl class="mt-4 flex flex-col gap-2">
              <div
                v-for="field in storeMetaFields"
                :key="field.label"
                class="rounded-2xl bg-base-200 p-3"
              >
                <dt
                  class="text-xs font-black uppercase tracking-widest text-base-content/45"
                >
                  {{ field.label }}
                </dt>

                <dd class="mt-1 wrap-break-word text-sm font-bold">
                  {{ field.value }}
                </dd>
              </div>
            </dl>
          </section>

          <section
            class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-lg"
          >
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-xl font-black">Nearby Portals</h2>

              <span class="badge badge-outline">
                {{ visiblePages.length }}
              </span>
            </div>

            <div v-if="visiblePages.length" class="mt-4 flex flex-col gap-2">
              <NuxtLink
                v-for="item in visiblePages"
                :key="item.path"
                :to="item.path"
                class="group rounded-2xl border border-base-300 bg-base-200 p-3 transition hover:border-primary hover:bg-primary/10"
              >
                <p class="truncate font-black group-hover:text-primary">
                  {{ item.title || item.path }}
                </p>

                <p class="mt-1 truncate text-xs text-base-content/50">
                  {{ item.path }}
                </p>
              </NuxtLink>
            </div>

            <div
              v-else
              class="mt-4 rounded-2xl border border-dashed border-base-300 p-4 text-sm text-base-content/50"
            >
              No other content pages returned.
            </div>
          </section>
        </aside>

        <section class="flex min-h-0 flex-col gap-4">
          <article
            class="min-h-[50dvh] rounded-2xl border border-base-300 bg-base-100 p-4 shadow-lg sm:p-6"
          >
            <div
              class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-base-300 pb-4"
            >
              <div>
                <p
                  class="text-xs font-black uppercase tracking-[0.25em] text-primary"
                >
                  Rendered Markdown
                </p>

                <h2 class="text-2xl font-black">ContentRenderer Output</h2>
              </div>

              <div class="text-3xl">🤖</div>
            </div>

            <ContentRenderer
              v-if="page"
              :value="page"
              class="prose max-w-none text-base-content prose-headings:text-base-content prose-a:text-primary prose-strong:text-base-content"
            />

            <div
              v-else-if="status === 'pending'"
              class="grid min-h-72 place-items-center rounded-2xl bg-base-200 p-6 text-center"
            >
              <div class="flex max-w-md flex-col items-center gap-3">
                <div class="loading loading-spinner loading-lg text-primary" />

                <h3 class="text-xl font-black">Querying Nuxt Content</h3>

                <p class="text-sm leading-relaxed text-base-content/60">
                  The content goblin is checking under the Markdown couch.
                </p>
              </div>
            </div>

            <div
              v-else
              class="grid min-h-72 place-items-center rounded-2xl border border-dashed border-warning/50 bg-warning/10 p-6 text-center"
            >
              <div class="max-w-lg">
                <div class="text-6xl">🕳️</div>

                <h3 class="mt-3 text-2xl font-black">
                  Page not found in content collection
                </h3>

                <p class="mt-2 text-sm leading-relaxed text-base-content/65">
                  The route loaded, but the content query returned nothing.
                </p>
              </div>
            </div>
          </article>

          <section
            class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-lg sm:p-6"
          >
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p
                  class="text-xs font-black uppercase tracking-[0.25em] text-secondary"
                >
                  Store Report
                </p>

                <h2 class="text-2xl font-black">What pageStore Has</h2>
              </div>

              <span
                class="badge"
                :class="storeMatchesContent ? 'badge-success' : 'badge-warning'"
              >
                {{
                  storeMatchesContent
                    ? 'store matches content path'
                    : 'store mismatch'
                }}
              </span>
            </div>

            <dl class="grid gap-3 md:grid-cols-2">
              <div
                v-for="field in storeReportFields"
                :key="field.label"
                class="rounded-2xl bg-base-200 p-3"
              >
                <dt
                  class="text-xs font-black uppercase tracking-widest text-base-content/45"
                >
                  {{ field.label }}
                </dt>

                <dd class="mt-1 wrap-break-word text-sm font-bold">
                  {{ field.value }}
                </dd>
              </div>
            </dl>

            <details
              class="mt-4 rounded-2xl border border-base-300 bg-base-200"
            >
              <summary class="cursor-pointer p-4 font-black">
                Open pageStore.page JSON
              </summary>

              <pre
                class="max-h-128 overflow-auto border-t border-base-300 p-4 text-xs"
              ><code>{{ rawStorePageJson }}</code></pre>
            </details>

            <details
              class="mt-4 rounded-2xl border border-base-300 bg-base-200"
            >
              <summary class="cursor-pointer p-4 font-black">
                Open raw Nuxt Content page JSON
              </summary>

              <pre
                class="max-h-128 overflow-auto border-t border-base-300 p-4 text-xs"
              ><code>{{ rawContentPageJson }}</code></pre>
            </details>
          </section>
        </section>
      </section>

      <footer
        class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center text-sm text-base-content/55 shadow-lg"
      >
        Test stage 2 active: Nuxt Content loads, then pushes into pageStore. If
        this works on first refresh, pageStore is innocent. Mostly. Nobody is
        fully innocent in hydration court.
      </footer>
    </main>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { ContentCollectionItem } from '@nuxt/content'
import { usePageStore } from '@/stores/pageStore'

type ContentProbePage = ContentCollectionItem & {
  title?: string
  description?: string
  subtitle?: string
  room?: string
  image?: string
  icon?: string
  tooltip?: string
  dottitip?: string
  amitip?: string
  dashboardKey?: string
  dashboardTab?: string
  loadingMessage?: string
  refreshLabel?: string
  cards?: unknown
  body?: unknown
}

type ContentProbeListItem = ContentCollectionItem & {
  title?: string
  description?: string
  image?: string
}

const route = useRoute()
const pageStore = usePageStore()

const hydrated = ref(false)
const friendlyImageFailed = ref(false)

const contentPath = computed(() => {
  const path = route.path.replace(/\/+$/, '')
  return path || '/'
})

const asyncKey = computed(() => `content-page-store-probe:${contentPath.value}`)

pageStore.initialize()

const {
  data: pageData,
  status,
  error,
  refresh,
} = await useAsyncData(
  asyncKey.value,
  async () => {
    const result = await queryCollection('content')
      .path(contentPath.value)
      .first()
    return result as ContentProbePage | null
  },
  {
    default: () => null,
    watch: [contentPath],
    server: true,
    lazy: false,
    immediate: true,
    dedupe: 'defer',
  },
)

const { data: allPagesData } = await useAsyncData(
  'content-page-store-probe:all-pages',
  async () => {
    const result = await queryCollection('content').all()
    return result as ContentProbeListItem[]
  },
  {
    default: () => [],
    server: true,
    lazy: false,
    immediate: true,
  },
)

const page = computed(() => pageData.value)

const allPages = computed(() => {
  return allPagesData.value ?? []
})

const friendlyEmoji = computed(() => {
  const path = contentPath.value.toLowerCase()

  if (path.includes('builder')) return '🛠️'
  if (path.includes('art')) return '🎨'
  if (path.includes('bot')) return '🤖'
  if (path.includes('memory')) return '🧠'
  if (path.includes('wonder')) return '🧪'
  if (path.includes('story')) return '📚'
  if (path.includes('dashboard')) return '📡'

  return '🐈‍⬛'
})

const friendlyImage = computed(() => {
  if (friendlyImageFailed.value) return ''

  const image = pageStore.image || page.value?.image

  if (typeof image !== 'string' || !image.trim()) return ''

  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image
  }

  return image.startsWith('/') ? image : `/${image}`
})

const errorMessage = computed(() => {
  if (!error.value) return ''

  if (error.value instanceof Error) {
    return error.value.message
  }

  return String(error.value)
})

const visiblePages = computed(() => {
  return allPages.value
    .filter((item): item is ContentProbeListItem & { path: string } => {
      return typeof item.path === 'string' && item.path.length > 0
    })
    .filter((item) => item.path !== contentPath.value)
    .slice(0, 12)
})

const storeMatchesContent = computed(() => {
  return pageStore.currentPage?.path === page.value?.path
})

const storeMetaFields = computed(() => [
  {
    label: 'title',
    value: stringifyField(pageStore.meta.title),
  },
  {
    label: 'room',
    value: stringifyField(pageStore.meta.room),
  },
  {
    label: 'subtitle',
    value: stringifyField(pageStore.meta.subtitle),
  },
  {
    label: 'description',
    value: stringifyField(pageStore.meta.description),
  },
  {
    label: 'icon',
    value: stringifyField(pageStore.meta.icon),
  },
  {
    label: 'image',
    value: stringifyField(pageStore.meta.image),
  },
  {
    label: 'dashboardKey',
    value: stringifyField(pageStore.meta.dashboardKey),
  },
  {
    label: 'dashboardTab',
    value: stringifyField(pageStore.meta.dashboardTab),
  },
  {
    label: 'loadingMessage',
    value: stringifyField(pageStore.meta.loadingMessage),
  },
  {
    label: 'refreshLabel',
    value: stringifyField(pageStore.meta.refreshLabel),
  },
])

const storeReportFields = computed(() => [
  {
    label: 'content path',
    value: contentPath.value,
  },
  {
    label: 'raw content page path',
    value: stringifyField(page.value?.path),
  },
  {
    label: 'store currentPage path',
    value: stringifyField(pageStore.currentPage?.path),
  },
  {
    label: 'store has page',
    value: pageStore.page ? 'yes' : 'no',
  },
  {
    label: 'store ready',
    value: String(pageStore.ready),
  },
  {
    label: 'store initialized',
    value: String(pageStore.initialized),
  },
  {
    label: 'store isLoading',
    value: String(pageStore.isLoading),
  },
  {
    label: 'store cardsKey',
    value: stringifyField(pageStore.cardsKey),
  },
  {
    label: 'store cards count',
    value: String(pageStore.cards.length),
  },
  {
    label: 'store workspaceCardKey',
    value: stringifyField(pageStore.workspaceCardKey),
  },
])

const rawStorePageJson = computed(() => {
  return JSON.stringify(pageStore.page, null, 2)
})

const rawContentPageJson = computed(() => {
  return JSON.stringify(page.value, null, 2)
})

function stringifyField(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'

  if (typeof value === 'string') return value

  return JSON.stringify(value)
}

async function forceRefresh(): Promise<void> {
  pageStore.setLoading(true)
  friendlyImageFailed.value = false
  await refresh()
  syncPageStore()
}

function syncPageStore(): void {
  if (status.value === 'pending' || status.value === 'idle') {
    pageStore.setLoading(true)
    return
  }

  if (page.value) {
    pageStore.setPage(page.value)
    return
  }

  if (status.value === 'success') {
    pageStore.clearPage()
    pageStore.setLoading(false)
  }
}

function logStoreReport(): void {
  if (!import.meta.client) return

  console.groupCollapsed('[app.vue probe] pageStore report')
  console.log('contentPath:', contentPath.value)
  console.log('contentStatus:', status.value)
  console.log('raw content page:', page.value)
  console.log('pageStore.page:', pageStore.page)
  console.log('pageStore.currentPage:', pageStore.currentPage)
  console.log('pageStore.meta:', pageStore.meta)
  console.log('storeMatchesContent:', storeMatchesContent.value)
  console.groupEnd()
}

watch(
  status,
  () => {
    syncPageStore()
  },
  { immediate: true },
)

watch(
  page,
  () => {
    syncPageStore()
  },
  { immediate: true },
)

watch(
  contentPath,
  () => {
    friendlyImageFailed.value = false
    pageStore.setLoading(true)
  },
  { flush: 'sync' },
)

useSeoMeta({
  title: () => pageStore.title || 'Kind Robots',
  description: () =>
    pageStore.description ||
    pageStore.subtitle ||
    'A friendly AI playground for humans and robots.',
})

onMounted(async () => {
  hydrated.value = true
  await nextTick()
  syncPageStore()

  if (!page.value && status.value !== 'pending') {
    await forceRefresh()
  }

  logStoreReport()
})
</script>
