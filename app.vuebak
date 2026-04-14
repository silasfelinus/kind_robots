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
        <butterfly-animation class="pointer-events-none" />
      </div>
    </div>

    <div
      v-if="isNavigating"
      class="fixed inset-0 z-40 flex items-center justify-center animate-fade-in"
    >
      <div class="loading loading-dots loading-lg text-primary" />
    </div>

    <header
      v-if="pageStore.ready && displayStore.headerState !== 'hidden'"
      class="fixed top-0 left-0 z-40 w-full"
      :style="displayStore.headerStyle"
    >
      <full-header class="h-full w-full" />
    </header>

    <main v-if="pageStore.ready" class="fixed z-30" :style="mainShellStyle">
      <div class="relative h-full w-full overflow-y-auto overscroll-contain">
        <div
          class="absolute top-2 right-2 z-50 flex flex-row-reverse items-start gap-3"
        >
          <corner-toggle />

          <Transition name="slide-in-right">
            <div v-if="displayStore.showCorner" class="pointer-events-none">
              <corner-panel class="pointer-events-auto" />
            </div>
          </Transition>
        </div>

        <NuxtPage
          :key="$route.fullPath"
          class="min-h-full w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 transition-opacity duration-300 bg-base-300"
        />
      </div>
    </main>

    <tutorial-toggle class="fixed right-2 bottom-2 z-50" />

    <Transition name="slide-in-right">
      <aside
        v-if="sidebarRightOpen"
        class="fixed z-40 overflow-hidden rounded-2xl"
        :style="displayStore.rightSidebarStyle"
      >
        <splash-tutorial
          class="h-full w-full transition-opacity duration-300"
        />
      </aside>
    </Transition>

    <footer
      v-if="pageStore.page?.showFooter && displayStore.footerState !== 'hidden'"
      class="fixed z-40 w-full"
      :style="displayStore.footerStyle"
    >
      <art-generator />
    </footer>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import { useSmartbarStore } from '@/stores/smartbarStore'

const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const pageStore = usePageStore()
const router = useRouter()
const route = useRoute()

const isNavigating = ref(false)

const showSwarm = computed(() => smartbarStore.showSwarm)

const sidebarRightOpen = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarRightState),
)

const rightSidebarWidth = computed(() => {
  if (!sidebarRightOpen.value) return 0
  return displayStore.sidebarRightWidth
})

const headerHeight = computed(() => displayStore.headerHeight)

const footerHeight = computed(() => {
  if (!pageStore.page?.showFooter || displayStore.footerState === 'hidden') {
    return 0
  }
  return displayStore.footerHeight
})

const mainShellStyle = computed(() => ({
  top: `calc(var(--vh) * ${headerHeight.value})`,
  left: '0',
  width: sidebarRightOpen.value
    ? `calc(100vw - ${rightSidebarWidth.value}vw)`
    : '100vw',
  height: `calc(var(--vh) * ${100 - headerHeight.value - footerHeight.value})`,
}))

router.beforeEach(() => {
  isNavigating.value = true
})

router.afterEach(() => {
  window.setTimeout(() => {
    isNavigating.value = false
  }, 400)
})

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: 'favicon.ico' }],
})
</script>
