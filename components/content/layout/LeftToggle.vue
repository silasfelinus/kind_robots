<template>
  <div class="relative">
    <button
      class="left-arc-button shadow-lg bg-accent hover:bg-secondary border-2 border-solid border-gray-300 text-lg text-white flex items-center justify-center z-10"
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
  width: 100px;
  height: 100px;
  border-radius: 100% 0 0 0; /* Quarter circle effect for the top-left corner */
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(
    -25%,
    -25%
  ); /* Adjusts the button slightly into the corner */
  z-index: 10; /* Ensures the button is above other content */
}

.toggle-character {
  font-size: 2rem; /* Matches the size of the text icon */
  line-height: 1;
  display: inline-block;
}
</style>
