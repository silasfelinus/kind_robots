<template>
  <div class="main-layout h-screen relative">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Grid Container: Header, Content, Sidebar (Left/Right) -->
    <div
      class="grid h-screen bg-base-100"
      :style="{
        'grid-template-columns': gridColumns,
        'grid-template-rows': gridRows,
        'grid-template-areas': gridAreas,
      }"
    >
      <!-- Header (Spans full width, centered content) -->
      <header
        class="flex items-center justify-center z-30"
        :style="{
          height: headerHeight,
          gridArea: 'header',
        }"
      >
        <header-upgrade class="flex-grow text-center" />
      </header>

      <!-- Left Sidebar (Subtract only the header height) -->
      <aside
        class="relative z-20 transition-all duration-500 ease-in-out overflow-hidden"
        :style="{
          width: sidebarLeftWidth,
          height: sidebarHeight, // Use sidebarHeight instead of mainHeight
          gridArea: 'sidebar-left',
        }"
      >
        <kind-sidebar-simple class="flex-grow" />
      </aside>

      <!-- Main Content (Subtract both header and footer heights) -->
      <main
        class="p-4 z-10 overflow-y-auto"
        :style="{
          gridArea: 'main',
          height: mainHeight,
        }"
        :class="{
          'transition-all duration-300': true,
        }"
      >
        <main-content />
      </main>

      <!-- Right Sidebar (Subtract only the header height) -->
      <aside
        class="z-20 transition-all duration-500 ease-in-out overflow-hidden"
        :style="{
          width: sidebarRightWidth,
          height: sidebarHeight, // Use sidebarHeight instead of mainHeight
          gridArea: 'sidebar-right',
        }"
      >
        <div v-if="isFullScreen" class="h-full w-full">
          <SplashTutorial class="h-full w-full" />
        </div>
      </aside>
    </div>

    <!-- Footer (Positioned below main content, not sidebars) -->
    <footer
      class="fixed bottom-0 left-0 w-full transition-transform duration-500 ease-in-out"
      :style="{
        height: footerHeight,
        transform:
          displayStore.footerState === 'open'
            ? 'translateY(0)'
            : 'translateY(100%)',
      }"
    >
      <horizontal-nav v-if="displayStore.footerState === 'open'" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore for managing the layout state
const displayStore = useDisplayStore()

// Compute layout heights and widths based on store state
const headerHeight = computed(() => displayStore.headerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const footerHeight = computed(() => displayStore.footerHeight)

// Calculate the height of the main content area dynamically based on the viewport
const mainHeight = computed(() => {
  return `calc(100vh - ${headerHeight.value} - ${footerHeight.value})`
})

// Calculate the height of the sidebars (subtract only the header height)
const sidebarHeight = computed(() => {
  return `calc(100vh - ${headerHeight.value})`
})

// Define grid structure with explicit areas for the header, sidebars, and main content
const gridColumns = computed(() => {
  return `${sidebarLeftWidth.value} 1fr ${sidebarRightWidth.value}` // Left sidebar, main content, right sidebar
})

const gridRows = computed(() => {
  return `${headerHeight.value} 1fr` // Header row, main content row (footer excluded)
})

// Define grid areas for the layout
const gridAreas = computed(
  () => `
  "header header header"
  "sidebar-left main sidebar-right"
`,
)

const isFullScreen = computed(() => displayStore.isFullScreen)
</script>

<style scoped>
/* Additional styles for transition and effects */
</style>
