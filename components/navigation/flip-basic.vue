<!-- /components/experiments/flip-basic.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <div class="flip-basic-base" :style="baseStyle" />
    <template v-if="isAnimating">
      <div class="flip-basic-bottom" :style="bottomStyle" />
      <div class="flip-basic-flap">
        <div class="flip-basic-flap-inner" @animationend="onAnimationEnd">
          <div
            class="flip-basic-face flip-basic-face--front"
            :style="frontStyle"
          />
          <div
            class="flip-basic-face flip-basic-face--back"
            :style="backStyle"
          />
        </div>
      </div>
    </template>
    <div
      class="absolute left-2 top-2 z-30 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      {{ isAnimating ? 'Animating…' : 'Ready • click to flip' }}
    </div>
    <div
      v-if="isAnimating"
      class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/30 z-25"
    />
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-basic.vue
import { ref, computed } from 'vue'

const image1 = ref('/images/backtree.webp')
const image2 = ref('/images/botcafe.webp')

const visibleImage = ref(image1.value)
const hiddenImage = ref(image2.value)

const isAnimating = ref(false)

const flapFrontSrc = ref(visibleImage.value)
const flapBackSrc = ref(hiddenImage.value)

const ariaLabel = computed(() =>
  isAnimating.value
    ? 'Running midline flip between images'
    : 'Click to flip the top half over and reveal the next image',
)

const baseStyle = computed(() => ({
  backgroundImage: `url("${visibleImage.value}")`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

const bottomStyle = computed(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center bottom',
  backgroundRepeat: 'no-repeat',
}))

const frontStyle = computed(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center top',
  backgroundRepeat: 'no-repeat',
}))

const backStyle = computed(() => ({
  backgroundImage: `url("${flapBackSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center bottom',
  backgroundRepeat: 'no-repeat',
}))

function startFlip() {
  if (isAnimating.value) return

  isAnimating.value = true

  const fromSrc = visibleImage.value
  const toSrc = hiddenImage.value

  flapFrontSrc.value = fromSrc
  flapBackSrc.value = toSrc

  visibleImage.value = toSrc
  hiddenImage.value = fromSrc
}

function onAnimationEnd() {
  isAnimating.value = false
}

function handleClick() {
  startFlip()
}
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
  animation: flip-basic-fold 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
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
