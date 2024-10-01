<template>
  <div :class="viewportClass">
    <!-- For small viewports, display only one section -->
    <div v-if="isMobileViewport" class="single-column">
      <div v-if="showTutorial" class="instructions">
        <SplashTutorial />
      </div>
      <div v-else class="launch">
        <NuxtPage />
      </div>
    </div>

    <!-- For medium viewports, show flip animation -->
    <div v-if="viewportSize === 'medium'" class="flip-card">
      <div v-if="flipState === 'tutorial' || flipState === 'toTutorial'" class="flip-side splash">
        <SplashTutorial />
      </div>
      <div v-else class="flip-side nuxt-page">
        <NuxtPage />
      </div>
    </div>

    <!-- For large/extra large viewports, display two columns -->
    <div v-if="isLargeViewport" class="two-column">
      <div class="left-column">
        <SplashTutorial />
      </div>
      <div class="right-column">
        <NuxtPage />
      </div>
      <div v-if="isFullScreen" class="full-screen-toggle">
        <button @click="toggleFullScreen">{{ fullScreenButtonText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDisplayStore } from '@/stores/displayStore';


// Get access to displayStore
const displayStore = useDisplayStore();
const {
  flipState,
  isMobileViewport,
  viewportSize,
  isLargeViewport,
  isFullScreen,
  showTutorial
} = displayStore;

// Computed value for button text based on full-screen toggle
const fullScreenButtonText = computed(() =>
  displayStore.isFullScreen ? 'Exit Full Screen' : 'Full Screen'
);

// Toggle full screen mode
const toggleFullScreen = () => {
  displayStore.toggleFullScreen();
};
</script>

<style scoped>
.single-column {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
}

.left-column, .right-column {
  padding: 1rem;
}

.flip-card {
  perspective: 1000px;
  height: 100%;
}

.flip-side {
  backface-visibility: hidden;
  transition: transform 0.6s;
}

.splash {
  transform: rotateY(0deg);
}

.nuxt-page {
  transform: rotateY(180deg);
}

.full-screen-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
