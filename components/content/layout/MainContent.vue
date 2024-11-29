<template>
  <!-- Main container -->
  <div class="h-full flex flex-col relative z-10">
    <!-- Fullscreen Toggle Icon -->
    <div
      class="absolute top-2 left-2 z-20 cursor-pointer bg-base-200 p-2 rounded-full shadow-md hover:bg-base-300 transition"
      @click="toggleFullscreen"
    >
      <icon v-if="!isFullscreen" name="expand" class="text-xl" />
      <icon v-else name="contract" class="text-xl" />
    </div>

    <!-- Transition Wrapper -->
    <transition name="flip" mode="out-in">
      <!-- Mobile View (no flip card) -->
      <div
        v-if="isMobile"
        key="mobile-view"
        :class="containerClass"
        :style="viewStyle"
      >
        <SplashTutorial
          v-if="showTutorial"
          class="h-full w-full z-10 rounded-2xl border-4"
        />
        <NuxtPage
          v-else
          class="h-full w-full z-10 no-scrollbar rounded-2xl box-border bg-base-300 border-1 border-accent"
        />
      </div>

      <!-- Fullscreen Mode (Desktop) -->
      <div v-else key="desktop-view" :class="containerClass" :style="viewStyle">
        <NuxtPage
          class="h-full w-full rounded-2xl box-border bg-base-300 border-1 border-accent"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access layout-related data and state from displayStore
const displayStore = useDisplayStore()

// Layout dimensions and state
const isMobile = computed(() => displayStore.isMobileViewport)
const showTutorial = computed(() => displayStore.showTutorial)

// Fullscreen state
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// Dynamic styles and classes
const viewStyle = computed(() => ({
  height: isFullscreen.value ? '100vh' : displayStore.centerHeight,
  padding: isFullscreen.value ? '0' : `${displayStore.sectionPaddingNumeric}px`,
}))

const containerClass = computed(() =>
  isFullscreen.value
    ? 'fixed top-0 left-0 h-screen w-screen z-30 bg-base-200'
    : 'relative flex-grow',
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
