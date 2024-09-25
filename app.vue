<template>
  <div class="main-layout absolute inset-0 pointer-events-none">
    <!-- Header -->
    <header
      class="header-overlay debug-box pointer-events-none"
      :style="{ height: displayStore.headerVh + 'vh' }"
    ></header>

    <!-- Main content area with sidebars and main content -->
    <div class="content-area">
      <aside
        class="sidebar-left-overlay debug-box pointer-events-none"
        :style="{
          width: displayStore.sidebarLeftVw + 'vw',
          height: displayStore.mainVh + 'vh'
        }"
      ></aside>

      <main
        class="main-content-overlay debug-box pointer-events-none"
        :style="{
          height: displayStore.mainVh + 'vh',
          width: displayStore.mainVw + 'vw'
        }"
      >
        <!-- Floating color-coded key in the center -->
        <div class="color-key absolute inset-0 flex justify-center items-center pointer-events-none">
          <div class="key-container bg-white p-4 rounded-lg shadow-md">
            <p><span class="color-box bg-red-500"></span> Header ({{ displayStore.headerVh }}vh)</p>
            <p><span class="color-box bg-blue-500"></span> Left Sidebar ({{ displayStore.sidebarLeftVw }}vw)</p>
            <p><span class="color-box bg-green-500"></span> Main Content ({{ displayStore.mainVw }}vw, {{ displayStore.mainVh }}vh)</p>
            <p><span class="color-box bg-yellow-500"></span> Right Sidebar ({{ displayStore.sidebarRightVw }}vw)</p>
            <p><span class="color-box bg-orange-500"></span> Footer ({{ displayStore.footerVh }}vh)</p>
          </div>
        </div>
      </main>

      <aside
        class="sidebar-right-overlay debug-box pointer-events-none"
        :style="{
          width: displayStore.sidebarRightVw + 'vw',
          height: displayStore.mainVh + 'vh'
        }"
      ></aside>
    </div>

    <!-- Footer -->
    <footer
      class="footer-overlay debug-box pointer-events-none"
      :style="{ height: displayStore.footerVh + 'vh' }"
    ></footer>

    <!-- Tick Overlay for every 20vh/20vw -->
    <div class="tick-overlay pointer-events-none"></div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-rows: auto 1fr auto; /* Header, Main Content, Footer */
  height: 100vh; /* Ensure the total height is always 100vh */
  overflow: hidden; /* Prevent any overflow */
}

.content-area {
  display: grid;
  grid-template-columns: 19vw 79vw 2vw; /* Left Sidebar, Main Content, Right Sidebar */
  height: 92vh; /* Consistent height for main content area */
  overflow: hidden; /* Prevent horizontal scrolling */
}

.header-overlay,
.sidebar-left-overlay,
.sidebar-right-overlay,
.main-content-overlay,
.footer-overlay {
  position: relative;
  text-align: center;
}

.header-overlay {
  background-color: #ff6f61; /* Red for header */
}

.sidebar-left-overlay {
  background-color: #6fa8dc; /* Blue for left sidebar */
}

.main-content-overlay {
  background-color: #76dd71; /* Green for main content */
  position: relative;
}

.sidebar-right-overlay {
  background-color: #f4d03f; /* Yellow for right sidebar */
}

.footer-overlay {
  background-color: #f39c12; /* Orange for footer */
}

.debug-box {
  border: 2px dashed rgba(255, 255, 255, 0.8); /* Visible debug border */
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

/* Floating color-coded key */
.color-key {
  pointer-events: none; /* Ensure it doesn't block interactions */
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

.bg-red-500 { background-color: #ff6f61; }
.bg-blue-500 { background-color: #6fa8dc; }
.bg-green-500 { background-color: #76dd71; }
.bg-yellow-500 { background-color: #f4d03f; }
.bg-orange-500 { background-color: #f39c12; }
</style>
