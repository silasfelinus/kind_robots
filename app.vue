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
      :style="{ height: displayStore.headerHeight }"
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
        :style="{ width: displayStore.sidebarLeftWidth }"
      >
        <kind-sidebar-simple class="h-full w-full" />
      </aside>

      <!-- Center Column -->
      <div class="flex flex-col w-full">
        <div
          class="flex items-center justify-center z-15 transition-all"
          :style="{ height: `${displayStore.modeRowHeight}px` }"
        >
          <mode-row />
        </div>

        <main class="flex-grow p-4 w-full transition-all">
          <NuxtPage :key="$route.fullPath" />
        </main>

        <footer
          v-if="footerVisible"
          class="z-10 bg-black/20 transition-all"
          :style="{ height: displayStore.footerHeight }"
        >
          <horizontal-nav class="h-full w-full" />
        </footer>
      </div>

      <!-- Right Sidebar -->
      <aside
        v-if="sidebarRightVisible"
        class="z-10 transition-all"
        :style="{ width: displayStore.sidebarRightWidth }"
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

const sidebarLeftVisible = computed(() => displayStore.sidebarLeftVisible)
const sidebarRightVisible = computed(() => displayStore.sidebarRightVisible)
const footerVisible = computed(() => displayStore.footerVisible)
</script>
