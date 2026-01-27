<template>
  <section
    class="relative w-full max-w-5xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="flip.ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <div class="absolute inset-0 grid" :style="gridStyle">
      <div
        v-for="cell in flip.cells"
        :key="cell.id"
        class="relative overflow-hidden"
      >
        <div
          class="flip-board-base absolute inset-0"
          :style="baseCellStyle(cell)"
        />

        <template v-if="flip.isAnimating">
          <div
            class="flip-board-bottom absolute left-0 right-0 top-1/2 bottom-0 z-20"
            :style="bottomCellStyle(cell)"
          />

          <div class="flip-board-flap absolute left-0 right-0 top-0 h-1/2 z-25">
            <div
              class="flip-board-flap-inner absolute inset-0"
              :style="flapAnimStyle(cell)"
              @animationend="() => onCellEnd(cell.id)"
            >
              <div
                class="flip-board-face flip-board-face--front absolute inset-0"
                :style="flapFrontCellStyle(cell)"
              />
              <div
                class="flip-board-face flip-board-face--back absolute inset-0"
                :style="flapBackCellStyle(cell)"
              />
            </div>
          </div>

          <div
            class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/30 z-30"
          />
        </template>
      </div>
    </div>

    <div
      class="absolute left-2 top-2 z-40 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      {{ flip.isAnimating ? 'Animating…' : 'Ready • click to flip' }}
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/flip/flip-board.vue
import { computed } from 'vue'
import { useFlipStore } from '~/stores/flipStore'
import type { FlipCell } from '~/stores/flipStore'

const flip = useFlipStore()

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${flip.grid.cols}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${flip.grid.rows}, minmax(0, 1fr))`,
}))

const baseCellStyle = (cell: FlipCell) => {
  const src = flip.isAnimating ? flip.nextSrc : flip.currentSrc
  return flip.getCellStyle(src, cell, 'full')
}

const bottomCellStyle = (cell: FlipCell) => {
  return flip.getCellStyle(flip.currentSrc, cell, 'bottom')
}

const flapFrontCellStyle = (cell: FlipCell) => {
  return flip.getCellStyle(flip.currentSrc, cell, 'top')
}

const flapBackCellStyle = (cell: FlipCell) => {
  return flip.getCellStyle(flip.nextSrc, cell, 'bottom')
}

const flapAnimStyle = (cell: FlipCell) => {
  const delay = flip.cellDelayStyle(cell)
  return {
    ...delay,
    animationName: 'flip-board-fold',
    animationDuration: 'var(--flip-duration)',
    animationTimingFunction: 'cubic-bezier(0.24, 0.9, 0.23, 1.01)',
    animationFillMode: 'forwards',
    animationDelay: 'var(--flip-delay)',
    transformStyle: 'preserve-3d',
    transformOrigin: '50% 100%',
  } as Record<string, string>
}

const onCellEnd = (cellId: string) => {
  flip.markCellDone(cellId)
}

const handleClick = () => {
  flip.startFlip()
}
</script>

<style scoped>
.flip-board-base {
  background-repeat: no-repeat;
  z-index: 0;
}

.flip-board-bottom {
  background-repeat: no-repeat;
}

.flip-board-flap {
  transform-style: preserve-3d;
  perspective: 1600px;
}

.flip-board-flap-inner {
  will-change: transform;
}

.flip-board-face {
  backface-visibility: hidden;
  background-repeat: no-repeat;
}

.flip-board-face--back {
  transform: rotateX(180deg);
}

@keyframes flip-board-fold {
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
