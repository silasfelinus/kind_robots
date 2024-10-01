<template>
  <div :class="viewportClass">
    <!-- For small viewports, display only one section -->
    <div v-if="isSmall" class="single-column">
      <div v-if="showInstructions" class="instructions">
        <SplashTutorial />
      </div>
      <div v-else class="launch">
        <NuxtPage />
      </div>
    </div>

    <!-- For medium viewports, show flip animation -->
    <div v-if="isMedium" class="flip-card">
      <div v-if="currentView === 'splash'" class="flip-side splash">
        <SplashTutorial />
      </div>
      <div v-else class="flip-side nuxt-page">
        <NuxtPage />
      </div>
    </div>

    <!-- For large/extra large viewports, display two columns -->
    <div v-if="isLarge || isXLarge" class="two-column">
      <div class="left-column">
        <SplashTutorial />
      </div>
      <div class="right-column">
        <NuxtPage />
      </div>
      <div v-if="fullScreenToggle" class="full-screen-toggle">
        <button @click="toggleFullScreen">{{ fullScreenButtonText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDisplayStore } from '@/stores/displayStore';


// Manage state
const displayStore = useDisplayStore();
const showInstructions = computed(() => displayStore.showInstructions);
const currentView = ref('splash'); // Toggle between 'splash' and 'nuxt'

// Responsive breakpoints
const viewportWidth = ref(window.innerWidth);
const isSmall = computed(() => viewportWidth.value < 640); // Small screen
const isMedium = computed(() => viewportWidth.value >= 640 && viewportWidth.value < 1024); // Medium
const isLarge = computed(() => viewportWidth.value >= 1024 && viewportWidth.value < 1280); // Large
const isXLarge = computed(() => viewportWidth.value >= 1280); // Extra Large

// Toggle between full screen and default
const fullScreenToggle = ref(false);
const fullScreenButtonText = computed(() =>
  fullScreenToggle.value ? 'Exit Full Screen' : 'Full Screen'
);

// Function to toggle full screen inside main container
const toggleFullScreen = () => {
  fullScreenToggle.value = !fullScreenToggle.value;
};

// Watch for viewport changes
window.addEventListener('resize', () => {
  viewportWidth.value = window.innerWidth;
});

onMounted(() => {
  // Optionally handle mounted logic if needed
});
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
  height: 100vh;
}

.left-column, .right-column {
  padding: 1rem;
}

.flip-card {
  perspective: 1000px;
  height: 100vh;
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

@media (max-width: 640px) {
  /* Adjust for small viewports */
  .single-column {
    flex-direction: column;
  }
}
</style>
