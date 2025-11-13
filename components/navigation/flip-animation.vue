<!-- /components/navigation/flip-animation.vue -->
<template>
  <div class="flip-tiles-container">
    <div
      v-for="tile in flipStore.tiles"
      :key="tile.id"
      class="flip-tile"
      :class="{ 'flip-tile--flipped': flipStore.flipped[tile.index] }"
      :style="tile.style"
    >
      <div class="flip-tile-inner">
        <div class="flip-tile-face flip-tile-face--front" />
        <div class="flip-tile-face flip-tile-face--back" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/flip-animation.vue
import { onMounted } from 'vue'
import { useFlipStore } from '@/stores/flipStore'

const flipStore = useFlipStore()

onMounted(() => {
  if (!flipStore.isPrepared) {
    flipStore.buildTiles()
  }
})
</script>

<style scoped>
.flip-tiles-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transform-style: preserve-3d;
  perspective: 1600px;
}

.flip-tile {
  position: absolute;
  left: var(--col-left);
  right: var(--col-right);
  top: var(--row-top);
  bottom: var(--row-bottom);
  transform-style: preserve-3d;
}

.flip-tile-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: 50% 100%;
  transition:
    transform 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01),
    opacity 0.35s ease-out;
}

.flip-tile--flipped .flip-tile-inner {
  transform: rotateX(180deg);
}

.flip-tile-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background-repeat: no-repeat;
}

/* Front face: current full image, sliced via background-size/position */
.flip-tile-face--front {
  background-image: var(--flip-image-front);
  background-size: 100% 300%;
  background-position: center calc(3 * var(--row-top));
}

/* Back face: collage / next-image underside */
.flip-tile-face--back {
  transform: rotateX(180deg);
  background-image: var(--flip-image-back);
  background-size: cover;
  background-position: center center;
  opacity: var(--flip-back-has-image);
}
</style>
