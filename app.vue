<template>
  <div class="main-layout bg-primary">
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <Analytics />
      <animation-loader class="fixed z-50" />
    </div>

    <!-- Header (only shown if header is not hidden) -->
    <header
      v-if="!displayStore.isFullScreen"
      class="header"
      :style="headerStyle"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Main Layout -->
    <div class="content-wrapper">
      <!-- Left Sidebar -->
      <aside
        v-show="sidebarLeftVisible"
        class="sidebar left"
        :style="leftSidebarStyle"
      >
        <kind-sidebar-simple class="h-full w-full" />
      </aside>

      <!-- Center Column (ModeRow + NuxtPage + Footer) -->
      <div class="center-column">
        <div class="mode-row" :style="modeRowStyle">
          <mode-row />
        </div>

        <main class="main-content" :style="mainContentStyle">
          <NuxtPage :key="$route.fullPath" />
        </main>

        <footer v-show="footerVisible" class="footer" :style="footerStyle">
          <horizontal-nav class="h-full w-full" />
        </footer>
      </div>

      <!-- Right Sidebar -->
      <aside
        v-show="sidebarRightVisible"
        class="sidebar right"
        :style="rightSidebarStyle"
      >
        <splash-tutorial class="h-full w-full" />
      </aside>
    </div>

    <!-- Footer Toggle -->
    <div class="footer-toggle">
      <footer-toggle />
    </div>

    <!-- Milestone Popup -->
    <milestone-popup />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const sidebarLeftVisible = computed(() => displayStore.sidebarLeftVisible)
const sidebarRightVisible = computed(() => displayStore.sidebarRightVisible)
const footerVisible = computed(() => displayStore.footerVisible)

const headerStyle = computed(() => displayStore.headerStyle)
const leftSidebarStyle = computed(() => displayStore.leftSidebarStyle)
const rightSidebarStyle = computed(() => displayStore.rightSidebarStyle)
const footerStyle = computed(() => displayStore.footerStyle)

// ModeRow sits directly above NuxtPage
const modeRowStyle = computed(() => ({
  marginBottom: '16px',
  zIndex: 15,
}))

// Ensure NuxtPage is correctly positioned below modeRow
const mainContentStyle = computed(() => ({
  flexGrow: 1,
  padding: '16px',
  zIndex: 10,
}))
</script>

<style scoped>
/* Main Layout */
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  box-sizing: border-box;
}

/* Header */
.header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.5s ease-in-out;
}

/* Content Wrapper: Grid layout */
.content-wrapper {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr auto;
  height: 100%; /* Ensure it fully takes up space */
  width: 100%;
}

/* Right Sidebar */
.sidebar.right {
  grid-column: 3 / 4;
  grid-row: 1 / 3;
  z-index: 10;
  height: 100%; /* Ensure it takes up the full row height */
  transition: all 0.6s ease-in-out;
  overflow: visible; /* Ensure no clipping */
}

/* Center Column */
.center-column {
  display: flex;
  flex-direction: column;
  grid-column: 2 / 3;
  grid-row: 1 / 3;
  width: 100%;
  min-height: 0; /* Allow flexibility */
}

/* Main Content */
.main-content {
  flex-grow: 1;
  z-index: 10;
  transition: all 0.6s ease-in-out;
  padding: 16px;
  min-height: 0; /* Prevent unwanted overflow */
}

/* Left Sidebar */
.sidebar.left {
  grid-column: 1 / 2;
  grid-row: 1 / 3;
  z-index: 10;
  transition: all 0.3s ease-in-out;
}

/* ModeRow */
.mode-row {
  display: flex;
  justify-content: center;
  z-index: 15;
  transition: all 0.5s ease-in-out;
}

/* Footer */
.footer {
  z-index: 10;
  box-sizing: border-box;
  transition: all 0.6s ease-in-out;
  background-color: rgba(0, 0, 0, 0.2);
}

/* Footer Toggle */
.footer-toggle {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
}
</style>
