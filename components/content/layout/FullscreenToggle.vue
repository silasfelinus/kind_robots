<template>
  <!-- Slim, floating flip icon for desktop viewports -->
  <div
    v-if="!displayStore.isMobileViewport"
    class="flex items-center space-x-2 z-50"
  >
    <!-- Fullscreen/Two-column button -->
    <button
      class="icon-button"
      :class="{
        'text-accent': isFullScreen,
        ' text-info': !isFullScreen,
      }"
      @click="toggleFullScreen"
    >
      <Icon
        :name="isFullScreen ? 'mdi-monitor' : 'mdi-view-column'"
        class="w-5 h-5"
      />
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
  padding: 0.5rem;
  border-radius: 9999px;
  transition: background-color 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.icon-button:hover {
  filter: brightness(1.1);
}
</style>
