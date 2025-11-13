// /components/navigation/flip-animation.vue
<template>
  <div class="flip-tiles">
    <div
      v-for="tile in tiles"
      :key="tile.id"
      class="flip-tile"
      :class="{ 'is-flipped': flipped[tile.index] }"
      :style="tile.style"
    >
      <div class="flip-tile-inner">
        <div class="flip-tile-face flip-tile-front" />
        <div class="flip-tile-face flip-tile-back" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/flip-animation.vue
export type FlipTileView = {
  id: string
  index: number
  style: Record<string, string>
}

const props = defineProps<{
  tiles: FlipTileView[]
  flipped: boolean[]
}>()
</script>

<style scoped>
.flip-tiles {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  transform-style: preserve-3d;
}

/* Each tile is absolutely positioned using the percent vars from tileVars */
.flip-tile {
  position: absolute;
  left: var(--col-left);
  right: var(--col-right);
  top: var(--row-top);
  bottom: var(--row-bottom);
  transform-style: preserve-3d;
}

/* Inner wrapper that actually rotates */
.flip-tile-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform-origin: top center;
  transition: transform 450ms cubic-bezier(0.2, 0.7, 0.3, 1);
}

/* When this class is present, the flap rotates down */
.flip-tile.is-flipped .flip-tile-inner {
  transform: rotateX(180deg);
}

/* Faces */

.flip-tile-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* Front face shows the current front panel image (image1) */
.flip-tile-front {
  background-image: var(--flip-image-front);
}

/* Back face shows logo / bottom-third strip / or nothing */
.flip-tile-back {
  background-image: var(--flip-image-back);
  transform: rotateX(180deg);
}
</style>