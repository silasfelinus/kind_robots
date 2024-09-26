<template>
  <div class="main-layout absolute inset-0 bg-base-300">
    <!-- Loader Component -->
    <div>
      <kind-loader></kind-loader>
    </div>

    <!-- Header -->
    <header
      class="header-overlay bg-base-300 flex items-center justify-between w-full px-4"
      :style="{ height: headerHeight }"
    >
      <!-- Sidebar Toggle -->
      <div class="p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl"></sidebar-toggle>
      </div>

      <!-- Navigation Links (centered in the row) -->
      <div class="flex-grow">
        <nav-links class="hidden sm:flex justify-center"></nav-links>
      </div>

      <!-- Launch/Instructions Buttons (right-aligned in the row) -->
      <button
        v-if="showLaunchButton"
        class="bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-50 p-1"
        @click="displayStore.toggleTutorial"
      >
        Launch
      </button>

      <button
        v-if="showInstructionsButton"
        class="bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 p-1"
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
      <!-- Left Sidebar -->
      <kind-sidebar-simple
        class="sidebar-left-overlay overflow-y-auto bg-base-300"
        :style="{
          width: sidebarLeftWidth,
          height: mainHeight,
        }"
      ></kind-sidebar-simple>

      <!-- Main Content -->
      <main
        class="main-content-overlay rounded-2xl bg-base-300"
        :style="{
          height: mainHeight,
          width: mainWidth,
        }"
      >
        <main-flip></main-flip>
      </main>

      <!-- Right Sidebar -->
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

// Computed properties for button visibility
const showLaunchButton = computed(() => {
  return (
    displayStore.showTutorial &&
    ['small', 'medium'].includes(displayStore.viewportSize)
  )
})

const showInstructionsButton = computed(() => {
  return (
    !displayStore.showTutorial &&
    ['small', 'medium'].includes(displayStore.viewportSize)
  )
})

// Function to set a custom --vh CSS variable to handle mobile devices like iPads
const setCustomVh = () => {
  if (typeof window !== 'undefined') {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    setCustomVh()
    if (!displayStore.isInitialized) {
      window.addEventListener('resize', setCustomVh)
      displayStore.initialize()
    }
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', setCustomVh)
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
