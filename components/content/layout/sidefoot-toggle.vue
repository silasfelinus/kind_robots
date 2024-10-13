<template>
  <div :class="togglePosition">
    <button
      class="flex items-center justify-center hover:bg-secondary rounded-lg w-[6vh] h-[6vh]"
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
  displayStore.footerState === 'open' ? '▲' : '←',
)

// Define a method to toggle the sidebar and footer state
const toggleState = () => {
  displayStore.toggleSidebar('sidebarLeftState')
  displayStore.toggleFooter()
}

// Inline Tailwind for position, handling positioning based on footer state
const togglePosition = computed(() =>
  displayStore.footerState === 'open'
    ? 'fixed bottom-[calc(var(--footer-height)+32px)] left-1/2 transform -translate-x-1/2 z-50'
    : 'fixed bottom-16 left-[calc(var(--sidebar-width)+32px)] z-50',
)

// OnMounted lifecycle hook to check the states of the sidebar and footer
onMounted(() => {
  const sidebarLeftState = displayStore.sidebarLeftState
  const footerState = displayStore.footerState

  // Case 1: Both are hidden
  if (sidebarLeftState === 'hidden' && footerState === 'hidden') {
    // Open the footer and leave the sidebar hidden
    displayStore.footerState = 'open'
  }

  // Case 2: Both are exposed (sidebar is 'open' or 'compact' and footer is 'open')
  if (
    (sidebarLeftState === 'open' || sidebarLeftState === 'compact') &&
    footerState === 'open'
  ) {
    // Hide the sidebar
    displayStore.sidebarLeftState = 'hidden'
  }
})
</script>

<style scoped>
/* No extra custom styles needed, Tailwind classes handle positioning */
</style>
