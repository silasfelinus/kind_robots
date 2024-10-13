<template>
  <div class="relative">
    <button
      class="bottom-arc-button shadow-lg bg-accent hover:bg-secondary border-2 border-solid border-gray-300 text-lg text-white flex items-center justify-center"
      @click="toggleState"
    >
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
  width: 50px;
  height: 50px;
  border-radius: 0 0 0 100%; /* Quarter arc for bottom-left corner */
  position: absolute;
  bottom: 0;
  left: 0;
  transform: translate(-25%, 25%); /* Adjusts the button to fit the corner */
}

.text-2xl {
  font-size: 2rem;
  line-height: 1;
}
</style>
