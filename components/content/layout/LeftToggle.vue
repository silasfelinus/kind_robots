<template>
  <div class="fixed z-50 p-1" :style="leftFooterToggleStyle">
    <button
      class="w-6 h-6 rounded-2xl font-semibold text-transparent flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
      @click="toggleSidebarLeft"
    >
      <span
        class="toggle-character"
        style="
          background: linear-gradient(to bottom right, #f472b6, #fbbf24);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        "
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
  if (displayStore.sidebarLeftState === 'hidden') return '>'
  if (displayStore.sidebarLeftState === 'compact') return '<'
  return '<' // Icon for both 'open' and 'compact'
})

// Compute the position for the left-footer toggle button inside the sidebar
const leftFooterToggleStyle = computed(() => {
  const consistentPadding = `${displayStore.sectionPadding}` // Use section padding for consistency
  if (displayStore.sidebarLeftState === 'hidden') {
    return {
      left: `${consistentPadding}`, // Position outside when hidden
      top: `calc(${consistentPadding} * 2)`, // Adjust top with consistent padding
    }
  } else {
    return {
      left: `calc(${displayStore.sidebarLeftWidth} - ${consistentPadding})`, // Position inside the sidebar when open/compact
      top: `calc(${consistentPadding})`, // Top aligned with padding
    }
  }
})

// Toggle the left sidebar between 'open', 'compact', and 'hidden'
const toggleSidebarLeft = () => {
  if (displayStore.sidebarLeftState === 'open') {
    displayStore.sidebarLeftState = 'compact' // Move to 'compact' from 'open'
  } else if (displayStore.sidebarLeftState === 'compact') {
    displayStore.sidebarLeftState = 'hidden' // Move to 'hidden' from 'compact'
  } else {
    displayStore.sidebarLeftState = 'open' // Move to 'open' from 'hidden'
    displayStore.footerState = 'hidden' // Close the footer when the left sidebar is opened
  }
}
</script>
