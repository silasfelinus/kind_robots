<template>
  <div class="relative">
    <!-- Arc-style toggle button for right sidebar and tutorial -->
    <button
      class="right-arc-button shadow-3d bg-gradient-to-bl from-accent to-accent-dark hover:bg-secondary border-double border-2 border-gray-300 text-lg text-white flex items-center justify-center transition-transform duration-300 ease-in-out"
      @click="toggleTutorialSidebar"
    >
      {{ rightIconText }}
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

<style scoped>
.right-arc-button {
  width: 60px;
  height: 60px;
  border-radius: 0 100% 0 0; /* Quarter-circle effect for top-right corner */
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(
    25%,
    -25%
  ); /* Adjusts the button to fit snugly in the top-right corner */
  z-index: 10; /* Ensures the button is on top of other content */
  transition: transform 0.3s ease-in-out; /* Smooth transition for hover effect */
}

/* Enhanced shadow to create a layered effect */
.shadow-3d {
  box-shadow:
    0px 4px 6px rgba(0, 0, 0, 0.3),
    0px 8px 15px rgba(0, 0, 0, 0.1);
}

/* Hover effects to add interaction feedback */
.right-arc-button:hover {
  transform: translate(25%, -25%) scale(1.1); /* Grows slightly on hover */
}

/* Subtle gradient background for depth */
.bg-gradient-to-bl {
  background: linear-gradient(
    to bottom left,
    var(--tw-gradient-from),
    var(--tw-gradient-to)
  );
}

/* Toggle character styles */
.toggle-character {
  font-size: 2rem; /* Matches the size of the text icon */
  line-height: 1;
  display: inline-block;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3); /* Adds a bit of depth to the text */
}
</style>
