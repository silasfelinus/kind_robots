<!-- /components/experiments/flip-basic.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <!-- BACKGROUND: always the next image -->
    <img
      :src="backgroundSrc"
      alt=""
      class="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      draggable="false"
    />

    <!-- BOTTOM STATIC HALF OF CURRENT IMAGE -->
    <div class="flip-basic-bottom" :style="bottomStyle" />

    <!-- TOP FLAP (animated) -->
    <div v-if="isAnimating" class="flip-basic-flap">
      <div class="flip-basic-flap-inner" @animationend="onAnimationEnd">
        <!-- FRONT FACE: top half of current image -->
        <div class="flip-basic-face flip-basic-face--front" :style="frontStyle" />

        <!-- BACK FACE: upside-down bottom half of *next* image -->
        <div class="flip-basic-face flip-basic-face--back" :style="backStyle" />
      </div>
    </div>

    <div
      class="absolute left-2 top-2 z-20 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      {{ isAnimating ? 'Animating…' : 'Ready • Click to flip' }}
    </div>

    <div class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/30" />
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-basic.vue
import { ref, computed } from 'vue'

// Test images
const image1 = ref('/images/backtree.webp')
const image2 = ref('/images/botcafe.webp')

// State: which image is currently being shown
const currentImage = ref(image1.value)
const otherImage = ref(image2.value)

const backgroundSrc = ref(currentImage.value)

// Animation flag
const isAnimating = ref(false)

// Flap face assignments
const flapFrontSrc = ref(currentImage.value)
const flapBackSrc = ref(otherImage.value)

// Accessibility
const ariaLabel = computed(() =>
  isAnimating.value
    ? 'Folding top half to reveal next image'
    : 'Click to perform paper-fold flip to next image',
)

// FRONT: top half of current image
const frontStyle = computed(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center top',
}))

// BACK: upside-down bottom half of next image
const backStyle = computed(() => ({
  backgroundImage: `url("${flapBackSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center bottom',
  transform: 'rotateX(180deg)', // <-- IMPORTANT: upside-down AT INSTANTIATION
}))

// BOTTOM static area: bottom half of current image
const bottomStyle = computed(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center bottom',
}))

function startFlip() {
  if (isAnimating.value) return

  isAnimating.value = true

  const fromSrc = currentImage.value
  const toSrc = otherImage.value

  // Assign tops & bottoms
  flapFrontSrc.value = fromSrc // front face is top of current
  flapBackSrc.value = toSrc     // back face is BOTTOM of next (inverted)

  // Background is the final desired image
  backgroundSrc.value = toSrc
}

function onAnimationEnd() {
  // Commit new image
  const tmp = currentImage.value
  currentImage.value = otherImage.value
  otherImage.value = tmp

  // Reset faces to new orientation
  backgroundSrc.value = currentImage.value
  flapFrontSrc.value = currentImage.value
  flapBackSrc.value = otherImage.value

  isAnimating.value = false
}

function handleClick() {
  startFlip()
}
</script>

<style scoped>
.flip-basic-bottom {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  bottom: 0;
  background-repeat: no-repeat;
  background-size: cover;
}

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
  transform-origin: 50% 100%; /* hinge at middle */
  animation: flip-basic-fold 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
}

.flip-basic-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background-repeat: no-repeat;
  background-size: cover;
}

.flip-basic-face--back {
  /* THIS IS NOW JUST BACKFACE + rotateX(180deg) */
}

@keyframes flip-basic-fold {
  0% {
    transform: rotateX(0deg);
  }
  60% {
    transform: rotateX(-210deg); /* overfold */
  }
  100% {
    transform: rotateX(-180deg);
  }
}
</style>