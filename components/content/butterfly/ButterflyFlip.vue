<template>
  <div class="flip-card relative w-70 h-100">
    <!-- Non-clickable area (front/back content) -->
    <div
      class="flip-card-inner absolute w-full h-full"
      :class="{ flipped: isFlipped }"
    >
      <div
        class="flip-card-front absolute w-full h-full backface-hidden overflow-y-auto"
      >
        <slot name="front"></slot>
      </div>
      <div
        class="flip-card-back absolute w-full h-full backface-hidden transform-back overflow-y-auto"
      >
        <slot name="back"></slot>
      </div>
    </div>

    <!-- Clickable Butterfly Icon for flipping between front and back -->
    <div
      v-if="isFlipped"
      class="absolute top-4 left-4 text-2xl bg-yellow-500 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer z-10"
      @click="setTab('front')"
    >
      <!-- Butterfly Icon for Back to Front -->
      <Icon name="ph:butterfly-light" class="text-purple-600 text-3xl" />
    </div>
    <div
      v-if="!isFlipped"
      class="absolute top-4 right-4 text-2xl bg-green-500 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer z-10"
      @click="setTab('back')"
    >
      <!-- Butterfly Icon for Front to Back -->
      <Icon name="ph:butterfly-fill" class="text-blue-600 text-3xl" />
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

.cursor-pointer:hover {
  transform: scale(1.1);
  background-color: #2563eb;
}
</style>
