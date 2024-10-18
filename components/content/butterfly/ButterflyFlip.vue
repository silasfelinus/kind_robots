<template>
  <div class="flip-card">
    <!-- Non-clickable area (front/back content) -->
    <div class="flip-card-inner" :class="{ 'flipped': isFlipped }">
      <div class="flip-card-front">
        <slot name="front"></slot>
      </div>
      <div class="flip-card-back">
        <slot name="back"></slot>
      </div>
    </div>

    <!-- Clickable triangle areas -->
    <div class="triangle top-left" @click="setTab('front')"></div>
    <div class="triangle bottom-right" @click="setTab('back')"></div>
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
  width: 200px;
  height: 300px;
  position: relative;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}

/* Triangle CSS for flipping */
.triangle {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  cursor: pointer;
  z-index: 10;
}

/* Top-left triangle */
.top-left {
  top: 0;
  left: 0;
  border-width: 0 40px 40px 0;
  border-color: transparent var(--go-accent) transparent transparent;
}

/* Bottom-right triangle */
.bottom-right {
  bottom: 0;
  right: 0;
  border-width: 40px 0 0 40px;
  border-color: transparent transparent transparent var(--go-accent);
}
</style>
