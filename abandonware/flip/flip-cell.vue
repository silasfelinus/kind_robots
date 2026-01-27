<!-- /components/flip/flip-cell.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="flip.ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <div class="flip-cell-base" :style="baseStyle" />

    <template v-if="flip.isAnimating">
      <div class="flip-cell-bottom" :style="bottomStyle" />

      <div class="flip-cell-flap">
        <div
          class="flip-cell-flap-inner"
          :style="flapInnerStyle"
          @animationend="onAnimationEnd"
        >
          <div
            class="flip-cell-face flip-cell-face--front"
            :style="frontStyle"
          />
          <div class="flip-cell-face flip-cell-face--back" :style="backStyle" />
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
import { computed, onMounted, watch } from 'vue'
import { useFlipStore } from '~/stores/flipStore'

const props = defineProps<{
  images?: string[]
  startIndex?: number
}>()

const flip = useFlipStore()

const setFromProps = () => {
  if (!props.images?.length) return
  flip.setImages(props.images, props.startIndex ?? 0)
}

onMounted(() => setFromProps())

watch(
  () => props.images,
  () => setFromProps(),
  { deep: true },
)

const baseStyle = computed(() => ({
  backgroundImage: `url("${flip.currentSrc}")`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

const bottomStyle = computed(() => ({
  backgroundImage: `url("${flip.currentSrc}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center bottom',
  backgroundRepeat: 'no-repeat',
}))

const frontStyle = computed(() => ({
  backgroundImage: `url("${flip.currentSrc}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center top',
  backgroundRepeat: 'no-repeat',
}))

const backStyle = computed(() => ({
  backgroundImage: `url("${flip.nextSrc}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center bottom',
  backgroundRepeat: 'no-repeat',
}))

const flapInnerStyle = computed(() => ({
  '--flip-duration': `${flip.grid.durationMs}ms`,
}))

function handleClick() {
  flip.startFlip()
}

function onAnimationEnd() {
  flip.finishFlip()
}
</script>

<style scoped>
.flip-cell-base {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  z-index: 0;
}

.flip-cell-bottom {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  bottom: 0;
  background-repeat: no-repeat;
  z-index: 20;
}

.flip-cell-flap {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 50%;
  transform-style: preserve-3d;
  perspective: 1600px;
  z-index: 25;
}

.flip-cell-flap-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: 50% 100%;
  animation: flip-cell-fold var(--flip-duration)
    cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
}

.flip-cell-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background-repeat: no-repeat;
}

.flip-cell-face--back {
  transform: rotateX(180deg);
}

@keyframes flip-cell-fold {
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
