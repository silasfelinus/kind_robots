<template>
  <div class="fixed z-50 p-1">
    <button
      class="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-yellow-400 text-2xl font-semibold text-white flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
      :style="rightToggleStyle"
      @click="toggleTutorialSidebar"
    >
      <span
        class="toggle-character"
        style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3)"
      >
        {{ rightIconText }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Right toggle style, based on whether the right sidebar is open or hidden
const rightToggleStyle = computed(() => {
  if (displayStore.sidebarRightState === 'hidden') {
    // When the sidebar is hidden, place the toggle outside with padding
    return {
      top: `calc(${displayStore.headerHeight} + (${displayStore.sectionPadding} * 2))`,
      right: `${displayStore.sectionPadding}`,
    }
  } else {
    // When the sidebar is open, place the toggle inside the sidebar
    return {
      top: `calc(${displayStore.headerHeight} + (${displayStore.sectionPadding} * 2))`,
      right: `calc(${displayStore.sidebarRightWidth} - (${displayStore.sectionPadding} * 2))`,
    }
  }
})

// Determine the icon text based on the right sidebar's state
const rightIconText = computed(() => {
  return displayStore.sidebarRightState === 'hidden' ? '<' : '>'
})

// Toggle the right sidebar
const toggleTutorialSidebar = () => {
  displayStore.toggleTutorial()

  if (!displayStore.isMobileViewport) {
    // Toggle between 'open' and 'hidden' state
    if (displayStore.sidebarRightState === 'hidden') {
      displayStore.setSidebarRight(true) // Open the sidebar
    } else {
      displayStore.setSidebarRight(false) // Close the sidebar
    }
  }
}
</script>
