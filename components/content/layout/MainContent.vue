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

    <!-- For large viewports, display two columns -->
    <div v-if="isLargeViewport" class="two-column">
      <div class="left-column">
        <SplashTutorial />
      </div>
      <div class="right-column">
        <NuxtPage />
      </div>
      <div v-if="isFullScreen" class="full-screen-toggle">
        <button @click="toggleFullScreen">{{ fullScreenButtonText }}</button>
      </div>
    </div>
  </div>

  <!-- Full-Screen Toggle Button for Large Viewports -->
  <button
    v-if="isLargeViewport"
    class="bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 z-40 p-1 ml-4"
    @click="toggleFullScreen"
  >
    {{ isFullScreen ? 'Two Columns' : 'Full Screen' }}
  </button>

  <!-- Launch and Instructions Button (for Small/Medium Viewports) -->
  <button
    v-if="showLaunchButton"
    class="bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-40 p-1 ml-4 mr-4"
    @click="toggleTutorial"
  >
    Launch
  </button>

  <button
    v-if="showInstructionsButton"
    class="bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-40 p-1 ml-4"
    @click="toggleTutorial"
  >
    Instructions
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const isMobileViewport = computed(() => displayStore.isMobileViewport)
const isLargeViewport = computed(() => displayStore.isLargeViewport)
const showTutorial = computed(() => displayStore.showTutorial)
const isFullScreen = computed(() => displayStore.isFullScreen)

const showLaunchButton = computed(
  () =>
    !displayStore.showTutorial &&
    ['small', 'medium'].includes(displayStore.viewportSize),
)

const showInstructionsButton = computed(
  () =>
    displayStore.showTutorial &&
    ['small', 'medium'].includes(displayStore.viewportSize),
)

const fullScreenButtonText = computed(() =>
  isFullScreen.value ? 'Exit Full Screen' : 'Full Screen',
)

const toggleFullScreen = () => {
  displayStore.toggleFullScreen()
}

const toggleTutorial = () => {
  displayStore.toggleTutorial()
}
</script>

<style scoped>
.single-column {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
}

.left-column,
.right-column {
  padding: 1rem;
}

.full-screen-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
