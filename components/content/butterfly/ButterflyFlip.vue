<template>
  <div class="flip-card relative w-full h-full flex flex-col justify-between">
    <!-- Conditionally apply the flip effect or fade transition -->
    <div
      class="flip-card-inner w-full h-full"
      :class="{ flipped: isFlipped, fadeEffect: !useFlipEffect }"
    >
      <div
        v-if="!isFlipped || !useFlipEffect"
        class="flip-card-front w-full h-full backface-hidden overflow-y-auto"
        :class="{ fade: !useFlipEffect }"
      >
        <slot name="front"></slot>
      </div>
      <div
        v-if="isFlipped || !useFlipEffect"
        class="flip-card-back w-full h-full backface-hidden transform-back overflow-y-auto"
        :class="{ fade: !useFlipEffect }"
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

// Destructure the prop directly
const { useFlipEffect } = defineProps({
  useFlipEffect: {
    type: Boolean,
    default: true, // Default to using the flip effect
  },
})

// Flip state
const isFlipped = ref(false)

// Methods to control flipping
const setTab = (tab) => {
  isFlipped.value = tab === 'back'
}
</script>

<style scoped>
/* Flip card effect */
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

/* Fade effect for toggling without 3D flip */
.fadeEffect .flip-card-inner {
  transform: none; /* Disable transform for the fade effect */
}

.fade {
  transition: opacity 0.5s ease-in-out;
  opacity: 0;
}

.flip-card-front.fade,
.flip-card-back.fade {
  opacity: 1;
}

.cursor-pointer:hover {
  transform: scale(1.1);
  background-color: #2563eb;
}
</style>
