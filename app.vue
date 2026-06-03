<template>
  <div class="relative h-dvh min-h-dvh w-full overflow-hidden bg-base-100">
    <div v-if="showLoader" class="pointer-events-none fixed inset-0 z-40">
      <kind-loader @pageReady="handlePageReady" />
    </div>

    <butterfly-layer />
    <animation-layer />
    <milestone-popup />

    <div
      v-if="isNavigating"
      class="pointer-events-none fixed inset-0 z-50 flex animate-fade-in items-center justify-center"
    >
      <div class="loading loading-dots loading-lg text-primary" />
    </div>

    <main class="h-full min-h-0 w-full overflow-hidden">
      <NuxtPage
        class="h-full min-h-0 w-full bg-base-300 transition-opacity duration-300"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/layoutStore'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'
import { useThemeStore } from '@/stores/themeStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'

const router = useRouter()
const layoutStore = useLayoutStore()
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
  layoutStore.initializeStore()
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
