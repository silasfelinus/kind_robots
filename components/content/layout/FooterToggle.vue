<template>
  <div
    class="fixed left-1/2 transform -translate-x-1/2 z-50 p-1"
    :style="footerToggleStyle"
  >
    <button
      class="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-yellow-400 text-xl font-semibold text-white flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
      @click="toggleFooter"
    >
      <!-- Footer toggle character (▼ or ▲) -->
      <span
        class="toggle-character"
        style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3)"
      >
        {{ footerCharacter }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Compute the style for the footer toggle based on footer state
const footerToggleStyle = computed(() => {
  const consistentHeightOffset = '20px' // Define a consistent height offset for the toggle

  if (displayStore.footerState === 'open') {
    // When the footer is open, place the toggle inside the footer
    return {
      bottom: `calc(${displayStore.footerHeight} - ${consistentHeightOffset})`, // Inside the footer
    }
  } else {
    // When the footer is closed, place the toggle just above the footer
    return {
      bottom: `calc(${displayStore.footerHeight} + (${displayStore.sectionPadding} * 2))`, // Just above the footer
    }
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
