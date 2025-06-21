<!-- /app.vue -->
<template>
  <div
    class="main-layout bg-base-200 h-full w-full relative overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <screen-debug />
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
      class="fixed z-40 border-6 border-secondary transition-all duration-500 ease-in-out"
      :style="displayStore.headerStyle"
    >
      <kind-header class="h-full w-full rounded-xl" />
    </header>

    <!-- Main Content Layer -->
    <main
      v-if="pageStore.ready"
      class="absolute z-30 inset-0 box-border rounded-2xl"
    >
      <!-- Main Content (Nuxt Page) -->
      <div
        v-if="showMainContent"
        class="absolute inset-0 bg-green-200/40"
        :style="displayStore.mainContentStyle"
      >
        <NuxtPage
          :key="$route.fullPath"
          class="h-full w-full px-4 py-6 transition-opacity duration-300"
        />
      </div>

      <!-- Splash Tutorial (small viewport fallback) -->
      <div
        v-if="sidebarRightOpen"
        class="absolute inset-0 bg-red-200/40"
        :style="displayStore.rightSidebarStyle"
      >
        <splash-tutorial
          class="h-full w-full px-4 py-6 transition-opacity duration-300"
        />
      </div>

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

// Set --vh on mount and resize
onMounted(() => {
  if (typeof window !== 'undefined') {
    setCustomVh()
    window.addEventListener('resize', setCustomVh)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', setCustomVh)
})

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: 'favicon.ico' }],
})
</script>

<style scoped>
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

.full-page {
  width: 100vw;
  height: 100vh;
  will-change: transform, opacity;
  transform: translateZ(0);
}

html,
body,
#__nuxt {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-in-right-enter-from,
.slide-in-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.slide-in-right-enter-active,
.slide-in-right-leave-active {
  transition:
    transform 0.4s ease-in-out,
    opacity 0.3s ease-in-out;
}
.slide-in-right-enter-to,
.slide-in-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>
