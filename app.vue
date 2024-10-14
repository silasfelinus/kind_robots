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

    <!-- Toggle buttons section -->
    <div class="fixed z-50 pointer-events-none">
      <!-- Left Toggle -->
      <div class="pointer-events-auto" :style="leftToggleStyle">
        <left-toggle />
      </div>

      <!-- Sidefoot Toggle -->
      <div class="pointer-events-auto" :style="sidefootToggleStyle">
        <sidefoot-toggle />
      </div>

      <!-- Right Toggle -->
      <div class="pointer-events-auto" :style="rightToggleStyle">
        <right-toggle />
      </div>

      <!-- Footer Toggle -->
      <div class="pointer-events-auto" :style="footerToggleStyle">
        <footer-toggle />
      </div>
    </div>

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

// Computed styles from the displayStore
const headerStyle = computed(() => ({
  height: `${displayStore.headerVh}vh`,
  width: displayStore.footerWidth,
  top: displayStore.sectionPadding,
  left: displayStore.sectionPadding,
  right: displayStore.sectionPadding,
}))

const leftSidebarStyle = computed(() => ({
  height: `${displayStore.centerHeight}vh`, // 'vh'
  width: `${displayStore.sidebarLeftVw}vw`, // 'vw'
  top: `calc(${displayStore.headerVh}vh + ${displayStore.sectionPadding})`, // 'vh' and 'px'
  left: displayStore.sectionPadding, // 'px'
}))

const mainContentStyle = computed(() => ({
  height: `${displayStore.centerHeight}vh`, // 'vh'
  width: `${displayStore.centerWidth}vw`, // 'vw'
  top: `calc(${displayStore.headerVh}vh + ${displayStore.sectionPadding})`, // 'vh' and 'px'
  right: sidebarRightOpen.value
    ? `calc(${displayStore.sidebarRightVw}vw + ${displayStore.sectionPadding})` // 'vw' and 'px'
    : displayStore.sectionPadding, // 'px'
}))

const rightSidebarStyle = computed(() => ({
  height: `${displayStore.centerHeight}vh`, // 'vh'
  width: `${displayStore.sidebarRightVw}vw`, // 'vw'
  top: `calc(${displayStore.headerVh}vh + ${displayStore.sectionPadding})`, // 'vh' and 'px'
  right: displayStore.sectionPadding, // 'px'
}))

const footerStyle = computed(() => ({
  height: `${displayStore.footerVh}vh`, // 'vh'
  width: `calc(100vw - ${displayStore.sectionPadding} * 2)`, // 'vw' and 'px'
  bottom: displayStore.sectionPadding, // 'px'
  left: displayStore.sectionPadding, // 'px'
  right: displayStore.sectionPadding, // 'px'
}))

// Toggle button styles
const leftToggleStyle = computed(() => ({
  top: `calc(${displayStore.headerVh}vh + ${displayStore.sectionPadding})`, // 'vh' and 'px'
  left: `calc(${displayStore.sidebarLeftVw}vw + ${displayStore.sectionPadding})`, // 'vw' and 'px'
}))

const sidefootToggleStyle = computed(() => ({
  bottom: `calc(${displayStore.footerVh}vh + ${displayStore.sectionPadding})`, // 'vh' and 'px'
  left: `calc(${displayStore.sidebarLeftVw}vw + ${displayStore.sectionPadding})`, // 'vw' and 'px'
}))

const rightToggleStyle = computed(() => ({
  top: `calc(${displayStore.headerVh}vh + ${displayStore.sectionPadding})`, // 'vh' and 'px'
  right: `calc(${displayStore.sidebarRightVw}vw + ${displayStore.sectionPadding})`, // 'vw' and 'px'
}))

const footerToggleStyle = computed(() => ({
  bottom: `calc(${displayStore.footerVh}vh + ${displayStore.sectionPadding})`, // 'vh' and 'px'
  right: `calc(${displayStore.sidebarRightVw}vw + ${displayStore.sectionPadding})`, // 'vw' and 'px'
}))
</script>
