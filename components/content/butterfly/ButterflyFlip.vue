<template>
  <div class="flip-card relative w-52 h-72">
    <!-- Non-clickable area (front/back content) -->
    <div class="flip-card-inner absolute w-full h-full" :class="{ flipped: isFlipped }">
      <div class="flip-card-front absolute w-full h-full backface-hidden">
        <slot name="front"></slot>
      </div>
      <div class="flip-card-back absolute w-full h-full backface-hidden transform-back">
        <slot name="back"></slot>
      </div>
    </div>

    <!-- Clickable triangle areas with better visibility -->
    <div
      v-if="isFlipped"
      class="absolute top-0 left-0 w-0 h-0 overflow-y-auto border-r-[50px] border-b-[50px] border-transparent border-r-blue-500 cursor-pointer z-10"
      @click="setTab('front')"
    ></div>
    <div
      v-if="!isFlipped"
      class="absolute top-0 right-0 w-0 h-0 overflow-y-auto border-l-[50px] border-b-[50px] border-transparent border-l-blue-500 cursor-pointer z-10"
      @click="setTab('back')"
    ></div>
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
</style>
