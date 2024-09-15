<template>
  <button @click="toggleSidebarLeft" class="flex items-center justify-center p-1 hover:bg-secondary rounded-lg">
    <icon name="menu" class="toggle-icon text-primary" />
  </button>
</template>

<script setup>
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Toggle the left sidebar
const toggleSidebarLeft = () => {
  displayStore.toggleSidebar('sidebarLeft')
}
</script>

<style scoped>
.toggle-icon {
  width: 100%;
  height: 100%;
  max-width: 30px;
  max-height: 30px;
  object-fit: contain;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
