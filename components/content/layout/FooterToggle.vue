<template>
  <div class="z-50 p-1">
    <button
      class="w-6 h-6 rounded-2xl bg-primary font-semibold text-transparent flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
      @click="toggleFooter"
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
        {{ footerCharacter }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Determine the footer character based on footer state (▼ for open, ▲ for closed)
const footerCharacter = computed(() => {
  return displayStore.footerState === 'open' ? '▼' : '▲'
})

// Toggle the footer's open/closed state, and close the left sidebar if footer is opened
const toggleFooter = () => {
  if (displayStore.footerState === 'hidden') {
    displayStore.footerState = 'open'
    displayStore.sidebarLeftState = 'hidden' // Close left sidebar when footer is opened
  } else {
    displayStore.footerState = 'hidden'
  }
  displayStore.saveState()
}
</script>
