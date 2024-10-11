<template>
  <div class="main-layout h-screen w-screen relative bg-primary box-border">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Header -->
    <header
      class="fixed top-0 left-0 w-full z-30 flex items-center justify-center bg-primary box-border overflow-hidden"
      :style="{ height: `calc(${headerHeight} - 2px)`, margin: '1px' }"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Left Sidebar -->
    <aside
      class="fixed left-0 z-20 box-border transition-all duration-500 ease-in-out overflow-hidden"
      :class="{ 'overflow-hidden': !sidebarLeftOpen }"
      :style="{
        width: `calc(${sidebarLeftWidth} - 2px)`,
        top: `calc(${headerHeight} + 1px)`,
        bottom: `calc(${footerHeight} + 1px)`,
        margin: '1px',
      }"
    >
      <kind-sidebar-simple v-if="sidebarLeftOpen" />
    </aside>

    <!-- Main Content -->
    <main
      class="absolute z-10 box-border overflow-hidden transition-all duration-300"
      :style="{
        top: `calc(${headerHeight} + 1px)`,
        bottom: `calc(${footerHeight} + 1px)`,
        marginLeft: `calc(${sidebarLeftWidth} + 1px)`,
        marginRight: `calc(${sidebarRightWidth} + 1px)`,
        margin: '1px',
      }"
    >
      <main-content />
    </main>

    <!-- Right Sidebar -->
    <aside
      class="fixed right-0 z-20 box-border transition-all duration-500 ease-in-out bg-primary overflow-hidden"
      :style="{
        width: `calc(${sidebarRightWidth} - 2px)`,
        top: `calc(${headerHeight} + 1px)`,
        bottom: `calc(${footerHeight} + 1px)`,
        margin: '1px',
      }"
    >
      <splash-tutorial v-if="showTutorial" class="h-full w-full bg-primary" />
    </aside>

    <!-- Footer -->
    <footer
      class="fixed bottom-0 left-0 right-0 z-30 box-border overflow-hidden"
      :style="{ height: `calc(${footerHeight} - 2px)`, margin: '1px' }"
    >
      <footer-toggle />
      <horizontal-nav v-if="footerOpen" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore for managing the layout state
const displayStore = useDisplayStore()

// Compute header height
const headerHeight = computed(
  () => `calc(var(--vh) * ${displayStore.headerVh})`,
)

// Sidebar widths for left and right
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)

// Footer height
const footerHeight = computed(
  () => `calc(var(--vh) * ${displayStore.footerVh})`,
)

// Control for tutorial visibility
const showTutorial = computed(() => displayStore.showTutorial)

// Check if the footer is open
const footerOpen = computed(() => displayStore.footerState === 'open')

// Check if the left sidebar is open
const sidebarLeftOpen = computed(
  () => displayStore.sidebarLeftState !== 'hidden',
)
</script>
