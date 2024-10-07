<template>
  <div>
    <!-- Toggle button for larger displays (controlled by parent container) -->
    <button
      class="flex items-center justify-center p-2 bg-accent text-white rounded-lg shadow-lg hover:bg-secondary"
      @click="toggleSidebarRight"
    >
      <Icon :name="iconName" class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Determine the icon based on the sidebarRightState (open, hidden)
const iconName = computed(() => {
  switch (displayStore.sidebarRightState) {
    case 'hidden':
      return 'mdi:menu-right'
    case 'open':
      return 'mdi:chevron-right'
    default:
      return 'mdi:menu-right'
  }
})

// Toggle the right sidebar
const toggleSidebarRight = () => {
  displayStore.toggleSidebar('sidebarRightState')
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
