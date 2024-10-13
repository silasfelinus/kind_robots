<template>
  <div>
    <button
      class="flex items-center justify-center text-accent text-lg h-10 w-10 rounded-lg shadow-lg hover:bg-secondary"
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

// Determine the icon text based on the sidebarLeftState (open, compact, hidden)
const iconText = computed(() => {
  if (displayStore.sidebarLeftState === 'open') {
    return '<' // Icon for open state
  } else if (displayStore.sidebarLeftState === 'compact') {
    return '>' // Icon for compact state
  }
  return '×' // Icon for hidden state
})

// Toggle the left sidebar between 'open', 'compact', and 'hidden'
const toggleSidebarLeft = () => {
  if (displayStore.sidebarLeftState === 'open') {
    displayStore.sidebarLeftState = 'compact'
  } else if (displayStore.sidebarLeftState === 'compact') {
    displayStore.sidebarLeftState = 'hidden'
  } else {
    displayStore.sidebarLeftState = 'open'
  }
}
</script>

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
