<template>
  <div class="main-layout absolute inset-0 bg-base-300">
    <kind-loader></kind-loader>
    <!-- Header -->
    <header
      class="header-overlay bg-base-300 items-center justify-between"
      :style="{
        height: headerHeight,
      }"
    >
      <!-- Sidebar Toggle -->
      <div class="p-1 z-40 text-white ml-2">
        <sidebar-toggle class="text-4xl"></sidebar-toggle>
      </div>

      <!-- Navigation Links -->
      <nav-links class="flex-grow"></nav-links>
      <!-- Added margin to avoid overlapping with the sidebar toggle -->

      <!-- Tutorial and Back Buttons -->
      <button
        v-if="
          displayStore.showTutorial &&
          (displayStore.viewportSize === 'small' ||
            displayStore.viewportSize === 'medium')
        "
        class="bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-50 p-1 mr-2"
        @click="displayStore.toggleTutorial"
      >
        Launch
      </button>

      <button
        v-if="
          !displayStore.showTutorial &&
          (displayStore.viewportSize === 'small' ||
            displayStore.viewportSize === 'medium')
        "
        class="bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 p-1 mr-2"
        @click="displayStore.toggleTutorial"
      >
        Instructions
      </button>
    </header>

    <!-- Main content area with sidebars and main content -->
    <div
      class="content-area"
      :style="{
        gridTemplateColumns: gridColumns,
        height: mainHeight,
      }"
    >
      <kind-sidebar-simple
        class="sidebar-left-overlay overflow-y-auto bg-base-300"
        :style="{
          width: sidebarLeftWidth,
          height: mainHeight,
        }"
      ></kind-sidebar-simple>

      <main
        class="main-content-overlay rounded-2xl bg-base-300"
        :style="{
          height: mainHeight,
          width: mainWidth,
        }"
      >
        <main-flip></main-flip>
      </main>

      <aside
        class="sidebar-right-overlay"
        :style="{
          width: sidebarRightWidth,
          height: mainHeight,
        }"
      ></aside>
    </div>

    <!-- Footer -->
    <footer
      class="footer-overlay"
      :style="{
        height: footerHeight,
      }"
    ></footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Computed properties for reactive access to store data
const headerHeight = computed(
  () => `calc(var(--vh, 1vh) * ${displayStore.headerVh})`,
)
const mainHeight = computed(
  () => `calc(var(--vh, 1vh) * ${displayStore.mainVh})`,
)
const footerHeight = computed(
  () => `calc(var(--vh, 1vh) * ${displayStore.footerVh})`,
)
const sidebarLeftWidth = computed(() => `${displayStore.sidebarLeftVw}vw`)
const sidebarRightWidth = computed(() => `${displayStore.sidebarRightVw}vw`)
const mainWidth = computed(
  () =>
    `calc(100vw - ${displayStore.sidebarLeftVw}vw - ${displayStore.sidebarRightVw}vw)`,
)
const gridColumns = computed(
  () =>
    `${displayStore.sidebarLeftVw}vw calc(100vw - ${displayStore.sidebarLeftVw}vw - ${displayStore.sidebarRightVw}vw) ${displayStore.sidebarRightVw}vw`,
)

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
