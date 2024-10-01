<template>
  <div class="flex items-center space-x-2">
    <!-- Fullscreen / Exit Fullscreen Button -->
    <button
      class="bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition-colors duration-300 p-2"
      @click="toggleFullScreen"
    >
      {{ isFullScreen ? 'Exit Full Screen' : 'Full Screen' }}
    </button>

    <!-- Tutorial / NuxtPage Toggle Button -->
    <button
      class="bg-accent text-base-200 rounded-lg shadow-md hover:bg-accent-focus transition-colors duration-300 p-2"
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

// Access fullscreen and tutorial state from displayStore
const isFullScreen = computed(() => displayStore.isFullScreen)
const showTutorial = computed(() => displayStore.showTutorial)

// Functions to toggle fullscreen and tutorial modes
const toggleFullScreen = () => {
  displayStore.toggleFullScreen()
}

const toggleTutorial = () => {
  displayStore.toggleTutorial()
}
</script>
