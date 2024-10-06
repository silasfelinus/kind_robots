<template>
  <div class="main-layout h-screen bg-base-100">
    <!-- Loaders -->
    <kind-loader></kind-loader>
    <animation-loader></animation-loader>

    <!-- Grid Container: Starts right after loaders -->
    <div
      class="grid"
      :style="{
        gridTemplateRows: `${headerHeight} 1fr ${footerHeight}`,
        gridTemplateColumns: `${sidebarLeftWidth} 1fr ${sidebarRightWidth}`,
        height: '100vh',
      }"
    >
      <!-- Header -->
      <header
        class="bg-base-100 flex items-center fixed w-full p-2 z-20"
        :style="{
          gridRow: '1 / 2',
          gridColumn: '1 / 4', /* Spans left sidebar, main content, right sidebar */,
          height: headerHeight,
        }"
      >
        <div class="flex items-center justify-start space-x-4 w-full">
          <!-- Sidebar Toggle -->
          <div class="p-1 text-white flex-shrink-0">
            <sidebar-toggle class="text-4xl"></sidebar-toggle>
          </div>

          <!-- Banner -->
          <header-upgrade class="flex-grow"></header-upgrade>
        </div>
      </header>

      <!-- Sidebar left -->
      <kind-sidebar-simple
        class="bg-base-100 fixed"
        :style="{ gridRow: '2 / 3', gridColumn: '1 / 2', width: sidebarLeftWidth }"
      ></kind-sidebar-simple>

      <!-- Main content -->
      <main
        :class="{ 'flip-card': !isFullScreen && !isMobile }"
        class="bg-base-100 p-2 rounded-2xl z-20 overflow-y-auto relative"
        :style="{
          gridRow: '2 / 3',
          gridColumn: '2 / 3',
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
        }"
      >
        <!-- Mobile View (no flip card) -->
        <div v-if="isMobile">
          <SplashTutorial v-if="showTutorial" class="h-full w-full z-30 rounded-2xl" />
          <NuxtPage v-else class="h-full w-full z-30 rounded-2xl" />
        </div>

        <!-- Fullscreen mode (Desktop) -->
        <div v-else-if="isFullScreen" class="rounded-2xl w-full h-full">
          <SplashTutorial v-if="showTutorial" class="h-full w-full z-30 rounded-2xl" />
          <NuxtPage v-else class="h-full w-full z-30 rounded-2xl" />
        </div>

        <!-- Flip-card mode (Desktop) -->
        <div v-else class="flip-card-inner" :class="{ 'is-flipped': !showTutorial }">
          <div class="flip-card-front rounded-2xl z-10">
            <SplashTutorial class="h-full w-full" />
          </div>
          <div class="flip-card-back rounded-2xl overflow-y-auto z-10">
            <NuxtPage class="h-full w-full" />
          </div>
        </div>

        <!-- Tutorial toggle button -->
        <tutorial-toggle />
      </main>

      <!-- Sidebar right -->
      <aside
        class="bg-base-100 fixed right-0 z-10"
        :style="{
          gridRow: '2 / 3',
          gridColumn: '3 / 4',
          top: headerHeight,
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
          width: sidebarRightWidth,
        }"
      >
        <!-- Display second column content in sidebar when fullscreen -->
        <div v-if="isFullScreen" class="h-full w-full overflow-y-auto">
          <SplashTutorial v-if="showTutorial" class="h-full w-full" />
          <NuxtPage v-else class="h-full w-full" />
        </div>
      </aside>

      <!-- Footer -->
      <footer
        class="flex justify-center items-center"
        :style="{ gridRow: '3 / 4', gridColumn: '1 / 4', height: footerHeight }"
      ></footer>
    </div>
  </div>
  <fullscreen-toggle />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access display store
const displayStore = useDisplayStore()

// Fullscreen and tutorial state
const showTutorial = computed(() => displayStore.showTutorial)
const isFullScreen = computed(() => displayStore.isFullScreen)

// Layout dimensions
const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)

// Mobile detection
const isMobile = computed(() => displayStore.isMobileViewport)
</script>

<style scoped>
/* Flip-card style */
.flip-card {
  perspective: 1500px; /* Increased perspective for a more pronounced flip effect */
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
  backface-visibility: hidden; /* Ensures the backface is not visible */
  border: 2px solid var(--bg-base);
  border-radius: 5px;
}

.flip-card-front {
  z-index: 2; /* Ensure the front side is on top when flipped */
}

.flip-card-back {
  transform: rotateY(180deg);
  z-index: 1; /* Keep back side behind the front side */
}
</style>
