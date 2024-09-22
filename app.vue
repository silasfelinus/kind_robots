<template>
  <div id="app" class="flex flex-col min-h-screen w-full bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isKindLoaderInitialized" @page-ready="handlePageReady" />

    <!-- Main content is displayed only when the page is ready -->
    <div v-if="isPageReady">
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
      </header>

      <!-- Main Layout -->
      <div class="flex-1 w-full flex">
        <kind-sidebar-simple />
        <main class="flex-grow overflow-y-auto relative">
          <div class="flex justify-center items-center">
            <div
              class="w-full max-w-4xl rounded-2xl bg-base-200 relative flip-card"
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

              <!-- Reverse Button to go back to Tutorial -->
              <button
                v-if="!showTutorial"
                class="absolute bottom-4 left-4 bg-secondary text-base-200 py-2 px-4 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 flex items-center"
                @click="handlePageReturn"
              >
                <div class="triangle-left"></div>
                <span>Back to Tutorial</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      <!-- Footer (Stick to Bottom) -->
      <footer
        v-if="displayStore.footer !== 'hidden'"
        :style="{ height: `${displayStore.footerVh}vh` }"
        class="w-full bg-gray-800 text-accent mt-auto flex-none"
      >
        created by Silas Knight silas@kindrobots.org
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Track whether the KindLoader has been initialized
const isKindLoaderInitialized = ref(false)
const displayStore = useDisplayStore()
const isPageReady = ref(false)

// Control for tutorial visibility and animation direction
const showTutorial = ref(true)

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
  perspective: 1000px;
  width: 100%;
  height: 100%;
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
  border-radius: 12px;
}

/* Back side */
.flip-card-back {
  transform: rotateY(180deg);
}
</style>
