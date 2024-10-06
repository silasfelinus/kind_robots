<template>
  <div>
    <!-- Toggle button for larger displays -->
    <button
      v-if="!isMobileViewport"
      class="flex items-center justify-center z-20 p-2 hover:bg-secondary rounded-lg"
      @click="toggleSidebarLeft"
    >
      <Icon name="emojione:artist-palette" class="w-6 h-6" />
    </button>

    <!-- Floating icon for mobile (fixed position near the corner) -->
    <button
      v-else
      class="fixed z-50 flex items-center justify-center bg-primary text-white p-2 rounded-full shadow-lg hover:bg-secondary bottom-4 left-4"
      @click="toggleSidebarLeft"
    >
      <!-- Dynamically change the icon based on the sidebar state -->
      <Icon :name="iconName" class="w-full h-full" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Check if it's mobile viewport
const isMobileViewport = computed(() => displayStore.isMobileViewport)

// Determine the icon based on the sidebar viewState (compact, hidden, open)
const iconName = computed(() => {
  switch (displayStore.sidebarLeftState) {
    case 'compact':
      return 'emojione:artist-palette'
    case 'hidden':
      return 'mdi:menu'
    case 'open':
      return 'mdi:chevron-left'
    default:
      return 'mdi:menu'
  }
})

// Toggle the left sidebar
const toggleSidebarLeft = () => {
  displayStore.toggleSidebar('sidebarLeftState') // Use the correct state name
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
