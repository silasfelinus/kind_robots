<!-- /app.vue -->
<template>
  <div
    class="relative h-dvh min-h-dvh w-full overflow-hidden bg-base-100 text-base-content"
    style="--hand-h: 11.5rem"
  >
    <dashboard-shell>
      <section
        class="relative flex h-full min-h-0 w-full flex-col overflow-hidden"
      >
        <button
          v-if="!workspaceSheetOpen"
          type="button"
          class="btn btn-primary btn-xs btn-square absolute left-3 top-2 z-40 shadow-lg"
          aria-label="Open workspace"
          :aria-expanded="workspaceSheetOpen"
          @click="workspaceSheetOpen = true"
        >
          <Icon name="kind-icon:panel-left" class="h-4 w-4" />
        </button>

        <div
          class="flex min-h-0 flex-1 overflow-hidden pb-(--hand-h) md:flex-row md:gap-3"
        >
          <Transition name="workspace-sheet-slide">
            <aside
              v-if="workspaceSheetOpen"
              class="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-base-300 bg-base-100 md:basis-1/2 md:max-w-[50%] lg:basis-1/3 lg:max-w-[33.333%] xl:basis-1/4 xl:max-w-[25%]"
            >
              <div
                class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100 px-3 py-2"
              >
                <div class="min-w-0">
                  <p
                    class="truncate text-xs font-black uppercase tracking-widest text-primary"
                  >
                    Workspace
                  </p>
                </div>

                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-square"
                  aria-label="Close workspace"
                  @click="workspaceSheetOpen = false"
                >
                  <Icon name="kind-icon:close" class="h-4 w-4" />
                </button>
              </div>

              <div
                class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"
              >
                <ClientOnly>
                  <workspace-sheet />

                  <template #fallback>
                    <div
                      class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-sm text-base-content/60"
                    >
                      Loading workspace...
                    </div>
                  </template>
                </ClientOnly>
              </div>
            </aside>
          </Transition>

          <main
            class="relative h-full min-h-0 flex-1 overflow-y-auto"
            :class="workspaceSheetOpen ? 'hidden md:block' : 'block'"
          >
            <section
              class="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 p-3 sm:p-4 lg:p-6"
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
                      {{ pageStore.room }}
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

                    <div
                      v-if="
                        pageStore.tooltip ||
                        pageStore.dottitip ||
                        pageStore.amitip
                      "
                      class="mt-4 grid gap-2 text-sm md:grid-cols-3"
                    >
                      <div
                        v-if="pageStore.tooltip"
                        class="rounded-2xl border border-base-300 bg-base-200/70 p-3"
                      >
                        {{ pageStore.tooltip }}
                      </div>

                      <div
                        v-if="pageStore.dottitip"
                        class="rounded-2xl border border-secondary/30 bg-secondary/10 p-3"
                      >
                        {{ pageStore.dottitip }}
                      </div>

                      <div
                        v-if="pageStore.amitip"
                        class="rounded-2xl border border-primary/30 bg-primary/10 p-3"
                      >
                        {{ pageStore.amitip }}
                      </div>
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
                        This room is loading without drama. Suspicious, but
                        welcome.
                      </p>
                    </div>
                  </section>
                </div>
              </header>

              <article
                class="min-h-[50dvh] rounded-2xl border border-base-300 bg-base-100 p-4 shadow-lg sm:p-6"
              >
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
                    <div
                      class="loading loading-spinner loading-lg text-primary"
                    />

                    <h2 class="text-xl font-black">
                      Loading {{ contentPath }}
                    </h2>

                    <p class="text-sm leading-relaxed text-base-content/60">
                      Reality is compiling. The robots are pretending this is
                      normal.
                    </p>
                  </div>
                </div>

                <div
                  v-else
                  class="grid min-h-72 place-items-center rounded-2xl border border-dashed border-warning/50 bg-warning/10 p-6 text-center"
                >
                  <div class="max-w-lg">
                    <div class="text-6xl">🕳️</div>

                    <h2 class="mt-3 text-2xl font-black">Page not found</h2>

                    <p
                      class="mt-2 text-sm leading-relaxed text-base-content/65"
                    >
                      No content entry was found for {{ contentPath }}.
                    </p>
                  </div>
                </div>
              </article>
            </section>
          </main>
        </div>
      </section>
    </dashboard-shell>

    <ClientOnly>
      <workspace-hand />

      <template #fallback>
        <div
          class="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/90 p-3 text-center text-xs font-black uppercase tracking-widest text-primary shadow-xl backdrop-blur"
        >
          Loading workspace hand...
        </div>
      </template>
    </ClientOnly>
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

const route = useRoute()
const pageStore = usePageStore()

const hydrated = ref(false)
const friendlyImageFailed = ref(false)
const workspaceSheetOpen = ref(true)

const contentPath = computed(() => {
  const path = route.path.replace(/\/+$/, '')
  return path || '/'
})

const asyncKey = computed(
  () => `content-dashboard-shell-probe:${contentPath.value}`,
)

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

const page = computed(() => pageData.value)

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

async function forceRefresh(): Promise<void> {
  pageStore.setLoading(true)
  friendlyImageFailed.value = false
  await refresh()
  syncPageStore()
}

function logPageReport(): void {
  if (!import.meta.client) return

  console.groupCollapsed('[app.vue] dashboard-shell page report')
  console.log('contentPath:', contentPath.value)
  console.log('status:', status.value)
  console.log('error:', errorMessage.value)
  console.log('page:', page.value)
  console.log('pageStore.page:', pageStore.page)
  console.log('pageStore.currentPage:', pageStore.currentPage)
  console.log('pageStore.meta:', pageStore.meta)
  console.log('workspaceSheetOpen:', workspaceSheetOpen.value)
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

watch(workspaceSheetOpen, (value) => {
  if (!import.meta.client) return

  window.localStorage.setItem(
    'kindrobots:workspace-sheet-open',
    value ? 'true' : 'false',
  )
})

useSeoMeta({
  title: () => pageStore.title || 'Kind Robots',
  description: () =>
    pageStore.description ||
    pageStore.subtitle ||
    'A friendly AI playground for humans and robots.',
})

onMounted(async () => {
  hydrated.value = true

  const storedSheetOpen = window.localStorage.getItem(
    'kindrobots:workspace-sheet-open',
  )

  if (storedSheetOpen) {
    workspaceSheetOpen.value = storedSheetOpen === 'true'
  }

  await nextTick()
  syncPageStore()

  if (!page.value && status.value !== 'pending') {
    await forceRefresh()
  }

  logPageReport()
})
</script>

<style scoped>
.workspace-sheet-slide-enter-active,
.workspace-sheet-slide-leave-active {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}

.workspace-sheet-slide-enter-from,
.workspace-sheet-slide-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
}

.workspace-sheet-slide-enter-to,
.workspace-sheet-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
