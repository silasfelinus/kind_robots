<!-- /components/experiments/flip-demo.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <!-- backCard: static card behind everything, showing base/new image -->
    <div class="flip-back-card" :style="backCardStyle" />

    <template v-if="isAnimating">
      <!-- bottom band: static bottom third of frontCard during both phases -->
      <div class="flip-front-card-bottom-band" :style="bottomBandStyle" />

      <!-- frontCard flap: top-half segment that flips down in two phases -->
      <div class="flip-front-card-flap">
        <div
          class="flip-front-card-flap-inner"
          :key="animationKey"
          @animationend="onAnimationEnd"
        >
          <!-- front face of frontCard flap (what we see at start of each flip) -->
          <div class="flip-front-card-face" :style="flapFrontStyle" />
          <!-- back face of frontCard flap (what we see while it flips past 90°) -->
          <div
            class="flip-front-card-face flip-front-card-face--back"
            :style="flapBackStyle"
          />
        </div>
      </div>
    </template>

    <div
      class="absolute left-2 top-2 z-30 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      <span v-if="!isAnimating">Ready • click for two-step flip</span>
      <span v-else>
        {{
          phase === 1
            ? 'Step 1 of 2 • old logo interlude'
            : 'Step 2 of 2 • reveal next image'
        }}
      </span>
    </div>

    <div
      v-if="isAnimating"
      class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/30 z-25"
    />
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-demo.vue
// This component models two stacked cards:
// - backCard: static card behind everything (shows newImage during animation)
// - frontCard: the flipping card; we only animate its top-half flap in two phases

import { ref, computed } from 'vue'

type Slice = 'top' | 'middle' | 'bottom'

// Source image handles
const image1 = ref('/images/backtree.webp')
const image2 = ref('/images/botcafe.webp')
const intermediateImage = ref('/images/old_logo.webp')

// currentImage (frontCard at rest) and newImage (backCard during flip)
const visibleImage = ref(image1.value)
const hiddenImage = ref(image2.value)

// backCard texture
const baseSrc = ref(visibleImage.value)

// Animation state
// phase 0: idle
// phase 1: first flip (top segment: currentImage -> old_logo, reveal top of newImage)
// phase 2: second flip (middle+bottom segment: old_logo -> newImage)
const isAnimating = ref(false)
const phase = ref<0 | 1 | 2>(0)
const animationKey = ref(0)

// frontCard flap textures (front/back faces)
const flapFrontSrc = ref(visibleImage.value)
const flapBackSrc = ref(hiddenImage.value)

// bottom band texture (bottom third of frontCard)
const bottomSrc = ref(visibleImage.value)

// Slice selection for each texture (top/middle/bottom thirds)
const frontSlice = ref<Slice>('top')
const backSlice = ref<Slice>('top')
const bottomSlice = ref<Slice>('bottom')

const ariaLabel = computed(() => {
  if (!isAnimating.value) {
    return 'Click to run a two-step flip and reveal the next image'
  }
  if (phase.value === 1) {
    return 'First staged flip, revealing the old logo'
  }
  if (phase.value === 2) {
    return 'Second staged flip, revealing the next image'
  }
  return 'Running flip sequence'
})

// backCard: full static background card
const backCardStyle = computed(() => ({
  backgroundImage: `url("${baseSrc.value}")`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

function sliceToPosition(slice: Slice): string {
  if (slice === 'top') return 'center top'
  if (slice === 'middle') return 'center center'
  return 'center bottom'
}

// bottom band: static bottom third of frontCard during both phases
const bottomBandStyle = computed(() => ({
  backgroundImage: `url("${bottomSrc.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition(bottomSlice.value),
  backgroundRepeat: 'no-repeat',
}))

// frontCard flap front face (what we see at start of each flip)
const flapFrontStyle = computed(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition(frontSlice.value),
  backgroundRepeat: 'no-repeat',
}))

// frontCard flap back face (underside of the flap)
const flapBackStyle = computed(() => ({
  backgroundImage: `url("${flapBackSrc.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition(backSlice.value),
  backgroundRepeat: 'no-repeat',
}))

function startFlip() {
  if (isAnimating.value) return

  // phase 0 -> 1
  phase.value = 1
  isAnimating.value = true

  // backCard becomes newImage for the duration of the animation
  baseSrc.value = hiddenImage.value

  // Bottom band shows bottom third of currentImage (frontCard at rest)
  bottomSrc.value = visibleImage.value
  bottomSlice.value = 'bottom'

  // Phase 1: flap top segment
  // front face = top of currentImage (frontCard.frontFace)
  flapFrontSrc.value = visibleImage.value
  frontSlice.value = 'top'

  // back face = top of intermediateImage (patchwork top: upside-down old_logo in concept)
  flapBackSrc.value = intermediateImage.value
  backSlice.value = 'top'

  animationKey.value += 1
}

function onAnimationEnd() {
  if (phase.value === 1) {
    // Prepare phase 2: flap covers middle+bottom segment
    phase.value = 2

    // Bottom band continues to show bottom third of currentImage
    bottomSrc.value = visibleImage.value
    bottomSlice.value = 'bottom'

    // Phase 2 front: middle slice of intermediateImage (old_logo band)
    flapFrontSrc.value = intermediateImage.value
    frontSlice.value = 'middle'

    // Phase 2 back: middle slice of newImage
    flapBackSrc.value = hiddenImage.value
    backSlice.value = 'middle'

    animationKey.value += 1
    return
  }

  if (phase.value === 2) {
    // Second flip complete: card should now be fully newImage
    phase.value = 0
    isAnimating.value = false

    const fromSrc = visibleImage.value
    const toSrc = hiddenImage.value

    // Swap which image is "current" vs "next" for the next cycle
    visibleImage.value = toSrc
    hiddenImage.value = fromSrc

    // backCard and frontCard bottom band both use new current image at rest
    baseSrc.value = visibleImage.value
    bottomSrc.value = visibleImage.value
    bottomSlice.value = 'bottom'
  }
}

function handleClick() {
  startFlip()
}
</script>

<style scoped>
/* backCard: static background card beneath the flipping frontCard */
.flip-back-card {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  z-index: 0;
}

/* bottom band: static bottom half of frontCard while flap animates top-half */
.flip-front-card-bottom-band {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  bottom: 0;
  background-repeat: no-repeat;
  z-index: 20;
}

/* frontCard flap: top-half segment of frontCard that flips down */
.flip-front-card-flap {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 50%;
  transform-style: preserve-3d;
  perspective: 1600px;
  z-index: 25;
}

/* inner element that actually rotates in 3D for both phases */
.flip-front-card-flap-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: 50% 100%;
  animation: flip-basic-fold 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
}

/* frontCard flap faces (front/back of the physical flap) */
.flip-front-card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background-repeat: no-repeat;
}

.flip-front-card-face--back {
  transform: rotateX(180deg);
}

/* shared flip animation: downward fold with overshoot and settle */
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
