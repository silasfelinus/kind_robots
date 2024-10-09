<template>
  <div>
    <!-- Toggle button for larger displays (controlled by parent container) -->
    <button
      class="flex items-center justify-center p-2 text-accent rounded-lg shadow-lg hover:bg-secondary"
      @click="toggleTutorialWithLogs"
    >
      <Icon :name="iconName" class="w-8 h-8" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Determine the icon based on the sidebarRightState (open or hidden)
const iconName = computed(() => {
  console.log('Current sidebarRightState:', displayStore.sidebarRightState) // Log current state
  return displayStore.sidebarRightState === 'open'
    ? 'mdi:chevron-right'
    : 'mdi:chevron-left'
})

// Function to toggle the right sidebar and the tutorial visibility
const toggleTutorialWithLogs = () => {
  console.log(
    'Before toggle, sidebarRightState:',
    displayStore.sidebarRightState,
  )
  displayStore.toggleTutorial()
  console.log(
    'After toggle, sidebarRightState:',
    displayStore.sidebarRightState,
  )
  console.log('Tutorial state:', displayStore.showTutorial)
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
