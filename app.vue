<template>
  <div class="main-layout h-screen relative">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Grid Container: Sidebar (Left), Header, Content, Footer, Sidebar (Right) -->
    <div
      class="relative grid z-10"
      :style="{
        gridTemplateRows: `${headerHeight} auto ${footerHeight}`,
        gridTemplateColumns: `${sidebarLeftWidth} 1fr ${sidebarRightWidth}`,
        height: '100vh',
      }"
    >
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

      <!-- Header (Full width across all columns) -->
      <div
        class="bg-base-100 flex items-center justify-between p-2 z-30"
        :style="{
          gridColumn: '1 / -1' /* Span across all columns, left to right */,
          height: headerHeight,
        }"
      >
        <header-upgrade />
      </div>

      <!-- Main Content (Scrollable on Y-axis only) -->
      <main
        class="bg-base-100 p-2 z-10 overflow-y-auto"
        :style="{
          gridColumn: '2' /* Positioned between sidebars */,
          gridRow: '2' /* Content row */,
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
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
          gridColumn: '2' /* Positioned between sidebars */,
          gridRow: '3' /* Footer row */,
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
