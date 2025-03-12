<template>
  <div
    class="main-layout h-screen w-screen relative bg-base-300 overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <Analytics />
      <animation-loader class="fixed z-50" />
      <milestone-popup class="fixed z-50" />
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
      v-if="sidebarLeftVisible"
      class="fixed z-10 box-border rounded-2xl transition-all duration-300 ease-in-out overflow-visible"
      :style="leftSidebarStyle"
    >
      <kind-sidebar-simple class="relative z-10 h-full rounded-2xl w-full" />
    </aside>

    <!-- Main Content with Flip Effect -->
    <main
      class="fixed z-10 box-border transition-all duration-600 rounded-2xl ease-in-out"
      :style="mainContentStyle"
    >
      <mode-row class="z-30 w-full flex-shrink-0" style="height: 5%" />
      <FlipScreen>
        <template #front>
          <NuxtPage
            :key="$route.fullPath"
            class="relative h-full w-full rounded-2xl overflow-y-auto bg-base-300 border-1 border-accent z-10"
          />
        </template>
        <template #back></template>
      </FlipScreen>
    </main>

    <!-- Right Sidebar -->
    <aside
      v-if="sidebarRightVisible"
      class="fixed z-10 box-border transition-all duration-600 rounded-2xl ease-in-out"
      :style="rightSidebarStyle"
    >
      <splash-tutorial class="h-full w-full z-10" />
    </aside>

    <!-- Footer -->
    <footer
      v-if="footerVisible"
      class="fixed z-10 box-border rounded-2xl overflow-visible transition-all duration-600 ease-in-out"
      :style="footerStyle"
      style="background-color: rgba(0, 0, 0, 0.2)"
    >
      <horizontal-nav class="h-full w-full z-5" />
    </footer>

    <!-- Footer Toggle (Fixed to the bottom center of the screen) -->
    <div class="fixed bottom-1 left-1/2 transform -translate-x-1/2 z-50">
      <footer-toggle />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { Analytics } from '@vercel/analytics/nuxt'

// Store
const displayStore = useDisplayStore()

// Computed Properties
const headerHeight = computed(() => displayStore.headerHeight)
const footerWidth = computed(() => displayStore.footerWidth)
const sectionPadding = computed(() => displayStore.sectionPadding)
const centerHeight = computed(() => displayStore.centerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const centerWidth = computed(() => displayStore.centerWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const footerHeight = computed(() => displayStore.footerHeight)

// Sidebar & Footer Visibility
const sidebarLeftVisible = computed(
  () =>
    displayStore.sidebarLeftState !== 'hidden' &&
    displayStore.sidebarLeftState !== 'disabled',
)
const sidebarRightVisible = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)
const footerVisible = computed(() => displayStore.footerState === 'open')

// Computed Styles
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
  top: `calc(${headerHeight.value} + (${sectionPadding.value} * 2))`,
  left: sectionPadding.value,
}))

const mainContentStyle = computed(() => ({
  height: centerHeight.value,
  width: centerWidth.value,
  top: `calc(${headerHeight.value} + (${sectionPadding.value} * 2))`,
  right: sidebarRightVisible.value
    ? `calc(${sidebarRightWidth.value} + (${sectionPadding.value} * 2))`
    : sectionPadding.value,
}))

const rightSidebarStyle = computed(() => ({
  height: centerHeight.value,
  width: sidebarRightWidth.value,
  top: `calc(${headerHeight.value} + (${sectionPadding.value} * 2))`,
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
