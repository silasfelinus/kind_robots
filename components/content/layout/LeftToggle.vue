<template>
  <div class="relative">
    <button
      class="rounded-tl-2xl rounded-br-2xl shadow-lg bg-gradient-to-br from-accent to-accent-dark hover:bg-secondary text-2xl font-semibold text-white flex items-center justify-center"
      @click="toggleSidebarLeft"
    >
      <span
        class="toggle-character"
        style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3)"
      >
        {{ iconText }}
      </span>
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
    return '<' // Icon for compact state
  }
  return '>' // Icon for hidden state
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
