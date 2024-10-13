<template>
  <!-- Main container -->
  <div class="h-full flex flex-col">
    
    <!-- Mobile View (no flip card) -->
    <div v-if="isMobile" class="flex-grow overflow-y-auto">
      <SplashTutorial
        v-if="showTutorial"
        class="h-full w-full z-10 rounded-2xl"
      />
      <NuxtPage v-else class="h-full w-full z-10 overflow-y-auto rounded-2xl" />
    </div>

    <!-- Fullscreen Mode (Desktop) -->
    <div v-else-if="isFullScreen" class="h-full w-full overflow-y-auto rounded-2xl z-10 flex-grow">
      <NuxtPage class="h-full w-full" />
    </div>

    <!-- Flip-card Mode (Medium Screens) -->
    <div v-else class="flip-card-inner h-full z-10 flex-grow transition-transform duration-700" 
         :class="{ 'rotate-y-180': !showTutorial }">
      <div class="flip-card-front rounded-2xl h-full w-full backface-hidden">
        <NuxtPage class="h-full w-full" />
      </div>
      <div class="flip-card-back rounded-2xl overflow-y-auto h-full w-full backface-hidden rotate-y-180">
        <SplashTutorial class="h-full w-full" />
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
const isFullScreen = computed(() => displayStore.isLargeViewport)
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