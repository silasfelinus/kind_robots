<template>
  <div>
    <!-- Toggle button for larger displays (controlled by parent container) -->
    <button
      class="flex items-center justify-center p-2 text-accent rounded-lg shadow-lg hover:bg-secondary"
      @click="toggleSidebarLeft"
    >
      <Icon :name="iconName" class="w-8 h-8" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Determine the icon based on the sidebarLeftState (compact, hidden, open)
const iconName = computed(() => {
  console.log('Current sidebarLeftState:', displayStore.sidebarLeftState)
  if (displayStore.sidebarLeftState === 'hidden') {
    return 'mdi:chevron-right'
  }
  return 'mdi:chevron-left'
})

// Toggle the left sidebar
const toggleSidebarLeft = () => {
  console.log('Before toggle sidebarLeftState:', displayStore.sidebarLeftState)
  displayStore.toggleSidebar('sidebarLeftState')
  console.log('After toggle sidebarLeftState:', displayStore.sidebarLeftState)
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
