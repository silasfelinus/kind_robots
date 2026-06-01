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
      class="fixed inset-0 z-50 flex animate-fade-in items-center justify-center"
    >
      <div class="loading loading-dots loading-lg text-primary" />
    </div>

    <main v-if="pageStore.ready" class="h-full min-h-0 w-full overflow-hidden">
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

const router = useRouter()
const layoutStore = useLayoutStore()
const pageStore = usePageStore()
const userStore = useUserStore()
const themeStore = useThemeStore()

const isNavigating = ref(false)
const showLoader = ref(true)

let removeAfter: (() => void) | null = null
let removeBefore: (() => void) | null = null
let navigationTimer: ReturnType<typeof setTimeout> | null = null

function handlePageReady() {
  showLoader.value = false
}

onMounted(async () => {
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

  layoutStore.initializeStore()
  pageStore.initialize()

  if (!userStore.initialized) {
    await userStore.initialize()
  }

  if (!themeStore.initialized) {
    await themeStore.initialize({ fetchShared: false })
  }
})

onUnmounted(() => {
  if (navigationTimer) {
    clearTimeout(navigationTimer)
    navigationTimer = null
  }

  removeBefore?.()
  removeAfter?.()
})

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: '/favicon.ico' }],
})
</script>
