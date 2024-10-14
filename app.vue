<template>
  <div
    class="main-layout h-screen w-screen relative bg-primary overflow-hidden box-border"
  >
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />
    <debug-launcher />

    <!-- Header -->
    <header
      class="fixed z-10 flex items-center justify-center box-border overflow-hidden transition-all duration-500 ease-in-out"
      :style="headerStyle"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Left Sidebar -->
    <aside
      class="fixed z-10 box-border transition-all duration-300 ease-in-out"
      :style="leftSidebarStyle"
    >
      <kind-sidebar-simple v-if="sidebarLeftOpen" />
    </aside>

    <!-- Main Content -->
    <main
      class="fixed z-10 border-4 rounded-2xl overflow-hidden box-border transition-all duration-600 ease-in-out"
      :style="mainContentStyle"
    >
      <main-content />
    </main>

    <!-- Toggle buttons outside fixed elements -->
    <!-- Left toggle button (top-left corner of the sidebar) -->
    <left-toggle class="fixed z-50" :style="leftToggleStyle" />

    <!-- Sidefoot toggle button (bottom-right corner of the sidebar) -->
    <sidefoot-toggle class="fixed z-50" :style="sidefootToggleStyle" />

    <!-- Right toggle button (top-right corner of the sidebar) -->
    <right-toggle class="fixed z-50" :style="rightToggleStyle" />

    <!-- Footer toggle button (bottom-left corner of the footer) -->
    <footer-toggle class="fixed z-50" :style="footerToggleStyle" />

    <!-- Right Sidebar -->
    <aside
      class="fixed z-10 box-border transition-all duration-600 ease-in-out"
      :style="rightSidebarStyle"
    >
      <splash-tutorial v-if="sidebarRightOpen" class="h-full w-full" />
    </aside>

    <!-- Footer -->
    <footer
      class="fixed z-10 box-border overflow-hidden transition-all duration-600 ease-in-out"
      :style="footerStyle"
    >
      <horizontal-nav v-if="footerOpen" class="h-full w-full" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore for managing the layout state
const displayStore = useDisplayStore()
const footerOpen = computed(() => displayStore.footerState === 'open')

const sidebarLeftOpen = computed(
  () =>
    displayStore.sidebarLeftState !== 'hidden' &&
    displayStore.sidebarLeftState !== 'disabled',
)
const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)

// Computed styles from the displayStore directly
const headerStyle = computed(() => ({
  height: displayStore.headerHeight,
  width: displayStore.footerWidth,
  top: displayStore.sectionPadding,
  left: displayStore.sectionPadding,
  right: displayStore.sectionPadding,
}))

const leftSidebarStyle = computed(() => ({
  height: displayStore.centerHeight,
  width: displayStore.sidebarLeftWidth,
  top: `calc(${displayStore.headerHeight} + (${displayStore.sectionPadding} * 2))`,
  left: displayStore.sectionPadding,
}))

const mainContentStyle = computed(() => ({
  height: displayStore.centerHeight,
  width: displayStore.centerWidth,
  top: `calc(${displayStore.headerHeight} + ${displayStore.sectionPadding} * 2)`,
  right: `calc(${displayStore.sidebarRightWidth} + ${displayStore.sectionPadding} * ${displayStore.sidebarRightMultiplier})`,
  left: `calc(${displayStore.sidebarLeftWidth} + ${displayStore.sectionPadding} * ${displayStore.sidebarLeftMultiplier} )`,
}))

const rightSidebarStyle = computed(() => ({
  height: displayStore.centerHeight,
  width: displayStore.sidebarRightWidth,
  top: `calc(${displayStore.headerHeight} + ${displayStore.sectionPadding} * 2)`,
  right: displayStore.sectionPadding,
}))

const footerStyle = computed(() => ({
  height: displayStore.footerHeight,
  width: displayStore.footerWidth,
  bottom: displayStore.sectionPadding,
  left: displayStore.sectionPadding,
  right: displayStore.sectionPadding,
}))

const leftToggleStyle = computed(() => ({
  top: `calc(${displayStore.headerHeight} + (${displayStore.sectionPadding} * 2))`,
  left: `calc(${displayStore.sidebarLeftWidth} + (${displayStore.sectionPadding} * ${displayStore.sidebarLeftMultiplier}))`,
}))

const sidefootToggleStyle = computed(() => ({
  bottom: `calc(${displayStore.footerHeight} + (${displayStore.sectionPadding} * ${displayStore.footerMultiplier}))`,
  left: `calc(${displayStore.sidebarLeftWidth} + (${displayStore.sectionPadding} * ${displayStore.sidebarLeftMultiplier}))`,
}))

const rightToggleStyle = computed(() => ({
  top: `calc(${displayStore.headerHeight} + ${displayStore.sectionPadding} * 2)`,
  right: `calc(${displayStore.sidebarRightWidth} + (${displayStore.sectionPadding} * ${displayStore.sidebarRightMultiplier}))`,
}))

const footerToggleStyle = computed(() => ({
  bottom: `calc(${displayStore.footerHeight} + ${displayStore.sectionPadding} * ${displayStore.footerMultiplier})`,
  right: `calc(${displayStore.sidebarRightWidth} + (${displayStore.sectionPadding} * ${displayStore.sidebarRightMultiplier}))`,
}))
</script>
