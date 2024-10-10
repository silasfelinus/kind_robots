<template>
  <div
    class="p-4 flex justify-center items-center bg-accent text-white rounded-full cursor-pointer select-none transition-transform duration-500"
    @click="cycleState"
  >
    <div class="text-4xl">
      {{ chevronIcon }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore to manage state
const displayStore = useDisplayStore()

// The available DisplayState types as per your existing types
type DisplayState = 'hidden' | 'compact' | 'open'

// Current state for cycling between sidebar and footer visibility

const _sidebarLeftState = computed(() => displayStore.sidebarLeftState)

const _footerState = computed(() => displayStore.footerState)

// States cycle: "all closed" -> "sidebarLeft compact" -> "sidebarLeft open" -> "sidebarLeft closed, footer open" -> "footer compact" -> "all closed"
const stateCycle = [
  {
    sidebarLeftState: 'hidden' as DisplayState,
    footerState: 'hidden' as DisplayState,
    icon: '⬇️',
  }, // All closed
  {
    sidebarLeftState: 'compact' as DisplayState,
    footerState: 'hidden' as DisplayState,
    icon: '⬅️',
  }, // Sidebar left compact
  {
    sidebarLeftState: 'open' as DisplayState,
    footerState: 'hidden' as DisplayState,
    icon: '⬆️',
  }, // Sidebar left open
  {
    sidebarLeftState: 'hidden' as DisplayState,
    footerState: 'open' as DisplayState,
    icon: '↘️',
  }, // Sidebar left closed, footer open
  {
    sidebarLeftState: 'hidden' as DisplayState,
    footerState: 'compact' as DisplayState,
    icon: '➡️',
  }, // Footer compact
]

// Keep track of current state index in the cycle
let currentIndex = 0

// Chevron icon based on current state
const chevronIcon = computed(() => {
  return stateCycle[currentIndex].icon
})

// Cycle through the states on click
const cycleState = () => {
  currentIndex = (currentIndex + 1) % stateCycle.length // Cycle through states
  displayStore.sidebarLeftState = stateCycle[currentIndex].sidebarLeftState
  displayStore.footerState = stateCycle[currentIndex].footerState
  displayStore.saveState() // Save the updated state
}
</script>

<style scoped>
/* Add any additional stylish effects for hover, transitions */
div:hover {
  transform: scale(1.1);
}
</style>
