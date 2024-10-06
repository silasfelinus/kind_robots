<template>
  <div class="main-layout h-screen bg-base-100">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

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
        class="bg-base-100 flex items-left justify-between w-full p-2 z-30"
        :style="{ height: headerHeight }"
      >
        <!-- Sidebar Toggle -->
        <div class="p-1 text-white flex-grow flex justify-center">
          <sidebar-toggle class="text-xl" />
        </div>
        <header-upgrade />
      </div>

      <!-- Sidebar left (Fixed, no scrolling) -->
      <kind-sidebar-simple
        class="bg-base-100 fixed top-0 left-0 z-10"
        :style="{
          width: sidebarLeftWidth,
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
          top: headerHeight
        }"
      />

      <!-- Main Content (Now App.vue defines gridColumn) -->
      <main
        class="bg-base-100 p-2 rounded-2xl z-10 overflow-hidden"
        :style="{
          gridColumn: '2 / 3',
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
          paddingTop: headerHeight,
          paddingBottom: footerHeight,
        }"
      >
        <main-content />
      </main>

      <!-- Sidebar right (Scrollable if content overflows) -->
      <aside
        class="bg-base-100 fixed top-0 right-0 z-20 overflow-y-auto"
        :style="{
          width: sidebarRightWidth,
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
          top: headerHeight
        }"
      >
        <div v-if="isFullScreen" class="h-full w-full">
          <SplashTutorial class="h-full w-full" />
        </div>
      </aside>

      <!-- Footer (Static, no scrolling) -->
      <footer
        class="flex justify-center items-center bg-base-100 z-20"
        :style="{ gridRow: '3 / 4', height: footerHeight }"
      >
        <!-- Minimalistic Tutorial Toggle -->
        <fullscreen-toggle class="text-sm px-2 py-1 rounded-lg bg-primary text-white" />
      </footer>
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