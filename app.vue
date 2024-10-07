<template>
  <div class="main-layout h-screen relative">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Grid Container: Header, Content, Footer, Sidebar (Right) -->
    <div
      class="relative grid h-screen"
      :style="{
        'grid-template-columns': gridColumns,
      }"
    >
      <!-- Header (Spans full width, contains nav and tutorial toggle) -->
      <div
        class="bg-primary flex items-center justify-between p-4 z-30"
        :style="{
          height: headerHeight,
          width: headerWidth,
          margin: '0 auto',
        }"
      >
        <!-- Header Upgrade Component (center-aligned) -->
        <header-upgrade class="flex-grow text-center text-white" />

        <!-- Tutorial Toggle (inside the header, right-aligned) -->
        <button
          class="text-xl font-bold text-secondary hover:bg-primary p-2 rounded"
          @click="toggleTutorial"
        >
          Tutorial
        </button>
      </div>

      <!-- Main Content (Scrollable on Y-axis only) -->
      <main
        class="bg-base-100 p-4 z-10 overflow-y-auto"
        :style="{
          height: mainHeight,
          width: mainWidth,
        }"
        :class="{
          'transition-all duration-300': true,
        }"
      >
        <main-content />
      </main>

      <!-- Sidebar Right (Fixed, full height, scrollable) -->
      <aside
        class="bg-secondary fixed z-20 transition-all duration-500 ease-in-out"
        :style="{
          height: '100vh',
          width: sidebarRightWidth,
          transform:
            sidebarRightState === 'hidden'
              ? 'translateX(100%)'
              : 'translateX(0)',
        }"
      >
        <div v-if="isFullScreen" class="h-full w-full">
          <SplashTutorial class="h-full w-full" />
        </div>
      </aside>

      <!-- Footer (Full width except sidebars) -->
      <footer
        class="flex justify-center items-center bg-primary text-white p-4"
        :style="{
          height: footerHeight,
          width: '100%',
        }"
      >
        <!-- Add footer content here -->
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Computed values for layout dimensions based on displayStore
const headerHeight = computed(() => displayStore.headerHeight)
const headerWidth = '90vw' // Set header width to 90vw as requested

const mainHeight = computed(() => displayStore.mainHeight)
const mainWidth = computed(() => displayStore.mainWidth)

const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const sidebarRightState = computed(() => displayStore.sidebarRightState)

const footerHeight = computed(() => displayStore.footerHeight)

const gridColumns = computed(() => displayStore.gridColumns)

const isFullScreen = computed(() => displayStore.isFullScreen)

// Toggle tutorial view
const toggleTutorial = () => {
  displayStore.toggleTutorial()
}
</script>

<style scoped>
/* Smooth transition effects */
.transition-all {
  transition: all 0.3s ease-in-out;
}
</style>
