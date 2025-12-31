<!-- /components/navigation/flip-animation.vue -->
<template>
  <div class="flip-tiles-container" :style="gridStyle">
    <div v-for="cell in flip.cells" :key="cell.id" class="flip-tile">
      <div
        class="flip-tile-inner"
        :class="{ 'flip-tile-inner--animating': flip.isAnimating }"
        :style="flip.cellDelayStyle(cell)"
        @animationend="flip.markCellDone(cell.id)"
      >
        <div
          class="flip-tile-face flip-tile-face--front"
          :style="flip.getCellStyle(flip.currentSrc, cell, 'top')"
        />
        <div
          class="flip-tile-face flip-tile-face--back"
          :style="flip.getCellStyle(flip.nextSrc, cell, 'bottom')"
        />
      </div>

      <div class="flip-seam" />
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/flip-animation.vue
import { computed, onMounted } from 'vue'
import { useFlipStore } from '@/stores/flipStore'

const flip = useFlipStore()

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${flip.grid.cols}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${flip.grid.rows}, minmax(0, 1fr))`,
}))

onMounted(() => {
  if (!flip.cells.length) {
    flip.setGrid(
      flip.grid.rows,
      flip.grid.cols,
      flip.grid.staggerMs,
      flip.grid.durationMs,
    )
  }
})
</script>

<style scoped>
.flip-tiles-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: grid;
  transform-style: preserve-3d;
  perspective: 1600px;
}

.flip-tile {
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
}

.flip-tile-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: 50% 100%;
}

.flip-tile-inner--animating {
  animation-name: flip-fold;
  animation-duration: var(--flip-duration);
  animation-delay: var(--flip-delay);
  animation-timing-function: cubic-bezier(0.24, 0.9, 0.23, 1.01);
  animation-fill-mode: forwards;
}

.flip-tile-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background-repeat: no-repeat;
}

.flip-tile-face--back {
  transform: rotateX(180deg);
}

.flip-seam {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: rgba(0, 0, 0, 0.22);
  pointer-events: none;
}

@keyframes flip-fold {
  0% {
    transform: rotateX(0deg);
  }
  60% {
    transform: rotateX(-210deg);
  }
  100% {
    transform: rotateX(-180deg);
  }
}
</style>
