<template>
  <div class="main-layout absolute inset-0 bg-base-300">
    <kind-loader></kind-loader>
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

      <!-- Full-Screen Toggle Button (Visible on large screens only) -->
      <button
        v-if="isLargeViewport"
        class="bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 z-40 p-1 ml-4"
        @click="displayStore.toggleFullScreen"
      >
        {{ displayStore.isFullScreen ? 'Two Columns' : 'Full Screen' }}
      </button>

      <!-- Launch Button -->
      <button
        v-if="showLaunchButton"
        class="bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-40 p-1 ml-4 mr-4"
        @click="displayStore.toggleTutorial"
      >
        Launch
      </button>

      <!-- Instructions Button -->
      <button
        v-if="showInstructionsButton"
        class="bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-40 p-1 ml-4"
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
import { useErrorStore, ErrorType } from './stores/errorStore'
import { computed, onMounted } from 'vue'
import { useDisplayStore } from './stores/displayStore'

const displayStore = useDisplayStore()
const errorStore = useErrorStore()

// Computed properties
const isLargeViewport = computed(() => displayStore.mainVw > 1024) // Adjust breakpoint as needed
const headerHeight = computed(
  () => `calc(var(--vh, 1vh) * ${displayStore.headerVh})`,
)
const mainHeight = computed(
  () => `calc(var(--vh, 1vh) * ${displayStore.mainVh})`,
)
const footerHeight = computed(
  () => `calc(var(--vh, 1vh) * ${displayStore.footerVh})`,
)
const gridColumns = computed(() => displayStore.gridColumns) // Use displayStore getter

const sidebarLeftWidth = computed(() => `${displayStore.sidebarLeftVw}vw`)
const sidebarRightWidth = computed(() => `${displayStore.sidebarRightVw}vw`)
const mainWidth = computed(
  () =>
    `calc(100vw - ${displayStore.sidebarLeftVw}vw - ${displayStore.sidebarRightVw}vw)`,
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
  grid-template-rows: auto 1fr auto; /* Header, Main Content, Footer */
  height: 100vh;
  overflow: hidden;
}

.content-area {
  display: grid;
  overflow: hidden;
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
</style>
