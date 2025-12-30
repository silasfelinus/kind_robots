<!-- /components/experiments/flip-new.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="flip.ariaLabel"
    aria-live="polite"
    @click="flip.toggleFlip"
  >
    <div
      v-if="cell"
      class="flip-basic-base"
      :style="flip.getCellStyle(flip.currentSrc, cell, 'full')"
    />

    <template v-if="flip.isAnimating && cell">
      <div
        class="flip-basic-base"
        :style="flip.getCellStyle(flip.nextSrc, cell, 'full')"
      />

      <div
        class="flip-basic-bottom"
        :style="flip.getCellStyle(flip.currentSrc, cell, 'bottom')"
      />

      <div class="flip-basic-flap">
        <div
          class="flip-basic-flap-inner"
          :style="flip.cellDelayStyle(cell)"
          @animationend="flip.markCellDone(cell.id)"
        >
          <div
            class="flip-basic-face flip-basic-face--front"
            :style="flip.getCellStyle(flip.currentSrc, cell, 'top')"
          />
          <div
            class="flip-basic-face flip-basic-face--back"
            :style="flip.getCellStyle(flip.nextSrc, cell, 'bottom')"
          />
        </div>
      </div>
    </template>

    <div
      class="absolute left-2 top-2 z-30 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      {{ flip.isAnimating ? 'Animating…' : 'Ready • click to flip' }}
    </div>

    <div
      v-if="flip.isAnimating"
      class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/30 z-25"
    />
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-new.vue
import { computed, onMounted } from 'vue'
import { useFlipStore } from '~/stores/flipStore'

const flip = useFlipStore()

const cell = computed(() => flip.cells[0])

onMounted(() => {
  flip.setImages(['/images/backtree.webp', '/images/botcafe.webp'], 0)
  flip.setGrid(1, 1, 0, 700)
})
</script>

<style scoped>
.flip-basic-base {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  z-index: 0;
}
.flip-basic-bottom {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  bottom: 0;
  background-repeat: no-repeat;
  z-index: 20;
}
.flip-basic-flap {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 50%;
  transform-style: preserve-3d;
  perspective: 1600px;
  z-index: 25;
}
.flip-basic-flap-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: 50% 100%;
  animation-name: flip-basic-fold;
  animation-duration: var(--flip-duration);
  animation-delay: var(--flip-delay);
  animation-timing-function: cubic-bezier(0.24, 0.9, 0.23, 1.01);
  animation-fill-mode: forwards;
}
.flip-basic-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background-repeat: no-repeat;
}
.flip-basic-face--back {
  transform: rotateX(180deg);
}
@keyframes flip-basic-fold {
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
