<!-- /app.vue -->
<template>
  <div class="relative h-dvh min-h-dvh w-full overflow-hidden bg-base-100">
    <ClientOnly>
      <butterfly-layer />
      <animation-layer />
      <milestone-popup />
    </ClientOnly>

    <ClientOnly>
      <kind-loader v-if="showLoader" @pageReady="handlePageReady" />
    </ClientOnly>

    <ClientOnly>
      <div
        v-if="isNavigating"
        class="pointer-events-none fixed inset-0 z-50 flex animate-fade-in items-center justify-center"
      >
        <div class="loading loading-dots loading-lg text-primary" />
      </div>
    </ClientOnly>

    <main class="h-full min-h-0 w-full overflow-hidden bg-base-200 p-2 sm:p-3">
  <section
  class="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
>
  <div class="relative flex min-h-0 flex-1 overflow-hidden">
    <button
      v-if="!sheetVisible"
      type="button"
      class="absolute left-3 top-3 z-40 flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-black uppercase tracking-widest text-primary shadow-md transition-all hover:border-primary hover:bg-primary/10 active:scale-95"
      title="Show workspace sheet"
      @click="showSheet"
    >
      <Icon name="kind-icon:sidebar-left" class="h-4 w-4" />
      <span class="hidden sm:inline">Sheet</span>
    </button>

    <Transition name="workspace-sheet-slide">
      <aside
        v-if="sheetVisible"
        class="absolute inset-y-0 left-0 z-30 flex min-h-0 w-80 shrink-0 flex-col overflow-hidden border-r border-base-300 bg-base-100 shadow-xl lg:relative lg:z-auto lg:shadow-none"
      >
        <div
          class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
        >
          <div class="flex min-w-0 items-center gap-2">
            <Icon
              name="kind-icon:sidebar-left"
              class="h-4 w-4 text-primary"
            />
            <span class="truncate text-sm font-black text-base-content">
              Workspace Sheet
            </span>
          </div>

          <button
            type="button"
            class="btn btn-xs btn-ghost rounded-xl"
            title="Hide workspace sheet"
            @click="hideSheet"
          >
            <Icon name="kind-icon:close" class="h-4 w-4" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <ClientOnly>
            <workspace-sheet />

            <template #fallback>
              <div
                class="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-4 text-center"
              >
                <Icon name="kind-icon:loading" class="h-8 w-8 text-info" />
                <p class="text-sm font-bold text-info">Loading sheet...</p>
              </div>
            </template>
          </ClientOnly>
        </div>
      </aside>
    </Transition>

    <section
      class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
      :class="!sheetVisible ? 'pt-14 sm:pt-4' : ''"
    >
      <NuxtPage />
    </section>
  </div>

  <section
    class="shrink-0 overflow-hidden border-t border-base-300 bg-base-100/95 p-2 shadow-[0_-0.75rem_1.5rem_rgba(0,0,0,0.06)] backdrop-blur"
  >
    <div class="h-28 min-h-28 sm:h-[22dvh] sm:max-h-52">
      <ClientOnly>
        <workspace-hand />

        <template #fallback>
          <div
            class="flex h-full items-center justify-center rounded-xl border border-base-300 bg-base-200 text-sm font-bold text-base-content/60"
          >
            Loading hand...
          </div>
        </template>
      </ClientOnly>
    </div>
  </section>
</section>


    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'
import { useThemeStore } from '@/stores/themeStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'

const router = useRouter()
const pageStore = usePageStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const displayStore = useDisplayStore()
const navStore = useNavStore()

const isNavigating = ref(false)
const showLoader = ref(true)

const sheetVisible = computed(() => {
  return ['open', 'compact'].includes(displayStore.sidebarLeftState)
})

let removeAfter: (() => void) | null = null
let removeBefore: (() => void) | null = null
let navigationTimer: ReturnType<typeof setTimeout> | null = null
let loaderTimer: ReturnType<typeof setTimeout> | null = null

function showSheet() {
  displayStore.sidebarLeftState = 'open'
}

function hideSheet() {
  displayStore.sidebarLeftState = 'hidden'
}

function handlePageReady() {
  showLoader.value = false

  if (loaderTimer) {
    clearTimeout(loaderTimer)
    loaderTimer = null
  }
}

async function initializeStores() {
  displayStore.initialize()
  pageStore.initialize()

  const tasks: Promise<unknown>[] = []

  if (!navStore.isInitialized) {
    tasks.push(navStore.initialize())
  }

  if (!userStore.initialized) {
    tasks.push(userStore.initialize())
  }

  if (!themeStore.initialized) {
    tasks.push(themeStore.initialize({ fetchShared: false }))
  }

  const results = await Promise.allSettled(tasks)

  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('[app] Store initialization failed:', result.reason)
    }
  })
}

onMounted(() => {
  removeBefore = router.beforeEach(() => {
    if (navigationTimer) {
      clearTimeout(navigationTimer)
      navigationTimer = null
    }

    isNavigating.value = true
  })

  removeAfter = router.afterEach(() => {
    if (navigationTimer) {
      clearTimeout(navigationTimer)
    }

    navigationTimer = setTimeout(() => {
      isNavigating.value = false
      navigationTimer = null
    }, 450)
  })

  loaderTimer = setTimeout(() => {
    showLoader.value = false
    loaderTimer = null
  }, 2500)

  void initializeStores()
})

onUnmounted(() => {
  if (navigationTimer) {
    clearTimeout(navigationTimer)
    navigationTimer = null
  }

  if (loaderTimer) {
    clearTimeout(loaderTimer)
    loaderTimer = null
  }

  removeBefore?.()
  removeAfter?.()
})

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: '/favicon.ico' }],
})
</script>

<style scoped>
.workspace-sheet-slide-enter-active,
.workspace-sheet-slide-leave-active {
  transition: all 180ms ease;
}

.workspace-sheet-slide-enter-from,
.workspace-sheet-slide-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
}
</style>
