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
        class="bg-base-100 flex items-center fixed w-full p-2 z-10"
        :style="{
          gridRow: '1 / 2',
          gridColumn: '1 / 3', /* Spans left sidebar + main content */
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
        :style="{ gridRow: '2 / 3', width: sidebarLeftWidth }"
      ></kind-sidebar-simple>

      <!-- Main content -->
      <main
        :class="{ 'flip-card': !isFullScreen && !isMobile }"
        class="bg-base-100 p-2 rounded-2xl z-10 overflow-y-auto"
        :style="{
          gridRow: '2 / 3',
          gridColumn: '2 / 3',
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
        }"
      >
        <!-- Mobile View (no flip card) -->
        <div v-if="isMobile">
          <SplashTutorial
            v-if="showTutorial"
            class="h-full w-full z-10 rounded-2xl"
          />
          <div v-else class="overflow-y-auto h-full w-full rounded-2xl">
            <NuxtPage class="h-full w-full" />
          </div>
        </div>

        <!-- Fullscreen mode (Desktop) -->
        <div v-else-if="isFullScreen" class="rounded-2xl w-full h-full">
          <div class="h-full rounded-2xl z-10 overflow-y-auto">
            <SplashTutorial class="h-full w-full" />
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
          <div class="flip-card-back rounded-2xl overflow-y-auto">
            <NuxtPage class="h-full w-full" />
          </div>
        </div>
      </main>

      <!-- Sidebar right -->
      <aside
        class="bg-base-100 fixed right-0 z-10"
        :style="{
          top: headerHeight,
          height: `calc(100vh - ${headerHeight} - ${footerHeight})`,
          width: sidebarRightWidth,
        }"
      >
        <!-- Display second column content in sidebar when fullscreen -->
        <div v-if="isFullScreen" class="h-full w-full overflow-y-auto">
          <NuxtPage class="h-full w-full" />
        </div>
      </aside>

      <!-- Footer -->
      <footer
        class="flex justify-center items-center"
        :style="{ gridRow: '3 / 4', gridColumn: '1 / 4', height: footerHeight }"
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
