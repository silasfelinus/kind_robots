<template>
  <div class="relative z-50">
    <button
      class="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-yellow-400 text-2xl font-semibold text-white flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
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
