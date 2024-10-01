<template>
  <div class="main-layout absolute inset-0 bg-base-300">
    <kind-loader></kind-loader>

    <!-- Header with Sidebar Toggle, Nav Links, and Kind Buttons -->
    <header
      class="header-overlay bg-base-300 flex items-center justify-between w-full h-auto p-2"
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

      <!-- Kind Buttons (Fullscreen/Two-column and Tutorial/NuxtPage) -->
      <div class="flex items-center space-x-2">
        <!-- Fullscreen / Two-column Toggle -->
        <button
          class="bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 p-2"
          @click="toggleFullScreen"
        >
          {{ fullScreenButtonText }}
        </button>

        <!-- Tutorial / NuxtPage Toggle -->
        <button
          class="bg-accent text-base-200 rounded-lg shadow-md hover:bg-accent-focus transition duration-300 p-2"
          @click="toggleTutorial"
        >
          Show {{ showTutorial ? 'Nuxt Page' : 'Tutorial' }}
        </button>
      </div>
    </header>

    <!-- Main content area -->
    <div
      class="content-area grid"
      :class="isFullScreen ? 'grid-cols-1' : 'md:grid-cols-1 lg:grid-cols-2'"
      :style="{ height: mainHeight }"
    >
      <!-- Sidebar left (only visible in two-column mode) -->
      <kind-sidebar-simple
        v-if="!isFullScreen"
        class="sidebar-left-overlay overflow-y-auto bg-base-300 hidden md:block"
        :style="{ width: sidebarLeftWidth, height: mainHeight }"
      ></kind-sidebar-simple>

      <!-- Main content view -->
      <main
        class="main-content-overlay rounded-2xl bg-base-300 overflow-y-auto"
        :style="{ height: mainHeight, width: isFullScreen ? '100%' : mainWidth }"
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
        <div v-else-if="isMediumViewport" class="flex justify-center items-center w-full h-full">
          <div v-if="showTutorial" class="tutorial-section">
            <SplashTutorial />
          </div>
          <div v-else class="launch-section">
            <NuxtPage />
          </div>
        </div>

        <!-- Large view: Two-column layout (if not full screen) -->
        <div v-else-if="isLargeViewport && !isFullScreen" class="grid grid-cols-2 w-full h-full">
          <div class="left-column p-4">
            <SplashTutorial />
          </div>
          <div class="right-column overflow-y-auto p-4">
            <NuxtPage />
          </div>
        </div>

        <!-- Fullscreen view: Full content area -->
        <div v-else-if="isFullScreen" class="flex justify-center items-center w-full h-full">
          <div v-if="showTutorial">
            <SplashTutorial />
          </div>
          <div v-else>
            <NuxtPage />
          </div>
        </div>
      </main>

      <!-- Sidebar right (just a placeholder space) -->
      <aside
        class="sidebar-right-overlay md:block overflow-y-auto"
        :style="{ width: sidebarRightWidth, height: mainHeight }"
      ></aside>
    </div>

    <!-- Footer -->
    <footer class="footer-overlay flex justify-center items-center" :style="{ height: footerHeight }"></footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Viewport conditions
const isMobileViewport = computed(() => displayStore.isMobileViewport)
const isMediumViewport = computed(() => displayStore.viewportSize === 'medium')
const isLargeViewport = computed(() => displayStore.isLargeViewport)
const showTutorial = computed(() => displayStore.showTutorial)
const isFullScreen = computed(() => displayStore.isFullScreen)
const footerHeight = computed (() => displayStore.footerHeight)

// Main height and width calculations based on available space
const mainHeight = computed(() => displayStore.mainHeight)
const mainWidth = computed(() => displayStore.mainWidth)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)

// Fullscreen / Two-column toggle button
const fullScreenButtonText = computed(() =>
  displayStore.isFullScreen ? 'Show Two Columns' : 'Show Full Screen'
)

const toggleFullScreen = () => {
  displayStore.toggleFullScreen()
}

// Tutorial / NuxtPage toggle button
const toggleTutorial = () => {
  displayStore.toggleTutorial()
}
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  overflow: hidden;
}

.content-area {
  display: grid;
  gap: 0;
  overflow: hidden;
}

.main-content-overlay {
  overflow-y: auto;
}

button {
  pointer-events: auto;
  transition: background-color 0.3s ease;
}

button:hover {
  cursor: pointer;
}
</style>
