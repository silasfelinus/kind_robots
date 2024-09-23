<template>
  <div v-if="displayStore.showInfo" class="debug-overlay">
    <div class="debug-info z-50">
      <p>Header VH: {{ displayStore.headerVh }}vh</p>
      <p>Sidebar VW: {{ displayStore.sidebarVw }}vw</p>
      <p>Footer VH: {{ displayStore.footerVh }}vh</p>
      <p>Viewport: {{ displayStore.viewportSize }}</p>
      <p>Touch Device: {{ displayStore.isTouchDevice ? 'Yes' : 'No' }}</p>
      <p>Vertical Layout: {{ displayStore.isVertical ? 'Yes' : 'No' }}</p>
      <p>Header State: {{ displayStore.headerState }}</p>
      <p>Left Sidebar: {{ displayStore.sidebarLeft }}</p>
      <p>Right Sidebar: {{ displayStore.sidebarRight }}</p>
      <p>Footer State: {{ displayStore.footer }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore' 
import { onMounted, onBeforeUnmount } from 'vue'

// Initialize the store
const displayStore = useDisplayStore()

// Ensure the viewport watcher is set up when the component mounts
onMounted(() => {
  displayStore.initializeViewportWatcher()
})

// Clean up the event listener when the component is destroyed
onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>

<style scoped>
.debug-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 2rem;
  z-index: 10000;
  padding: 1rem;
  border-radius: 0.5rem;
}

.debug-info p {
  margin: 0;
  padding: 0.5rem 0;
}
</style>
