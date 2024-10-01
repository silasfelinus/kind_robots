<template>
  <div class="main-layout absolute inset-0 bg-base-300">
    <kind-loader></kind-loader>

    <!-- Header -->
    <header
      class="header-overlay bg-base-300 flex items-center justify-between w-full"
      :style="{ height: headerHeight }"
    >
      <div class="p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl"></sidebar-toggle>
      </div>

      <div class="flex-grow">
        <nav-links class="hidden sm:flex justify-center"></nav-links>
      </div>
    </header>

    <!-- Main content area -->
    <div
      class="content-area grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-0"
      :style="{ height: mainHeight }"
    >
      <!-- Sidebar left -->
      <kind-sidebar-simple
        class="sidebar-left-overlay overflow-y-auto bg-base-300 hidden md:block"
        :style="{ width: sidebarLeftWidth, height: mainHeight }"
      ></kind-sidebar-simple>

      <!-- Main content -->
      <main
        class="main-content-overlay rounded-2xl bg-base-300 overflow-y-auto"
        :style="{ height: mainHeight, width: mainWidth }"
      >
        <main-content />
      </main>

      <!-- Sidebar right -->
      <aside
        class="sidebar-right-overlay hidden md:block overflow-y-auto"
        :style="{ width: sidebarRightWidth, height: mainHeight }"
      ></aside>
    </div>

    <!-- Footer -->
    <footer class="footer-overlay" :style="{ height: footerHeight }"></footer>
  </div>

  <!-- Full-Screen Toggle Button -->
  <button
    v-if="isLargeViewport"
    class="flip-btn fixed bottom-4 right-4 bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 z-50 p-2"
    @click="toggleFullScreen"
  >
    {{ fullScreenButtonText }}
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDisplayStore } from './stores/displayStore'
import { useErrorStore, ErrorType } from './stores/errorStore'

const displayStore = useDisplayStore()
const errorStore = useErrorStore()

// Computed layout properties
const headerHeight = computed(() => displayStore.headerHeight)
const mainHeight = computed(() => displayStore.mainHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const mainWidth = computed(() => displayStore.mainWidth)
const isLargeViewport = computed(() => displayStore.viewportSize === 'large')
const fullScreenButtonText = computed(() =>
  displayStore.isFullScreen ? 'Exit Full Screen' : 'Full Screen',
)

// Toggle Fullscreen
const toggleFullScreen = () => {
  displayStore.toggleFullScreen()
}

// Initialization and error handling
onMounted(async () => {
  try {
    if (!displayStore.isInitialized) {
      await errorStore.handleError(
        async () => displayStore.initialize(),
        ErrorType.STORE_ERROR,
        'Error initializing display store',
      )
    }
  } catch (error) {
    errorStore.setError(
      ErrorType.STORE_ERROR,
      error instanceof Error ? error.message : 'Unknown error during mounting',
    )
  }
})
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  overflow: hidden;
}

.content-area {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0; /* No gap to respect height boundaries */
  overflow: hidden; /* Prevents double scrollbars */
}

@media (min-width: 768px) {
  .content-area {
    grid-template-columns: auto 1fr auto;
    gap: 0;
  }
}

.header-overlay,
.sidebar-left-overlay,
.sidebar-right-overlay,
.main-content-overlay,
.footer-overlay {
  position: relative;
  padding: 0;
}

.main-content-overlay {
  overflow-y: auto; /* Ensure scrolling only within the main content */
}

.sidebar-left-overlay,
.sidebar-right-overlay {
  overflow-y: auto; /* Allow scrolling within sidebars if content overflows */
}

.footer-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Flip button styling */
.flip-btn {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 50;
}
</style>
