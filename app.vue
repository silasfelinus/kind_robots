<template>
  <div class="main-layout absolute inset-0 pointer-events-none">
    <kind-loader />
    <!-- Header -->
    <header
      class="header-overlay"
      :style="{
        height: 'calc(var(--vh, 1vh) * ' + displayStore.headerVh + ')',
      }"
    >
      <!-- Sidebar Toggle -->
      <div class="absolute top-2 left-4 p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl" />
      </div>

      <!-- Navigation Links -->
      <nav-links class="flex-grow ml-16" />
      <!-- Added margin to avoid overlapping with the sidebar toggle -->

      <!-- Tutorial and Back Buttons -->
      <button
        v-if="displayStore.showTutorial"
        class="bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-50 p-2 mr-4"
        @click="displayStore.toggleTutorial"
      >
        Launch
      </button>

      <button
        v-else
        class="bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 p-2 mr-4"
        @click="displayStore.toggleTutorial"
      >
        Instructions
      </button>
    </header>

    <!-- Main content area with sidebars and main content -->
    <div
      class="content-area"
      :style="{
        gridTemplateColumns: `${displayStore.sidebarLeftVw}vw calc(100vw - ${displayStore.sidebarLeftVw}vw - ${displayStore.sidebarRightVw}vw) ${displayStore.sidebarRightVw}vw`,
        height: 'calc(var(--vh, 1vh) * ' + displayStore.mainVh + ')',
      }"
    >
      <kind-sidebar-simple
        class="sidebar-left-overlay overflow-y-auto"
        :style="{
          width: displayStore.sidebarLeftVw + 'vw',
          height: 'calc(var(--vh, 1vh) * ' + displayStore.mainVh + ')',
        }"
      ></kind-sidebar-simple>

      <main
        class="main-content-overlay rounded-2xl bg-base-300 overflow-y-auto"
        :style="{
          height: 'calc(var(--vh, 1vh) * ' + displayStore.mainVh + ')',
          width: `calc(100vw - ${displayStore.sidebarLeftVw}vw - ${displayStore.sidebarRightVw}vw)`,
        }"
      >
        <MainFlip />
      </main>

      <aside
        class="sidebar-right-overlay"
        :style="{
          width: displayStore.sidebarRightVw + 'vw',
          height: 'calc(var(--vh, 1vh) * ' + displayStore.mainVh + ')',
        }"
      ></aside>
    </div>

    <!-- Footer -->
    <footer
      class="footer-overlay"
      :style="{
        height: 'calc(var(--vh, 1vh) * ' + displayStore.footerVh + ')',
      }"
    ></footer>
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
    // Check if we're in the browser
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
}

// Initialize the viewport state and load previous states
onMounted(() => {
  setCustomVh() // Set custom vh on mount if in the browser
  window.addEventListener('resize', setCustomVh) // Update custom vh on resize if in the browser
  displayStore.initialize() // Initialize store settings
})

// Remove the viewport watcher on component unmount
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    // Only clean up in the browser
    window.removeEventListener('resize', setCustomVh) // Clean up the listener
  }
  displayStore.removeViewportWatcher()
})
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-rows: auto 1fr auto; /* Header, Main Content, Footer */
  height: calc(var(--vh, 1vh) * 100); /* Custom height using var(--vh) */
  overflow: hidden; /* Prevent any overflow */
}

.content-area {
  display: grid;
  grid-template-columns: 1fr; /* Dynamically handled by inline styles */
  overflow: hidden; /* Prevent horizontal scrolling */
}

.header-overlay,
.sidebar-left-overlay,
.sidebar-right-overlay,
.main-content-overlay,
.footer-overlay {
  position: relative;
  text-align: center;
  padding: 0; /* Ensure no padding */
}
</style>
