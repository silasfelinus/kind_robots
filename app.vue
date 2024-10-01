<template>
  <div class="main-layout absolute inset-0 bg-base-300">
    <kind-loader></kind-loader>

    <!-- Header with Sidebar Toggle, Nav Links, and Kind Buttons -->
    <header
      class="bg-base-300 flex items-center justify-between w-full p-2 h-auto"
      :style="{ height: headerHeight }"
    >
      <!-- Sidebar Toggle -->
      <div class="p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl"></sidebar-toggle>
      </div>

      <!-- Navigation Links (Centered) -->
      <div class="flex flex-grow justify-center">
        <nav-links class="hidden sm:flex space-x-4"></nav-links>
      </div>

      <!-- Kind Buttons (Aligned to the right inside the header) -->
      <div class="flex items-center space-x-2">
        <kind-buttons class="kind-buttons"></kind-buttons>
      </div>
    </header>

    <!-- Main content area -->
    <div
      class="grid h-full"
      :class="{ 'grid-cols-1': isFullScreen, 'lg:grid-cols-2': !isFullScreen }"
      :style="{ height: mainHeight }"
    >
      <!-- Sidebar left (based on displayStore width) -->
      <kind-sidebar-simple
        class="overflow-y-auto bg-base-300"
        :style="{ width: sidebarLeftWidth, height: mainHeight }"
      ></kind-sidebar-simple>

      <!-- Main content view -->
      <main
        class="rounded-2xl bg-base-300 overflow-y-auto"
        :style="{ height: mainHeight, width: mainWidth }"
      >
        <!-- Mobile view: Single column layout -->
        <div v-if="isMobileViewport" class="flex flex-col w-full h-full">
          <div v-if="showTutorial" class="instructions">
            <SplashTutorial />
          </div>
          <div v-else class="launch">
            <NuxtPage />
          </div>
        </div>

        <!-- Medium view: Single column centered content -->
        <div
          v-else-if="isMediumViewport"
          class="flex justify-center items-center w-full h-full"
        >
          <div v-if="showTutorial" class="tutorial-section">
            <SplashTutorial />
          </div>
          <div v-else class="launch-section">
            <NuxtPage />
          </div>
        </div>

        <!-- Large/Extra-large view: Two-column layout (if not full screen) -->
        <div
          v-else-if="isLargeOrMore && !isFullScreen"
          class="grid grid-cols-2 w-full h-full"
        >
          <div class="left-column p-4">
            <SplashTutorial />
          </div>
          <div class="right-column overflow-y-auto p-4">
            <NuxtPage />
          </div>
        </div>

        <!-- Fullscreen view: Full content area -->
        <div
          v-else-if="isFullScreen"
          class="flex justify-center items-center w-full h-full"
        >
          <div v-if="showTutorial">
            <SplashTutorial />
          </div>
          <div v-else>
            <NuxtPage />
          </div>
        </div>
      </main>

      <!-- Sidebar right (based on displayStore width) -->
      <aside
        class="overflow-y-auto"
        :style="{ width: sidebarRightWidth, height: mainHeight }"
      ></aside>
    </div>

    <!-- Footer -->
    <footer
      class="flex justify-center items-center"
      :style="{ height: footerHeight }"
    ></footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Viewport conditions
const isMobileViewport = computed(() => displayStore.isMobileViewport)
const isMediumViewport = computed(() => displayStore.viewportSize === 'medium')
const isLargeOrMore = computed(() =>
  ['large', 'extraLarge'].includes(displayStore.viewportSize),
)
const showTutorial = computed(() => displayStore.showTutorial)
const isFullScreen = computed(() => displayStore.isFullScreen)

// Main height and width calculations based on available space
const mainHeight = computed(() => displayStore.mainHeight)
const mainWidth = computed(() => displayStore.mainWidth)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  overflow: hidden;
}

button:hover {
  cursor: pointer;
}
</style>
