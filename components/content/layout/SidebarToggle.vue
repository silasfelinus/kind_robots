<template>
  <button @click="toggleSidebarLeft" class="flex items-center justify-center p-2 hover:bg-primary rounded-lg">
    <icon name="menu" class="toggle-icon" />
  </button>
</template>

<script setup>
import { useDisplayStore } from '@/stores/displayStore' // Adjust the path as necessary

const displayStore = useDisplayStore()

// Toggle the sidebar (left by default)
const toggleSidebarLeft = () => {
  displayStore.toggleSidebar('sidebarLeft')
}
</script>

<style scoped>
.toggle-icon {
  width: 100%;
  height: 100%;
  max-width: 40px; /* This controls the max size of the icon */
  max-height: 40px;
  min-width: 20px; /* Set min sizes to avoid shrinking too small */
  min-height: 20px;
  object-fit: contain; /* Ensures the icon scales properly */
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
