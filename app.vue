<template>
  <div class="main-layout h-screen overflow-hidden bg-base-300">
    <!-- Loaders -->
    <kind-loader></kind-loader>
    <animation-loader></animation-loader>

    <!-- Grid Container: Starts right after loaders -->
    <div
      class="grid"
      :style="{
        gridTemplateRows: `${headerHeight} auto ${footerHeight}`,
        gridTemplateColumns: `${sidebarLeftWidth} 1fr ${sidebarRightWidth}`,
        height: '100vh'  // Full viewport height
      }"
    >
      <!-- Header -->
      <header
        class="bg-base-300 flex items-center justify-between w-full p-2 z-40"
        :style="{ gridRow: '1 / 2', height: headerHeight }"
      >
        <div class="p-1 text-white">
          <sidebar-toggle class="text-4xl"></sidebar-toggle>
        </div>

        <div class="flex flex-grow justify-center space-x-4">
          <nav-links class="flex space-x-4"></nav-links> <!-- Nav links in a row -->
        </div>

        <div class="flex items-center space-x-2">
          <kind-buttons></kind-buttons>
        </div>
      </header>

      <!-- Sidebar left -->
      <kind-sidebar-simple
        class="bg-base-300 overflow-y-auto"
        :style="{ gridRow: '2 / 3', width: sidebarLeftWidth }"
      ></kind-sidebar-simple>

      <!-- Main content area: Flip-card or fullscreen layout -->
      <main
        :class="[{ 'flip-card': !isFullScreen }, { 'is-flipped': isFlipped && !isMobile }]"
        class="bg-base-300 overflow-y-auto p-4 z-40 rounded-2xl"
        :style="{
          gridRow: '2 / 3',
          gridColumn: '2 / 3',
          height: mainHeight
        }"
      >
        <!-- Fullscreen mode -->
        <div v-if="isFullScreen" class="grid grid-cols-2 gap-4 w-full h-full">
          <div class="h-full">
            <SplashTutorial :style="{ height: '100%', width: '100%' }" />
          </div>
          <div class="h-full">
            <NuxtPage :style="{ height: '100%', width: '100%' }" />
          </div>
        </div>

        <!-- Flip-card mode -->
        <div v-else class="flip-card-inner">
          <div v-if="showTutorial" class="flip-card-front">
            <SplashTutorial :style="{ height: '100%', width: '100%' }" />
          </div>
          <div v-else class="flip-card-back">
            <NuxtPage :style="{ height: '100%', width: '100%' }" />
          </div>
        </div>
      </main>

      <!-- Sidebar right -->
      <aside
        class="bg-base-300 overflow-y-auto"
        :style="{ gridRow: '2 / 3', width: sidebarRightWidth }"
      ></aside>

      <!-- Footer -->
      <footer
        class="flex justify-center items-center"
        :style="{ gridRow: '3 / 4', height: footerHeight }"
      ></footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

// Flip state
const isFlipped = ref(false)

// Check for mobile screens
const isMobile = computed(() => displayStore.isMobileViewport)

// Watch tutorial state and flip card when necessary
watch(showTutorial, (newVal) => {
  isFlipped.value = !newVal
})
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-card.is-flipped .flip-card-inner {
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
