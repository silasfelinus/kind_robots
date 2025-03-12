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

    <!-- Header -->
    <header
      class="fixed z-20 flex items-center justify-center box-border transition-all duration-500 ease-in-out"
      :style="headerStyle"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Left Sidebar -->
    <aside
      v-show="sidebarLeftVisible"
      class="fixed z-10 box-border rounded-2xl transition-all duration-300 ease-in-out overflow-visible"
      :style="leftSidebarStyle"
    >
      <kind-sidebar-simple class="relative z-10 h-full rounded-2xl w-full" />
    </aside>

    <main
      class="fixed z-10 box-border transition-all duration-600 rounded-2xl ease-in-out"
      :style="mainContentStyle"
    >
      <FlipScreen>
        <NuxtPage :key="$route.fullPath" />
      </FlipScreen>
    </main>

    <!-- Right Sidebar -->
    <aside
      v-show="sidebarRightVisible"
      class="fixed z-10 box-border transition-all duration-600 rounded-2xl ease-in-out"
      :style="rightSidebarStyle"
    >
      <splash-tutorial class="h-full w-full z-10" />
    </aside>

    <!-- Footer -->
    <footer
      v-show="footerVisible"
      class="fixed z-10 box-border rounded-2xl overflow-visible transition-all duration-600 ease-in-out"
      :style="footerStyle"
      style="background-color: rgba(0, 0, 0, 0.2)"
    >
      <horizontal-nav class="h-full w-full z-5" />
    </footer>

    <!-- Footer Toggle -->
    <div class="fixed bottom-1 left-1/2 transform -translate-x-1/2 z-50">
      <footer-toggle />
    </div>

    <!-- Milestone Popup (Ensure it's on top & renders last) -->
    <milestone-popup class="fixed z-[9999]" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useRoute } from 'vue-router'

const displayStore = useDisplayStore()
const route = useRoute()

// Ensure route change updates the previousRoute
watch(
  () => route.fullPath,
  (newPath) => {
    displayStore.previousRoute = newPath
  },
)

// Make store state reactive using computed properties
const sidebarLeftVisible = computed(() => displayStore.sidebarLeftVisible)
const sidebarRightVisible = computed(() => displayStore.sidebarRightVisible)
const footerVisible = computed(() => displayStore.footerVisible)

// Get styles from displayStore
const headerStyle = computed(() => displayStore.headerStyle)
const leftSidebarStyle = computed(() => displayStore.leftSidebarStyle)
const mainContentStyle = computed(() => displayStore.mainContentStyle)
const rightSidebarStyle = computed(() => displayStore.rightSidebarStyle)
const footerStyle = computed(() => displayStore.footerStyle)
</script>
