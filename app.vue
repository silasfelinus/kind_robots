<template>
  <div
    class="main-layout h-screen w-screen relative bg-primary overflow-hidden box-border"
  >
    <!-- Loaders -->
<div class="fixed z-50" >
    <kind-loader />

    <animation-loader />
    <milestone-popup />
</div>
    <!-- Header -->
    <header
      class="fixed z-10 flex items-center justify-center box-border overflow-hidden transition-all duration-500 ease-in-out"
      :style="headerStyle"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- Left Sidebar -->
    <aside
      class="fixed z-10 box-border rounded-2xl transition-all duration-300 ease-in-out overflow-visible"
      :style="leftSidebarStyle"
      style="background-color: rgba(0, 0, 0, 0.1)"
    >
      <kind-sidebar-simple v-if="sidebarLeftOpen" class="h-full rounded-2xl w-full z-10" />
      <div
        class="absolute -top-2 left-0 p-1 z-50 rounded-2xl border-1 border-accent"
      >
        <left-toggle />
      </div>
    </aside>

    <!-- Main Content -->
    <main
      class="fixed z-10 border-1 rounded-2xl overflow-hidden box-border bg-base-300 transition-all duration-600 ease-in-out"
      :style="mainContentStyle"
    >
      <main-content />
    </main>

    <!-- Right Sidebar -->
    <aside
      class="fixed z-10 box-border transition-all duration-600 rounded-2xl ease-in-out"
      :style="rightSidebarStyle"
    >
      <splash-tutorial v-if="sidebarRightOpen" class="h-full w-full z-10" />

      <!-- Right Toggle (Top-right corner of the sidebar) -->
      <div
        class="absolute top-0 right-0 p-1 z-50 rounded-2xl border-1 border-accent"
      >
        <right-toggle />
      </div>
    </aside>

    <!-- Footer -->
    <footer
      class="fixed z-10 box-border rounded-2xl overflow-visible transition-all duration-600 ease-in-out"
      :style="footerStyle"
      style="background-color: rgba(0, 0, 0, 0.2)"
    >
      <horizontal-nav v-if="footerOpen" class="h-full w-full z-5" />
    </footer>

    <!-- Footer Toggle (Fixed to the bottom center of the screen) -->
    <div class="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50 p-1">
      <footer-toggle />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore for managing the layout state
const displayStore = useDisplayStore()

// Computed properties to access displayStore values
const headerHeight = computed(() => displayStore.headerHeight)
const footerWidth = computed(() => displayStore.footerWidth)
const sectionPadding = computed(() => displayStore.sectionPadding)
const centerHeight = computed(() => displayStore.centerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const centerWidth = computed(() => displayStore.centerWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const footerHeight = computed(() => displayStore.footerHeight)

// Pre-calculated properties for commonly used calculations
const headerAndPaddingHeight = computed(
  () => `calc(${headerHeight.value} + (${sectionPadding.value} * 2))`,
)
const sidebarRightWidthWithPadding = computed(
  () => `calc(${sidebarRightWidth.value} + (${sectionPadding.value} * 2))`,
)

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

// Computed styles for layout elements
const headerStyle = computed(() => ({
  height: headerHeight.value,
  width: footerWidth.value,
  top: sectionPadding.value,
  left: sectionPadding.value,
  right: sectionPadding.value,
}))

const leftSidebarStyle = computed(() => ({
  height: centerHeight.value,
  width: sidebarLeftWidth.value,
  top: headerAndPaddingHeight.value,
  left: sectionPadding.value,
}))

const mainContentStyle = computed(() => ({
  height: centerHeight.value,
  width: centerWidth.value,
  top: headerAndPaddingHeight.value,
  right: sidebarRightOpen.value
    ? sidebarRightWidthWithPadding.value
    : sectionPadding.value,
}))

const rightSidebarStyle = computed(() => ({
  height: centerHeight.value,
  width: sidebarRightWidth.value,
  top: headerAndPaddingHeight.value,
  right: sectionPadding.value,
}))

const footerStyle = computed(() => ({
  height: footerHeight.value,
  width: `calc(100vw - (${sectionPadding.value} * 2))`,
  bottom: sectionPadding.value,
  left: sectionPadding.value,
  right: sectionPadding.value,
}))
</script>
