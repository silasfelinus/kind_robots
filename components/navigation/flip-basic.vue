<!-- /components/experiments/flip-basic.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <!-- Static top half when not animating -->
    <div v-if="!isAnimating" class="flip-basic-top" :style="staticTopStyle" />

    <!-- Bottom half: always visible -->
    <div class="flip-basic-bottom" :style="bottomStyle" />

    <!-- Flap that replaces the top half while animating -->
    <div v-if="isAnimating" class="flip-basic-flap">
      <div class="flip-basic-flap-inner" @animationend="onAnimationEnd">
        <div
          class="flip-basic-face flip-basic-face--front"
          :style="frontStyle"
        />
        <div class="flip-basic-face flip-basic-face--back" :style="backStyle" />
      </div>
    </div>

    <div
      class="absolute left-2 top-2 z-20 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      {{ isAnimating ? 'Animating…' : 'Ready • click to flip' }}
    </div>

    <div
      class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/30"
    />
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-basic.vue
import { ref, computed } from 'vue'

const image1 = ref('/images/backtree.webp')
const image2 = ref('/images/botcafe.webp')

const currentImage = ref(image1.value)
const otherImage = ref(image2.value)

const isAnimating = ref(false)

const flapFrontSrc = ref(currentImage.value)
const flapBackSrc = ref(otherImage.value)

const ariaLabel = computed(() =>
  isAnimating.value
    ? 'Running midline flip between images'
    : 'Click to flip the top half over and reveal the next image',
)

// Idle top half: top half of current image
const staticTopStyle = computed(() => ({
  backgroundImage: `url("${currentImage.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center top',
}))

// Bottom half: bottom half of current image (or from image while animating)
const bottomStyle = computed(() => {
  const src = isAnimating.value ? flapFrontSrc.value : currentImage.value
  return {
    backgroundImage: `url("${src}")`,
    backgroundSize: '100% 200%',
    backgroundPosition: 'center bottom',
  }
})

// Flap front = top half of from image
const frontStyle = computed(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center top',
}))

// Flap back = upside-down bottom half of next image
const backStyle = computed(() => ({
  backgroundImage: `url("${flapBackSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center bottom',
}))

function startFlip() {
  if (isAnimating.value) return

  isAnimating.value = true

  const fromSrc = currentImage.value
  const toSrc = otherImage.value

  flapFrontSrc.value = fromSrc
  flapBackSrc.value = toSrc
}

function onAnimationEnd() {
  const tmp = currentImage.value
  currentImage.value = otherImage.value
  otherImage.value = tmp

  flapFrontSrc.value = currentImage.value
  flapBackSrc.value = otherImage.value

  isAnimating.value = false
}

function handleClick() {
  startFlip()
}
</script>

<style scoped>
/* Slight overlap between top and bottom to avoid a hairline seam */
.flip-basic-top {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 50.4%;
  background-repeat: no-repeat;
}

.flip-basic-bottom {
  position: absolute;
  left: 0;
  right: 0;
  top: 49.6%;
  bottom: 0;
  background-repeat: no-repeat;
}

/* Flap occupies the top half and hinges at 50% */
.flip-basic-flap {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 50%;
  transform-style: preserve-3d;
  perspective: 1600px;
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
