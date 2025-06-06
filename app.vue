<!-- /app.vue -->
<template>
  <div
    class="main-layout bg-base-200 h-screen w-screen relative overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
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
      class="fixed z-40 border-6 border-secondary transition-all duration-500 ease-in-out"
      :style="displayStore.headerStyle"
    >
      <kind-header class="h-full w-full rounded-xl" />
    </header>

    <!-- Main Content -->
    <main
      class="absolute inset-0 z-30 box-border overflow-hidden"
      :style="displayStore.mainContentStyle"
    >
      <main-content class="w-full h-full" />
    </main>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { usesmartIconStore } from '@/stores/smartIconStore'

const smartIconStore = usesmartIconStore()
const showSwarm = computed(() => smartIconStore.showSwarm)

const displayStore = useDisplayStore()
const router = useRouter()
const isNavigating = ref(false)

router.beforeEach(() => {
  isNavigating.value = true
})
router.afterEach(() => {
  setTimeout(() => {
    isNavigating.value = false
  }, 400)
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
</style>
