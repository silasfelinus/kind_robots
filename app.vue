<!-- /app.vue -->
<!-- /app.vue -->
<template>
  <div class="min-h-dvh w-full grid grid-cols-4 grid-rows-4">
    <div class="bg-red-500"></div>
    <div class="bg-blue-500"></div>
    <div class="bg-green-500"></div>
    <div class="bg-yellow-500"></div>

    <div class="bg-purple-500"></div>
    <div class="bg-pink-500"></div>
    <div class="bg-indigo-500"></div>
    <div class="bg-teal-500"></div>

    <div class="bg-orange-500"></div>
    <div class="bg-lime-500"></div>
    <div class="bg-cyan-500"></div>
    <div class="bg-rose-500"></div>

    <div class="bg-primary"></div>
    <div class="bg-secondary"></div>
    <div class="bg-accent"></div>
    <div class="bg-base-200"></div>
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
