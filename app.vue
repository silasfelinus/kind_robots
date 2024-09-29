<template>
  <div class="main-layout absolute inset-0 bg-base-300">
    <kind-loader></kind-loader>

    <!-- Header -->
    <header
      class="header-overlay bg-base-300 flex items-center justify-between w-full px-4"
      :style="{ height: headerHeight }"
    >
      <div class="p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl"></sidebar-toggle>
      </div>

      <div class="flex-grow">
        <nav-links class="hidden sm:flex justify-center"></nav-links>
      </div>

      <button
        v-if="isLargeViewport"
        class="bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 z-40 p-1 ml-4"
        @click="displayStore.toggleFullScreen"
      >
        {{ displayStore.isFullScreen ? 'Two Columns' : 'Full Screen' }}
      </button>

      <button
        v-if="showLaunchButton"
        class="bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-40 p-1 ml-4 mr-4"
        @click="displayStore.toggleTutorial"
      >
        Launch
      </button>

      <button
        v-if="showInstructionsButton"
        class="bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-40 p-1 ml-4"
        @click="displayStore.toggleTutorial"
      >
        Instructions
      </button>
    </header>

    <!-- Main content area -->
    <div
      class="content-area"
      :style="{ gridTemplateColumns: gridColumns, height: mainHeight }"
    >
      <kind-sidebar-simple
        class="sidebar-left-overlay overflow-y-auto bg-base-300"
        :style="{ width: sidebarLeftWidth, height: mainHeight }"
      ></kind-sidebar-simple>

      <main
        class="main-content-overlay rounded-2xl bg-base-300"
        :style="{ height: mainHeight, width: mainWidth }"
      >
        <main-flip></main-flip>
      </main>

      <aside
        class="sidebar-right-overlay"
        :style="{ width: sidebarRightWidth, height: mainHeight }"
      ></aside>
    </div>

    <footer class="footer-overlay" :style="{ height: footerHeight }"></footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDisplayStore } from './stores/displayStore'
import { useErrorStore, ErrorType } from './stores/errorStore'

const displayStore = useDisplayStore()
const errorStore = useErrorStore()

const isLargeViewport = computed(() => displayStore.isLargeViewport)
const headerHeight = computed(() => displayStore.headerHeight)
const mainHeight = computed(() => displayStore.mainHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const gridColumns = computed(() => displayStore.gridColumns)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const mainWidth = computed(() => displayStore.mainWidth)

// Button visibility
const showLaunchButton = computed(
  () =>
    displayStore.showTutorial &&
    ['small', 'medium'].includes(displayStore.viewportSize),
)
const showInstructionsButton = computed(
  () =>
    !displayStore.showTutorial &&
    ['small', 'medium'].includes(displayStore.viewportSize),
)

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
