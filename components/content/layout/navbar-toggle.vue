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
import { computed, ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore to manage state
const displayStore = useDisplayStore()

// The available DisplayState types
type DisplayState = 'hidden' | 'compact' | 'open'

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

// Use `ref` to make the current index reactive
const currentIndex = ref(0)

// Chevron icon based on current state
const chevronIcon = computed(() => stateCycle[currentIndex.value].icon)

// Cycle through the states on click
const cycleState = () => {
  currentIndex.value = (currentIndex.value + 1) % stateCycle.length // Cycle through states
  displayStore.sidebarLeftState =
    stateCycle[currentIndex.value].sidebarLeftState
  displayStore.footerState = stateCycle[currentIndex.value].footerState
  displayStore.saveState() // Save the updated state
}
</script>

<style scoped>
/* Add any additional stylish effects for hover, transitions */
div:hover {
  transform: scale(1.1);
}
</style>
