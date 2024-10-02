<template>
  <div class="kind-buttons">
    <!-- Fullscreen / Two-column Toggle (Top-right corner) -->
    <button
      class="fixed hidden lg:block top-4 right-4 bg-accent text-base-200 rounded-lg shadow-md hover:bg-primary transition duration-300 p-1"
      @click="toggleFullScreen"
    >
      {{ fullScreenButtonText }}
    </button>

    <!-- Tutorial / NuxtPage Toggle (Bottom-center of the screen) -->
    <button
      v-if="!displayStore.isFullScreen"
      class="fixed bottom-4 right-4 transform -translate-x-1/2 bg-primary text-base-200 rounded-lg shadow-md hover:bg-accent transition duration-300 z-50 p-1"
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

const fullScreenButtonText = computed(() =>
  displayStore.isFullScreen ? '1 Column' : '2 Columns',
)

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
  pointer-events: auto;
}

button:hover {
  cursor: pointer;
}
</style>
