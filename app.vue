<template>
  <div
    class="main-layout h-screen w-screen relative bg-primary overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <Analytics />
      <animation-loader class="fixed z-50" />
      <screen-debug />
      <milestone-popup />
    </div>

    <!-- Header (Always on Top) -->
    <header
      class="fixed z-50 flex items-center justify-center box-border overflow-hidden transition-all duration-500 ease-in-out"
      :style="displayStore.headerStyle"
    >
      <template v-if="displayStore.headerState === 'hidden'">
        <mode-row class="flex-grow text-center" />
      </template>
      <template v-else>
        <header-upgrade class="flex-grow text-center" />
      </template>
    </header>

    <!-- Left Sidebar -->
    <aside
      class="fixed z-30 box-border transition-all duration-300 ease-in-out overflow-visible"
      :style="displayStore.leftSidebarStyle"
    >
      <kind-sidebar-simple class="h-full w-full" />
    </aside>

    <!-- Center Column (Grows Fully) -->
    <div class="flex flex-col w-full h-full">
      <main
        class="fixed z-10 border-4 rounded-2xl overflow-scroll box-border transition-all duration-600 ease-in-out"
        :style="displayStore.mainContentStyle"
      >
        <NuxtPage :key="$route.fullPath" />
      </main>

      <!-- Footer (Properly Stays at the Bottom) -->
      <footer
        class="z-10 transition-all mt-auto"
        :style="displayStore.footerStyle"
      >
        <horizontal-nav class="h-full w-full" />
      </footer>
    </div>

    <!-- Right Sidebar -->
    <aside
      class="fixed z-10 box-border transition-all duration-600 ease-in-out"
      :style="displayStore.rightSidebarStyle"
    >
      <splash-tutorial class="h-full w-full" />
    </aside>
  </div>

  <!-- Footer Toggle -->
  <div class="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50 p-1">
    <footer-toggle />
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
</script>
