<template>
  <div class="main-layout h-screen relative bg-primary box-border">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Header -->
    <header
      class="fixed top-0 left-0 w-full z-30 flex items-center justify-center box-border p-1"
      :style="{ height: headerHeight }"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Left Sidebar -->
    <aside
      class="fixed top-0 left-0 z-20 box-border p-1 transition-all duration-500 ease-in-out"
      :class="{ 'overflow-hidden': !sidebarLeftOpen }"
      :style="{ 
        width: sidebarLeftWidth, 
        height: sidebarHeight, 
        marginTop: headerHeight 
      }"
    >
      <kind-sidebar-simple v-if="sidebarLeftOpen" />
    </aside>

    <!-- Main Content -->
    <main
      class="fixed top-0 left-0 right-0 z-10 box-border p-1 overflow-hidden transition-all duration-300"
      :style="{
        height: mainHeight,
        marginTop: headerHeight,
        marginLeft: sidebarLeftWidth,
        marginRight: sidebarRightWidth,
      }"
    >
      <main-content />
    </main>

    <!-- Right Sidebar -->
    <aside
      class="fixed top-0 right-0 z-20 box-border p-1 transition-all duration-500 ease-in-out"
      :class="{ 'overflow-hidden': !showTutorial }"
      :style="{ 
        width: sidebarRightWidth, 
        height: sidebarHeight, 
        marginTop: headerHeight 
      }"
    >
      <splash-tutorial v-if="showTutorial" class="h-full w-full" />
    </aside>

    <!-- Footer -->
    <footer
      class="fixed bottom-0 left-0 right-0 z-30 box-border p-1"
      :style="{ height: footerHeight }"
    >
      <horizontal-nav v-if="footerOpen" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore for managing the layout state
const displayStore = useDisplayStore()

// Compute layout heights and widths based on store state
const headerHeight = computed(() => displayStore.headerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const footerHeight = computed(() => displayStore.footerHeight)
const showTutorial = computed(() => displayStore.showTutorial)

const footerOpen = computed(() => displayStore.footerState === 'open')
const sidebarLeftOpen = computed(() => displayStore.sidebarLeftState !== 'hidden')

// Calculate the height of the main content area dynamically based on the viewport
const mainHeight = computed(() => {
  return `calc(100vh - ${headerHeight.value} - ${footerHeight.value})`
})

// Calculate the height of the sidebars (subtract both header and footer height)
const sidebarHeight = computed(() => {
  return `calc(100vh - ${headerHeight.value} - ${footerHeight.value})`
})
</script>

<style scoped>
/* Additional styles if needed */
</style>
