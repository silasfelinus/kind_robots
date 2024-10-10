<template>
  <div>
    <!-- Toggle button for right sidebar and tutorial -->
    <button
      class="flex items-center justify-center p-2 text-accent rounded-lg shadow-lg hover:bg-secondary"
      @click="toggleTutorialWithSidebar"
    >
      {{ rightIconText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Determine the icon text based on the sidebarRightState (hidden or open)
const rightIconText = computed(() => {
  return displayStore.sidebarRightState === 'hidden' ? '<' : '>'
})

// Function to toggle tutorial and sidebar logic based on screen size
const toggleTutorialWithSidebar = () => {
  const isLargeOrExtraLarge = displayStore.viewportSize === 'large' || displayStore.viewportSize === 'extraLarge';
  const isSmallOrMedium = displayStore.viewportSize === 'small' || displayStore.viewportSize === 'medium';

  // If screen is small or medium, just call toggleTutorial
  if (isSmallOrMedium) {
    displayStore.toggleTutorial();
    return;
  }

  // Handle large and extra-large screen sizes
  if (isLargeOrExtraLarge) {
    if (displayStore.sidebarRightState === 'hidden' && !displayStore.showTutorial && !displayStore.isFullScreen) {
      // Move to state 2: Open right sidebar, show tutorial, enter fullscreen
      displayStore.setSidebarRight(true);  // Open the right sidebar
      displayStore.showTutorial = true;
      displayStore.isFullScreen = true;
    } else if (displayStore.sidebarRightState === 'open' && displayStore.showTutorial && displayStore.isFullScreen) {
      // Move to state 3: Close right sidebar, show tutorial, exit fullscreen
      displayStore.setSidebarRight(false); // Close the right sidebar
      displayStore.showTutorial = true;
      displayStore.isFullScreen = false;
     } else if (displayStore.sidebarRightState === 'open' && !displayStore.isFullScreen) {
      // Move to state 3: Close right sidebar, show tutorial, exit fullscreen
      displayStore.setSidebarRight(false); // Close the right sidebar
      displayStore.showTutorial = !displayStore.showTutorial;
    } else if (displayStore.sidebarRightState === 'hidden' && displayStore.showTutorial && !displayStore.isFullScreen) {
      // Move to state 1: Close right sidebar, hide tutorial, exit fullscreen
      displayStore.setSidebarRight(false); // Keep sidebar closed
      displayStore.showTutorial = false;
      displayStore.isFullScreen = false;
    }
  }
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
