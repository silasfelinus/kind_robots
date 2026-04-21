<!-- /app.vue -->
<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-base-100">
    <div class="fixed inset-0 z-50 pointer-events-none">
      <div class="pointer-events-auto">
        <footer-toggle />
        <kind-loader />
        <milestone-popup />
      </div>

      <animation-loader class="fixed z-50 pointer-events-none" />

      <div
        v-if="showSwarm"
        class="fixed inset-0 z-50 overflow-hidden pointer-events-none"
      >
        <butterfly-layer class="pointer-events-none" />
      </div>
    </div>

    <div
      v-if="isNavigating"
      class="fixed inset-0 z-40 flex items-center justify-center animate-fade-in"
    >
      <div class="loading loading-dots loading-lg text-primary" />
    </div>

    <main v-if="pageStore.ready" class="fixed z-30">
      <div class="relative h-full w-full overflow-y-auto overscroll-contain">
        <div
          class="absolute top-2 right-2 z-50 flex flex-row-reverse items-start gap-3"
        ></div>

        <NuxtPage
          :key="$route.fullPath"
          class="min-h-full w-full transition-opacity duration-300 bg-base-300"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSmartbarStore } from '@/stores/smartbarStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const layoutStore = useLayoutStore()
const pageStore = usePageStore()
const userStore = useUserStore()

const isNavigating = ref(false)
const showSwarm = computed(() => smartbarStore.showSwarm)

let removeAfter: (() => void) | null = null
let removeBefore: (() => void) | null = null
let navigationTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  removeBefore = router.beforeEach(() => {
    if (navigationTimer) {
      clearTimeout(navigationTimer)
      navigationTimer = null
    }
    isNavigating.value = true
  })

  removeAfter = router.afterEach(() => {
    if (navigationTimer) clearTimeout(navigationTimer)
    navigationTimer = setTimeout(() => {
      isNavigating.value = false
      navigationTimer = null
    }, 450)
  })

  if (!displayStore.isInitialized) displayStore.initialize()
  layoutStore.initializeStore()
  pageStore.initialize()
  if (!userStore.initialized) await userStore.initialize()
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
  link: [{ rel: 'icon', type: 'image/png', href: 'favicon.ico' }],
})
</script>
