<!-- /app.vue -->
<template>
  <div
    class="main-layout h-screen w-screen relative bg-primary overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <animation-loader class="fixed z-50" />
      <milestone-popup />
      <screen-debug />
    </div>

    <!-- Header -->
    <header
      class="fixed z-40 border-3 flex items-center justify-center box-border border-1 border-black overflow-hidden transition-all duration-500 ease-in-out"
      :style="displayStore.headerStyle"
    >
      <kind-header class="flex-grow text-center rounded-xl" />
    </header>

    <!-- Left Sidebar -->
    <aside
      class="fixed z-10 box-border border-3 transition-all duration-300 ease-in-out overflow-visible"
      :style="displayStore.leftSidebarStyle"
    >
      <kind-sidebar v-if="sidebarLeftOpen" class="h-full w-full z-10" />
    </aside>

    <!-- Center Column -->
    <div class="flex flex-col w-full h-full">
      <main
        class="fixed z-10 border-3 rounded-2xl overflow-auto bg-base-300 box-border transition-all duration-600 ease-in-out"
        :style="displayStore.mainContentStyle"
      >
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

 <right-toggle :style="rightToggleStyle" class="fixed z-40" />

        <big-toggle :style="leftToggleStyle" class="fixed z-40" />



  <!-- Footer -->
  <footer
    class="fixed z-20 box-border border-3 overflow-visible transition-all duration-600 ease-in-out"
    :style="displayStore.footerStyle"
  >
    <mode-row v-if="footerOpen" class="h-full w-full z-10" />
  </footer>

  <!-- Footer Toggle -->
  <div
    class="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-40"
    :style="displayStore.footerToggleStyle"
  >
    <footer-toggle />
  </div>
</template>

<script setup lang="ts">
// /app.vue

import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const footerOpen = computed(() => displayStore.footerState === 'open')

const sidebarLeftOpen = computed(
  () =>
    displayStore.sidebarLeftState !== 'hidden' &&
    displayStore.sidebarLeftState !== 'disabled',
)

const leftToggleStyle = computed(() => displayStore.leftToggleStyle)
const rightToggleStyle = computed(() => displayStore.rightToggleStyle)

const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)
</script>
