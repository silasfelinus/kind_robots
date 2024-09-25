<template>
  <div id="app" class="flex flex-col h-screen w-screen bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isPageReady" @page-ready="handlePageReady" />

    <!-- Header -->
    <header class="sticky top-0 z-30 w-full bg-base-200" :class="`h-[${displayStore.headerVh}vh]`">
      <!-- Sidebar Toggle -->
      <div class="absolute top-2 left-4 p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl" />
      </div>

      <nav-links />

      <!-- Tutorial and Back Buttons -->
      <button
        v-if="showTutorial"
        class="fixed top-1 right-4 bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-50 p-1"
        @click="toggleTutorial"
      >
        Launch
      </button>

      <button
        v-else
        class="fixed top-1 right-4 bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 p-1"
        @click="toggleTutorial"
      >
        <span>Instructions</span>
      </button>
    </header>

    <!-- Main Layout Wrapper -->
    <div class="flex flex-grow relative overflow-hidden">
      <!-- Left Sidebar (below the header) -->
      <kind-sidebar-simple class="h-full" :class="`w-[${displayStore.sidebarLeftWidth}vw]`" />

      <!-- Main Content Area -->
      <main class="relative flex-grow overflow-y-auto flex justify-center items-center">
        <div class="w-full max-w-5xl rounded-2xl bg-base-100 relative flip-card shadow-lg overflow-y-auto">
          <div class="flip-card-inner" :class="{ 'is-flipped': !showTutorial }">

            <!-- Front side: Splash Tutorial -->
            <div class="flip-card-front">
              <SplashTutorial />
            </div>

            <!-- Back side: NuxtPage content -->
            <div class="flip-card-back">
              <NuxtPage />
            </div>
          </div>
        </div>
      </main>

      <!-- Right Sidebar -->
      <kind-sidebar-right class="h-full" :class="`w-[${displayStore.sidebarRightWidth}vw]`" />
    </div>

    <!-- Footer -->
    <footer class="w-full bg-base-200 flex items-center justify-center" :class="`h-[${displayStore.footerVh}vh]`">
      created by Silas Knight silas@kindrobots.org
    </footer>

    <!-- Ticks Overlay -->
    <div class="ticks-overlay pointer-events-none absolute inset-0">
      <!-- Vertical Ticks -->
      <div class="ticks-vw absolute inset-y-0 left-0 flex flex-col justify-between">
        <span v-for="tick in vwTicks" :key="tick" class="text-xs text-white" :style="{ top: tick + 'vh' }">
          {{ tick }}vw
        </span>
      </div>
      <!-- Horizontal Ticks -->
      <div class="ticks-vh absolute inset-x-0 top-0 flex justify-between">
        <span v-for="tick in vhTicks" :key="tick" class="text-xs text-white" :style="{ left: tick + 'vw' }">
          {{ tick }}vh
        </span>
      </div>
    </div>

    <!-- Store Debug Overlay -->
    <store-debug class="absolute inset-0 pointer-events-none" />
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

// Ticks for overlay
const vwTicks = ref([])
const vhTicks = ref([])

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

// Function to generate ticks for every 20vw and 20vh
const generateTicks = () => {
  vwTicks.value = Array.from({ length: 5 }, (_, i) => (i + 1) * 20) // 20vw, 40vw, 60vw, etc.
  vhTicks.value = Array.from({ length: 5 }, (_, i) => (i + 1) * 20) // 20vh, 40vh, 60vh, etc.
}

// Ensure the viewport watcher and key press event are set up when the component mounts
onMounted(() => {
  displayStore.initializeViewportWatcher()
  generateTicks()
})

// Clean up the event listener when the component is destroyed
onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>

<style scoped>
/* Ticks for visual feedback at each 20vw and 20vh */
.ticks-overlay {
  z-index: 1000;
}

.ticks-vw span,
.ticks-vh span {
  position: absolute;
  color: rgba(255, 255, 255, 0.8);
  background-color: rgba(0, 0, 0, 0.5);
  padding: 0.2rem 0.5rem;
  border-radius: 0.2rem;
  font-size: 0.75rem;
  pointer-events: none; /* Make sure they don't block clicks */
}
</style>
