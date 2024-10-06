<template>
  <!-- Content of MainContent.vue focuses only on its content -->
  <div class="h-full">
    <!-- Mobile View (no flip card) -->
    <div v-if="isMobile">
      <SplashTutorial
        v-if="showTutorial"
        class="h-full w-full z-10 rounded-2xl"
      />
      <NuxtPage v-else class="h-full w-full z-10 overflow-y-auto rounded-2xl" />
    </div>

    <!-- Fullscreen mode (Desktop) -->
    <div v-else-if="isFullScreen" class="h-full rounded-2xl z-10 overflow-y-auto">
      <NuxtPage class="h-full w-full" />
    </div>

    <!-- Flip-card mode (Desktop) -->
    <div
      v-else
      class="flip-card-inner h-full z-10"
      :class="{ 'is-flipped': !showTutorial }"
    >
      <div class="flip-card-front rounded-2xl h-full">
        <SplashTutorial class="h-full w-full" />
      </div>
      <div class="flip-card-back rounded-2xl overflow-y-auto z-10">
        <NuxtPage class="h-full w-full" />
      </div>
    </div>
    <tutorial-toggle />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access layout-related data and state from displayStore
const displayStore = useDisplayStore()

// Layout dimensions and state
const isMobile = computed(() => displayStore.isMobileViewport)
const isFullScreen = computed(() => displayStore.isFullScreen)
const showTutorial = computed(() => displayStore.showTutorial)
</script>

<style scoped>
/* Flip-card style */
.flip-card {
  perspective: 1500px;
  width: 100%;
  height: 100%;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border: 2px solid var(--bg-base);
  border-radius: 5px;
}

.flip-card-front {
  z-index: 2;
}

.flip-card-back {
  transform: rotateY(180deg);
  z-index: 1;
}
</style>
