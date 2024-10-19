<template>
  <div
    class="relative w-full h-full flex items-center justify-center bg-gray-200"
  >
    <!-- Butterfly demo section for selected butterfly -->
    <div
      v-if="currentButterfly"
      class="butterfly-container relative"
      :style="{ transform: 'scale(' + currentButterfly.scale + ')' }"
    >
      <!-- Butterfly wings -->
      <div
        class="left-wing"
        :style="{ background: currentButterfly.wingTopColor }"
      ></div>
      <div
        class="right-wing"
        :style="{ background: currentButterfly.wingBottomColor }"
      ></div>

      <!-- Conditionally show the butterfly's name -->
      <div class="absolute top-20 w-full text-center text-lg text-gray-700">
        <p>{{ currentButterfly.id }}</p>
        <p>{{ currentButterfly.message }}</p>
      </div>

      <div></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

// Access the butterfly store
const butterflyStore = useButterflyStore()

// Computed property to get the selected butterfly from the store
const currentButterfly = computed(() => butterflyStore.getSelectedButterfly)
</script>

<style scoped>
/* Container for the butterfly */
.butterfly-container {
  width: 100px;
  height: 100px;
  position: relative;
  animation: flutter-wings 1s infinite ease-in-out;
}

/* Left and right wings styling */
.left-wing,
.right-wing {
  position: absolute;
  width: 40px;
  height: 60px;
  border-radius: 20px;
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

/* Fluttering effect for the butterfly container */
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
