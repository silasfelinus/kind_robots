<template>
  <div>
    <!-- Toggle button for right sidebar and tutorial -->
    <button
      class="flex items-center justify-center text-accent rounded-lg shadow-lg hover:bg-secondary text-lg h-10 w-10"
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

const isMobile = computed(() => displayStore.isMobileViewport)

// Determine the icon text based on the sidebarRightState (hidden or open)
const rightIconText = computed(() => {
  return displayStore.sidebarRightState === 'hidden' ? '<' : '>'
})

// Function to toggle tutorial and sidebar
const toggleTutorialWithSidebar = () => {
  if (!isMobile.value) {
    if (displayStore.sidebarRightState === 'hidden') {
      displayStore.sidebarRightState = 'open'
      displayStore.showTutorial = true
    } else {
      displayStore.sidebarRightState = 'hidden'
      displayStore.showTutorial = false
    }
  } else {
    // Handle mobile-specific behavior here if necessary
    console.log('Mobile mode, sidebar state remains unchanged.')
  }
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
