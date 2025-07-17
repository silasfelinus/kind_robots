<!-- /app.vue -->
<template>
  <div
    class="main-layout bg-base-200 h-full w-full relative overflow-hidden box-border"
  >
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
      class="fixed inset-0 z-40 bg-base-200 bg-opacity-70 flex items-center justify-center animate-fade-in"
    >
      <div class="loading loading-dots loading-lg text-primary" />
    </div>

    <!-- Header -->
    <header
      v-if="pageStore.ready && displayStore.headerState !== 'hidden'"
      class="fixed z-40 transition-all duration-500 ease-in-out"
      :style="displayStore.headerStyle"
    >
      <kind-header class="h-full w-full rounded-xl" />
    </header>

    <!-- Main Content Layer -->
    <main v-if="pageStore.ready">
      <!-- Main Content (Nuxt Page) -->
      <Transition name="slide-in-left">
        <div
          v-if="showMainContent"
          class="fixed z-40 transition-all duration-500 ease-in-out overflow-y-auto overscroll-contain rounded-2xl"
          :style="displayStore.mainContentStyle"
        >
          <!-- Corner Panel -->
          <corner-panel />
         <NuxtPage
  :key="$route.fullPath"
  class="min-h-full w-full px-4 py-6 pr-[5.5rem] transition-opacity duration-300"
/>

        </div>
      </Transition>

      <!-- Splash Tutorial (small viewport fallback) -->
      <Transition name="slide-in-right">
        <div
          v-if="sidebarRightOpen"
          class="fixed z-40 transition-all duration-500 ease-in-out"
          :style="displayStore.rightSidebarStyle"
        >
          <splash-tutorial
            class="h-full w-full px-4 py-6 transition-opacity duration-300"
          />
        </div>
      </Transition>

      <!-- Right Sidebar Toggle -->
      <right-toggle
        class="fixed bottom-14 right-4 z-40"
        :class="{
          'bg-accent text-white shadow-xl': sidebarRightOpen,
          'bg-base-300 shadow': !sidebarRightOpen,
        }"
      />
    </main>
  </div>

  <!-- Footer Area (Extra UI like Art Generator) -->
  <div
    v-if="pageStore.page?.showFooter"
    class="fixed z-40 w-full"
    :style="displayStore.footerStyle"
  >
    <art-generator />
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import { useSmartbarStore } from '@/stores/smartbarStore'
import { setCustomVh } from '@/stores/helpers/displayHelper'

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

