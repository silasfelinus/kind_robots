<template>
  <div class="relative w-full h-full flex items-center justify-center bg-gray-200">
    <!-- Refresh button in the top-right corner -->
    <button
      class="absolute top-4 right-4 bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-400 transition-all"
      @click="refreshButterfly"
    >
      Refresh
    </button>

    <!-- Butterfly demo section -->
    <div
      class="butterfly-container relative"
      :style="{ transform: 'scale(' + butterfly.scale + ')' }"
    >
      <div class="left-wing" :style="{ background: butterfly.wingTopColor }"></div>
      <div class="right-wing" :style="{ background: butterfly.wingBottomColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

// Access the butterfly store
const butterflyStore = useButterflyStore()

// Create a butterfly object that will hold a randomly generated butterfly
const butterfly = ref(butterflyStore.createButterfly())

// Function to refresh the butterfly by generating a new one
const refreshButterfly = () => {
  butterfly.value = butterflyStore.createButterfly()
}
</script>

<style scoped>
.butterfly-container {
  width: 100px;
  height: 100px;
  position: relative;
  animation: flutter-wings 0.4s infinite;
}

.left-wing, .right-wing {
  position: absolute;
  width: 40px;
  height: 60px;
  border-radius: 20px;
  background: blue;
  top: 20px;
  animation: flap 0.4s infinite;
  transform-origin: top center;
}

.left-wing {
  left: -20px;
  transform: rotate3d(0, 1, 0, 20deg);
  animation-name: left-wing-flap;
}

.right-wing {
  right: -20px;
  transform: rotate3d(0, 1, 0, -20deg);
  animation-name: right-wing-flap;
}

/* Wing flap animation */
@keyframes left-wing-flap {
  0% {
    transform: rotate3d(0, 1, 0, 20deg);
  }
  50% {
    transform: rotate3d(0, 1, 0, 60deg);
  }
  100% {
    transform: rotate3d(0, 1, 0, 20deg);
  }
}

@keyframes right-wing-flap {
  0% {
    transform: rotate3d(0, 1, 0, -20deg);
  }
  50% {
    transform: rotate3d(0, 1, 0, -60deg);
  }
  100% {
    transform: rotate3d(0, 1, 0, -20deg);
  }
}

/* Fluttering effect for the wings */
@keyframes flutter-wings {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
