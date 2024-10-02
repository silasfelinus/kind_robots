<template>
  <div class="kind-buttons">
    <!-- Fullscreen / Two-column Toggle (Top-right corner) -->
    <div
      class="fixed hidden lg:flex top-4 right-4 items-center space-x-2 bg-accent text-base-200 rounded-lg shadow-md p-2 transition duration-300"
    >
      <!-- Two-column layout button -->
      <button
        class="icon-button"
        :class="{
          'bg-info text-base-200': isFullScreen,
          'bg-gray-400 text-gray-700': !isFullScreen,
        }"
        @click="toggleFullScreen"
      >
        <Icon name="mdi-view-column" class="w-6 h-6" />
      </button>
      <!-- One-column layout button -->
      <button
        class="icon-button"
        :class="{
          'bg-info text-base-200': !isFullScreen,
          'bg-gray-400 text-gray-700': isFullScreen,
        }"
        @click="toggleFullScreen"
      >
        <Icon name="mdi-monitor" class="w-6 h-6" />
      </button>
    </div>

    <!-- Tutorial / NuxtPage Toggle (Bottom-center of the screen) -->
    <button
      v-if="!isFullScreen"
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

const isFullScreen = computed(() => displayStore.isFullScreen)

const toggleFullScreen = () => {
  displayStore.toggleFullScreen()
}

const showTutorial = computed(() => displayStore.showTutorial)

const toggleTutorial = () => {
  displayStore.toggleTutorial()
}
</script>

<style scoped>
.kind-buttons {
  pointer-events: auto;
}

.icon-button {
  cursor: pointer;
  padding: 8px;
  border-radius: 9999px;
  transition: background-color 0.3s;
}

.icon-button:hover {
  filter: brightness(1.1);
}
</style>
