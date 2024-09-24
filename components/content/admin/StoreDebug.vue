<template>
  <div class="main-layout absolute">
    <!-- Header with overlay -->
    <header
      class="header-overlay"
      :style="{ height: displayStore.headerVh + 'vh' }"
    >
      <p>Header</p>
    </header>

    <!-- Main content area with sidebars and main content -->
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

    <!-- Footer with overlay -->
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

    <!-- New section position debug overlay -->
    <div v-if="displayStore.showInfo" class="section-overlay">
      <!-- Header Overlay -->
      <div class="overlay-header debug-box">
        <p>Header</p>
      </div>
      <!-- Left Sidebar Overlay -->
      <div
        v-if="displayStore.sidebarLeft === 'open'"
        class="overlay-sidebar-left debug-box"
      >
        <p>Left Sidebar</p>
      </div>
      <!-- Main Content Overlay -->
      <div class="overlay-main-content debug-box">
        <p>Main Content</p>
      </div>
      <!-- Right Sidebar Overlay -->
      <div
        v-if="displayStore.sidebarRight === 'open'"
        class="overlay-sidebar-right debug-box"
      >
        <p>Right Sidebar</p>
      </div>
      <!-- Footer Overlay -->
      <div class="overlay-footer debug-box">
        <p>Footer</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'
import { onMounted, onBeforeUnmount } from 'vue'

// Initialize the store
const displayStore = useDisplayStore()

// Function to handle key press
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'd' || event.key === 'D') {
    displayStore.showInfo = !displayStore.showInfo
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

/* Debug overlay for section positions */
.section-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none; /* Ensure it doesn't affect clicks */
}

.debug-box {
  position: absolute;
  border: 2px dashed rgba(255, 255, 255, 0.8);
  color: white;
  text-align: center;
  z-index: 9999;
  font-size: 1.2rem;
  pointer-events: none; /* Don't block interactions */
}

/* Specific overlay section positions */
.overlay-header {
  top: 0;
  left: 0;
  width: 100%;
  height: var(--header-height, 20vh);
  background-color: rgba(0, 128, 255, 0.3);
}

.overlay-sidebar-left {
  top: var(--header-height, 20vh);
  left: 0;
  width: var(--sidebar-width, 20vw);
  height: calc(100vh - var(--header-height, 20vh) - var(--footer-height, 10vh));
  background-color: rgba(255, 165, 0, 0.3);
}

.overlay-main-content {
  top: var(--header-height, 20vh);
  left: var(--sidebar-width, 20vw);
  width: calc(100vw - var(--sidebar-width, 20vw) * 2);
  height: calc(100vh - var(--header-height, 20vh) - var(--footer-height, 10vh));
  background-color: rgba(144, 238, 144, 0.3);
}

.overlay-sidebar-right {
  top: var(--header-height, 20vh);
  right: 0;
  width: var(--sidebar-width, 20vw);
  height: calc(100vh - var(--header-height, 20vh) - var(--footer-height, 10vh));
  background-color: rgba(255, 165, 0, 0.3);
}

.overlay-footer {
  bottom: 0;
  left: 0;
  width: 100%;
  height: var(--footer-height, 10vh);
  background-color: rgba(255, 69, 0, 0.3);
}
</style>
