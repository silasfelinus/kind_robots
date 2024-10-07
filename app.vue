<template>
  <div class="main-layout h-screen relative">
    <!-- Gradient Background (Full screen, absolute) -->
    <gradient-background class="absolute inset-0 z-0" />
    
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Grid Container: Sidebar (Left), Content (Header, Main, Footer), Sidebar (Right) -->
    <div
      class="relative grid z-10"  <!-- Ensure the grid is above the background -->
      :style="{
        gridTemplateRows: `${headerHeight} auto ${footerHeight}`,
        gridTemplateColumns: `${sidebarLeftWidth} 1fr ${sidebarRightWidth}`,
        height: '100vh',
      }"
    >
      <!-- Header (Full width, not fixed) -->
      <div
        class="bg-base-100 flex items-center justify-between p-2 z-30"
        :style="{
          gridColumn: '1 / -1', /* Span across all columns */
          height: headerHeight,
        }"
      >
        <header-upgrade />
      </div>

      <!-- Sidebar left (Fixed, full height, positioned under the header) -->
      <kind-sidebar-simple
        class="bg-base-100 fixed"
        :style="{
          left: '0px',
          top: headerHeight,
          width: sidebarLeftWidth,
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
        }"
      />

      <!-- Main Content (Scrollable on Y-axis only) -->
      <main
        class="bg-base-100 p-2 z-10 overflow-y-auto"
        :style="{
          left: sidebarLeftWidth,
          right: sidebarRightWidth,
          top: headerHeight,
          bottom: footerHeight,
        }"
      >
        <main-content />
      </main>

      <!-- Sidebar right (Fixed, full height, scrollable if content overflows) -->
      <aside
        class="bg-base-100 fixed"
        :style="{
          right: '0px',
          top: headerHeight,
          width: sidebarRightWidth,
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
        }"
      >
        <div v-if="isFullScreen" class="h-full w-full">
          <SplashTutorial class="h-full w-full" />
        </div>
      </aside>

      <!-- Footer (Full width except sidebars) -->
      <footer
        class="flex justify-center items-center bg-base-100 z-20"
        :style="{
          gridColumn: '2', /* Between sidebars */
          bottom: '0px',
          height: footerHeight,
        }"
      ></footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Layout dimensions
const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const isFullScreen = computed(() => displayStore.isFullScreen)
</script>

<style scoped>
/* Gradient Background Styling */
.gradient-background {
  position: absolute;
  height: 100vh;
  width: 100vw;
  z-index: 0;
}
</style>
