<template>
  <div class="relative z-50">
    <!-- Arc-style toggle button for right sidebar and tutorial -->
    <button
      class="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-yellow-400 text-2xl font-semibold text-white flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
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

// Determine if the viewport is mobile
const isMobile = computed(() => displayStore.isMobileViewport)

// Determine the icon text based on the right sidebar's state
const rightIconText = computed(() => {
  return displayStore.sidebarRightState === 'hidden' ? '>' : '<'
})

// Toggle the right sidebar and tutorial
const toggleTutorialSidebar = () => {
  displayStore.toggleTutorial()

  if (!isMobile.value) {
    // Toggle between 'open' and 'hidden' state
    if (displayStore.sidebarRightState === 'hidden') {
      displayStore.setSidebarRight(true) // Open the sidebar
    } else {
      displayStore.setSidebarRight(false) // Close the sidebar
    }
  }
}
</script>
