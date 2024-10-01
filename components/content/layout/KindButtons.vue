<template>
  <div
    class="kind-buttons fixed bottom-4 right-4 flex flex-col items-end p-4 z-50"
    style="max-height: auto; max-width: auto"
  >
    <!-- Fullscreen / Two-column Toggle -->
    <button
      v-if="isLargeViewport || isMediumViewport"
      class="bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 p-2 m-2"
      @click="toggleFullScreen"
    >
      {{ fullScreenButtonText }}
    </button>

    <!-- Tutorial / NuxtPage Toggle -->
    <button
      class="bg-accent text-base-200 rounded-lg shadow-md hover:bg-accent-focus transition duration-300 p-2 m-2"
      @click="toggleTutorial"
    >
      Switch to {{ showTutorial ? 'Nuxt Page' : 'Tutorial' }}
    </button>

    <!-- Launch and Instructions Buttons for Small/Medium Viewports -->
    <button
      v-if="showLaunchButton"
      class="bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 p-2 m-2"
      @click="toggleTutorial"
    >
      Launch
    </button>

    <button
      v-if="showInstructionsButton"
      class="bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 p-2 m-2"
      @click="toggleTutorial"
    >
      Instructions
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Button visibility logic
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
  displayStore.isFullScreen ? 'Exit Full Screen' : 'Full Screen',
)

// Tutorial / NuxtPage toggle button
const showTutorial = computed(() => displayStore.showTutorial)
const isLargeViewport = computed(() => displayStore.isLargeViewport)
const isMediumViewport = computed(() => displayStore.viewportSize === 'medium')

// Methods
const toggleFullScreen = () => {
  displayStore.toggleFullScreen()
}

const toggleTutorial = () => {
  displayStore.toggleTutorial()
}
</script>

<style scoped>
.kind-buttons {
  pointer-events: none; /* This ensures that the component doesn't interfere with other elements */
  max-height: auto; /* Ensure it doesn't stretch vertically */
  max-width: auto; /* Ensure it doesn't stretch horizontally */
}

button {
  pointer-events: auto; /* Ensures buttons themselves are clickable */
}
</style>
