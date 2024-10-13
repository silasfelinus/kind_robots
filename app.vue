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
      class="fixed z-20 box-border transition-all duration-500 ease-in-out"
      :style="{
        width: sidebarLeftWidth,
        left: sectionPadding,
        top: `calc(${headerHeight} + ${sectionPadding} * 2)`,
        height: `calc(${mainHeight} - (${sectionPadding} * (${footerMultiplier} + 2)))`,
      }"
    >
      <left-toggle
        v-if="!footerOpen"
        class="fixed z-40 transition-all duration-500 ease-in-out"
        :style="{
          top: `calc(${headerHeight} + ${sectionPadding} * 2)`,
          left: `calc(${sidebarLeftWidth} + ${sectionPadding} * (${sidebarLeftMultiplier})`,
        }"
      />

      <sidefoot-toggle
        v-if="sidebarLeftOpen || footerOpen"
        class="fixed z-40 transition-all duration-500 ease-in-out"
        :style="{
          bottom: `calc(${footerHeight} + ${sectionPadding})`,
          left: `calc(${sidebarLeftWidth} + ${sectionPadding})`,
        }"
      />

      <kind-sidebar-simple v-if="sidebarLeftOpen" />
    </aside>

    <!-- Main Content -->
    <main
      class="fixed z-10 box-border transition-all duration-500 ease-in-out"
      :style="{
        top: `calc(${headerHeight} + ${sectionPadding} * 2)`,
        height: `calc(${mainHeight} - (${sectionPadding} * (${footerMultiplier} + 2)))`,
        right: `calc(${sidebarRightWidth} + (${sectionPadding} * ${sidebarRightMultiplier}))`,
        width: `calc(${mainWidth} - (${sectionPadding} * ${sidebarLeftMultiplier}) - (${sectionPadding} * ${sidebarRightMultiplier}))`,
      }"
    >
      <main-content />
    </main>

    <!-- Right Sidebar -->
    <aside
      class="fixed z-20 box-border transition-all duration-500 ease-in-out"
      :style="{
        width: sidebarRightWidth,
        right: sectionPadding,
        top: `calc(${headerHeight} + ${sectionPadding} * 2)`,
        height: `calc(${mainHeight} - (${sectionPadding} * (${footerMultiplier} + 2)))`,
      }"
    >
      <right-toggle
        class="fixed z-40 transition-all duration-500 ease-in-out"
        :style="{
          top: `calc(50vh - ${mainHeight} / 2)`,
          right: `calc(${sidebarRightWidth} + ${sectionPadding} * (${sidebarRightMultiplier})`,
        }"
      />

      <splash-tutorial
        v-if="sidebarRightOpen && showTutorial"
        class="h-full w-full"
      />
    </aside>

    <!-- Footer -->
    <footer
      class="fixed z-30 box-border overflow-hidden transition-all duration-500 ease-in-out"
      :style="{
        height: footerHeight,
        width: `calc(100vw - ${sectionPadding} * 2)`,
        left: sectionPadding,
        right: sectionPadding,
        bottom: sectionPadding,
      }"
    >
      <footer-toggle
        v-if="!sidebarLeftOpen"
        class="fixed z-40 transition-all duration-500 ease-in-out"
        :style="{
          bottom: `calc(${footerHeight} + ${sectionPadding})`,
          right: `calc(${sidebarRightWidth} + ${sectionPadding})`,
        }"
      />

      <horizontal-nav v-if="footerOpen" />
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
const mainWidth = computed(() => displayStore.mainWidth)

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

<style scoped>
/* No additional styles needed, using Tailwind CSS classes */
</style>
