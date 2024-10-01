<template>
  <div class="main-layout absolute inset-0 bg-base-300">
    <kind-loader></kind-loader>

    <!-- Header with Sidebar Toggle, Nav Links, and Kind Buttons -->
    <header
      class="header-overlay bg-base-300 flex items-center justify-between w-full h-auto p-2"
      :style="{ height: headerHeight }"
    >
      <!-- Sidebar Toggle -->
      <div class="p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl"></sidebar-toggle>
      </div>

      <!-- Navigation Links (Centered) -->
      <div class="flex flex-grow justify-center">
        <nav-links class="hidden sm:flex space-x-4"></nav-links>
      </div>
    </header>

    <!-- Main content area -->
    <div
      class="content-area grid"
      :class="isFullScreen ? 'grid-cols-1' : 'md:grid-cols-[auto_1fr_auto]'"
      :style="{ height: mainHeight }"
    >
      <!-- Sidebar left (only visible in two-column mode) -->
      <kind-sidebar-simple
        v-if="!isFullScreen"
        class="sidebar-left-overlay overflow-y-auto bg-base-300 hidden md:block"
        :style="{ width: sidebarLeftWidth, height: mainHeight }"
      ></kind-sidebar-simple>

      <!-- Main content -->
      <main
        class="main-content-overlay rounded-2xl bg-base-300 overflow-y-auto"
        :style="{
          height: mainHeight,
          width: isFullScreen ? '100%' : mainWidth,
        }"
      >
        <main-content />
      </main>

      <!-- Sidebar right (only visible in two-column mode) -->
      <aside
        v-if="!isFullScreen"
        class="sidebar-right-overlay hidden md:block overflow-y-auto"
        :style="{ width: sidebarRightWidth, height: mainHeight }"
      ></aside>
    </div>

    <!-- Footer -->
    <footer
      class="footer-overlay flex justify-center items-center"
      :style="{ height: footerHeight }"
    ></footer>
  </div>
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
const isFullScreen = computed(() => displayStore.isFullScreen)

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
  gap: 0;
  overflow: hidden;
}

.main-content-overlay {
  overflow-y: auto;
}

.sidebar-left-overlay,
.sidebar-right-overlay {
  overflow-y: auto;
}
</style>
