<template>
  <div class="flex justify-center items-end h-full">
    <button
      class="flex items-center justify-center p-1 hover:bg-secondary rounded-lg"
      :style="buttonStyle"
      @click="toggleFooter"
    >
      <!-- Conditionally render the icon based on footer state -->
      <Icon :name="footerIcon" class="toggle-icon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Compute the icon size
const buttonStyle = computed(() => {
  const iconSize = 5
  return {
    width: `${iconSize}vh`,
    height: `${iconSize}vh`,
  }
})

// Determine the footer icon based on whether the footer is open or closed
const footerIcon = computed(() => {
  return displayStore.footerState === 'open' ? 'mdi:chevron-down' : 'mdi:chevron-up'
})

// Toggle footer
const toggleFooter = () => {
  displayStore.toggleFooter()
}
</script>

<style scoped>
.toggle-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
