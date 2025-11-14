<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <!-- Rear panel (the next image, fully visible behind everything) -->
    <img
      :src="backgroundSrc"
      alt=""
      class="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      draggable="false"
    />

    <!-- Bottom half strip of the CURRENT front image -->
    <div class="flip-basic-bottom" :style="bottomStyle"></div>

    <!-- The folding flap (top half of current image) -->
    <div class="flip-basic-flap" v-if="isAnimating">
      <div class="flip-basic-flap-inner" @animationend="onAnimationEnd">
        <div
          class="flip-basic-face flip-basic-face--front"
          :style="frontStyle"
        ></div>
        <div
          class="flip-basic-face flip-basic-face--back"
          :style="backStyle"
        ></div>
      </div>
    </div>

    <!-- Debug overlay -->
    <div
      class="absolute left-2 top-2 z-20 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      {{ isAnimating ? 'Animating…' : 'Ready — click to flip' }}
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-basic.vue
import { ref, computed } from 'vue'

const image1 = ref('/images/backtree.webp')
const image2 = ref('/images/botcafe.webp')

const currentImage = ref(image1.value)
const otherImage = ref(image2.value)

const backgroundSrc = ref(currentImage.value)

const isAnimating = ref(false)

const flapFrontSrc = ref(currentImage.value)
const flapBackSrc = ref(otherImage.value)

const ariaLabel = computed(() =>
  isAnimating.value
    ? 'Running midline flip between images'
    : 'Click to flip the top half over and reveal the next image',
)

// FRONT FACE → full current image, but we only display the *top half*
const frontStyle = computed(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center top',
}))

// BACK FACE → upside-down *bottom half* of the next image
const backStyle = computed(() => ({
  backgroundImage: `url("${flapBackSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center bottom',
}))

// BOTTOM HALF overlay of current image
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

  flapFrontSrc.value = fromSrc
  flapBackSrc.value = toSrc

  // Immediately place new image behind everything
  backgroundSrc.value = toSrc
}

function onAnimationEnd() {
  // Swap images (sanity reset)
  const tmp = currentImage.value
  currentImage.value = otherImage.value
  otherImage.value = tmp

  // Rebuild static display
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
/* ---- BOTTOM HALF STRIP ---- */
.flip-basic-bottom {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  bottom: 0;
  background-repeat: no-repeat;
  background-size: cover;
}

/* ---- TOP FLAP ---- */
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

/* ---- Faces ---- */
.flip-basic-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background-repeat: no-repeat;
  background-size: cover;
}

.flip-basic-face--back {
  transform: rotateX(180deg) scaleY(-1);
}

/* ---- OVERFOLD ANIMATION ---- */
/* Forward-only motion, same each click */
@keyframes flip-basic-fold {
  0% {
    transform: rotateX(0deg) scale(1);
  }
  25% {
    transform: rotateX(-45deg) scale(1.03);
  }
  50% {
    transform: rotateX(-115deg) scale(1.09);
  }
  75% {
    transform: rotateX(-190deg) scale(1.03);
  }
  100% {
    transform: rotateX(-180deg) scale(1);
  }
}
</style>
