<template>
  <div class="main-layout h-screen relative">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Grid Container: Header, Content, Sidebar (Left/Right), Footer -->
    <div
      class="grid h-screen bg-base-100"
      :style="{
        'grid-template-columns': gridColumns,
        'grid-template-rows': gridRows,
        'grid-template-areas': gridAreas,
      }"
    >
      <!-- Header (Top row, spans all columns) -->
      <header
        class="flex items-center justify-center z-30"
        :style="{
          height: headerHeight,
          gridArea: 'header',
        }"
      >
        <header-upgrade class="flex-grow text-center" />
      </header>

      <!-- Left Sidebar (Center and Bottom-Left cells) -->
      <aside
        class="relative z-20 transition-all duration-500 ease-in-out overflow-hidden"
        :style="{
          width: sidebarLeftWidth,
          height: sidebarHeight,
          gridArea: 'sidebar-left',
        }"
      >
        <kind-sidebar-simple class="flex-grow" />
      </aside>

      <!-- Main Content (Center-middle cell) -->
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

      <!-- Right Sidebar (Center and Bottom-Right cells) -->
      <aside
        class="z-20 transition-all duration-500 ease-in-out overflow-hidden"
        :style="{
          width: sidebarRightWidth,
          height: sidebarHeight,
          gridArea: 'sidebar-right',
        }"
      >
        <kind-sidebar-right class="h-full w-full" />
      </aside>

      <!-- Footer (Center-bottom cell) -->
      <footer
        class="transition-transform duration-500 ease-in-out"
        :style="{
          height: footerHeight,
          gridArea: 'footer',
        }"
      >
        <horizontal-nav />
      </footer>
    </div>
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

// Define grid structure for 3x3 layout
const gridColumns = computed(() => {
  return `${sidebarLeftWidth.value} 1fr ${sidebarRightWidth.value}` // Left sidebar, main content, right sidebar
})

const gridRows = computed(() => {
  return `${headerHeight.value} 1fr ${footerHeight.value}` // Header row, main content row, footer row
})

// Define grid areas for the layout
const gridAreas = computed(
  () => `
  "header header header"
  "sidebar-left main sidebar-right"
  "sidebar-left footer sidebar-right"
`,
)
</script>

<style scoped>
/* Additional styles for transition and effects */
</style>
