<template>
  <div
    class="main-layout h-screen w-screen relative bg-primary overflow-hidden box-border"
  >
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

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
      <div class="absolute top-0 left-0 p-1 z-50">
        <left-toggle />
      </div>
    </aside>

    <!-- Main Content -->
    <main
      class="fixed z-10 border-4 rounded-2xl overflow-hidden box-border transition-all duration-600 ease-in-out"
      :style="mainContentStyle"
    >
      <main-content />
    </main>

    <!-- Right Sidebar -->
    <aside
      class="fixed z-10 box-border transition-all duration-600 ease-in-out"
      :style="rightSidebarStyle"
    >
      <splash-tutorial v-if="sidebarRightOpen" class="h-full w-full z-10" />

      <!-- Right Toggle (Top-right corner of the sidebar) -->
      <div class="absolute top-0 right-0 p-1 z-50">
        <right-toggle />
      </div>
    </aside>

    <!-- Footer -->
    <footer
      class="fixed z-10 box-border overflow-hidden transition-all duration-600 ease-in-out"
      :style="footerStyle"
    >
      <!-- Footer Toggle (Centered within the footer) -->
      <div class="absolute left-1/2 transform -translate-x-1/2 z-50 p-1">
        <footer-toggle />
      </div>
      <horizontal-nav v-if="footerOpen" class="h-full w-full z-5" />
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

// Computed styles for layout elements
const headerStyle = computed(() => ({
  height: `${displayStore.headerVh}vh`,
  width: displayStore.footerWidth,
  top: displayStore.sectionPadding,
  left: displayStore.sectionPadding,
  right: displayStore.sectionPadding,
}))

const leftSidebarStyle = computed(() => ({
  height: displayStore.centerHeight,
  width: `${displayStore.sidebarLeftVw}vw`,
  top: `calc(${displayStore.headerVh}vh + (${displayStore.sectionPadding} * 2 ))`,
  left: displayStore.sectionPadding,
}))

const mainContentStyle = computed(() => ({
  height: displayStore.centerHeight,
  width: displayStore.centerWidth,
  top: `calc(${displayStore.headerVh}vh + (${displayStore.sectionPadding} * 2 ))`,
  right: sidebarRightOpen.value
    ? `calc(${displayStore.sidebarRightVw}vw + (${displayStore.sectionPadding} * 2 ))`
    : displayStore.sectionPadding,
}))

const rightSidebarStyle = computed(() => ({
  height: displayStore.centerHeight,
  width: `${displayStore.sidebarRightVw}vw`,
  top: `calc(${displayStore.headerVh}vh + (${displayStore.sectionPadding} * 2 ))`,
  right: displayStore.sectionPadding,
}))

const footerStyle = computed(() => ({
  height: displayStore.footerHeight,
  width: `calc(100vw - (${displayStore.sectionPadding} * 2))`,
  bottom: displayStore.sectionPadding,
  left: displayStore.sectionPadding,
  right: displayStore.sectionPadding,
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
}))
</script>
