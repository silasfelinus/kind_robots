<template>
  <div
    class="main-layout h-screen w-screen relative bg-primary overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <Analytics />
      <animation-loader class="fixed z-50" />
      <milestone-popup />
    </div>

    <!-- Header (Always on Top) -->
    <header
      class="fixed z-40 flex items-center justify-center box-border overflow-hidden transition-all duration-500 ease-in-out"
      :style="displayStore.headerStyle"
    >
      <template v-if="displayStore.headerState === 'hidden'">
        <mode-row class="flex-grow text-center rounded-xl" />
      </template>
      <template v-else>
        <kind-header class="flex-grow text-center rounded-xl" />
      </template>
    </header>

    <!-- Left Sidebar -->
    <aside
      class="fixed z-30 box-border transition-all duration-300 ease-in-out overflow-visible"
      :style="displayStore.leftSidebarStyle"
    >
      <kind-sidebar-simple v-if="sidebarLeftOpen" class="h-full w-full z-10" />
    </aside>

    <!-- Center Column (Grows Fully) -->
    <div class="flex flex-col w-full h-full">
      <main
        class="fixed z-10 border-4 rounded-2xl overflow-auto box-border transition-all duration-600 ease-in-out"
        :style="displayStore.mainContentStyle"
      >
        <NuxtPage :key="$route.fullPath" />
      </main>
    </div>

    <!-- Right Sidebar -->
    <aside
      class="fixed z-10 box-border transition-all duration-600 ease-in-out"
      :style="displayStore.rightSidebarStyle"
    >
      <splash-tutorial v-if="sidebarRightOpen" class="h-full w-full z-10" />
    </aside>
  </div>

  <footer
    class="fixed z-50 box-border overflow-visible transition-all duration-600 ease-in-out"
    :style="displayStore.footerStyle"
  >
    <horizontal-nav v-if="footerOpen" class="h-full w-full z-5" />
  </footer>

  <!-- Footer Toggle -->
  <div class="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50 p-1">
    <footer-toggle />
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const footerOpen = computed(() => displayStore.footerState === 'open')

const sidebarLeftOpen = computed(
  () =>
    displayStore.sidebarLeftState !== 'hidden' &&
    displayStore.sidebarLeftState !== 'disabled',
)

const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)
</script>
