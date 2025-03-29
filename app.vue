<template>
  <div
    class="main-layout h-screen w-screen relative bg-primary overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <animation-loader class="fixed z-50" />
      <milestone-popup />
    </div>

    <!-- Header (Always on Top) -->
    <header
      class="fixed z-40 border-3 flex items-center justify-center box-border border-1 border-black overflow-hidden transition-all duration-500 ease-in-out"
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
      class="fixed z-30 box-border border-3 transition-all duration-300 ease-in-out overflow-visible"
      :style="displayStore.leftSidebarStyle"
    >
      <kind-sidebar v-if="sidebarLeftOpen" class="h-full w-full z-10" />
    </aside>

    <!-- Center Column (Grows Fully) -->
    <div class="flex flex-col w-full h-full">
      <main
        class="fixed z-10 border-3 rounded-2xl overflow-auto bg-base-300 box-border transition-all duration-600 ease-in-out"
        :style="displayStore.mainContentStyle"
      >
        <big-toggle class="relative top-1 right-1" />
        <NuxtPage :key="$route.fullPath" />
      </main>
    </div>

    <!-- Right Sidebar -->
    <aside
      class="fixed z-10 border-3 box-border transition-all duration-600 ease-in-out"
      :style="displayStore.rightSidebarStyle"
    >
      <splash-tutorial v-if="sidebarRightOpen" class="h-full w-full z-10" />
    </aside>
  </div>

  <footer
    class="fixed z-30 box-border border-3 overflow-visible transition-all duration-600 ease-in-out"
    :style="displayStore.footerStyle"
  >
    <mode-row v-if="footerOpen" class="h-full w-full z-5" />
  </footer>

  <!-- Footer Toggle -->
  <div class="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-30 p-1">
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
