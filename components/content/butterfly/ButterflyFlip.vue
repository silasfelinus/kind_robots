<template>
  <div class="flip-card relative w-52 h-72">
    <!-- Non-clickable area (front/back content) -->
    <div class="flip-card-inner absolute w-full h-full transition-transform duration-600 ease-in-out" :class="{ flipped: isFlipped }">
      <div class="flip-card-front absolute w-full h-full backface-hidden">
        <slot name="front"></slot>
      </div>
      <div class="flip-card-back absolute w-full h-full backface-hidden transform rotate-y-180">
        <slot name="back"></slot>
      </div>
    </div>

    <!-- Clickable triangle areas -->
    <div
      v-if="isFlipped"
      class="absolute top-0 left-0 w-0 h-0 border-r-[30px] border-b-[30px] border-transparent border-r-[var(--bg-accent,#ff9800)] cursor-pointer z-10"
      @click="setTab('front')"
    ></div>
    <div
      v-if="!isFlipped"
      class="absolute top-0 right-0 w-0 h-0 border-l-[30px] border-b-[30px] border-transparent border-l-[var(--bg-accent,#ff9800)] cursor-pointer z-10"
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
.backface-hidden {
  backface-visibility: hidden;
}

.flip-card-inner.flipped {
  transform: rotateY(180deg);
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
</style>
