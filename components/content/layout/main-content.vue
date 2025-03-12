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
      class="fixed z-10 box-border rounded-2xl transition-all duration-300 ease-in-out overflow-visible"
      :style="leftSidebarStyle"
    >
      <kind-sidebar-simple
        v-if="sidebarLeftOpen"
        class="relative z-10 h-full rounded-2xl w-full"
      />
    </aside>

    <!-- Main Content -->
    <main
      class="fixed z-10 box-border transition-all duration-600 rounded-2xl ease-in-out"
      :style="mainContentStyle"
    >
      <mode-row class="z-30 w-full flex-shrink-0" style="height: 5%" />
      <div class="flex-grow" style="height: 95%">
        <transition name="flip" mode="out-in">
          <!-- Mobile View (no flip card) -->
          <div v-if="isMobile" key="mobile-view" class="h-full w-full">
            <splash-tutorial
              v-if="showTutorial"
              class="h-full w-full z-10 rounded-2xl border-4"
            />
            <NuxtPage
              v-else
              class="relative h-full w-full z-10 no-scrollbar overflow-y-auto rounded-2xl bg-base-300 border-1 border-accent"
            />
          </div>

          <!-- Desktop View -->
          <div v-else key="desktop-view" class="h-full w-full">
            <NuxtPage
              class="relative h-full w-full rounded-2xl overflow-y-auto bg-base-300 border-1 border-accent z-10"
            />
          </div>
        </transition>
      </div>
    </main>

    <!-- Right Sidebar -->
    <aside
      class="fixed z-10 box-border transition-all duration-600 rounded-2xl ease-in-out"
      :style="rightSidebarStyle"
    >
      <splash-tutorial v-if="sidebarRightOpen" class="h-full w-full z-10" />
    </aside>

    <!-- Footer -->
    <footer
      class="fixed z-10 box-border rounded-2xl overflow-visible transition-all duration-600 ease-in-out"
      :style="footerStyle"
      style="background-color: rgba(0, 0, 0, 0.2)"
    >
      <horizontal-nav v-if="footerOpen" class="h-full w-full z-5" />
    </footer>

    <!-- Footer Toggle -->
    <div class="fixed bottom-1 left-1/2 transform -translate-x-1/2 z-50">
      <footer-toggle />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { Analytics } from '@vercel/analytics/nuxt'

const displayStore = useDisplayStore()

const headerHeight = computed(() => displayStore.headerHeight)
const footerWidth = computed(() => displayStore.footerWidth)
const sectionPadding = computed(() => displayStore.sectionPadding)
const centerHeight = computed(() => displayStore.centerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const centerWidth = computed(() => displayStore.centerWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const footerHeight = computed(() => displayStore.footerHeight)

const headerAndPaddingHeight = computed(
  () => `calc(${headerHeight.value} + (${sectionPadding.value} * 2))`,
)

const sidebarRightWidthWithPadding = computed(
  () => `calc(${sidebarRightWidth.value} + (${sectionPadding.value} * 2))`,
)

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

const showTutorial = computed(() => displayStore.showTutorial)
const isMobile = computed(() => displayStore.isMobileViewport)

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

const modeRowHeight = computed(() => `calc(${centerHeight.value} * 0.05)`)

const rightSidebarStyle = computed(() => ({
  height: `calc(${centerHeight.value} - ${modeRowHeight.value})`,
  width: sidebarRightWidth.value,
  top: `calc(${headerAndPaddingHeight.value} + ${modeRowHeight.value})`,
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

<style scoped>
/* Flip transition effect */
.flip-enter-active,
.flip-leave-active {
  transform-style: preserve-3d;
  perspective: 1000px;
  transition: transform 0.6s ease-in-out;
}

.flip-enter,
.flip-leave-to {
  transform: rotateY(90deg);
}

.flip-leave,
.flip-enter-to {
  transform: rotateY(0deg);
}
</style>
