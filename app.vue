<template>
  <div id="app" class="h-screen w-screen bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isPageReady" @page-ready="handlePageReady" />

    <!-- Header -->
    <header class="sticky top-0 z-30 w-full bg-base-200" :class="`h-[${displayStore.headerVh}vh]`">
      <!-- Sidebar Toggle -->
      <div class="absolute top-4 left-4 p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl" />
      </div>

      <nav-links />

      <!-- Tutorial and Back Buttons -->
      <button
        v-if="showTutorial"
        class="fixed top-4 right-4 bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-50 px-4 py-2"
        @click="toggleTutorial"
      >
        Launch
      </button>

      <button
        v-else
        class="fixed top-4 right-4 bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 px-4 py-2"
        @click="toggleTutorial"
      >
        <span>Instructions</span>
      </button>
    </header>

    <!-- Main Layout Wrapper -->
    <div class="flex relative w-full" :class="`h-[calc(100vh - ${displayStore.headerVh}vh - ${displayStore.footerVh}vh)]`">
      <!-- Left Sidebar (below the header) -->
      <kind-sidebar-simple class="h-full" :class="`w-[${displayStore.sidebarLeftWidth}vw]`" />

      <!-- Main Content Area -->
      <main class="relative overflow-y-auto w-full h-full p-1 flex justify-center items-center">
        <div class="w-full max-w-5xl rounded-2xl bg-base-100 relative flip-card shadow-lg overflow-hidden">
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
    <footer class="w-full" :class="`h-[${displayStore.footerVh}vh]`" />
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
