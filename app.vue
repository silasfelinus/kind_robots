<template>
  <div id="app" class="flex flex-col min-h-screen w-full bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isKindLoaderInitialized" @page-ready="handlePageReady" />

    

      <!-- Header -->
      <header
        class="w-full bg-base-200 flex justify-between items-center transition-all duration-500 ease-in-out sticky top-0 z-30"
        :style="{ height: `${displayStore.headerVh}vh` }"
      >
        <!-- Sidebar Toggle -->
        <div class="absolute top-4 left-4 p-1 z-40 text-white">
          <sidebar-toggle
            class="text-4xl"
            @click="displayStore.toggleSidebar('sidebarLeft')"
          />
        </div>

        <nav-links />

        <!-- Next Button -->
        <button
          v-if="showTutorial"
          class="absolute bottom-1 right-4 bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 flex items-center z-50"
          @click="handlePageTransition"
        >
          Launch
        </button>

        <!-- Back Button -->
        <button
          v-if="!showTutorial"
          class="absolute bottom-1 right-4 bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 flex items-center z-50"
          @click="handlePageReturn"
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
                  <SplashTutorial @page-transition="handlePageTransition" />
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

// Track whether the KindLoader has been initialized
const isKindLoaderInitialized = ref(false)
const displayStore = useDisplayStore()
const isPageReady = ref(false)

// Control for tutorial visibility and animation direction
const showTutorial = ref(true)
const router = useRouter()

// When the page is ready, load content
const handlePageReady = (ready) => {
  isPageReady.value = ready
  if (ready) {
    isKindLoaderInitialized.value = true
  }
}

// Transition from the tutorial to the main content (NuxtPage)
const handlePageTransition = () => {
  showTutorial.value = false
}

// Transition back from the main content to the tutorial
const handlePageReturn = () => {
  showTutorial.value = true
}

// Auto-reset tutorial on route changes
router.beforeEach((to, from, next) => {
  // Always show the tutorial when navigating to a new page
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
.flip-card {
  width: 100%;
  height: 100%;
  perspective: 1000px; /* Custom CSS for perspective */
}

/* Inner container holding both sides */
.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

/* Flipped state */
.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
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

</style>
