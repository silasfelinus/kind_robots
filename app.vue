<template>
  <div class="main-layout h-screen w-screen relative bg-primary box-border">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Header -->
    <header
      class="fixed w-full z-30 flex items-center justify-center bg-primary box-border overflow-hidden transition-all duration-500 ease-in-out"
      :style="headerStyle"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Left Sidebar -->
    <aside
      class="fixed z-20 box-border transition-all duration-300 ease-in-out"
      :style="leftSidebarStyle"
    >
      <!-- Left toggle button (top-left corner of the sidebar) -->
      <left-toggle
        class="fixed z-40 transition-all duration-600 ease-in-out"
        :style="leftToggleStyle"
      />
      <!-- Sidefoot toggle button (bottom-right corner of the sidebar) -->
      <sidefoot-toggle
        class="fixed z-40 transition-all duration-600 ease-in-out"
        :style="sidefootToggleStyle"
      />
      <kind-sidebar-simple />
    </aside>

    <!-- Main Content -->
    <main
      class="fixed z-10 box-border transition-all duration-600 ease-in-out"
      :style="mainContentStyle"
    >
      <main-content />
    </main>

    <!-- Right Sidebar -->
    <aside
      class="fixed z-20 box-border transition-all duration-600 ease-in-out"
      :style="rightSidebarStyle"
    >
      <!-- Right toggle button (top-right corner of the sidebar) -->
      <right-toggle
        class="fixed z-40 transition-all duration-600 ease-in-out"
        :style="rightToggleStyle"
      />
      <splash-tutorial v-if="showTutorial" class="h-full w-full" />
    </aside>

    <!-- Footer -->
    <footer
      class="fixed z-30 box-border overflow-hidden transition-all duration-600 ease-in-out"
      :style="footerStyle"
    >
      <!-- Footer toggle button (bottom-left corner of the footer) -->
      <footer-toggle
        class="fixed z-40 transition-all duration-600 ease-in-out"
        :style="footerToggleStyle"
      />
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
const headerHeight = computed(() => `calc(var(--vh) * ${displayStore.headerVh})`)
const mainHeight = computed(() => displayStore.mainHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const footerHeight = computed(() => `calc(var(--vh) * ${displayStore.footerVh})`)
const sectionPadding = '16px'
const showTutorial = computed(() => displayStore.showTutorial)
const footerOpen = computed(() => displayStore.footerState === 'open')
const sidebarLeftOpen = computed(() => displayStore.sidebarLeftState !== 'hidden' && displayStore.sidebarLeftState !== 'disabled')
const sidebarRightOpen = computed(() => displayStore.sidebarRightState !== 'hidden' && displayStore.sidebarRightState !== 'disabled')
const footerMultiplier = computed(() => (footerOpen.value ? 2 : 1))
const sidebarLeftMultiplier = computed(() => (sidebarLeftOpen.value ? 2 : 1))
const sidebarRightMultiplier = computed(() => (sidebarRightOpen.value ? 2 : 1))

// Computed styles
const headerStyle = computed(() => ({
  height: headerHeight.value,
  width: `calc(100vw - ${sectionPadding} * 2)`,
  top: sectionPadding,
  left: sectionPadding,
  right: sectionPadding,
}))

const leftSidebarStyle = computed(() => ({
  width: sidebarLeftWidth.value,
  left: sectionPadding,
  top: `calc(${headerHeight.value} + ${sectionPadding} * 2)`,
  height: `calc(${mainHeight.value} - (${sectionPadding} * (${footerMultiplier.value} + 2)))`,
}))

const leftToggleStyle = computed(() => ({
  top: `calc(${headerHeight.value} + ${sectionPadding} * 3)`,
  left: `calc(${sidebarLeftWidth.value} + ${sectionPadding} * (${sidebarLeftMultiplier.value} + 1))`,
}))

const sidefootToggleStyle = computed(() => ({
  bottom: `calc(${footerHeight.value} + (${sectionPadding} * (${footerMultiplier.value} + 2)))`,
  left: `calc(${sidebarLeftWidth.value} + (${sectionPadding} * (${sidebarLeftMultiplier.value} + 2)))`,
}))

const mainContentStyle = computed(() => ({
  top: `calc(${headerHeight.value} + ${sectionPadding} * 2)`,
  height: `calc(${mainHeight.value} - (${sectionPadding} * (${footerMultiplier.value} + 2)))`,
  right: sidebarRightOpen.value
    ? `calc(${sidebarRightWidth.value} + (${sectionPadding} * ${sidebarRightMultiplier.value}))`
    : sectionPadding,
  left: sidebarLeftOpen.value
    ? `calc(${sidebarLeftWidth.value} + (${sectionPadding} * ${sidebarLeftMultiplier.value}))`
    : sectionPadding,
  width: `calc(100vw - (${sectionPadding} * (${sidebarLeftMultiplier.value} + ${sidebarRightMultiplier.value}) + ${sidebarLeftOpen.value ? sidebarLeftWidth.value : 0} + ${sidebarRightOpen.value ? sidebarRightWidth.value : 0}))`,
}))

const rightSidebarStyle = computed(() => ({
  width: sidebarRightWidth.value,
  right: sectionPadding,
  top: `calc(${headerHeight.value} + ${sectionPadding} * 2)`,
  height: `calc(${mainHeight.value} - (${sectionPadding} * (${footerMultiplier.value} + 2)))`,
}))

const rightToggleStyle = computed(() => ({
  top: `calc(${headerHeight.value} + ${sectionPadding} * 2)`,
  right: `calc(${sidebarRightWidth.value} + (${sectionPadding} * ${sidebarRightMultiplier.value}))`,
}))

const footerStyle = computed(() => ({
  height: footerHeight.value,
  width: `calc(100vw - ${sectionPadding} * 2)`,
  left: sectionPadding,
  right: sectionPadding,
  bottom: sectionPadding,
}))

const footerToggleStyle = computed(() => ({
  bottom: `calc(${footerHeight.value} + ${sectionPadding} * ${footerMultiplier.value})`,
  right: `calc(${sidebarRightWidth.value} + ${sectionPadding} * (${sidebarRightMultiplier.value} + 1))`,
}))
</script>
