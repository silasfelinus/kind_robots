<template>
  <div class="main-layout h-screen relative box-border">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Grid Container: Header, Content, Sidebar (Left/Right), Footer -->
    <div
      class="grid h-screen w-screen box-border"
      :class="{
        'grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto]': true,
      }"
      :style="{
        'grid-template-areas': gridAreas,
      }"
    >
      <!-- Header (Top row, spans all columns) -->
      <header
        class="flex items-center justify-center z-30 w-full px-4 box-border"
        :style="{
          height: headerHeight,
          width: '100vw', // Ensure it spans the full viewport width
          gridArea: 'header',
        }"
      >
        <header-upgrade class="flex-grow text-center" />
      </header>

      <!-- Left Sidebar (Center and Bottom-Left cells) -->
      <aside
        class="relative z-20 transition-all duration-500 ease-in-out overflow-hidden box-border bg-info"
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
        class="p-4 z-10 overflow-hidden box-border bg-primary"
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
        class="z-20 transition-all duration-500 ease-in-out overflow-hidden box-border bg-info"
        :style="{
          width: sidebarRightWidth,
          height: sidebarHeight,
          gridArea: 'sidebar-right',
        }"
      >
        <splash-tutorial class="h-full w-full" />
      </aside>

      <!-- Footer (Center-bottom cell) -->
      <footer
        class="transition-transform duration-500 ease-in-out overflow-x-auto box-border bg-secondary"
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

const footerOpen = computed(() => displayStore.footerState === 'open')
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
  "sidebar-left footer sidebar-right"
`,
)
</script>
