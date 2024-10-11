<template>
  <div class="main-layout h-screen relative bg-primary box-border">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Header -->
    <header
      class="fixed top-0 left-0 w-full z-30 flex items-center justify-center bg-primary box-border"
      :style="{ height: headerHeight }"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Left Sidebar -->
    <aside
      class="fixed top-0 left-0 z-20 box-border transition-all duration-500 ease-in-out"
      :class="{ 'overflow-hidden': !sidebarLeftOpen }"
      :style="{
        height: mainHeight,
        width: sidebarLeftWidth,
        top: headerHeight /* Align the sidebar starting under the header */,
        bottom: footerHeight /* Align sidebar ending above the footer */,
      }"
    >
      <kind-sidebar-simple v-if="sidebarLeftOpen" />
    </aside>

    <!-- Main Content -->
    <main
      class="relative z-10 box-border overflow-hidden transition-all duration-300"
      :style="{
        height: mainHeight,
        top: headerHeight,
        bottom: footerHeight,
        marginLeft: sidebarLeftWidth,
        marginRight: sidebarRightWidth,
      }"
    >
      <main-content />
    </main>

    <!-- Right Sidebar -->
    <aside
      class="fixed top-0 right-0 z-20 box-border transition-all duration-500 ease-in-out bg-base-300"
      :class="{ 'overflow-hidden': !showTutorial }"
      :style="{
        width: sidebarRightWidth,
        height: mainHeight,
        top: headerHeight /* Align the sidebar starting under the header */,
        bottom: footerHeight /* Align sidebar ending above the footer */,
      }"
    >
      <splash-tutorial v-if="showTutorial" class="h-full w-full" />
    </aside>

    <!-- Footer -->
    <footer
      class="fixed bottom-0 left-0 right-0 z-30 box-border"
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

// Compute header height, no need for padding since it's the full height of the element
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

// Calculate the main content height dynamically, adjusting for header and footer heights
const mainHeight = computed(() => {
  return `calc(var(--vh) * 100 - ${headerHeight.value} - ${footerHeight.value})`
})
</script>
