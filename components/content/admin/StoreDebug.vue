<template>
  <div class="display-debug fixed inset-0 pointer-events-none">
    <!-- Header -->
    <header
      class="header-overlay debug-box"
      :style="{
        height: displayStore.headerHeight,
      }"
    ></header>

    <!-- Main content area with sidebars and main content -->
    <div
      class="content-area grid"
      :style="{
        gridTemplateColumns: `${displayStore.sidebarLeftWidth} calc(100vw - ${displayStore.sidebarLeftWidth} - ${displayStore.sidebarRightWidth}) ${displayStore.sidebarRightWidth}`,
        height: displayStore.centerHeight,
      }"
    >
      <!-- Left Sidebar -->
      <aside
        class="sidebar-left-overlay debug-box"
        :style="{
          width: displayStore.sidebarLeftWidth,
          height: displayStore.centerHeight,
        }"
      ></aside>

      <!-- Main Content -->
      <main
        class="main-content-overlay debug-box"
        :style="{
          height: displayStore.centerHeight,
          width: `calc(100vw - ${displayStore.sidebarLeftWidth} - ${displayStore.sidebarRightWidth})`,
        }"
      >
        <!-- Floating color-coded key in the center -->
        <div
          class="color-key absolute inset-0 flex justify-center items-center"
        >
          <div class="key-container bg-white p-4 rounded-lg shadow-md">
            <p>
              <span class="color-box bg-red-500"></span> Header ({{
                displayStore.headerVh
              }}vh)
            </p>
            <p>
              <span class="color-box bg-blue-500"></span> Left Sidebar ({{
                displayStore.sidebarLeftVw
              }}vw)
            </p>
            <p>
              <span class="color-box bg-green-500"></span> Main Content ({{
                displayStore.mainVw
              }}vw, {{ displayStore.mainVh }}vh)
            </p>
            <p>
              <span class="color-box bg-yellow-500"></span> Right Sidebar ({{
                displayStore.sidebarRightVw
              }}vw)
            </p>
            <p>
              <span class="color-box bg-orange-500"></span> Footer ({{
                displayStore.footerVh
              }}vh)
            </p>
            <!-- Add detailed display state information -->
            <p>Header State: {{ displayStore.headerState }}</p>
            <p>Left Sidebar State: {{ displayStore.sidebarLeftState }}</p>
            <p>Right Sidebar State: {{ displayStore.sidebarRightState }}</p>
            <p>Footer State: {{ displayStore.footerState }}</p>
            <p>Viewport Size: {{ displayStore.viewportSize }}</p>
            <p>Is Vertical: {{ displayStore.isVertical ? 'Yes' : 'No' }}</p>
            <p>
              Is Touch Device: {{ displayStore.isTouchDevice ? 'Yes' : 'No' }}
            </p>
          </div>
        </div>
      </main>

      <!-- Right Sidebar -->
      <aside
        class="sidebar-right-overlay debug-box"
        :style="{
          width: displayStore.sidebarRightWidth,
          height: displayStore.centerHeight,
        }"
      ></aside>
    </div>

    <!-- Footer -->
    <footer
      class="footer-overlay debug-box"
      :style="{
        height: displayStore.footerHeight,
      }"
    ></footer>

    <!-- Tick Overlay for every 20vh/20vw -->
    <div class="tick-overlay"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize the display store
const displayStore = useDisplayStore()

// Function to set a custom --vh CSS variable to handle mobile devices like iPads
const setCustomVh = () => {
  if (typeof window !== 'undefined') {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
}

// Initialize the viewport state and load previous states
onMounted(() => {
  setCustomVh() // Set custom vh on mount
  window.addEventListener('resize', setCustomVh) // Update on resize
  displayStore.initialize() // Initialize store settings
})

// Remove the viewport watcher on component unmount
onBeforeUnmount(() => {
  window.removeEventListener('resize', setCustomVh) // Clean up listener
})
</script>

<style scoped>
.screen-debug {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none; /* Prevent interaction with debug */
}

.content-area {
  display: grid;
  grid-template-columns: 1fr; /* Dynamically handled by inline styles */
}

.header-overlay,
.sidebar-left-overlay,
.sidebar-right-overlay,
.main-content-overlay,
.footer-overlay {
  position: relative;
  text-align: center;
  padding: 0;
}

.header-overlay {
  background-color: rgba(255, 111, 97, 0.5); /* Red with 50% opacity */
}

.sidebar-left-overlay {
  background-color: rgba(111, 168, 220, 0.5); /* Blue with 50% opacity */
}

.main-content-overlay {
  background-color: rgba(118, 221, 113, 0.5); /* Green with 50% opacity */
}

.sidebar-right-overlay {
  background-color: rgba(244, 208, 63, 0.5); /* Yellow with 50% opacity */
}

.footer-overlay {
  background-color: rgba(243, 156, 18, 0.5); /* Orange with 50% opacity */
}

.debug-box {
  border: 2px dashed rgba(255, 255, 255, 0.8);
}

.tick-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.5) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
  background-size: 20vw 20vh;
  pointer-events: none;
}

.color-key {
  pointer-events: none;
}

.key-container {
  text-align: left;
  font-size: 0.9rem;
}

.color-box {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 8px;
  vertical-align: middle;
}

.bg-red-500 {
  background-color: #ff6f61;
}
.bg-blue-500 {
  background-color: #6fa8dc;
}
.bg-green-500 {
  background-color: #76dd71;
}
.bg-yellow-500 {
  background-color: #f4d03f;
}
.bg-orange-500 {
  background-color: #f39c12;
}
</style>
