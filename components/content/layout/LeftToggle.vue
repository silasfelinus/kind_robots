<template>
  <div class="relative">
    <button
      class="left-arc-button shadow-3d bg-gradient-to-br from-accent to-accent-dark hover:bg-secondary border-double border-2 border-gray-300 text-lg text-white flex items-center justify-center transition-transform duration-300 ease-in-out"
      @click="toggleSidebarLeft"
    >
      <!-- Conditionally render the icon based on the sidebar state -->
      <span class="toggle-character">{{ iconText }}</span>
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
    return '×' // Icon for open state
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

<style scoped>
.left-arc-button {
  width: 60px; /* Slightly larger for more emphasis */
  height: 60px;
  border-radius: 0 0 100% 0; /* Quarter arc effect for top-left corner */
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-25%, -25%);
  transition: transform 0.3s ease-in-out; /* Smooth transition for hover effect */
}

/* Enhanced shadow to create a layered effect */
.shadow-3d {
  box-shadow:
    0px 4px 6px rgba(0, 0, 0, 0.3),
    0px 8px 15px rgba(0, 0, 0, 0.1);
}

/* Hover effects to add interaction feedback */
.left-arc-button:hover {
  transform: translate(-25%, -25%) scale(1.1); /* Grows slightly on hover */
}

/* Subtle gradient background for depth */
.bg-gradient-to-br {
  background: linear-gradient(
    to bottom right,
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
