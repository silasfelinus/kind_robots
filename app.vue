<!-- /app.vue -->
<template>
  <div class="main-layout h-full w-full relative overflow-hidden box-border">
    <!-- Loaders -->
    <div class="fixed z-50">
      <footer-toggle />
      <kind-loader />
      <animation-loader class="fixed z-50" />
      <milestone-popup />
      <div
        v-if="showSwarm"
        class="fixed inset-0 overflow-hidden z-50 pointer-events-none full-page"
      >
        <butterfly-animation class="pointer-events-none" />
      </div>
    </div>

    <!-- Navigation Loader -->
    <div
      v-if="isNavigating"
      class="fixed inset-0 z-40 bg-opacity-70 flex items-center justify-center animate-fade-in"
    >
      <div class="loading loading-dots loading-lg text-primary" />
    </div>

    <!-- Header -->
    <header
      v-if="pageStore.ready && displayStore.headerState !== 'hidden'"
      class="fixed z-40 transition-all duration-500 ease-in-out"
      :style="displayStore.headerStyle"
    >
      <full-header class="h-full w-full rounded-xl" />
    </header>

    <!-- Main Content Layer -->
    <main v-if="pageStore.ready">
      <Transition name="slide-in-left">
        <div
          v-if="showMainContent"
          class="fixed z-40 transition-all duration-500 ease-in-out overflow-y-auto overscroll-contain rounded-2xl"
          :style="displayStore.mainContentStyle"
        >
          <NuxtPage
            :key="$route.fullPath"
            class="min-h-full w-full px-4 py-6 pr-[6rem] transition-opacity duration-300 z-40 bg-base-300"
          />

          <div
            class="absolute top-3 right-3 z-50 flex flex-row-reverse items-start gap-3"
          >
            <corner-toggle />

            <Transition name="slide-in-right">
              <div
                v-if="displayStore.showCorner"
                class="pointer-events-none"
              >
                <corner-panel class="pointer-events-auto" />
              </div>
            </Transition>
          </div>
        </div>
      </Transition>

      <tutorial-toggle class="fixed z-40 bottom-2 right-2" />

      <!-- Splash Tutorial in right sidebar region -->
      <Transition name="slide-in-right">
        <div
          v-if="sidebarRightOpen"
          class="fixed z-40 transition-all duration-500 ease-in-out rounded-2xl overflow-hidden"
          :style="displayStore.rightSidebarStyle"
        >
          <splash-tutorial
            class="h-full w-full px-4 py-6 transition-opacity duration-300"
          />
        </div>
      </Transition>
    </main>

    <!-- Footer Area (Art Generator) -->
    <div
      v-if="pageStore.page?.showFooter"
      class="fixed z-40 w-full"
      :style="displayStore.footerStyle"
    >
      <art-generator />
    </div>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import { useSmartbarStore } from '@/stores/smartbarStore'

const smartbarStore = useSmartbarStore()
const showSwarm = computed(() => smartbarStore.showSwarm)

const displayStore = useDisplayStore()
const pageStore = usePageStore()
const router = useRouter()
const isNavigating = ref(false)

const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)

const showMainContent = computed(() => {
  if (displayStore.viewportSize === 'small') {
    return !['open', 'extended'].includes(displayStore.sidebarRightState)
  }
  return true
})

router.beforeEach(() => {
  isNavigating.value = true
})
router.afterEach(() => {
  setTimeout(() => {
    isNavigating.value = false
  }, 400)
})

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: 'favicon.ico' }],
})
</script>
