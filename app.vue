<template>
  <div class="main-layout h-screen w-screen relative bg-primary box-border">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Header -->
    <header
      class="fixed w-full z-30 flex items-center justify-center bg-primary box-border overflow-hidden transition-all duration-500 ease-in-out"
      :style="{
        height: headerHeight,
        width: `calc(100vw - ${sectionPadding} * 2)`,
        top: sectionPadding,
        left: sectionPadding,
        right: sectionPadding,
      }"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Left Sidebar -->
    <aside
      class="fixed z-20 box-border transition-all duration-300 ease-in-out"
      :style="{
        width: sidebarLeftWidth,
        left: sectionPadding,
        top: `calc(${headerHeight} + ${sectionPadding} * 2)`,
        height: `calc(${mainHeight} - (${sectionPadding} * (${footerMultiplier} + 2)))`,
      }"
    >
      <kind-sidebar-simple />
    </aside>

    <!-- Main Content -->
    <main
      class="fixed z-10 box-border transition-all duration-600 ease-in-out"
      :style="{
        top: `calc(${headerHeight} + ${sectionPadding} * 2)`,
        height: `calc(${mainHeight} - (${sectionPadding} * (${footerMultiplier} + 2)))`,
        right: sidebarRightOpen
          ? `calc(${sidebarRightWidth} + (${sectionPadding} * ${sidebarRightMultiplier}))`
          : sectionPadding,
        left: sidebarLeftOpen
          ? `calc(${sidebarLeftWidth} + (${sectionPadding} * ${sidebarLeftMultiplier}))`
          : sectionPadding,
        width: `calc(100vw - (${sectionPadding} * (${sidebarLeftMultiplier} + ${sidebarRightMultiplier}) + ${sidebarLeftOpen ? sidebarLeftWidth : 0} + ${sidebarRightOpen ? sidebarRightWidth : 0}))`,
      }"
    >
      <!-- Left toggle button (top-left corner) -->
      <left-toggle
        class="absolute top-0 left-0 z-50 transition-all duration-600 ease-in-out"
      />

      <!-- Right toggle button (top-right corner) -->
      <right-toggle
        class="absolute top-0 right-0 z-50 transition-all duration-600 ease-in-out"
      />

      <!-- Footer toggle button (bottom-left corner) -->
      <footer-toggle
        class="absolute bottom-0 left-0 z-50 transition-all duration-600 ease-in-out"
      />

      <!-- Sidefoot toggle button (bottom-right corner) -->
      <sidefoot-toggle
        class="absolute bottom-0 right-0 z-50 transition-all duration-600 ease-in-out"
      />

      <main-content />
    </main>

    <!-- Right Sidebar -->
    <aside
      class="fixed z-20 box-border transition-all duration-600 ease-in-out"
      :style="{
        width: sidebarRightWidth,
        right: sectionPadding,
        top: `calc(${headerHeight} + ${sectionPadding} * 2)`,
        height: `calc(${mainHeight} - (${sectionPadding} * (${footerMultiplier} + 2)))`,
      }"
    >
      <splash-tutorial v-if="showTutorial" class="h-full w-full" />
    </aside>

    <!-- Footer -->
    <footer
      class="fixed z-30 box-border overflow-hidden transition-all duration-600 ease-in-out"
      :style="{
        height: footerHeight,
        width: `calc(100vw - ${sectionPadding} * 2)`,
        left: sectionPadding,
        right: sectionPadding,
        bottom: sectionPadding,
      }"
    >
      <horizontal-nav />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore for managing the layout state
const displayStore = useDisplayStore()

// Compute header height using custom vh
const headerHeight = computed(
  () => `calc(var(--vh) * ${displayStore.headerVh})`,
)

// Main content dimensions
const mainHeight = computed(() => displayStore.mainHeight)

// Sidebar widths for left and right
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const showTutorial = computed(() => displayStore.showTutorial)

// Footer height
const footerHeight = computed(
  () => `calc(var(--vh) * ${displayStore.footerVh})`,
)

// Padding for all sections (consistent)
const sectionPadding = '16px'

// Check if the footer is open
const footerOpen = computed(() => displayStore.footerState === 'open')

// Check if the left sidebar is open (and not hidden/disabled)
const sidebarLeftOpen = computed(
  () =>
    displayStore.sidebarLeftState !== 'hidden' &&
    displayStore.sidebarLeftState !== 'disabled',
)

// Check if the right sidebar is open (and not hidden/disabled)
const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)

// Calculate sidebar and main content multipliers based on footer and sidebar state
const footerMultiplier = computed(() => (footerOpen.value ? 2 : 1))
const sidebarLeftMultiplier = computed(() => (sidebarLeftOpen.value ? 2 : 1))
const sidebarRightMultiplier = computed(() => (sidebarRightOpen.value ? 2 : 1))
</script>
