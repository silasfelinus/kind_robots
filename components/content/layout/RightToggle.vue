<template>
  <div class="z-50 p-1">
    <button
      class="w-6 h-6 rounded-2xl font-semibold text-transparent flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
      @click="toggleTutorialSidebar"
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
        {{ rightIconText }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Determine the icon text based on the right sidebar's state
const rightIconText = computed(() => {
  return displayStore.sidebarRightState === 'hidden' ? '<' : '>'
})

// Toggle the right sidebar and tutorial
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
