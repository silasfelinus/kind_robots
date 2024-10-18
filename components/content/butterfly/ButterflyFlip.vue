<template>
  <div class="flip-card relative w-full h-full flex flex-col justify-between">
    <!-- Flip card content (front/back) -->
    <div class="flip-card-inner w-full h-full" :class="{ flipped: isFlipped }">
      <div
        class="flip-card-front w-full h-full backface-hidden overflow-y-auto"
      >
        <slot name="front"></slot>
      </div>
      <div
        class="flip-card-back w-full h-full backface-hidden transform-back overflow-y-auto"
      >
        <slot name="back"></slot>
      </div>
    </div>

    <!-- Butterfly Icon Toggles - Using Flexbox for Proper Placement -->
    <div class="w-full flex justify-between items-center mt-2 px-4">
      <!-- Back to Front Icon -->
      <div
        v-if="isFlipped"
        class="text-2xl bg-yellow-500 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer"
        @click="setTab('front')"
      >
        <Icon name="ph:butterfly-light" class="text-purple-600 text-3xl" />
      </div>

      <!-- Front to Back Icon -->
      <div
        v-if="!isFlipped"
        class="text-2xl bg-green-500 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer"
        @click="setTab('back')"
      >
        <Icon name="ph:butterfly-fill" class="text-blue-600 text-3xl" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Flip state
const isFlipped = ref(false)

// Methods to control flipping
const setTab = (tab) => {
  isFlipped.value = tab === 'back'
}
</script>

<style scoped>
.flip-card {
  perspective: 1500px; /* Slightly increased perspective for a smoother 3D effect */
}

.flip-card-inner {
  transition: transform 0.8s ease-in-out; /* Smoother, slower transition */
  transform-style: preserve-3d;
  position: relative; /* Ensure front/back layers are properly positioned */
}

.flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  backface-visibility: hidden; /* Ensure only the front or back is visible */
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1; /* Ensure proper stacking of front and back */
}

.flip-card-back {
  transform: rotateY(180deg);
  z-index: 0; /* Ensure back is behind front before flipping */
}

.cursor-pointer:hover {
  transform: scale(1.1);
  background-color: #2563eb;
}
</style>
