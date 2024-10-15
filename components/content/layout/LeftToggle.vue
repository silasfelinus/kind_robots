<template>
  <div class="fixed z-50 p-1" :style="leftFooterToggleStyle">
    <button
      class="w-6 h-6 rounded-2xl bg-gradient-to-br from-pink-400 to-yellow-400 text-2xl font-semibold text-white flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
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
  return displayStore.sidebarLeftState === 'hidden' ? '>' : '<'
})

// Compute the position for the left-footer toggle button
const leftFooterToggleStyle = computed(() => {
  if (displayStore.sidebarLeftState === 'hidden') {
    // Sidebar is hidden, so place the toggle outside (on the padding)
    return {
      left: `${displayStore.sectionPadding}`,
      top: `calc(50vh - (${displayStore.sectionPadding} * 2))`, // Centered vertically in the viewport
    }
  } else {
    // Sidebar is either open or compact, place the toggle inside the sidebar
    return {
      left: `calc(${displayStore.sidebarLeftWidth} - (${displayStore.sectionPadding} * 2))`,
      top: `calc(50vh - (${displayStore.sectionPadding} * 2))`, // Centered vertically in the viewport
    }
  }
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
