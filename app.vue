<template>
  <div class="flex flex-col h-screen w-screen bg-primary overflow-hidden">
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <Analytics />
      <animation-loader class="fixed z-50" />
    </div>

    <!-- Header -->
    <header
      class="flex items-center justify-center z-20 transition-all"
      :class="headerHeight"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Main Layout -->
    <div
      class="grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] flex-grow w-full"
    >
      <!-- Left Sidebar -->
      <aside
        v-if="sidebarLeftVisible"
        class="z-10 transition-all"
        :class="leftSidebarWidth"
      >
        <kind-sidebar-simple class="h-full w-full" />
      </aside>

      <!-- Center Column -->
      <div class="flex flex-col w-full">
        <div
          class="flex items-center justify-center z-15 transition-all"
          :class="modeRowHeight"
        >
          <mode-row />
        </div>

        <main
          class="flex-grow p-4 w-full transition-all"
          :class="mainContentHeight"
        >
          <NuxtPage :key="$route.fullPath" />
        </main>

        <footer
          v-if="footerVisible"
          class="z-10 bg-black/20 transition-all"
          :class="footerHeight"
        >
          <horizontal-nav class="h-full w-full" />
        </footer>
      </div>

      <!-- Right Sidebar -->
      <aside
        v-if="sidebarRightVisible"
        class="z-10 transition-all"
        :class="rightSidebarWidth"
      >
        <splash-tutorial class="h-full w-full" />
      </aside>
    </div>

    <!-- Footer Toggle -->
    <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <footer-toggle />
    </div>

    <!-- Milestone Popup -->
    <milestone-popup />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Visibility Computed Properties
const sidebarLeftVisible = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarLeftState),
)
const sidebarRightVisible = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarRightState),
)
const footerVisible = computed(() => displayStore.footerState === 'open')

// Size Computed Properties (Derived from displayStore)
const headerHeight = computed(() => `h-[${displayStore.headerVh}vh]`)
const footerHeight = computed(() => `h-[${displayStore.footerVh}vh]`)
const leftSidebarWidth = computed(() => `w-[${displayStore.sidebarLeftVw}vw]`)
const rightSidebarWidth = computed(() => `w-[${displayStore.sidebarRightVw}vw]`)
const modeRowHeight = computed(() => `h-[${displayStore.modeRowHeight}px]`)
const mainContentHeight = computed(() => `h-[${displayStore.mainVh}vh]`)
</script>
