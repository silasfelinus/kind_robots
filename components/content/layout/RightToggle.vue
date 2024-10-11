<template>
  <div>
    <!-- Toggle button for right sidebar and tutorial -->
    <button
      class="flex items-center justify-center text-accent rounded-lg shadow-lg hover:bg-secondary"
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

// Function to toggle tutorial and sidebar
const toggleTutorialWithSidebar = () => {
  // If the sidebar is hidden, we open it and show the tutorial
  if (displayStore.sidebarRightState === 'hidden') {
    displayStore.sidebarRightState = 'open'
    displayStore.showTutorial = true
  } else {
    // If the sidebar is open, we close it and hide the tutorial
    displayStore.sidebarRightState = 'hidden'
    displayStore.showTutorial = false
  }
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
