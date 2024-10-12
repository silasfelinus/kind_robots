<template>
  <div>
    <!-- Toggle button for larger displays (controlled by parent container) -->
    <button
      class="flex items-center justify-center p-2 text-accent text-lg h-10 w-10 rounded-lg shadow-lg hover:bg-secondary"
      @click="toggleSidebarLeft"
    >
      {{ iconText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Determine the icon text based on the sidebarLeftState (compact, hidden, open)
const iconText = computed(() => {
  console.log('Current sidebarLeftState:', displayStore.sidebarLeftState)
  if (displayStore.sidebarLeftState === 'hidden') {
    return '>'
  }
  return '<'
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
