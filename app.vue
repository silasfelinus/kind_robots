<template>
  <div class="main-layout h-screen bg-base-100">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Grid Container: Sidebar (Left), Content (Header, Main, Footer), Sidebar (Right) -->
    <div
      class="relative grid"
      :style="{
        gridTemplateRows: `${headerHeight} auto ${footerHeight}`,
        gridTemplateColumns: `${sidebarLeftWidth} 1fr ${sidebarRightWidth}`,
        height: '100vh',
      }"
    >
      <!-- Header (Fixed at the top, spans entire width except sidebars) -->
      <div
        class="bg-base-100 flex items-center justify-between p-2 z-30 fixed"
        :style="{
          gridColumn: '1 / -1', /* Span across all columns */
          left: '0px', /* Full width including sidebars */
          right: '0px',
          top: '0px',
          height: headerHeight,
        }"
      >
        <!-- Keep header content in header-upgrade component -->
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

      <!-- Main Content (Fixed below the header and above the footer) -->
      <main
        class="bg-base-100 p-2 rounded-2xl z-10 fixed"
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

      <!-- Footer (Fixed at the bottom of the screen, full width except sidebars) -->
      <footer
        class="flex fixed justify-center items-center bg-base-100 z-20"
        :style="{
          left: sidebarLeftWidth,
          right: sidebarRightWidth,
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

// Access layout-related data from displayStore
const displayStore = useDisplayStore()

// Layout dimensions
const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const isFullScreen = computed(() => displayStore.isFullScreen)
</script>

<style scoped>
/* Additional necessary styles for flip card interaction or specific layout handling */
.flip-card {
  perspective: 1500px;
  width: 100%;
  height: 100%;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 5px;
}

.flip-card-front {
  z-index: 2;
}

.flip-card-back {
  transform: rotateY(180deg);
  z-index: 1;
}
</style>
