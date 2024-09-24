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
  </div>
</template>


<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'
import { onMounted, onBeforeUnmount } from 'vue'

// Initialize the store
const displayStore = useDisplayStore()

// Function to handle key press
const handleKeyPress = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement

  // Check if the target element is an input, textarea, or contenteditable
  const isInteractiveElement =
    ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable

  // Only toggle if 'D' is pressed and the target is not an interactive element
  if (!isInteractiveElement && (event.key === 'd' || event.key === 'D')) {
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

<style.header-overlay,
.sidebar-left-overlay,
.sidebar-right-overlay,
.main-content-overlay,
.footer-overlay {
  position: relative;
  background-color: rgba(0, 128, 255, 0.5);
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

.content-area {
  display: flex;
  flex: 1;
  height: 100%;
}

</style>
