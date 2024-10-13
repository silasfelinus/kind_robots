<template>
  <div
    :class="togglePosition"
  >
    <button
      class="flex items-center justify-center hover:bg-secondary rounded-lg"
      :class="buttonSizeClasses"
      @click="toggleState"
    >
      <!-- Render arrow based on state -->
      <span class="toggle-character">
        {{ toggleCharacter }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Define button size using Tailwind classes
const buttonSizeClasses = 'w-[6vh] h-[6vh]'

// Compute the character to display based on sidebar/footer state
const toggleCharacter = computed(() => {
  return displayStore.footerState === 'open' ? '▲' : '←'
})

// Determine the toggle button position based on sidebar/footer state
const togglePosition = computed(() => {
  return displayStore.footerState === 'open'
    ? 'fixed bottom-[calc(var(--footer-height)+32px)] left-1/2 transform -translate-x-1/2 z-50'
    : 'fixed bottom-16 left-[calc(var(--sidebar-width)+32px)] z-50'
})

// Toggle both sidebar and footer states
const toggleState = () => {
  if (displayStore.footerState === 'open') {
    displayStore.footerState = 'hidden'
  } else {
    displayStore.leftsideBarState = displayStore.leftsideBarState === 'compact' ? 'hidden' : 'compact'
    displayStore.footerState = 'hidden'
  }
}
</script>

<style scoped>
.toggle-character {
  font-size: 2rem;
  line-height: 1;
  display: inline-block;
}
</style>
