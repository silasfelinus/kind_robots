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

    <!-- Toggle buttons -->
    <left-toggle class="fixed z-50" :style="leftToggleStyle" />
    <sidefoot-toggle class="fixed z-50" :style="sidefootToggleStyle" />
    <right-toggle class="fixed z-50" :style="rightToggleStyle" />
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

// Sidebar and footer states
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

// Computed styles
const headerStyle = computed(() => ({
  height: displayStore.headerHeight,
  width: displayStore.footerWidth,
  top: `calc(${displayStore.sectionPaddingVh})`,
  left: displayStore.sectionPaddingVw,
  right: displayStore.sectionPaddingVw,
}))

const leftSidebarStyle = computed(() => ({
  height: displayStore.centerHeight,
  width: displayStore.sidebarLeftWidth,
  top: `calc(${displayStore.headerHeight} + ${displayStore.sectionPaddingVh})`,
  left: displayStore.sectionPaddingVw,
}))

const mainContentStyle = computed(() => ({
  height: displayStore.centerHeight,
  width: displayStore.centerWidth,
  top: `calc(${displayStore.headerHeight} + ${displayStore.sectionPaddingVh})`,
  right: `calc(${displayStore.sidebarRightWidth} + ${displayStore.sectionPaddingVw})`,
  left: `calc(${displayStore.sidebarLeftWidth} + ${displayStore.sectionPaddingVw})`,
}))

const rightSidebarStyle = computed(() => ({
  height: displayStore.centerHeight,
  width: displayStore.sidebarRightWidth,
  top: `calc(${displayStore.headerHeight} + ${displayStore.sectionPaddingVh})`,
  right: displayStore.sectionPaddingVw,
}))

const footerStyle = computed(() => ({
  height: displayStore.footerHeight,
  width: displayStore.footerWidth,
  bottom: displayStore.sectionPaddingVh,
  left: displayStore.sectionPaddingVw,
  right: displayStore.sectionPaddingVw,
}))

// Toggle button styles
const leftToggleStyle = computed(() => ({
  top: `calc(${displayStore.headerHeight} + ${displayStore.sectionPaddingVh})`,
  left: `calc(${displayStore.sidebarLeftWidth} + ${displayStore.sectionPaddingVw})`,
}))

const sidefootToggleStyle = computed(() => ({
  bottom: `calc(${displayStore.footerHeight} + ${displayStore.sectionPaddingVh})`,
  left: `calc(${displayStore.sidebarLeftWidth} + ${displayStore.sectionPaddingVw})`,
}))

const rightToggleStyle = computed(() => ({
  top: `calc(${displayStore.headerHeight} + ${displayStore.sectionPaddingVh})`,
  right: `calc(${displayStore.sidebarRightWidth} + ${displayStore.sectionPaddingVw})`,
}))

const footerToggleStyle = computed(() => ({
  bottom: `calc(${displayStore.footerHeight} + ${displayStore.sectionPaddingVh})`,
  right: `calc(${displayStore.sidebarRightWidth} + ${displayStore.sectionPaddingVw})`,
}))
</script>
