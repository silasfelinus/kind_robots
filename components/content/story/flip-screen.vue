<template>
  <div class="flip-container">
    <div class="flip-inner" :class="{ 'is-flipped': flipping }">
      <!-- Old Page (visible during first half) -->
      <div class="flip-page flip-front">
        <slot name="old"></slot>
      </div>

      <!-- New Page (appears at 90° rotation) -->
      <div class="flip-page flip-back">
        <slot name="new"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

const route = useRoute()
const displayStore = useDisplayStore()
const flipping = ref(false)

// Flip animation trigger on route change
watch(
  () => route.fullPath,
  () => {
    flipping.value = true
    displayStore.setFlipState('toMain') // Update store state

    setTimeout(() => {
      flipping.value = false
      displayStore.completeFlip() // Ensure proper state update
    }, 300) // Swap content at halfway (0.6s / 2)
  },
)
</script>

<style scoped>
/* Perspective ensures 3D depth */
.flip-container {
  perspective: 1200px;
  width: 100%;
  height: 100%;
}

/* Flip Animation */
.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

/* Rotate at 180° for coin flip effect */
.flip-inner.is-flipped {
  transform: rotateY(180deg);
}

/* Pages (Front & Back) */
.flip-page {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

/* Front (Old Page) */
.flip-front {
  transform: rotateY(0deg);
}

/* Back (New Page - Hidden initially) */
.flip-back {
  transform: rotateY(180deg);
}
</style>
