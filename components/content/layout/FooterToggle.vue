<template>
  <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
    <button
      class="flex items-center justify-center p-1 hover:bg-secondary rounded-lg"
      :style="buttonStyle"
      @click="toggleFooter"
    >
      <!-- Conditionally render the text character based on footer state -->
      <span class="toggle-character">{{ footerCharacter }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Compute the button size
const buttonStyle = computed(() => {
  const iconSize = 6
  return {
    width: `${iconSize}vh`,
    height: `${iconSize}vh`,
  }
})

// Determine the footer character based on whether the footer is open or closed
const footerCharacter = computed(() => {
  return displayStore.footerState === 'open' ? '▼' : '▲'
})

// Toggle footer
const toggleFooter = () => {
  displayStore.toggleFooter()
}
</script>

<style scoped>
.toggle-character {
  font-size: 2rem; /* Adjust the size as needed */
  line-height: 1;
  display: inline-block;
}
</style>
