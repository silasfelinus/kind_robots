<template>
  <div class="main-layout h-screen w-screen relative bg-primary box-border">
    <!-- Loaders -->
    <kind-loader />
    <animation-loader />

    <!-- Header -->
    <header
      class="fixed w-full z-30 flex items-center justify-center bg-primary box-border overflow-hidden"
      :style="{
        height: headerHeight,
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
        top: `calc(${headerHeight} + ${sectionPadding} * 2)`, // Correct calculation
        bottom: `calc(${footerHeight} + ${sectionPadding} * 2)`,
      }"
    >
      <kind-sidebar-simple v-if="sidebarLeftOpen" />
    </aside>

    <!-- Main Content -->
    <main
      class="absolute z-10 box-border overflow-hidden transition-all duration-300"
      :style="{
        top: `calc(${headerHeight} + ${sectionPadding} * 2)`,
        bottom: `calc(${footerHeight} + ${sectionPadding} * 2)`,
        left: `calc(${sidebarLeftWidth} + ${sectionPadding} * 2)`,
        right: `calc(${sidebarRightWidth} + ${sectionPadding} * 2)`,
      }"
    >
      <main-content />
    </main>

    <!-- Right Sidebar -->
    <aside
      class="fixed z-20 box-border transition-all duration-500 ease-in-out bg-primary"
      :style="{
        width: sidebarRightWidth,
        right: sectionPadding,
        top: `calc(${headerHeight} + ${sectionPadding} * 2)`,
        bottom: `calc(${footerHeight} + ${sectionPadding} * 2)`,
      }"
    >
      <splash-tutorial
        v-if="showTutorial && isLargeScreen"
        class="h-full w-full"
      />
    </aside>

    <!-- Footer -->
    <footer
      class="fixed z-30 box-border overflow-hidden"
      :style="{
        height: footerHeight,
        left: sectionPadding,
        right: sectionPadding,
        bottom: sectionPadding,
      }"
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

// Compute header height using custom vh
const headerHeight = computed(
  () => `calc(var(--vh) * ${displayStore.headerVh})`,
)

// Sidebar widths for left and right
const sidebarLeftWidth = computed(() => `${displayStore.sidebarLeftVw}vw`)
const sidebarRightWidth = computed(() => `${displayStore.sidebarRightVw}vw`)

// Footer height
const footerHeight = computed(
  () => `calc(var(--vh) * ${displayStore.footerVh})`,
)

// Padding for all sections (consistent)
const sectionPadding = '16px' // This can be customized based on your need

// Control for tutorial visibility
const showTutorial = computed(() => displayStore.showTutorial)

// Check if the footer is open
const footerOpen = computed(() => displayStore.footerState === 'open')

// Check if the left sidebar is open
const sidebarLeftOpen = computed(
  () => displayStore.sidebarLeftState !== 'hidden',
)

// Check if it's a large viewport
const isLargeScreen = computed(() => displayStore.isLargeViewport)
</script>
