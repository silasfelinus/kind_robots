<template>
  <div
    class="kind-buttons fixed bottom-4 right-4 flex flex-col items-end p-4 z-50"
    style="max-height: auto; max-width: auto"
  >
    <!-- Fullscreen / Two-column Toggle -->
    <button
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const fullScreenButtonText = computed(() =>
  displayStore.isFullScreen ? 'Exit Full Screen' : 'Full Screen',
)

// Tutorial / NuxtPage toggle button
const showTutorial = computed(() => displayStore.showTutorial)
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
