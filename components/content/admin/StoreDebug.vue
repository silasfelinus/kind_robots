<template>
  <div class="main-layout absolute">
    <!-- Unified layout and debug overlay -->
    <header
      class="header-overlay debug-box"
      :class="{ 'debug-active': displayStore.showInfo }"
      :style="{ height: displayStore.headerVh + 'vh' }"
    >
      <p>Header</p>
      <p v-if="displayStore.showInfo">Header VH: {{ displayStore.headerVh }}vh</p>
    </header>

    <!-- Main content area with sidebars and main content -->
    <div class="content-area">
      <aside
        class="sidebar-left-overlay debug-box"
        :class="{ 'debug-active': displayStore.showInfo }"
        :style="{ width: displayStore.sidebarVw + 'vw' }"
      >
        <p>Left Sidebar</p>
        <p v-if="displayStore.showInfo">Sidebar VW: {{ displayStore.sidebarVw }}vw</p>
      </aside>

      <main class="main-content-overlay debug-box">
        <p>Main Content</p>
        <p v-if="displayStore.showInfo">Viewport: {{ displayStore.viewportSize }}</p>
      </main>

      <aside
        class="sidebar-right-overlay debug-box"
        :class="{ 'debug-active': displayStore.showInfo }"
        :style="{ width: displayStore.sidebarVw + 'vw' }"
      >
        <p>Right Sidebar</p>
        <p v-if="displayStore.showInfo">Right Sidebar VW: {{ displayStore.sidebarVw }}vw</p>
      </aside>
    </div>

    <footer
      class="footer-overlay debug-box"
      :class="{ 'debug-active': displayStore.showInfo }"
      :style="{ height: displayStore.footerVh + 'vh' }"
    >
      <p>Footer</p>
      <p v-if="displayStore.showInfo">Footer VH: {{ displayStore.footerVh }}vh</p>
    </footer>

    <!-- Debug Toggle Button -->
    <button
      class="debug-toggle"
      @click="toggleDebugMode"
    >
      {{ displayStore.showInfo ? 'Hide Debug Info' : 'Show Debug Info' }}
    </button>

    <!-- Info Sheet Toggle -->
    <button
      class="info-toggle"
      @click="toggleInfoSheet"
      v-if="displayStore.showInfo"
    >
      Toggle Info Sheet
    </button>

    <!-- Info Sheet Display -->
    <div v-if="displayStore.showInfoSheet && displayStore.showInfo" class="info-sheet">
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

// Function to toggle the debug mode visibility
const toggleDebugMode = () => {
  displayStore.showInfo = !displayStore.showInfo
}

// Function to toggle the info sheet visibility
const toggleInfoSheet = () => {
  displayStore.showInfoSheet = !displayStore.showInfoSheet
}

// Function to handle key press for toggling debug mode
const handleKeyPress = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement
  const isInteractiveElement =
    ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable

  if (!isInteractiveElement && (event.key === 'd' || event.key === 'D')) {
    toggleDebugMode()
  }
}

// Ensure the viewport watcher and key press event are set up when the component mounts
onMounted(() => {
  displayStore.initializeViewportWatcher()
  window.addEventListener('keydown', handleKeyPress)
})

// Clean up the event listener when the component is destroyed
onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
  window.removeEventListener('keydown', handleKeyPress)
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

.header-overlay,
.sidebar-left-overlay,
.sidebar-right-overlay,
.main-content-overlay,
.footer-overlay {
  position: relative;
  background-color: rgba(0, 128, 255, 0.5); /* Light Blue */
  text-align: center;
  color: white;
  padding: 1rem;
}

.debug-box {
  border: none;
}

.debug-active {
  border: 2px dashed rgba(255, 255, 255, 0.8);
  background-color: rgba(0, 0, 0, 0.3); /* Highlight during debug mode */
}

.debug-toggle {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
}

.info-toggle {
  position: absolute;
  bottom: 60px;
  right: 20px;
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
}

.info-sheet {
  position: absolute;
  bottom: 100px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 20px;
  border-radius: 10px;
  font-size: 1rem;
  z-index: 1000;
}
</style>
