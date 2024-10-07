<template>
  <div class="relative h-full flex flex-col">
    <!-- Right Sidebar Toggle (Mobile & Desktop) -->
    <div
      class="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-secondary text-white rounded-l-lg cursor-pointer"
      @click="toggleSidebarAndTutorial"
    >
      <!-- Arrow icon for desktop -->
      <span v-if="!isMobile && displayStore.sidebarRightState === 'open'">
        &#8250;
      </span>
      <span v-if="!isMobile && displayStore.sidebarRightState === 'hidden'">
        &#8249;
      </span>
      <!-- Book icon for mobile (represents tutorial toggle) -->
      <span v-if="isMobile"> &#x1F4D6; </span>
    </div>

    <!-- Mobile View (Tutorial or Content) -->
    <div v-if="isMobile" class="flex-grow overflow-y-auto">
      <SplashTutorial
        v-if="showTutorial"
        class="h-full w-full z-10 rounded-2xl"
      />
      <NuxtPage v-else class="h-full w-full z-10 rounded-2xl" />
    </div>

    <!-- Fullscreen Mode (Desktop, Content Only) -->
    <div
      v-else-if="isFullScreen"
      class="h-full w-full overflow-y-auto rounded-2xl z-10 flex-grow"
    >
      <NuxtPage class="h-full w-full" />
    </div>

    <!-- Flip-card Mode (Desktop with Sidebar for Tutorial) -->
    <div v-else class="relative flex-grow z-10">
      <!-- Main Content (NuxtPage) -->
      <div class="flip-card-back rounded-2xl overflow-y-auto h-full w-full">
        <NuxtPage class="h-full w-full" />
      </div>

      <!-- Right Sidebar (Tutorial) -->
      <aside
        class="bg-secondary fixed top-0 right-0 h-full transition-all duration-500 ease-in-out"
        :class="{
          'w-0': displayStore.sidebarRightState === 'hidden',
          'w-80': displayStore.sidebarRightState === 'open',
        }"
      >
        <SplashTutorial class="h-full w-full" />
      </aside>
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

/* Sidebar transition and width handling */
aside {
  width: 80px; /* Default closed width */
}

aside.w-0 {
  width: 0;
}

aside.w-80 {
  width: 20rem; /* Opened sidebar width */
}
</style>
