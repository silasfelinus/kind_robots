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
      <div
        class="bg-base-100 flex items-left fixed justify-between w-full p-2 z-30"
        :style="{ height: headerHeight }"
      >
        <!-- Sidebar Toggle -->
        <div class="p-1 text-white flex-grow flex justify-center">
          <sidebar-toggle class="text-xl"></sidebar-toggle>
        </div>
        <header-upgrade />
      </div>

      <!-- Sidebar left (Fixed) -->
      <kind-sidebar-simple
        class="bg-base-100 fixed top-0 left-0 z-10"
        :style="{
          width: sidebarLeftWidth,
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
          top: headerHeight
        }"
      ></kind-sidebar-simple>

      <!-- Main Content (Scrollable within its boundaries) -->
      <main
        :class="{ 'flip-card': !isFullScreen && !isMobile }"
        class="bg-base-100 p-2 rounded-2xl z-10 overflow-hidden" 
        :style="{
          gridColumn: '2 / 3',
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
        }"
      >
        <div class="h-full overflow-y-auto">
          <!-- Mobile View (no flip card) -->
          <div v-if="isMobile">
            <SplashTutorial
              v-if="showTutorial"
              class="h-full w-full z-10 rounded-2xl"
            />
            <NuxtPage v-else class="h-full w-full z-10 rounded-2xl" />
          </div>

          <!-- Fullscreen mode (Desktop) -->
          <div v-else-if="isFullScreen" class="h-full rounded-2xl z-10">
            <NuxtPage class="h-full w-full" />
          </div>

          <!-- Flip-card mode (Desktop) -->
          <div
            v-else
            class="flip-card-inner h-full z-10"
            :class="{ 'is-flipped': !showTutorial }"
          >
            <div class="flip-card-front rounded-2xl h-full">
              <SplashTutorial class="h-full w-full" />
            </div>
            <div class="flip-card-back rounded-2xl overflow-y-auto z-10">
              <NuxtPage class="h-full w-full" />
            </div>
          </div>
          <tutorial-toggle />
        </div>
      </main>

      <!-- Sidebar right (Fixed) -->
      <aside
        class="bg-base-100 fixed top-0 right-0 z-20"
        :style="{
          width: sidebarRightWidth,
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
          top: headerHeight
        }"
      >
        <!-- Place second column content here when fullscreen -->
        <div v-if="isFullScreen" class="h-full w-full">
          <SplashTutorial class="h-full w-full" />
        </div>
      </aside>

      <!-- Footer -->
      <footer
        class="flex justify-center items-center"
        :style="{ gridRow: '3 / 4', height: footerHeight }"
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
  border: 2px solid var(--bg-base);
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
