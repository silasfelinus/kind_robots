<template>
  <div class="flip-card relative w-70 h-100">
    <!-- Non-clickable area (front/back content) -->
    <div
      class="flip-card-inner absolute w-full h-full"
      :class="{ flipped: isFlipped }"
    >
      <div class="flip-card-front absolute w-full h-full backface-hidden">
        <slot name="front"></slot>
      </div>
      <div
        class="flip-card-back absolute w-full h-full backface-hidden transform-back"
      >
        <slot name="back"></slot>
      </div>
    </div>

    <!-- Clickable arrows for flipping between front and back -->
    <div
      v-if="isFlipped"
      class="absolute top-4 left-4 text-2xl text-white bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer z-10"
      @click="setTab('front')"
    >
      ←
    </div>
    <div
      v-if="!isFlipped"
      class="absolute top-4 right-4 text-2xl text-white bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer z-10"
      @click="setTab('back')"
    >
      →
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
  perspective: 1000px;
}

.flip-card-inner {
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  backface-visibility: hidden;
  position: absolute;
  width: 100%;
  height: 100%;
}

.transform-back {
  transform: rotateY(180deg);
}

/* Optional style tweaks for better presentation */
.text-2xl {
  font-size: 1.5rem;
}

.bg-blue-500 {
  background-color: #3b82f6;
}

.rounded-full {
  border-radius: 9999px;
}

.cursor-pointer:hover {
  transform: scale(1.1);
  background-color: #2563eb;
}
</style>
