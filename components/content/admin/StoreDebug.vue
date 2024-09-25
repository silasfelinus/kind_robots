<template>
  <div id="app" class="flex flex-col h-screen w-screen bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isPageReady" @page-ready="handlePageReady" />

    <!-- Header -->
    <header class="header-overlay debug-box" :style="{ height: displayStore.headerVh + 'vh' }">
      <p>Header</p>
      <p v-if="displayStore.showInfo">
        Header VH: {{ displayStore.headerVh }}vh
      </p>
    </header>

    <!-- Main Layout Wrapper -->
    <div class="flex flex-grow">
      <!-- Left Sidebar -->
      <aside class="sidebar-left-overlay debug-box" :style="{ width: displayStore.sidebarLeftVw + 'vw', height: displayStore.mainVh + 'vh' }">
        <p>Left Sidebar</p>
        <p v-if="displayStore.showInfo">
          Sidebar VW: {{ displayStore.sidebarLeftVw }}vw
        </p>
      </aside>

      <!-- Main Content Area -->
      <main class="main-content-overlay debug-box flex-grow">
        <p>Main Content</p>
        <p v-if="displayStore.showInfo">
          Main Content VH: {{ displayStore.mainVh }}vh
        </p>
        <p v-if="displayStore.showInfo">
          Main Content VW: {{ displayStore.mainVw }}vw
        </p>
      </main>

      <!-- Right Sidebar -->
      <aside class="sidebar-right-overlay debug-box" :style="{ width: displayStore.sidebarRightVw + 'vw', height: displayStore.mainVh + 'vh' }">
        <p>Right Sidebar</p>
        <p v-if="displayStore.showInfo">
          Right Sidebar VW: {{ displayStore.sidebarRightVw }}vw
        </p>
      </aside>
    </div>

    <!-- Footer -->
    <footer class="footer-overlay debug-box" :style="{ height: displayStore.footerVh + 'vh' }">
      <p>Footer</p>
      <p v-if="displayStore.showInfo">
        Footer VH: {{ displayStore.footerVh }}vh
      </p>
    </footer>

    <!-- Debug Toggle Button -->
    <button class="debug-toggle" @click="toggleDebugMode">
      {{ displayStore.showInfo ? 'Hide Debug Info' : 'Show Debug Info' }}
    </button>

    <!-- Info Sheet Toggle -->
    <button v-if="displayStore.showInfo" class="info-toggle" @click="toggleInfoSheet">
      Toggle Info Sheet
    </button>

    <!-- Info Sheet Display -->
    <div v-if="displayStore.showInfoSheet && displayStore.showInfo" class="info-sheet">
      <p>Header VH: {{ displayStore.headerVh }}vh</p>
      <p>Sidebar Left VW: {{ displayStore.sidebarLeftVw }}vw</p>
      <p>Sidebar Right VW: {{ displayStore.sidebarRightVw }}vw</p>
      <p>Main Content VH: {{ displayStore.mainVh }}vh</p>
      <p>Main Content VW: {{ displayStore.mainVw }}vw</p>
      <p>Footer VH: {{ displayStore.footerVh }}vh</p>
      <p>Viewport: {{ displayStore.viewportSize }}</p>
      <p>Touch Device: {{ displayStore.isTouchDevice ? 'Yes' : 'No' }}</p>
      <p>Vertical Layout: {{ displayStore.isVertical ? 'Yes' : 'No' }}</p>
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
  flex-grow: 1;
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
