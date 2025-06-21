<!-- /components/content/admin/store-debug.vue -->
<template>
  <div class="display-debug fixed inset-0 pointer-events-none">
    <!-- Header -->
    <header
      class="header-overlay debug-box"
      :style="{ height: displayStore.headerHeight }"
    ></header>

    <!-- Main content with sidebars -->
    <div
      class="content-area grid"
      :style="{
        gridTemplateColumns: `${displayStore.sidebarLeftWidth} 1fr ${displayStore.sidebarRightWidth}`,
        height: displayStore.mainContentHeight,
      }"
    >
      <!-- Left Sidebar -->
      <aside
        class="sidebar-left-overlay debug-box"
        :style="{ width: displayStore.sidebarLeftWidth }"
      ></aside>

      <!-- Main Content -->
      <main class="main-content-overlay debug-box">
        <div
          class="color-key absolute inset-0 flex justify-center items-center"
        >
          <div class="key-container bg-white p-4 rounded-lg shadow-md">
            <p>
              <span class="color-box bg-red-500"></span> Header ({{
                displayStore.headerHeight
              }})
            </p>
            <p>
              <span class="color-box bg-blue-500"></span> Left Sidebar ({{
                displayStore.sidebarLeftWidth
              }})
            </p>
            <p>
              <span class="color-box bg-green-500"></span> Main Content ({{
                displayStore.mainContentWidth
              }}, {{ displayStore.mainContentHeight }})
            </p>
            <p>
              <span class="color-box bg-yellow-500"></span> Right Sidebar ({{
                displayStore.sidebarRightWidth
              }})
            </p>
            <p>
              <span class="color-box bg-orange-500"></span> Footer ({{
                displayStore.footerHeight
              }})
            </p>
            <p>Header State: {{ displayStore.headerState }}</p>
            <p>Sidebar Left: {{ displayStore.sidebarLeftState }}</p>
            <p>Sidebar Right: {{ displayStore.sidebarRightState }}</p>
            <p>Footer State: {{ displayStore.footerState }}</p>
            <p>Viewport: {{ displayStore.viewportSize }}</p>
            <p>Touch Device: {{ displayStore.isTouchDevice ? 'Yes' : 'No' }}</p>
          </div>
        </div>
      </main>

      <!-- Right Sidebar -->
      <aside
        class="sidebar-right-overlay debug-box"
        :style="{ width: displayStore.sidebarRightWidth }"
      ></aside>
    </div>

    <!-- Footer -->
    <footer
      class="footer-overlay debug-box"
      :style="{ height: displayStore.footerHeight }"
    ></footer>

    <!-- Tick Grid Overlay -->
    <div class="tick-overlay"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Function to set a custom --vh CSS variable for mobile
const setCustomVh = () => {
  if (typeof window !== 'undefined') {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
}

onMounted(() => {
  setCustomVh()
  window.addEventListener('resize', setCustomVh)
  displayStore.initialize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', setCustomVh)
})
</script>

<style scoped>
.display-debug {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.content-area {
  display: grid;
}

.debug-box {
  border: 2px dashed rgba(255, 255, 255, 0.8);
  position: relative;
  text-align: center;
}

.header-overlay {
  background-color: rgba(255, 111, 97, 0.5); /* Red */
}

.sidebar-left-overlay {
  background-color: rgba(111, 168, 220, 0.5); /* Blue */
}

.main-content-overlay {
  background-color: rgba(118, 221, 113, 0.5); /* Green */
}

.sidebar-right-overlay {
  background-color: rgba(244, 208, 63, 0.5); /* Yellow */
}

.footer-overlay {
  background-color: rgba(243, 156, 18, 0.5); /* Orange */
}

/* Grid Overlay */
.tick-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.5) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
  background-size: 20vw 20vh;
  pointer-events: none;
}

/* Debug Key */
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

/* Colors */
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
