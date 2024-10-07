<template>
  <div class="main-layout h-screen relative">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Grid Container: Header, Content, Footer, Sidebar (Right) -->
    <div
      class="relative grid h-screen grid-rows-[auto_1fr_auto] grid-cols-[1fr_auto]"
    >
      <!-- Header (Spans full width, contains vertical nav and tutorial toggle) -->
      <div
        class="bg-primary flex items-center justify-between p-4 z-30 row-span-1 col-span-2"
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
      <main class="bg-base-100 p-4 z-10 overflow-y-auto col-span-2 row-span-1">
        <main-content />
      </main>

      <!-- Sidebar Right (Fixed, full height, scrollable) -->
      <aside
        class="bg-secondary fixed z-20 transition-all duration-300"
        :class="{
          'translate-x-full': displayStore.sidebarRightState === 'hidden',
        }"
        style="right: 0; top: var(--header-height)"
      >
        <div v-if="isFullScreen" class="h-full w-full">
          <SplashTutorial class="h-full w-full" />
        </div>
      </aside>

      <!-- Footer (Full width except sidebars) -->
      <footer
        class="flex justify-center items-center bg-primary text-white row-span-1 col-span-2 p-4"
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

// Computed values for layout dimensions
const isFullScreen = computed(() => displayStore.isFullScreen)

// Toggle tutorial view
const toggleTutorial = () => {
  displayStore.toggleTutorial()
}
</script>

<style scoped>
/* No inline styles used for hover effects; Tailwind classes applied instead */
</style>
