<template>
  <div class="kind-buttons flex flex-col space-y-2 z-50">
    <!-- Fullscreen / Two-column Toggle -->
    <button
      class="hidden lg:flex bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 p-2"
      @click="toggleFullScreen"
    >
      {{ fullScreenButtonText }}
    </button>

    <!-- Tutorial / NuxtPage Toggle Don't show if we're already showing both -->
    <button
      v-if="!displayStore.isFullScreen"
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
  align-items: flex-end; /* Align the buttons to the right */
}

button:hover {
  cursor: pointer;
}
</style>
