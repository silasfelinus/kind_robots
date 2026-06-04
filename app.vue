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
        class="relative flex h-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <ClientOnly>
          <dashboard-shell>
            <NuxtPage />
          </dashboard-shell>

          <template #fallback>
            <div class="h-full min-h-0 w-full overflow-y-auto p-3 sm:p-4">
              <NuxtPage />
            </div>
          </template>
        </ClientOnly>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
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

let removeAfter: (() => void) | null = null
let removeBefore: (() => void) | null = null
let navigationTimer: ReturnType<typeof setTimeout> | null = null
let loaderTimer: ReturnType<typeof setTimeout> | null = null

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
