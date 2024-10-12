<template>
  <div>
    <button
      class="flex items-center justify-center text-accent rounded-lg shadow-lg hover:bg-secondary text-lg"
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
  displayStore.toggleSidebar('sidebarLeftState')
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
