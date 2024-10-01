<template>
  <div class="grid grid-rows-[auto_1fr_auto] h-screen bg-base-300">
    <!-- Header with Sidebar Toggle and Navigation Links -->
    <header
      class="flex items-center justify-between w-full bg-base-300 p-2"
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

      <!-- Kind Buttons for Fullscreen / Tutorial Toggle -->
      <kind-buttons class="flex items-center space-x-2" />
    </header>

    <!-- Main content area with dynamic grid -->
    <div
      class="grid overflow-hidden"
      :class="isTwoColumnMode ? 'grid-cols-[1fr_auto]' : 'grid-cols-1'"
      :style="{ height: mainHeight }"
    >
      <!-- Sidebar left (visible in two-column mode) -->
      <kind-sidebar-simple
        v-if="isTwoColumnMode"
        class="hidden md:block bg-base-300 overflow-y-auto"
        :style="{ width: sidebarLeftWidth, height: mainHeight }"
      ></kind-sidebar-simple>

      <!-- Main Content -->
      <main
        class="bg-base-300 overflow-y-auto rounded-2xl p-4"
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

        <!-- Medium view: Centered content -->
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

        <!-- Large view: Two-column layout (main content divided into two columns) -->
        <div v-else-if="isTwoColumnMode" class="grid grid-cols-2 w-full h-full">
          <div class="p-4">
            <SplashTutorial />
          </div>
          <div class="overflow-y-auto p-4">
            <NuxtPage />
          </div>
        </div>

        <!-- Fullscreen view: Show either Tutorial or Nuxt Page -->
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

      <!-- Right Sidebar (space reserved, but no interaction with the main content) -->
      <aside
        v-if="isTwoColumnMode"
        class="hidden md:block bg-base-300"
        :style="{ width: sidebarRightWidth, height: mainHeight }"
      ></aside>
    </div>

    <!-- Footer -->
    <footer
      class="flex justify-center items-center"
      :style="{ height: footerHeight }"
    >
      <!-- Footer content here -->
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access display store to manage layout
const displayStore = useDisplayStore()

// Viewport conditions
const isMobileViewport = computed(() => displayStore.isMobileViewport)
const isMediumViewport = computed(() => displayStore.viewportSize === 'medium')
const isLargeViewport = computed(() => displayStore.isLargeViewport)
const showTutorial = computed(() => displayStore.showTutorial)
const isFullScreen = computed(() => displayStore.isFullScreen)

// Determine if the layout should show two columns (Tutorial + NuxtPage)
const isTwoColumnMode = computed(
  () => isLargeViewport.value && !isFullScreen.value,
)

// Layout dimensions
const headerHeight = computed(() => displayStore.headerHeight)
const mainHeight = computed(() => displayStore.mainHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const mainWidth = computed(() => displayStore.mainWidth)
</script>
