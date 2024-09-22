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

        <!-- Navigation Links -->
        <div
          class="nav-links flex items-center justify-center gap-4 md:gap-6 lg:gap-8 p-2 md:p-4"
        >
          <a
            v-for="link in navLinks"
            :key="link.text"
            :href="link.url"
            class="text-base sm:text-sm md:text-lg font-medium text-base-content hover:text-secondary transition-all"
          >
            {{ link.text }}
          </a>
        </div>

        <!-- Page Info Toggle -->
        <div class="absolute top-4 right-4 p-1 z-40">
          <PageInfo />
        </div>
      </header>

      <!-- Main Layout -->
      <div class="flex-1 w-full flex">
        <kind-sidebar-simple />
        <main class="flex-grow overflow-y-auto relative">
          <div class="flex justify-center items-center">
            <div class="w-full max-w-4xl rounded-2xl bg-base-200 relative">
              <!-- Transition wrapper for flip animation -->
              <transition :name="animationDirection">
                <div v-if="showTutorial" key="tutorial" class="flip-container">
                  <SplashTutorial @page-transition="handlePageTransition" />
                </div>
                <div v-else key="content" class="flip-container">
                  <NuxtPage />
                </div>
              </transition>

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

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import SplashTutorial from '@/components/SplashTutorial.vue'

// Track whether the KindLoader has been initialized
const isKindLoaderInitialized = ref(false)
const displayStore = useDisplayStore()
const isPageReady = ref(false)

// Control for tutorial visibility and animation direction
const showTutorial = ref(true)
const animationDirection = ref('flip-forward')

// When the page is ready, load content
const handlePageReady = (ready) => {
  isPageReady.value = ready
  if (ready) {
    isKindLoaderInitialized.value = true
  }
}

// Transition from the tutorial to the main content (NuxtPage)
const handlePageTransition = () => {
  animationDirection.value = 'flip-forward'
  showTutorial.value = false
}

// Transition back from the main content to the tutorial
const handlePageReturn = () => {
  animationDirection.value = 'flip-backward'
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
/* Flip animation */
.flip-container {
  perspective: 1000px;
}

.flip-forward-enter-active,
.flip-forward-leave-active,
.flip-backward-enter-active,
.flip-backward-leave-active {
  transition: transform 0.6s ease;
  backface-visibility: hidden;
}

.flip-forward-enter,
.flip-backward-leave-to {
  transform: rotateY(-180deg);
}

.flip-backward-enter,
.flip-forward-leave-to {
  transform: rotateY(180deg);
}

main {
  overflow-y: auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Additional adjustments for small screen navigation links */
.nav-links a {
  white-space: nowrap; /* Prevent links from overflowing */
}

/* Optional: Ensure links wrap if they exceed available width */
.nav-links {
  flex-wrap: wrap;
}
</style>
