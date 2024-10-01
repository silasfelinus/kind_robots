<template>
  <div class="flex items-center space-x-4">
    <button
      class="bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 p-2"
      @click="toggleFullScreen"
    >
      {{ fullScreenButtonText }}
    </button>
    <!-- Add more buttons here if needed -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Fullscreen button logic
const fullScreenButtonText = computed(() =>
  displayStore.isFullScreen ? 'Exit Full Screen' : 'Full Screen'
)

// Fullscreen toggle
const toggleFullScreen = () => {
  displayStore.toggleFullScreen()
}
</script>

<style scoped>
button {
  z-index: 50;
  transition: background-color 0.3s ease;
}

button:hover {
  cursor: pointer;
}
</style>
