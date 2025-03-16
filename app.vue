<template>
  <div class="flex flex-col h-screen w-screen bg-primary overflow-hidden">
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <Analytics />
      <animation-loader class="fixed z-50" />
      <screen-debug />
      <milestone-popup />
    </div>

    <!-- Header -->
    <header
      class="flex items-center justify-center z-20 transition-all"
      :style="displayStore.headerStyle"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Main Layout -->
    <div
      class="grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] flex-grow w-full"
    >
      <!-- Left Sidebar -->
      <aside class="z-10 transition-all" :style="displayStore.leftSidebarStyle">
        <kind-sidebar-simple class="h-full w-full" />
      </aside>

      <!-- Center Column -->
      <div class="flex flex-col w-full">
        <div
          class="flex items-center justify-center z-15 transition-all"
          :style="displayStore.modeRowStyle"
        >
          <mode-row />
        </div>

        <main
          class="flex-grow p-4 w-full transition-all"
          :style="displayStore.mainContentStyle"
        >
          <NuxtPage :key="$route.fullPath" />
        </main>

        <footer class="z-10 transition-all" :style="displayStore.footerStyle">
          <horizontal-nav class="h-full w-full" />
        </footer>
      </div>

      <!-- Right Sidebar -->
      <aside
        class="z-10 transition-all"
        :style="displayStore.rightSidebarStyle"
      >
        <splash-tutorial class="h-full w-full" />
      </aside>
    </div>

    <!-- Footer Toggle -->
    <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <footer-toggle />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
</script>
