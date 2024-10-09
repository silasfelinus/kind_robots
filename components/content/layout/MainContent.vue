<template>
  <div class="relative h-full flex flex-col">
    <!-- Main Content Area -->
    <div class="relative flex-grow h-full flex flex-col">
      
      <!-- Fullscreen Toggle (Top Center) -->
      <fullscreen-toggle
        class="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 z-20 text-accent cursor-pointer"
      />

      <!-- Left Toggle Button (inside content) -->
      <left-toggle
        class="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 z-20 text-accent cursor-pointer"
      />
      
      <!-- Right Sidebar Toggle (inside content) -->
      <right-toggle
        class="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 z-20 text-accent cursor-pointer"
        @click="toggleSidebarAndTutorial"
      />

      <!-- Main Content (Tutorial or Content) -->
      <div v-if="isMobile" class="flex-grow overflow-y-auto">
        <SplashTutorial v-if="showTutorial" class="h-full w-full z-10 rounded-2xl" />
        <NuxtPage v-else class="h-full w-full z-10 rounded-2xl" />
      </div>

      <!-- Fullscreen Mode (Desktop, Content Only) -->
      <div v-else-if="isFullScreen" class="h-full w-full overflow-y-auto rounded-2xl z-10 flex-grow">
        <NuxtPage class="h-full w-full" />
      </div>

      <!-- Flip-card Mode (Desktop with Sidebar for Tutorial) -->
      <div v-else class="relative flex-grow z-10 flex flex-col">
        <div class="flip-card flex-grow">
          <div class="flip-card-inner" :class="{ flipped: showTutorial }">
            <!-- Main Content (NuxtPage) -->
            <div class="flip-card-front rounded-2xl overflow-y-auto h-full w-full">
              <NuxtPage class="h-full w-full" />
            </div>

            <!-- Splash Tutorial -->
            <div class="flip-card-back rounded-2xl overflow-y-auto h-full w-full">
              <SplashTutorial class="h-full w-full" />
            </div>
          </div>
        </div>

        <!-- Right Sidebar (Tutorial) -->
        <aside
          class="bg-secondary fixed top-0 right-0 h-full transition-all duration-500 ease-in-out"
          :style="{ width: sidebarRightWidth }"
        >
          <SplashTutorial class="h-full w-full" />
        </aside>
      </div>

      <!-- Footer Toggle (Bottom Center) -->
      <footer-toggle
        class="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 z-20 text-accent cursor-pointer"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access layout-related data and state from displayStore
const displayStore = useDisplayStore()

// Layout dimensions and state
const isMobile = computed(() => displayStore.isMobileViewport)
const isFullScreen = computed(() => displayStore.isFullScreen)
const showTutorial = computed(() => displayStore.showTutorial)

// Function to toggle both the right sidebar and the tutorial
const toggleSidebarAndTutorial = () => {
  // Toggle the tutorial visibility
  displayStore.showTutorial = !displayStore.showTutorial

  // Toggle the sidebar state
  displayStore.sidebarRightState =
    displayStore.sidebarRightState === 'open' ? 'hidden' : 'open'
}

// Computed function to get the sidebar width from the store
const sidebarRightWidth = computed(() => `${displayStore.sidebarRightVw}vw`)
</script>

<style scoped>
/* Flip-card style */
.flip-card {
  perspective: 1500px;
  width: 100%;
  height: 100%;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 5px;
}

.flip-card-front {
  z-index: 2;
}

.flip-card-back {
  transform: rotateY(180deg);
  z-index: 1;
}

/* Add the flipped class to trigger the flip animation */
.flip-card-inner.flipped {
  transform: rotateY(180deg);
}
</style>
