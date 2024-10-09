<template>
  <div>
    <!-- Toggle button for larger displays (controlled by parent container) -->
    <button
      class="flex items-center justify-center p-2 text-accent rounded-lg shadow-lg hover:bg-secondary"
      @click="toggleSidebarRightAndTutorial"
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
  return displayStore.sidebarRightState === 'open'
    ? 'mdi:chevron-right'
    : 'mdi:chevron-left'
})

// Function to toggle the right sidebar and the tutorial visibility
const toggleSidebarRightAndTutorial = () => {
  displayStore.toggleTutorial()
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
