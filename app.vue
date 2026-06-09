<!-- /app.vue -->
<template>
  <div
    class="relative h-dvh min-h-dvh w-full overflow-hidden bg-base-100 text-base-content"
    style="--hand-h: 11.5rem"
  >
    <div v-if="showLoader" class="pointer-events-none fixed inset-0 z-50">
      <kind-loader @pageReady="handlePageReady" />
    </div>

    <butterfly-layer />
    <animation-layer />
    <milestone-popup />

    <section
      class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-base-200 p-3 sm:p-4"
    >
      <workspace-header
        :chrome-minimized="chromeMinimized"
        @toggle-chrome="toggleChrome"
      />

      <section class="relative z-0 min-h-0 flex-1 overflow-hidden">
        <button
          v-if="!workspaceSheetOpen"
          type="button"
          class="btn btn-primary btn-xs btn-square absolute left-3 top-3 z-40 shadow-lg"
          aria-label="Open workspace"
          :aria-expanded="workspaceSheetOpen"
          @click="setWorkspaceSheetOpen(true)"
        >
          <Icon name="kind-icon:question" class="h-4 w-4" />
        </button>

        <main
          class="flex h-full min-h-0 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
        >
          <div
            class="flex min-h-0 flex-1 overflow-hidden md:flex-row md:gap-3"
            :class="chromeMinimized ? 'pb-12' : 'pb-(--hand-h)'"
          >
            <Transition name="workspace-sheet-slide">
              <aside
                v-if="workspaceSheetOpen"
                class="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-base-300 bg-base-100 md:basis-1/2 md:max-w-[50%] lg:basis-1/3 lg:max-w-[33.333%] xl:basis-1/4 xl:max-w-[25%]"
              >
                <div
                  class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100 px-3 py-2"
                >
                  <p
                    class="truncate text-xs font-black uppercase tracking-widest text-primary"
                  >
                    Workspace
                  </p>

                  <button
                    type="button"
                    class="btn btn-ghost btn-xs btn-square"
                    aria-label="Close workspace"
                    @click="setWorkspaceSheetOpen(false)"
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

            <section
              class="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4"
              :class="workspaceSheetOpen ? 'hidden md:flex' : 'flex'"
            >
              <div
                class="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-base-100"
              >
                <main
                  ref="mainScrollEl"
                  class="h-full min-h-0 w-full overflow-y-auto overscroll-contain"
                  @scroll.passive="handleMainScroll"
                  @wheel.passive="minimizeChrome"
                  @touchmove.passive="minimizeChrome"
                >
                  <NuxtPage />
                </main>
              </div>
            </section>
          </div>
        </main>
      </section>
    </section>

    <Transition name="workspace-hand-slide">
      <ClientOnly v-show="!chromeMinimized">
        <workspace-hand />

        <template #fallback>
          <div
            class="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/90 p-3 text-center text-xs font-black uppercase tracking-widest text-primary shadow-xl backdrop-blur"
          >
            Loading workspace hand...
          </div>
        </template>
      </ClientOnly>
    </Transition>

    <button
      type="button"
      class="btn btn-primary btn-sm btn-circle fixed bottom-3 left-1/2 z-50 -translate-x-1/2 shadow-xl"
      :aria-label="
        chromeMinimized ? 'Restore header and footer' : 'Hide header and footer'
      "
      :title="
        chromeMinimized ? 'Restore header and footer' : 'Hide header and footer'
      "
      @click="toggleChrome"
    >
      <Icon
        :name="
          chromeMinimized ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
        "
        class="h-5 w-5"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { ContentCollectionItem } from '@nuxt/content'
import { usePageStore } from '@/stores/pageStore'
import { useThemeStore } from '@/stores/themeStore'

type WorkspaceContentPage = ContentCollectionItem & {
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
const themeStore = useThemeStore()

const showLoader = ref(true)
const workspaceSheetOpen = ref(true)
const chromeMinimized = ref(false)
const mainScrollEl = ref<HTMLElement | null>(null)

const contentPath = computed(() => {
  const path = route.path.replace(/\/+$/, '')
  return path || '/'
})

const asyncKey = computed(() => `app-content:${contentPath.value}`)

pageStore.initialize()

const {
  data: pageData,
  status,
  refresh,
} = await useAsyncData(
  asyncKey,
  async () => {
    const result = await queryCollection('content')
      .path(contentPath.value)
      .first()

    return result as WorkspaceContentPage | null
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

function handlePageReady(): void {
  showLoader.value = false
}

function minimizeChrome(): void {
  chromeMinimized.value = true

  if (import.meta.client) {
    window.localStorage.setItem('kindrobots:chrome-minimized', 'true')
  }
}

function restoreChrome(): void {
  chromeMinimized.value = false

  if (import.meta.client) {
    window.localStorage.setItem('kindrobots:chrome-minimized', 'false')
  }
}

function toggleChrome(): void {
  if (chromeMinimized.value) {
    restoreChrome()
    return
  }

  minimizeChrome()
}

function handleMainScroll(): void {
  const scrollTop = mainScrollEl.value?.scrollTop ?? 0

  if (scrollTop > 8) {
    minimizeChrome()
  }
}

function setWorkspaceSheetOpen(value: boolean): void {
  workspaceSheetOpen.value = value

  if (import.meta.client) {
    window.localStorage.setItem(
      'kindrobots:workspace-sheet-open',
      value ? 'true' : 'false',
    )
  }
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
  async () => {
    pageStore.setLoading(true)
    minimizeChrome()

    await nextTick()

    if (mainScrollEl.value) {
      mainScrollEl.value.scrollTop = 0
    }
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
  themeStore.initialize()

  const storedSheetOpen = window.localStorage.getItem(
    'kindrobots:workspace-sheet-open',
  )

  if (storedSheetOpen) {
    workspaceSheetOpen.value = storedSheetOpen === 'true'
  }

  const storedChromeMinimized = window.localStorage.getItem(
    'kindrobots:chrome-minimized',
  )

  if (storedChromeMinimized) {
    chromeMinimized.value = storedChromeMinimized === 'true'
  }

  await nextTick()
  syncPageStore()

  if (!page.value && status.value !== 'pending') {
    await refresh()
    syncPageStore()
  }
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

.workspace-hand-slide-enter-active,
.workspace-hand-slide-leave-active {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}

.workspace-hand-slide-enter-from,
.workspace-hand-slide-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

.workspace-hand-slide-enter-to,
.workspace-hand-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
