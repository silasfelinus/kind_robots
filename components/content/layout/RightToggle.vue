<template>
  <div class="relative">
    <!-- Arc-style toggle button for right sidebar and tutorial -->
    <button
      class="right-arc-button shadow-lg bg-accent hover:bg-secondary border-2 border-solid border-gray-300 text-lg text-white flex items-center justify-center z-10"
      @click="toggleTutorialSidebar"
    >
      {{ rightIconText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const isMobile = computed(() => displayStore.isMobileViewport)

const rightIconText = computed(() => {
  return displayStore.sidebarRightState === 'hidden' ? '>' : '<'
})

// Toggle the right sidebar and tutorial
const toggleTutorialSidebar = () => {
  displayStore.toggleTutorial()

  if (!isMobile.value) {
    // Toggle between 'open' and 'hidden' state
    if (displayStore.sidebarRightState === 'hidden') {
      displayStore.setSidebarRight(true) // Open the sidebar
    } else {
      displayStore.setSidebarRight(false) // Close the sidebar
    }
  }
}
</script>

<style scoped>
.right-arc-button {
  width: 100px;
  height: 100px;
  border-radius: 0 100% 0 0; /* Quarter circle effect for the top-right corner */
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(
    25%,
    -25%
  ); /* Adjusts the button slightly off the corner */
  z-index: 10; /* Ensures the button is above other content */
}
</style>
