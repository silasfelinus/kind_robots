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

    <!-- Clickable top and bottom areas for flipping -->
    <div class="flip-card-controls">
      <!-- Top clickable tab -->
      <button @click="setTab('front')" :class="{ active: !isFlipped }" class="flip-tab">
        {{ frontTabName }}
      </button>
      <!-- Bottom clickable tab -->
      <button @click="setTab('back')" :class="{ active: isFlipped }" class="flip-tab">
        {{ backTabName }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue'

// Props to customize tab names
const props = defineProps({
  frontTabName: {
    type: String,
    default: 'Front'
  },
  backTabName: {
    type: String,
    default: 'Back'
  }
})

// Flip state
const isFlipped = ref(false)

// Methods to control flipping
const setTab = (tab) => {
  isFlipped.value = tab === 'back'
}

</script>

<style>

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

.flip-card-controls {
  position: absolute;
  width: 100%;
  display: flex;
  justify-content: space-between;
  bottom: -40px;
  left: 0;
}

.flip-tab {
  width: 50%;
  background-color: var(--bg-base-200); /* Tailwind's bg-base-200 */
  padding: 10px;
  cursor: pointer;
  border: none;
  text-align: center;
}

.flip-tab.active {
  font-weight: bold;
  background-color: var(--bg-primary); /* Tailwind's bg-primary */
}

</style>
