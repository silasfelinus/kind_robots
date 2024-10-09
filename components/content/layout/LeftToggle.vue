<template>
  <div>
    <!-- Toggle button for larger displays (controlled by parent container) -->
    <button
      class="flex items-center justify-center p-2 bg-primary text-white rounded-lg shadow-lg hover:bg-secondary"
      @click="toggleSidebarLeft"
    >
      <Icon :name="iconName" class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Determine the icon based on the sidebarLeftState (compact, hidden, open)
const iconName = computed(() => {
  switch (displayStore.sidebarLeftState) {
    case 'compact':
      return 'mdi:chevron-left'
    case 'hidden':
      return 'mdi:chevron-right'
    case 'open':
      return 'mdi:chevron-left'
    default:
      return 'mdi:menu'
  }
})

// Toggle the left sidebar
const toggleSidebarLeft = () => {
  displayStore.toggleSidebar('sidebarLeftState')
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
