<template>
  <div
    v-if="!displayStore.isMobileViewport"
    class="fixed lg:flex bottom-4 right-4 items-center space-x-2 text-base-200 rounded-lg shadow-md p-2 transition duration-300 z-50"
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const isFullScreen = computed(() => displayStore.isFullScreen)

const toggleFullScreen = () => {
  displayStore.toggleFullScreen()
}
</script>

<style scoped>
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
