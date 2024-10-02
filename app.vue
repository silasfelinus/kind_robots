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
        height: '100vh',
      }"
    >
      <!-- Header -->
      <header
        class="bg-base-300 flex items-center justify-between w-full p-2 z-40"
        :style="{ gridRow: '1 / 2', height: headerHeight }"
      >
        <!-- Sidebar Toggle (Hamburger Menu) -->
        <div class="p-1 text-white md:hidden flex-grow flex justify-center">
          <sidebar-toggle class="text-4xl"></sidebar-toggle>
        </div>

        <!-- Nav Links: centered for medium and larger screens, and on small screens as well -->
        <div
          class="flex-grow flex justify-center items-center space-x-4"
          :class="isMobile ? 'flex' : 'hidden md:flex'"
        >
          <nav-links></nav-links>
        </div>

        <!-- Kind Buttons (Always aligned right, no overlap) -->
        <div class="flex items-center space-x-2 ml-auto">
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
        :class="{ 'flip-card': !isFullScreen && !isMobile }"
        class="bg-base-300 overflow-y-hidden p-4 z-40 rounded-2xl"
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
            :style="{ height: '100%', width: '100%' }"
          />
          <NuxtPage
            v-else
            class="overflow-y-auto"
            :style="{ height: '100%', width: '100%' }"
          />
        </div>

        <!-- Fullscreen mode (Desktop) -->
        <div
          v-else-if="isFullScreen"
          class="grid grid-cols-2 gap-4 rounded-2xl w-full h-full"
        >
          <div class="h-full rounded-2xl">
            <SplashTutorial :style="{ height: '100%', width: '100%' }" />
          </div>
          <div class="h-full overflow-y-auto rounded-2xl">
            <NuxtPage :style="{ height: '100%', width: '100%' }" />
          </div>
        </div>

        <!-- Flip-card mode (Desktop) -->
        <div
          v-else
          class="flip-card-inner"
          :class="{ 'is-flipped': showTutorial }"
        >
          <div class="flip-card-front rounded-2xl">
            <SplashTutorial :style="{ height: '100%', width: '100%' }" />
          </div>
          <div class="flip-card-back overflow-y-auto rounded-2xl">
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
import { computed, ref, onMounted } from 'vue'
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
const isMobile = ref(false)
onMounted(() => {
  isMobile.value = window.innerWidth <= 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768
  })
})
</script>

<style scoped>
/* Flip-card style */
.flip-card {
  perspective: 1000px;
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

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
