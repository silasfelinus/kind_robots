<template>
  <div class="main-layout h-screen relative">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Grid Container: Header, Content, Footer, Sidebar (Right) -->
    <div
      class="relative grid h-screen"
      :class="{
        'grid-cols-[1fr_auto]': displayStore.sidebarRightState !== 'open',
        'grid-cols-[1fr_300px]': displayStore.sidebarRightState === 'open', // Adjust main content size based on sidebar state
      }"
    >
      <!-- Header (Spans full width, contains nav and tutorial toggle) -->
      <div
        class="bg-primary flex items-center justify-between p-4 z-30 col-span-2"
      >
        <!-- Header Upgrade Component (center-aligned) -->
        <header-upgrade class="flex-grow text-center text-white" />
      </div>

      <!-- Main Content (Scrollable on Y-axis only) -->
      <main
        class="bg-base-100 p-4 z-10 overflow-y-auto"
        :class="{
          'col-span-2': displayStore.sidebarRightState !== 'open',
          'col-span-1': displayStore.sidebarRightState === 'open', // Adjust column span for main content
        }"
      >
        <main-content />
      </main>

      <!-- Sidebar Right (Fixed, full height, scrollable) -->
      <aside
        class="bg-secondary fixed z-20 transition-all duration-300 h-screen"
        :class="{
          'translate-x-full': displayStore.sidebarRightState === 'hidden',
          'w-0': displayStore.sidebarRightState === 'compact',
          'w-72': displayStore.sidebarRightState === 'open',
        }"
        style="right: 0; top: var(--header-height)"
      >
        <div v-if="isFullScreen" class="h-full w-full">
          <SplashTutorial class="h-full w-full" />
        </div>
      </aside>

      <!-- Footer (Full width except sidebars) -->
      <footer
        class="flex justify-center items-center bg-primary text-white col-span-2 p-4"
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

// Computed value to check if in fullscreen
const isFullScreen = computed(() => displayStore.isFullScreen)
</script>

<style scoped>
/* Additional styles if needed */
</style>
