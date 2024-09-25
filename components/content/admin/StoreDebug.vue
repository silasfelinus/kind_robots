<template>
  <div class="main-layout absolute inset-0 pointer-events-none">
    <!-- Unified layout and debug overlay -->
    <header
      class="header-overlay debug-box pointer-events-none"
      :class="{ 'debug-active': displayStore.showInfo }"
      :style="isDisplayStoreLayout
        ? { height: displayStore.headerVh + 'vh' }
        : { height: '6vh' }"
    >
      <p>Header</p>
      <p v-if="displayStore.showInfo">
        Header VH: {{ isDisplayStoreLayout ? displayStore.headerVh : 6 }}vh
      </p>
    </header>

    <!-- Main content area with sidebars and main content -->
    <div class="content-area">
      <aside
        class="sidebar-left-overlay debug-box pointer-events-none"
        :class="{ 'debug-active': displayStore.showInfo }"
        :style="isDisplayStoreLayout
          ? { width: displayStore.sidebarLeftVw + 'vw', height: displayStore.mainVh + 'vh' }
          : { width: '19vw', height: '92vh' }"
      >
        <p>Left Sidebar</p>
        <p v-if="displayStore.showInfo">Sidebar VW: {{ isDisplayStoreLayout ? displayStore.sidebarLeftVw : 19 }}vw</p>
        <p v-if="displayStore.showInfo">Sidebar VH: {{ isDisplayStoreLayout ? displayStore.mainVh : 92 }}vh</p>
      </aside>

      <main
        class="main-content-overlay debug-box pointer-events-none"
        :class="{ 'debug-active': displayStore.showInfo }"
        :style="isDisplayStoreLayout
          ? { height: displayStore.mainVh + 'vh', width: displayStore.mainVw + 'vw' }
          : { height: '92vh', width: '79vw' }"
      >
        <p>Main Content</p>
        <p v-if="displayStore.showInfo">Main Content VH: {{ isDisplayStoreLayout ? displayStore.mainVh : 92 }}vh</p>
        <p v-if="displayStore.showInfo">Main Content VW: {{ isDisplayStoreLayout ? displayStore.mainVw : 79 }}vw</p>
      </main>

      <aside
        class="sidebar-right-overlay debug-box pointer-events-none"
        :class="{ 'debug-active': displayStore.showInfo }"
        :style="isDisplayStoreLayout
          ? { width: displayStore.sidebarRightVw + 'vw', height: displayStore.mainVh + 'vh' }
          : { width: '2vw', height: '92vh' }"
      >
        <p>Right Sidebar</p>
        <p v-if="displayStore.showInfo">Sidebar VW: {{ isDisplayStoreLayout ? displayStore.sidebarRightVw : 2 }}vw</p>
        <p v-if="displayStore.showInfo">Sidebar VH: {{ isDisplayStoreLayout ? displayStore.mainVh : 92 }}vh</p>
      </aside>
    </div>

    <footer
      class="footer-overlay debug-box pointer-events-none"
      :class="{ 'debug-active': displayStore.showInfo }"
      :style="isDisplayStoreLayout
        ? { height: displayStore.footerVh + 'vh' }
        : { height: '2vh' }"
    >
      <p>Footer</p>
      <p v-if="displayStore.showInfo">Footer VH: {{ isDisplayStoreLayout ? displayStore.footerVh : 2 }}vh</p>
    </footer>

    <!-- Tick Overlay for every 20vh/20vw -->
    <div class="tick-overlay pointer-events-none"></div>

    <!-- Debug Toggle Button -->
    <button class="debug-toggle pointer-events-auto" @click="toggleDebugMode">
      {{ displayStore.showInfo ? 'Hide Debug Info' : 'Show Debug Info' }}
    </button>

    <!-- Layout Toggle Buttons -->
    <button class="layout-toggle pointer-events-auto" @click="toggleLayout">
      {{ isDisplayStoreLayout ? 'Use Hardcoded Layout' : 'Use Display Store Layout' }}
    </button>

    <!-- Info Sheet Toggle -->
    <button
      v-if="displayStore.showInfo"
      class="info-toggle pointer-events-auto"
      @click="toggleInfoSheet"
    >
      Toggle Info Sheet
    </button>

    <!-- Info Sheet Display -->
    <div
      v-if="displayStore.showInfoSheet && displayStore.showInfo"
      class="info-sheet pointer-events-auto"
    >
      <p>Header VH: {{ isDisplayStoreLayout ? displayStore.headerVh : 6 }}vh</p>
      <p>Sidebar Left VW: {{ isDisplayStoreLayout ? displayStore.sidebarLeftVw : 19 }}vw</p>
      <p>Sidebar Left VH: {{ isDisplayStoreLayout ? displayStore.mainVh : 92 }}vh</p>
      <p>Sidebar Right VW: {{ isDisplayStoreLayout ? displayStore.sidebarRightVw : 2 }}vw</p>
      <p>Sidebar Right VH: {{ isDisplayStoreLayout ? displayStore.mainVh : 92 }}vh</p>
      <p>Main Content VH: {{ isDisplayStoreLayout ? displayStore.mainVh : 92 }}vh</p>
      <p>Main Content VW: {{ isDisplayStoreLayout ? displayStore.mainVw : 79 }}vw</p>
      <p>Footer VH: {{ isDisplayStoreLayout ? displayStore.footerVh : 2 }}vh</p>
      <p>Viewport: {{ displayStore.viewportSize }}</p>
      <p>Touch Device: {{ displayStore.isTouchDevice ? 'Yes' : 'No' }}</p>
      <p>Vertical Layout: {{ displayStore.isVertical ? 'Yes' : 'No' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize the store
const displayStore = useDisplayStore()

// Toggle between dynamic displayStore layout and hardcoded layout
const isDisplayStoreLayout = ref(true)
const toggleLayout = () => {
  isDisplayStoreLayout.value = !isDisplayStoreLayout.value
}

// Toggle debug info display
const toggleDebugMode = () => {
  displayStore.showInfo = !displayStore.showInfo
}

// Toggle info sheet display
const toggleInfoSheet = () => {
  displayStore.showInfoSheet = !displayStore.showInfoSheet
}

// Handle key press for toggling debug mode
const handleKeyPress = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement
  const isInteractiveElement = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable

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
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
}

.content-area {
  display: grid;
  grid-template-columns: auto 1fr auto;
  height: 100%;
  width: 100%;
}

.header-overlay,
.sidebar-left-overlay,
.sidebar-right-overlay,
.main-content-overlay,
.footer-overlay {
  position: relative;
  text-align: center;
  color: white;
}

.header-overlay {
  background-color: #ff6f61; /* Red for header */
}

.sidebar-left-overlay {
  background-color: #6fa8dc; /* Blue for left sidebar */
}

.main-content-overlay {
  background-color: #76dd71; /* Green for main content */
}

.sidebar-right-overlay {
  background-color: #f4d03f; /* Yellow for right sidebar */
}

.footer-overlay {
  background-color: #f39c12; /* Orange for footer */
}

.debug-box {
  border: none;
}

.debug-active {
  border: 2px dashed rgba(255, 255, 255, 0.8);
  background-color: rgba(0, 0, 0, 0.1); /* Transparent highlight during debug mode */
}

.tick-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.5) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
  background-size: 20vw 20vh;
  pointer-events: none;
}

.debug-toggle,
.layout-toggle,
.info-toggle {
  position: absolute;
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
}

.debug-toggle {
  bottom: 20px;
  right: 20px;
}

.layout-toggle {
  bottom: 60px;
  right: 20px;
}

.info-toggle {
  bottom: 100px;
  right: 20px;
}

.info-sheet {
  position: absolute;
  bottom: 140px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 20px;
  border-radius: 10px;
  font-size: 1rem;
  z-index: 1000;
}
</style>
