<!-- /components/navigation/flip-animation.vue -->
<template>
  <div class="absolute inset-0 z-10">
    <div
      v-for="tile in tiles"
      :key="tile.id"
      class="flap-wrapper"
      :class="{ 'is-flipped': flipped[tile.index] }"
      :style="tile.style"
    >
      <div class="face face-front"></div>
      <div class="face face-back"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface FlipTileView {
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
.flap-wrapper {
  position: absolute;
  top: var(--row-top);
  bottom: var(--row-bottom);
  left: var(--col-left);
  right: var(--col-right);
  transform-style: preserve-3d;
  perspective: 1200px;
  transform-origin: 50% 100%;
  transition: transform 700ms cubic-bezier(0.2, 0.7, 0.3, 1);
}

.flap-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), transparent);
  mix-blend-mode: multiply;
  transition: opacity 700ms ease;
}

.flap-wrapper.is-flipped {
  transform: rotateX(-180deg);
}

.flap-wrapper.is-flipped::after {
  opacity: 0.28;
}

.face {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.face-front {
  transform: rotateX(0deg) translateZ(0.01px);
  background-image: var(--flip-image-front);
  background-position: var(--col-center) var(--row-center-front);
}

.face-back {
  transform: rotateX(180deg);
  background-image: var(--flip-image-back);
  background-position: var(--col-center) var(--row-center-back);
  filter: brightness(0.96);
}
</style>
