<template>
  <div id="app" class="flex flex-col min-h-screen w-full bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isPageReady" @page-ready="handlePageReady" />

    <!-- Sidebar Toggle (Left) -->
    <div class="absolute top-4 left-4 p-1 z-40 text-white">
      <sidebar-toggle class="text-4xl" @click="toggleSidebar('sidebarLeft')" />
    </div>

    <!-- Sidebar Toggle (Right) -->
    <div class="absolute bottom-4 right-4 p-1 z-40 text-white">
      <sidebar-right-toggle class="text-4xl" @click="toggleSidebar('sidebarRight')" />
    </div>

    <!-- Header -->
    <header
      class="w-full bg-base-200 flex justify-between items-center transition-all duration-500 ease-in-out sticky top-0 z-30"
      :style="{ height: `${displayStore.headerVh}vh` }"
    >
      <nav-links />
      <button
        v-if="showTutorial"
        class="fixed top-4 right-4 bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 flex items-center z-50 px-4 py-2"
        @click="toggleTutorial"
      >
        Launch
      </button>
      <button
        v-else
        class="fixed top-4 right-4 bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 flex items-center z-50 px-4 py-2"
        @click="toggleTutorial"
      >
        <span>Instructions</span>
      </button>
    </header>

    <!-- Main Layout with flexible layout for sidebars and footer -->
    <div class="flex-1 w-full flex relative">
      <!-- Left Sidebar -->
      <div
        :style="{ width: `${displayStore.sidebarLeftVw}vw` }"
        class="bg-secondary h-full transition-all duration-500"
      >
        <kind-sidebar-simple />
      </div>

      <!-- Main content -->
      <main
        class="flex-grow overflow-hidden relative"
        :style="{
          height: `${displayStore.mainVh}vh`,
          width: `${displayStore.mainVw}vw`
        }"
      >
        <div class="flex justify-center items-center w-full h-full overflow-hidden">
          <div
            class="w-full max-w-5xl rounded-2xl bg-base-200 relative flip-card shadow-lg overflow-hidden"
          :style="{ maxHeight: `${displayStore.mainVh}vh` }"

          >
            <div class="flip-card-inner h-full overflow-hidden" :class="{ 'is-flipped': !showTutorial }">
              <!-- Front side: Splash Tutorial -->
              <div class="flip-card-front h-full overflow-y-auto">
                <SplashTutorial @page-transition="handlePageTransition" />
              </div>

              <!-- Back side: NuxtPage content -->
              <div class="flip-card-back h-full overflow-y-auto">
                <NuxtPage />
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right Sidebar -->
      <div
        :style="{ width: `${displayStore.sidebarRightVw}vw` }"
        class="bg-secondary h-full transition-all duration-500"
      >
        <kind-sidebar-right />
      </div>
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
const isPageReady = ref(false)
const router = useRouter()

// Handle when page is ready
const handlePageReady = (ready: boolean) => {
  isPageReady.value = ready
}

// Toggle between tutorial and main content
const toggleTutorial = () => {
  showTutorial.value = !showTutorial.value
}

// Toggle left or right sidebar state
const toggleSidebar = (side: 'sidebarLeft' | 'sidebarRight') => {
  displayStore.toggleSidebar(side)
}

const toggleFooter = () => {
  displayStore.toggleFooter()
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
  overflow-y: auto; /* Enable scrolling for content overflow */
}

.flip-card-front {
  z-index: 2; /* Ensures the front side is on top */
}

.flip-card-back {
  transform: rotateY(180deg); /* Ensures the back side starts flipped */
}
</style>
