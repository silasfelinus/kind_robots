<template>
  <div class="relative">
    <button
      class="bottom-arc-button shadow-3d bg-gradient-to-tl from-accent to-accent-dark hover:bg-secondary border-double border-2 border-gray-300 text-lg text-white flex items-center justify-center transition-transform duration-300 ease-in-out"
      @click="toggleState"
    >
      <!-- Simple up and down caret characters -->
      <span class="text-2xl leading-none">{{ toggleCharacter }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Compute the character to display based on footer state
const toggleCharacter = computed(() =>
  displayStore.footerState === 'open' ? '▲' : '▼',
)

// Define a method to toggle the sidebar and footer state
const toggleState = () => {
  displayStore.toggleSidebar('sidebarLeftState')
  displayStore.toggleFooter()
  const sidebarLeftState = displayStore.sidebarLeftState
  const footerState = displayStore.footerState

  // Handle the sidebar and footer toggle logic
  if (sidebarLeftState === 'hidden' && footerState === 'hidden') {
    displayStore.footerState = 'open'
  } else if (
    (sidebarLeftState === 'open' || sidebarLeftState === 'compact') &&
    footerState === 'open'
  ) {
    displayStore.sidebarLeftState = 'hidden'
  }
}

// Lifecycle hook to ensure proper initial states
onMounted(() => {
  const sidebarLeftState = displayStore.sidebarLeftState
  const footerState = displayStore.footerState

  if (sidebarLeftState === 'hidden' && footerState === 'hidden') {
    displayStore.footerState = 'open'
  } else if (
    (sidebarLeftState === 'open' || sidebarLeftState === 'compact') &&
    footerState === 'open'
  ) {
    displayStore.sidebarLeftState = 'hidden'
  }
})
</script>

<style scoped>
.bottom-arc-button {
  width: 60px;
  height: 60px;
  border-radius: 0 0 0 100%; /* Quarter arc for bottom-left corner */
  position: absolute;
  bottom: 0;
  left: 0;
  transform: translate(
    -25%,
    25%
  ); /* Adjusts the button to fit snugly into the corner */
  transition: transform 0.3s ease-in-out; /* Smooth transition for hover effect */
}

/* Enhanced shadow to create a layered effect */
.shadow-3d {
  box-shadow:
    0px 4px 6px rgba(0, 0, 0, 0.3),
    0px 8px 15px rgba(0, 0, 0, 0.1);
}

/* Hover effects to add interaction feedback */
.bottom-arc-button:hover {
  transform: translate(-25%, 25%) scale(1.1); /* Grows slightly on hover */
}

/* Subtle gradient background for depth */
.bg-gradient-to-tl {
  background: linear-gradient(
    to top left,
    var(--tw-gradient-from),
    var(--tw-gradient-to)
  );
}

/* Toggle character styles */
.toggle-character {
  font-size: 2rem; /* Size of the arrow (▲ or ▼) */
  line-height: 1;
  display: inline-block;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3); /* Adds depth to the arrow icon */
}
</style>
