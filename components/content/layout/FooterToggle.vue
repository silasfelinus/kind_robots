<template>
  <div class="relative z-50">
    <button
      class="footer-arc-button shadow-3d bg-gradient-to-tr from-accent to-accent-dark hover:bg-secondary border-double border-2 border-gray-300 text-lg text-white flex items-center justify-center transition-transform duration-300 ease-in-out"
      :style="buttonStyle"
      @click="toggleFooter"
    >
      <!-- Footer toggle character (▼ or ▲) -->
      <span class="toggle-character">{{ footerCharacter }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Compute the button size dynamically based on viewport height (vh)
const buttonStyle = computed(() => {
  const iconSize = 6 // Adjust the icon size in vh units
  return {
    width: `${iconSize}vh`,
    height: `${iconSize}vh`,
  }
})

// Determine the footer character based on footer state (▼ for open, ▲ for closed)
const footerCharacter = computed(() => {
  return displayStore.footerState === 'open' ? '▼' : '▲'
})

// Toggle the footer's open/closed state
const toggleFooter = () => {
  displayStore.toggleFooter()
}
</script>

<style scoped>
.footer-arc-button {
  border-radius: 100% 0 0 0; /* Quarter arc effect for bottom-left corner */
  position: absolute;
  bottom: 0;
  left: 0;
  transform: translate(
    -25%,
    25%
  ); /* Adjusts the button to fit snugly into the bottom-left corner */
  transition: transform 0.3s ease-in-out; /* Smooth transition for hover effect */
}

/* Enhanced shadow to create a layered effect */
.shadow-3d {
  box-shadow:
    0px 4px 6px rgba(0, 0, 0, 0.3),
    0px 8px 15px rgba(0, 0, 0, 0.1);
}

/* Hover effects to add interaction feedback */
.footer-arc-button:hover {
  transform: translate(-25%, 25%) scale(1.1); /* Grows slightly on hover */
}

/* Subtle gradient background for depth */
.bg-gradient-to-tr {
  background: linear-gradient(
    to top right,
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
