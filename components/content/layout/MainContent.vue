<template>
  <!-- Content of MainContent.vue focuses only on its content -->
  <div class="relative h-full flex flex-col">
    <!-- Left Sidebar Toggle -->
    <div
      class="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-secondary text-white rounded-r-lg cursor-pointer"
      @click="toggleLeftSidebar"
    >
      <span v-if="displayStore.sidebarLeftState === 'open'"> &#8249; </span>
      <span v-if="displayStore.sidebarLeftState === 'compact'"> &#8810; </span>
      <span v-if="displayStore.sidebarLeftState === 'hidden'"> &#8250; </span>
    </div>

    <!-- Right Sidebar Toggle -->
    <div
      class="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-secondary text-white rounded-l-lg cursor-pointer"
      @click="toggleRightSidebar"
    >
      <span v-if="displayStore.sidebarRightState === 'open'"> &#8250; </span>
      <span v-if="displayStore.sidebarRightState === 'hidden'"> &#8249; </span>
    </div>

    <!-- Mobile View (no flip card) -->
    <div v-if="isMobile" class="flex-grow overflow-y-auto">
      <SplashTutorial
        v-if="showTutorial"
        class="h-full w-full z-10 rounded-2xl"
      />
      <NuxtPage v-else class="h-full w-full z-10 rounded-2xl" />
    </div>

    <!-- Fullscreen mode (Desktop) -->
    <div
      v-else-if="isFullScreen"
      class="h-full w-full overflow-y-auto rounded-2xl z-10 flex-grow"
    >
      <NuxtPage class="h-full w-full" />
    </div>

    <!-- Flip-card mode (Desktop) -->
    <div
      v-else
      class="flip-card-inner h-full z-10 flex-grow"
      :class="{ 'is-flipped': !showTutorial }"
    >
      <div class="flip-card-front rounded-2xl h-full w-full">
        <SplashTutorial class="h-full w-full" />
      </div>
      <div class="flip-card-back rounded-2xl overflow-y-auto h-full w-full">
        <NuxtPage class="h-full w-full" />
      </div>
    </div>

    <!-- Small Tutorial Toggle Button on Mobile -->
    <div
      v-if="!displayStore.isFullScreen && isMobile"
      class="fixed bottom-4 right-4 z-50"
    >
      <button
        class="p-2 bg-primary text-white rounded-full shadow-lg hover:bg-secondary transition"
        @click="toggleTutorial"
      >
        <Icon name="mdi-help-circle-outline" class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Layout dimensions and state
const isMobile = computed(() => displayStore.isMobileViewport)
const isFullScreen = computed(() => displayStore.isFullScreen)
const showTutorial = computed(() => displayStore.showTutorial)

// Function to toggle the left sidebar
const toggleLeftSidebar = () => {
  if (displayStore.sidebarLeftState === 'open') {
    displayStore.sidebarLeftState = 'compact'
  } else if (displayStore.sidebarLeftState === 'compact') {
    displayStore.sidebarLeftState = 'hidden'
  } else {
    displayStore.sidebarLeftState = 'open'
  }
}

// Function to toggle the right sidebar
const toggleRightSidebar = () => {
  displayStore.sidebarRightState =
    displayStore.sidebarRightState === 'open' ? 'hidden' : 'open'
}

// Function to toggle the tutorial
const toggleTutorial = () => {
  displayStore.showTutorial = !displayStore.showTutorial
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

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
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
</style>
