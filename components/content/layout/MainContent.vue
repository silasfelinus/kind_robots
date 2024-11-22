<template>
  <!-- Main container -->
  <div class="h-full flex flex-col relative z-10 bg-base-300">
    <!-- Transition Wrapper -->
    <transition name="flip" mode="out-in">
      <!-- Mobile View (no flip card) -->
      <div
        v-if="isMobile"
        key="mobile-view"
        class="flex-grow overflow-y-auto"
        :style="mobileViewStyle"
      >
        <SplashTutorial
          v-if="showTutorial"
          class="h-full w-full z-10 rounded-2xl border-4"
        />
        <NuxtPage v-else class="h-full w-full z-10 no-scrollbar rounded-2xl" />
      </div>

      <!-- Fullscreen Mode (Desktop) -->
      <div
        v-else
        key="desktop-view"
        class="h-full w-full overflow-y-auto no-scrollbar z-10 flex-grow"
        :style="desktopViewStyle"
      >
        <NuxtPage class="h-full w-full rounded-2xl" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access layout-related data and state from displayStore
const displayStore = useDisplayStore()

// Layout dimensions and state
const isMobile = computed(() => displayStore.isMobileViewport)
const showTutorial = computed(() => displayStore.showTutorial)

// Compute styles dynamically using displayStore values
const mobileViewStyle = computed(() => ({
  height: `calc(100vh - ${displayStore.headerHeight} - ${displayStore.footerHeight})`,
  padding: displayStore.sectionPadding,
}))

const desktopViewStyle = computed(() => ({
  height: `calc(100vh - ${displayStore.headerHeight} - ${displayStore.footerHeight})`,
  margin: `${displayStore.sectionPadding}`,
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
