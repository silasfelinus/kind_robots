<template>
  <!-- Main container -->
  <div class="h-full flex flex-col rounded-2xl relative z-10">
    <!-- Wrapper for mode-row and transition content -->
    <div :class="wrapperClass" :style="viewStyle">
      <!-- Mode Row: Fixed height of 10% -->
      <mode-row class="w-full flex-shrink-0" style="height: 10%;" />

      <!-- Transaction Wrapper occupies remaining 90% -->
      <div class="flex-grow" style="height: 90%;">
        <transition name="flip" mode="out-in">
          <!-- Mobile View (no flip card) -->
          <div v-if="isMobile" key="mobile-view" class="h-full w-full">
            <SplashTutorial
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
    </div>
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

// BigMode state from store
const isBigMode = computed(() => displayStore.bigMode)

// Dynamic styles and classes
const viewStyle = computed(() => ({
  height: isBigMode.value ? '100vh' : displayStore.centerHeight,
}))

const wrapperClass = computed(() =>
  isBigMode.value
    ? 'fixed top-0 left-0 h-screen w-screen z-30 bg-base-200 flex flex-col'
    : 'relative flex flex-col flex-grow'
)
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
