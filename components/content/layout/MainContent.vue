<template>
  <div>
    <!-- For small viewports, display only one section -->
    <div v-if="isMobileViewport" class="single-column">
      <div v-if="showTutorial" class="instructions">
        <SplashTutorial />
      </div>
      <div v-else class="launch">
        <NuxtPage />
      </div>
    </div>

    <!-- For medium viewports, display centered content -->
    <div v-if="isMediumViewport" class="center-content">
      <div v-if="showTutorial" class="tutorial-section">
        <SplashTutorial />
      </div>
      <div v-else class="launch-section">
        <NuxtPage />
      </div>
    </div>

    <!-- For large viewports, display two columns -->
    <div v-if="isLargeViewport && !isFullScreen" class="two-column">
      <div class="left-column">
        <SplashTutorial />
      </div>
      <div class="right-column overflow-y-auto">
        <NuxtPage />
      </div>
    </div>

    <!-- Fullscreen view -->
    <div v-if="isLargeViewport && isFullScreen" class="fullscreen-content">
      <div v-if="showTutorial">
        <SplashTutorial />
      </div>
      <div v-else>
        <NuxtPage />
      </div>
    </div>

    <!-- Full-Screen Toggle Button for Large/Medium Viewports -->
    <button
      v-if="isLargeViewport || isMediumViewport"
      class="full-screen-toggle bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 p-2 fixed bottom-4 right-4"
      @click="toggleFullScreen"
    >
      {{ fullScreenButtonText }}
    </button>

    <!-- Launch and Instructions Buttons for Small/Medium Viewports -->
    <button
      v-if="showLaunchButton"
      class="bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 p-2 fixed bottom-16 right-4"
      @click="toggleTutorial"
    >
      Launch
    </button>

    <button
      v-if="showInstructionsButton"
      class="bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 p-2 fixed bottom-16 right-4"
      @click="toggleTutorial"
    >
      Instructions
    </button>

    <!-- Button to toggle between SplashTutorial and NuxtPage in fullscreen mode -->
    <button
      v-if="isFullScreen"
      class="bg-accent text-base-200 rounded-lg shadow-md hover:bg-accent-focus transition duration-300 p-2 fixed bottom-16 right-4"
      @click="toggleTutorial"
    >
      Switch to {{ showTutorial ? 'Nuxt Page' : 'Tutorial' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Viewport conditions
const isMobileViewport = computed(() => displayStore.isMobileViewport)
const isMediumViewport = computed(() => displayStore.viewportSize === 'medium')
const isLargeViewport = computed(() => displayStore.isLargeViewport)
const showTutorial = computed(() => displayStore.showTutorial)
const isFullScreen = computed(() => displayStore.isFullScreen)

// Button visibility logic
const showLaunchButton = computed(() =>
  !displayStore.showTutorial && ['small', 'medium'].includes(displayStore.viewportSize),
)

const showInstructionsButton = computed(() =>
  displayStore.showTutorial && ['small', 'medium'].includes(displayStore.viewportSize),
)

// Button text for fullscreen toggle
const fullScreenButtonText = computed(() =>
  isFullScreen.value ? 'Exit Full Screen' : 'Full Screen',
)

// Methods to toggle full screen and tutorial
const toggleFullScreen = () => {
  displayStore.toggleFullScreen()
}

const toggleTutorial = () => {
  displayStore.toggleTutorial()
}
</script>

<style scoped>
/* Layout Styles */
.single-column,
.center-content,
.two-column,
.fullscreen-content {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.left-column,
.right-column {
  padding: 1rem;
}

.right-column {
  overflow-y: auto; /* Allow scrolling only within the NuxtPage */
}

/* Button Styles */
.full-screen-toggle,
button {
  position: fixed;
  z-index: 40;
  bottom: 1rem;
  right: 1rem;
  transition: background-color 0.3s ease;
}

button:hover {
  cursor: pointer;
}
</style>
