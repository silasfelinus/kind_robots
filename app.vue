<template>
  <div class="main-layout absolute inset-0 bg-base-300">
    <kind-loader></kind-loader>
    <animation-loader></animation-loader>

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
      <div class="flex items-center lg:flex-row space-x-2">
        <kind-buttons class="kind-buttons"></kind-buttons>
      </div>
    </header>

    <!-- Main content area -->
    <div
      class="grid h-full"
      :class="isFullScreen ? 'grid-cols-2' : 'grid-cols-[auto_1fr_auto]'"
      :style="{ height: mainHeight }"
    >
      <!-- Sidebar left -->
      <kind-sidebar-simple
        class="overflow-y-auto bg-base-300"
        :style="{ width: sidebarLeftWidth, height: mainHeight }"
      ></kind-sidebar-simple>

      <!-- Main content view -->
      <main class="rounded-2xl bg-base-300 overflow-y-auto p-4 h-full">
        <!-- Fullscreen mode: Two-column layout showing both tutorial and page -->
        <div v-if="isFullScreen" class="grid grid-cols-2 gap-4 w-full h-full">
          <div class="h-full w-full">
            <SplashTutorial class="h-full w-full" />
          </div>
          <div class="h-full w-full">
            <NuxtPage class="h-full w-full" />
          </div>
        </div>

        <!-- Single column layout for non-fullscreen modes -->
        <div v-else class="flex justify-center items-center w-full h-full">
          <div v-if="showTutorial" class="instructions h-full w-full">
            <SplashTutorial class="h-full w-full" />
          </div>
          <div v-else class="launch h-full w-full">
            <NuxtPage class="h-full w-full" />
          </div>
        </div>
      </main>

      <!-- Sidebar right -->
      <aside
        class="bg-base-300 overflow-y-auto"
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
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  overflow: hidden;
}

.grid-cols-2 {
  grid-template-columns: 1fr 1fr;
}

.grid-cols-[auto_1fr_auto] {
  grid-template-columns: auto 1fr auto;
}

button:hover {
  cursor: pointer;
}
</style>
