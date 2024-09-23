<template>
  <div id="app" class="flex flex-col min-h-screen w-full bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isPageReady" @page-ready="handlePageReady" />

    <!-- Header -->
    <header
      class="w-full bg-base-200 flex justify-between items-center transition-all duration-500 ease-in-out sticky top-0 z-30"
      :style="{ height: `${displayStore.headerVh}vh` }"
    >
      <!-- Sidebar Toggle -->
      <div class="absolute top-4 left-4 p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl" />
      </div>

      <nav-links />

      <!-- Tutorial and Back Buttons -->
      <button
        v-if="showTutorial"
        class="fixed bottom-4 right-4 bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 flex items-center z-50 px-4 py-2"
        @click="toggleTutorial"
      >
        Launch
      </button>

      <button
        v-else
        class="fixed bottom-4 right-4 bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 flex items-center z-50 px-4 py-2"
        @click="toggleTutorial"
      >
        <span>Instructions</span>
      </button>
    </header>

    <!-- Main Layout with strong margin and padding -->
    <div class="flex-1 w-full flex">
      <kind-sidebar-simple />
      <main class="flex-grow overflow-y-auto relative">
        <div class="flex justify-center items-center">
          <div
            class="w-full max-w-4xl rounded-2xl bg-base-200 relative flip-card shadow-lg p-4 lg:p-8"
          >
            <div
              class="flip-card-inner"
              :class="{ 'is-flipped': !showTutorial }"
            >
              <!-- Conditional rendering of tutorial or page content -->
              <div v-if="showTutorial" key="tutorial" class="flip-card-front">
                <SplashTutorial @page-transition="toggleTutorial" />
              </div>
              <div v-else key="content" class="flip-card-back">
                <NuxtPage />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize stores and states
const displayStore = useDisplayStore()
const showTutorial = ref(true)
const router = useRouter()

// Combine isPageReady and isKindLoaderInitialized logic into one
const isPageReady = ref(false)

// Handle when page is ready
const handlePageReady = (ready: boolean) => {
  isPageReady.value = ready
}

// Toggle between tutorial and main content
const toggleTutorial = () => {
  showTutorial.value = !showTutorial.value
}

// Auto-reset tutorial on route changes if needed
router.beforeEach((to, from, next) => {
  showTutorial.value = true
  next()
})

onMounted(() => {
  displayStore.initializeViewportWatcher()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>

<style scoped>
/* Flip card container */
.flip-card-inner {
  perspective: 1000px;
  transform-style: preserve-3d;
}

/* Front and back face of the card */
.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

/* Back side */
.flip-card-back {
  transform: rotateY(180deg);
}

/* Flipped state */
.rotate-y-180 {
  transform: rotateY(180deg);
}
</style>
