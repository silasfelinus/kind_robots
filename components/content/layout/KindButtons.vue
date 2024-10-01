<template>
  <div class="kind-buttons fixed bottom-4 right-4 flex flex-col space-y-2 z-50">
    <!-- Fullscreen / Two-column Toggle -->
    <button
      class="bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 p-2"
      @click="toggleFullScreen"
    >
      {{ fullScreenButtonText }}
    </button>

    <!-- Tutorial / NuxtPage Toggle -->
    <button
      class="bg-accent text-base-200 rounded-lg shadow-md hover:bg-accent-focus transition duration-300 p-2"
      @click="toggleTutorial"
    >
      Show {{ showTutorial ? 'Nuxt Page' : 'Tutorial' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Fullscreen / Two-column toggle button text
const fullScreenButtonText = computed(() =>
  displayStore.isFullScreen ? 'Show Two Columns' : 'Show Full Screen'
)

// Access fullscreen and tutorial state from displayStore
const isFullScreen = computed(() => displayStore.isFullScreen)
const showTutorial = computed(() => displayStore.showTutorial)

// Toggle fullscreen mode
const toggleFullScreen = () => {
  displayStore.toggleFullScreen()
}

// Toggle tutorial / NuxtPage mode
const toggleTutorial = () => {
  displayStore.toggleTutorial()
}
</script>

<style scoped>
.kind-buttons {
  pointer-events: auto; /* Ensure buttons are clickable */
}

button:hover {
  cursor: pointer;
}
</style>
