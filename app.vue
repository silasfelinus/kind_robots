<template>
  <div class="main-layout h-screen relative">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Grid Container: Header, Content, Footer, Sidebar (Right) -->
    <div
      class="grid h-screen bg-base-100"
      :style="{
        'grid-template-columns': gridColumns,
        'grid-template-rows': gridRows,
        'grid-template-areas': gridAreas,
      }"
    >
      <!-- Header (Spans full width) -->
      <header
        class="flex items-center justify-between p-4 z-30"
        :style="{
          height: headerHeight,
          gridArea: 'header',
        }"
      >
        <!-- Header Content -->
        <header-upgrade class="flex-grow text-center text-white" />
      </header>

      <!-- Left Sidebar -->
      <aside
        class="z-20 transition-all duration-500 ease-in-out"
        :style="{
          width: sidebarLeftWidth,
          gridArea: 'sidebar-left',
        }"
      >
        <!-- Sidebar Left Content Here -->
      </aside>

      <!-- Main Content -->
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

      <!-- Right Sidebar -->
      <aside
        class="z-20 transition-all duration-500 ease-in-out"
        :style="{
          width: sidebarRightWidth,
          gridArea: 'sidebar-right',
        }"
      >
        <!-- Sidebar Content (e.g., Tutorial) -->
        <div v-if="isFullScreen" class="h-full w-full">
          <SplashTutorial class="h-full w-full" />
        </div>
      </aside>

      <!-- Footer (Optional, sliding in from the bottom) -->
      <footer
        v-if="displayStore.footerState === 'open'"
        class="fixed bottom-0 w-full transition-transform duration-500 ease-in-out"
        :style="{
          height: footerHeight,
          transform: displayStore.footerState === 'open' ? 'translateY(0)' : 'translateY(100%)',
        }"
      >
        <!-- Footer Content -->
    <FooterIcon />
      </footer>
    </div>

    <!-- Footer Toggle Icon Component -->

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'


const displayStore = useDisplayStore()

// Computed values for layout dimensions
const headerHeight = computed(() => displayStore.headerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const mainHeight = computed(() => displayStore.mainHeight)
const footerHeight = computed(() => displayStore.footerHeight)

// Grid columns and rows setup based on store dimensions
const gridColumns = computed(() => displayStore.gridColumns)
const gridRows = computed(() => {
  return `${headerHeight.value} 1fr ${footerHeight.value}` // Header row, main row, footer row
})

// Set grid areas to ensure each section is explicitly placed in the layout
const gridAreas = computed(
  () => `
  "header header header"
  "sidebar-left main sidebar-right"
  "footer footer footer"
`,
)

const isFullScreen = computed(() => displayStore.isFullScreen)
</script>

<style scoped>
/* Additional transitions or effects can be added here */
</style>
