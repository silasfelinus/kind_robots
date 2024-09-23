<template>
  <div class="main-layout">
    <header
      class="header-overlay"
      :style="{ height: displayStore.headerVh + 'vh' }"
    >
      <p>Header</p>
    </header>

    <div class="content-area">
      <aside
        v-if="displayStore.sidebarLeft === 'open'"
        class="sidebar-left-overlay"
        :style="{ width: displayStore.sidebarVw + 'vw' }"
      >
        <p>Left Sidebar</p>
      </aside>

      <main class="main-content-overlay">
        <p>Main Content</p>
      </main>

      <aside
        v-if="displayStore.sidebarRight === 'open'"
        class="sidebar-right-overlay"
        :style="{ width: displayStore.sidebarVw + 'vw' }"
      >
        <p>Right Sidebar</p>
      </aside>
    </div>

    <footer
      class="footer-overlay"
      :style="{ height: displayStore.footerVh + 'vh' }"
    >
      <p>Footer</p>
    </footer>

    <!-- Debug overlay for displayStore values -->
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
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.content-area {
  display: flex;
  flex: 1;
}

.header-overlay {
  background-color: rgba(0, 128, 255, 0.5); /* Light Blue */
  text-align: center;
  color: white;
}

.sidebar-left-overlay,
.sidebar-right-overlay {
  background-color: rgba(255, 165, 0, 0.5); /* Light Orange */
  text-align: center;
  color: white;
  padding: 1rem;
}

.main-content-overlay {
  flex: 1;
  background-color: rgba(144, 238, 144, 0.5); /* Light Green */
  text-align: center;
  color: white;
  padding: 1rem;
}

.footer-overlay {
  background-color: rgba(255, 69, 0, 0.5); /* Light Red */
  text-align: center;
  color: white;
}

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
