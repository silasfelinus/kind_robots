<template>
  <div
    class="main-layout h-screen w-screen relative bg-base-300 overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <Analytics />
      <animation-loader class="fixed z-50" />
    </div>

    <!-- Milestone Popup (Ensures it's on top) -->
    <milestone-popup class="fixed z-[9999]" />

    <!-- Header -->
    <header
      class="fixed z-10 flex items-center justify-center box-border overflow-hidden transition-all duration-500 ease-in-out"
      :style="displayStore.headerStyle"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Left Sidebar -->
    <aside
      v-if="displayStore.sidebarLeftVisible"
      class="fixed z-10 box-border rounded-2xl transition-all duration-300 ease-in-out overflow-visible"
      :style="displayStore.leftSidebarStyle"
    >
      <kind-sidebar-simple class="relative z-10 h-full rounded-2xl w-full" />
    </aside>

    <!-- Main Content with Flip Effect -->
    <main
      class="fixed z-10 box-border transition-all duration-600 rounded-2xl ease-in-out"
      :style="displayStore.mainContentStyle"
    >
      <mode-row class="z-30 w-full flex-shrink-0" style="height: 5%" />
      <FlipScreen>
        <template #old>
          <NuxtPage
            :key="displayStore.previousRoute"
            class="relative h-full w-full rounded-2xl overflow-y-auto bg-base-300 border-1 border-accent z-10"
          />
        </template>

        <template #new>
          <NuxtPage
            :key="$route.fullPath"
            class="relative h-full w-full rounded-2xl overflow-y-auto bg-base-300 border-1 border-accent z-10"
          />
        </template>
      </FlipScreen>
    </main>

    <!-- Right Sidebar -->
    <aside
      v-if="displayStore.sidebarRightVisible"
      class="fixed z-10 box-border transition-all duration-600 rounded-2xl ease-in-out"
      :style="displayStore.rightSidebarStyle"
    >
      <splash-tutorial class="h-full w-full z-10" />
    </aside>

    <!-- Footer -->
    <footer
      v-if="displayStore.footerVisible"
      class="fixed z-10 box-border rounded-2xl overflow-visible transition-all duration-600 ease-in-out"
      :style="displayStore.footerStyle"
      style="background-color: rgba(0, 0, 0, 0.2)"
    >
      <horizontal-nav class="h-full w-full z-5" />
    </footer>

    <!-- Footer Toggle -->
    <div class="fixed bottom-1 left-1/2 transform -translate-x-1/2 z-50">
      <footer-toggle />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'
import { useRoute } from 'vue-router'
import { watch } from 'vue'

const displayStore = useDisplayStore()
const route = useRoute()

// Track previous route for flip effect
watch(
  () => route.fullPath,
  (newPath) => {
    displayStore.previousRoute = newPath
  },
)

// Ensure visibility updates when sidebar/footer states change
watch(
  () => [
    displayStore.sidebarLeftState,
    displayStore.sidebarRightState,
    displayStore.footerState,
  ],
  () => {
    displayStore.updateVisibility()
  },
  { immediate: true }, // Run once on startup
)
</script>
