<template>
  <button
    class="flex items-center justify-center p-1 hover:bg-secondary rounded-lg"
    :style="buttonStyle"
    @click="toggleSidebarRight"
  >
    <Icon name="carbon:tool-box" class="toggle-icon" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Compute the icon size based on the header height
const buttonStyle = computed(() => {
  const iconSize = Math.max(5, displayStore.headerVh - 3)
  return {
    width: `${iconSize}vh`,
    height: `${iconSize}vh`,
  }
})

// Toggle the left sidebar
const toggleSidebarRight = () => {
  displayStore.toggleSidebar('sidebarRight')
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
