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
  const isLargeOrExtraLarge =
    displayStore.viewportSize === 'large' ||
    displayStore.viewportSize === 'extraLarge'
  const isSmallOrMedium =
    displayStore.viewportSize === 'small' ||
    displayStore.viewportSize === 'medium'

  // If screen is small or medium, just toggle the tutorial
  if (isSmallOrMedium) {
    displayStore.toggleTutorial()
    return
  }

  // On large or extra-large screens, simply call the toggleFullScreen action from the store
  if (isLargeOrExtraLarge) {
    displayStore.toggleFullScreen()
  }
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
