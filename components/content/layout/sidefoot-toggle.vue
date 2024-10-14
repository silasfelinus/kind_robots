<template>
  <div class="relative">
    <button
      class="w-5 h-5 rounded-tl-2xl shadow-lg bg-gradient-to-tl from-accent to-accent-dark hover:bg-secondary border-b-4 border-l-4 text-2xl font-semibold text-white flex items-center justify-center transition-transform duration-300 ease-in-out absolute bottom-0 left-0"
      @click="toggleState"
    >
      <!-- Simple up and down caret characters -->
      <span
        class="toggle-character"
        style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3)"
      >
        {{ toggleCharacter }}
      </span>
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
