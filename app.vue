<template>
  <div class="main-layout h-screen relative box-border bg-primary">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Grid Container: Header, Content, Right Sidebar, Footer, Navbar-Toggle -->
    <div
      class="grid h-screen w-screen box-border"
      :style="{
        'grid-template-areas': gridAreas,
        'grid-template-columns': gridColumns,
        'grid-template-rows': gridRows,
      }"
    >
      <!-- Header (Top row, spans all columns) -->
      <header
        class="flex items-center justify-center z-30 w-full box-border"
        :style="{
          height: headerHeight,
          width: '100vw',
          gridArea: 'header',
        }"
      >
        <header-upgrade class="flex-grow text-center" />
      </header>

      <!-- Left Sidebar (Center-left cell) -->
      <aside
        class="relative z-20 transition-all duration-500 ease-in-out overflow-hidden box-border"
        :style="{
          width: sidebarLeftWidth,
          height: sidebarHeight,
          gridArea: 'sidebar-left',
        }"
      >
        <kind-sidebar-simple v-if="sidebarLeftOpen" />
      </aside>

      <!-- Main Content (Center-middle cell) -->
      <main
        class="p-1 z-10 overflow-hidden box-border bg-primary"
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
        class="z-20 transition-all duration-500 ease-in-out overflow-hidden box-border"
        :style="{
          width: sidebarRightWidth,
          height: sidebarHeight,
          gridArea: 'sidebar-right',
        }"
      >
        <splash-tutorial v-if="showTutorial" class="h-full w-full" />
      </aside>

<!-- Navbar Toggle (Bottom-Left Corner) -->
      <div
        class="absolute bottom-4 left-4 p-2 bg-accent rounded-full box-border shadow-lg z-30"
        :style="{ gridArea: 'navbar-toggle' }"
      >
        <navbar-toggle />
      </div>

      <!-- Footer (Center-bottom cell) -->
      <footer
        class="transition-transform duration-500 ease-in-out overflow-x-auto box-border"
        :style="{
          height: footerHeight,
          gridArea: 'footer',
          maxWidth:
            'calc(100vw - ' +
            sidebarLeftWidth +
            ' - ' +
            sidebarRightWidth +
            ')',
        }"
      >
        <horizontal-nav v-if="footerOpen" />
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
const showTutorial = computed(() => displayStore.showTutorial)

const footerOpen = computed(() => displayStore.footerState === 'open')
const sidebarLeftOpen = computed(
  () => displayStore.sidebarLeftState !== 'hidden',
)

// Calculate the height of the main content area dynamically based on the viewport
const mainHeight = computed(() => {
  return `calc(100vh - ${headerHeight.value} - ${footerHeight.value})`
})

// Calculate the height of the sidebars (subtract only the header height)
const sidebarHeight = computed(() => {
  return `calc(100vh - ${headerHeight.value})`
})

// Define grid areas for the layout
const gridAreas = computed(
  () => `
  "header header header"
  "sidebar-left main sidebar-right"
  "navbar-toggle footer sidebar-right"
`,
)

// Define explicit grid rows and columns
const gridRows = computed(
  () => `
  ${headerHeight.value} 1fr ${footerHeight.value}
`,
)

const gridColumns = computed(
  () => `
  ${sidebarLeftWidth.value} 1fr ${sidebarRightWidth.value}
`,
)
</script>

<style scoped>
/* Additional styles if needed */
</style>
