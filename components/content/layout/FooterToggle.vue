<template>
  <div class="fixed z-50 p-1" :style="footerToggleStyle">
    <button
      class="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-yellow-400 text-2xl font-semibold text-white flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
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

// Handle positioning for the footer toggle in bottom-right
const footerToggleStyle = computed(() => ({
  bottom: `calc(${displayStore.sectionPadding} * 2)`, // Stay close to the bottom
  right:
    displayStore.sidebarRightState !== 'hidden'
      ? `calc(${displayStore.sidebarRightWidth} + (${displayStore.sectionPadding} * 2 ))`
      : displayStore.sectionPadding,
}))

// Determine the footer character based on footer state (▼ for open, ▲ for closed)
const footerCharacter = computed(() => {
  return displayStore.footerState === 'open' ? '▼' : '▲'
})

// Toggle the footer's open/closed state
const toggleFooter = () => {
  displayStore.toggleFooter()
}
</script>
