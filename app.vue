<template>
  <div class="main-layout h-screen overflow-hidden bg-base-300">
    <kind-loader></kind-loader>
    <animation-loader></animation-loader>

    <!-- Header with Sidebar Toggle, Nav Links, and Kind Buttons -->
    <header
      class="bg-base-300 flex items-center justify-between w-full p-2 z-40"
      :style="{ height: headerHeight }"
    >
      <div class="p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl"></sidebar-toggle>
      </div>

      <div class="flex flex-grow justify-center">
        <nav-links class="hidden sm:flex space-x-4"></nav-links>
      </div>

      <div class="flex items-center space-x-2">
        <kind-buttons></kind-buttons>
      </div>
    </header>

    <!-- Main content area -->
    <div class="grid grid-cols-3 z-40 h-full">
      <!-- Sidebar left -->
      <kind-sidebar-simple
        class="overflow-y-auto bg-base-300"
        :style="{ width: sidebarLeftWidth, height: mainHeight }"
      ></kind-sidebar-simple>

      <!-- Main content: Fullscreen or flip-card based on isFullScreen -->
      <main
        v-if="isFullScreen"
        class="rounded-2xl bg-base-300 overflow-y-auto p-4 h-full z-40"
        :style="{ width: mainWidth, height: mainHeight }"
      >
        <!-- Fullscreen mode: Two-column layout -->
        <div class="grid grid-cols-2 gap-4 w-full h-full">
          <div class="h-full">
            <SplashTutorial :style="{ height: mainHeight, width: '100%' }" />
          </div>
          <div class="h-full">
            <NuxtPage :style="{ height: mainHeight, width: '100%' }" />
          </div>
        </div>
      </main>

      <!-- Main content: Flip-card in non-fullscreen mode -->
      <main
        v-else
        class="rounded-2xl bg-base-300 overflow-y-auto p-4 h-full z-40 flip-card"
        :class="{ 'is-flipped': isFlipped && !isMobile }"
        :style="{ width: mainWidth, height: mainHeight }"
      >
        <!-- Flip-card inner content, toggles between SplashTutorial and NuxtPage -->
        <div class="flip-card-inner">
          <!-- Front side (SplashTutorial) -->
          <div v-if="showTutorial" class="flip-card-front">
            <SplashTutorial :style="{ height: mainHeight, width: '100%' }" />
          </div>

          <!-- Back side (NuxtPage) -->
          <div v-else class="flip-card-back">
            <NuxtPage :style="{ height: mainHeight, width: '100%' }" />
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
import { computed, ref } from 'vue'
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
const mainWidth = computed(() => displayStore.mainWidth)

// Flip state
const isFlipped = ref(false)

// Check for mobile screens
const isMobile = computed(() => displayStore.isMobileViewport)
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
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

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
