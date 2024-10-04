<template>
  <div class="main-layout h-screen bg-base-100">
    <!-- Loaders -->
    <kind-loader></kind-loader>
    <animation-loader></animation-loader>

    <!-- Grid Container: Starts right after loaders -->
    <div
      class="grid"
      :style="{
        gridTemplateRows: `${headerHeight} auto ${footerHeight}`,
        gridTemplateColumns: `${sidebarLeftWidth} 1fr ${sidebarRightWidth}`,
        height: '100vh',
      }"
    >
      <!-- Header -->
      <header
        class="bg-base-100 flex items-center fixed justify-between w-full p-2 z-10"
        :style="{ gridRow: '1 / 2', height: headerHeight }"
      >
        <!-- Sidebar Toggle -->
        <div class="p-1 text-white flex-grow flex justify-center">
          <sidebar-toggle class="text-4xl"></sidebar-toggle>
        </div>

        <!-- Nav Links -->
        <div class="flex-grow flex justify-center items-center space-x-4">
          <nav-links></nav-links>
        </div>
      </header>

      <!-- Sidebar left -->
      <kind-sidebar-simple
        class="bg-base-100 overflow-y-hidden"
        :style="{ gridRow: '2 / 3', width: sidebarLeftWidth }"
      ></kind-sidebar-simple>

      <main
        :class="{ 'flip-card': !isFullScreen && !isMobile }"
        class="bg-base-100 p-2 rounded-2xl z-10"
        :style="{
          gridRow: '2 / 3',
          gridColumn: '2 / 3',
          height: mainHeight,
        }"
      >
        <!-- Mobile View (no flip card) -->
        <div v-if="isMobile">
          <SplashTutorial
            v-if="showTutorial"
            class="h-full w-full z-10 rounded-2xl"
          />
          <NuxtPage v-else class="h-full w-full z-10 rounded-2xl" />
        </div>

        <!-- Fullscreen mode (Desktop) -->
        <div
          v-else-if="isFullScreen"
          class="grid grid-cols-2 gap-4 rounded-2xl w-full h-full"
        >
          <div class="h-full rounded-2xl z-10">
            <SplashTutorial class="h-full w-full" />
          </div>
          <div class="h-full rounded-2xl z-10">
            <NuxtPage class="h-full w-full" />
          </div>
        </div>

        <!-- Flip-card mode (Desktop) -->
        <div
          v-else
          class="flip-card-inner"
          :class="{ 'is-flipped': !showTutorial }"
        >
          <div class="flip-card-front rounded-2xl">
            <SplashTutorial class="h-full w-full" />
          </div>
          <div class="flip-card-back overflow-y-auto rounded-2xl">
            <NuxtPage class="h-full w-full" />
          </div>
        </div>
      </main>

      <!-- Sidebar right -->
      <aside
        class="bg-base-100"
        :style="{ gridRow: '2 / 3', width: sidebarRightWidth }"
      ></aside>

      <!-- Footer -->
      <footer
        class="flex justify-center items-center"
        :style="{ gridRow: '3 / 4', height: footerHeight }"
      ></footer>
    </div>
  </div>
  <kind-buttons></kind-buttons>
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
const mainHeight = computed(() => displayStore.mainHeight)
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
