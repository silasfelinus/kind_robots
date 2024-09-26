<template>
  <div id="app" class="flex flex-col" :style="{ height: `${windowHeight}px` }">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isPageReady" @page-ready="handlePageReady" />

    <!-- Header -->
    <header
      class="sticky top-0 z-30 w-full bg-base-200"
      :style="{ height: `${headerHeight}px`, top: `${displayStore.headerOffset}px` }"
    >
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
      <!-- Left Sidebar -->
      <kind-sidebar-simple
        class="h-full"
        :style="{ width: `${sidebarLeftWidth}vw`, left: `${displayStore.sidebarLeftOffset}px` }"
      />

      <!-- Main Content Area -->
      <main
        class="relative flex-grow overflow-y-auto flex justify-center items-center"
        :style="{ height: `${mainHeight}px` }"
      >
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
      <aside class="h-full" :style="{ width: `${sidebarRightWidth}vw`, right: `${displayStore.sidebarRightOffset}px` }" />
    </div>

    <!-- Footer -->
    <footer class="w-full bg-base-200 flex items-center justify-center" :style="{ height: `${footerHeight}px` }">
      created by Silas Knight silas@kindrobots.org
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize stores and states
const displayStore = useDisplayStore()
const showTutorial = ref(true)
const router = useRouter()

// Dynamically calculated window height and other variables
const windowHeight = ref(window.innerHeight)
const headerHeight = ref(0)
const footerHeight = ref(0)
const mainHeight = ref(0)
const sidebarLeftWidth = ref(displayStore.sidebarLeftWidth)
const sidebarRightWidth = ref(displayStore.sidebarRightWidth)

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

// Update heights and widths dynamically
const updateLayout = () => {
  const totalHeight = window.innerHeight
  headerHeight.value = (displayStore.headerVh / 100) * totalHeight
  footerHeight.value = (displayStore.footerVh / 100) * totalHeight
  mainHeight.value = totalHeight - headerHeight.value - footerHeight.value
  windowHeight.value = totalHeight
}

onMounted(() => {
  displayStore.initializeViewportWatcher()
  updateLayout()

  // Recalculate layout on window resize
  window.addEventListener('resize', updateLayout)
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
  window.removeEventListener('resize', updateLayout)
})

// Watch for changes in displayStore and update layout accordingly
watch(
  () => displayStore,
  () => {
    updateLayout()
  },
  { deep: true }
)
</script>

<style scoped>
.flip-card {
  width: 100%;
  height: 100%;
  perspective: 1000px; /* Creates depth for the flip effect */
}

.flip-card-inner {
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg); /* Flips the entire card horizontally */
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden; /* Hides the backside during rotation */
  border-radius: 12px;
}

.flip-card-front {
  z-index: 2; /* Ensures the front side is on top */
}

.flip-card-back {
  transform: rotateY(180deg); /* Ensures the back side starts flipped */
}
</style>
