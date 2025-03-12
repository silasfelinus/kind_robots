<template>
  <div
    class="main-layout h-screen w-screen relative bg-base-300 overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <Analytics />
      <animation-loader class="fixed z-50" />
    </div>

    <!-- Header -->
    <header
      class="fixed z-20 flex items-center justify-center box-border transition-all duration-500 ease-in-out"
      :style="headerStyle"
    >
      <header-upgrade class="flex-grow text-center" />
    </header>

    <!-- ModeRow -->
    <div
      class="fixed w-full flex justify-center transition-all duration-500 ease-in-out"
      :style="modeRowStyle"
    >
      <mode-row class="relative z-10" />
    </div>

    <!-- Left Sidebar -->
    <aside
      v-show="sidebarLeftVisible"
      class="fixed z-10 box-border rounded-2xl transition-all duration-300 ease-in-out overflow-visible"
      :style="leftSidebarStyle"
    >
      <kind-sidebar-simple class="relative z-10 h-full rounded-2xl w-full" />
    </aside>

    <!-- Main Flip Animation Container -->
    <main
      class="flip-container fixed z-10 transition-all duration-600 rounded-2xl ease-in-out"
      :style="mainContentStyle"
    >
      <div class="flip-inner" :class="{ 'is-flipped': flipping }">
        <!-- Front side: Current page -->
        <div class="flip-page flip-front">
          <NuxtPage :key="$route.fullPath" />
        </div>
        <!-- Back side: Previous page (during flip) -->
        <div class="flip-page flip-back">
          <NuxtPage v-if="previousRoute" :key="previousRoute" />
        </div>
      </div>
    </main>

    <!-- Right Sidebar -->
    <aside
      v-show="sidebarRightVisible"
      class="fixed z-10 box-border transition-all duration-600 rounded-2xl ease-in-out"
      :style="rightSidebarStyle"
    >
      <splash-tutorial class="h-full w-full z-10" />
    </aside>

    <!-- Footer -->
    <footer
      v-show="footerVisible"
      class="fixed z-10 box-border rounded-2xl overflow-visible transition-all duration-600 ease-in-out"
      :style="footerStyle"
      style="background-color: rgba(0, 0, 0, 0.2)"
    >
      <horizontal-nav class="h-full w-full z-5" />
    </footer>

    <!-- Footer Toggle -->
    <div class="fixed bottom-1 left-1/2 transform -translate-x-1/2 z-50">
      <footer-toggle />
    </div>

    <!-- Milestone Popup -->
    <milestone-popup class="fixed z-50" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useRoute } from 'vue-router'

const displayStore = useDisplayStore()
const route = useRoute()

const flipping = ref(false)
const previousRoute = ref<string | null>(null)

// Flip animation on route change
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    if (newPath !== oldPath) {
      console.log(`[Flip] Transitioning from ${oldPath} to ${newPath}`)

      previousRoute.value = oldPath // Store the previous route
      flipping.value = true

      setTimeout(() => {
        flipping.value = false
      }, 600) // Match transition duration
    }
  },
)

// Make store state reactive
const sidebarLeftVisible = computed(() => displayStore.sidebarLeftVisible)
const sidebarRightVisible = computed(() => displayStore.sidebarRightVisible)
const footerVisible = computed(() => displayStore.footerVisible)

const headerStyle = computed(() => displayStore.headerStyle)
const leftSidebarStyle = computed(() => displayStore.leftSidebarStyle)
const mainContentStyle = computed(() => displayStore.mainContentStyle)
const rightSidebarStyle = computed(() => displayStore.rightSidebarStyle)
const footerStyle = computed(() => displayStore.footerStyle)

const modeRowStyle = computed(() => ({
  top: `calc(${displayStore.headerHeight} + 8px)`,
  zIndex: 15,
}))
</script>

<style scoped>
.flip-container {
  perspective: 1200px;
  width: 100%;
  height: 100%;
  position: relative;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
  transform-origin: center;
}

.flip-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-page {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.flip-front {
  transform: rotateY(0deg);
  background: white;
  z-index: 2;
}

.flip-back {
  transform: rotateY(180deg);
  background: white;
  z-index: 1;
}
</style>
