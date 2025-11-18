<!-- /components/experiments/flip-stepper.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <!-- Base card: shows whatever the current base image is -->
    <div class="flip-base-card" :style="baseStyle" />

    <!-- Flap: only visible while animating -->
    <div
      v-if="isAnimating"
      class="flip-flap-wrapper"
      :class="flapWrapperClass"
    >
      <div
        class="flip-flap-inner"
        :key="animationKey"
        :class="flapInnerClass"
        @animationend="onAnimationEnd"
      >
        <!-- FRONT of flap: two stacked bands (upper + lower) -->
        <div class="flip-face-group flip-face-group--front">
          <div class="flip-face-part flip-face-part--upper" :style="frontUpperStyle" />
          <div class="flip-face-part flip-face-part--lower" :style="frontLowerStyle" />
        </div>

        <!-- BACK of flap: two stacked bands (upper + lower) -->
        <div class="flip-face-group flip-face-group--back">
          <div class="flip-face-part flip-face-part--upper" :style="backUpperStyle" />
          <div class="flip-face-part flip-face-part--lower" :style="backLowerStyle" />
        </div>
      </div>
    </div>

    <!-- Debug lines at 1/3 and 2/3 -->
    <div
      class="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-black/30 z-40"
    />
    <div
      class="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-black/30 z-40"
    />

    <!-- Status label -->
    <div
      class="absolute left-2 top-2 z-50 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      <span v-if="!isAnimating && phase === 0">
        Ready • click for 2-step 2/3 flip
      </span>
      <span v-else-if="phase === 1">
        Phase 1 • top 2/3
      </span>
      <span v-else-if="phase === 2">
        Phase 2 • bottom 2/3
      </span>
      <span v-else>
        Finishing…
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-stepper.vue
import { ref, computed } from 'vue'

type Slice = 'top' | 'middle' | 'bottom'

const image1 = ref('/images/backtree.webp')
const image2 = ref('/images/botcafe.webp')
const patchLogo = ref('/images/logo_old.webp')

const visibleImage = ref(image1.value)
const hiddenImage = ref(image2.value)

/**
 * phase:
 * 0 = idle
 * 1 = flap over top 2/3 (slices 1+2)
 * 2 = flap over bottom 2/3 (slices 2+3)
 */
const phase = ref<0 | 1 | 2>(0)
const isAnimating = ref(false)
const animationKey = ref(0)

/**
 * Flap faces are split into *two parts* each:
 * - frontUpper: slice 1 or 2
 * - frontLower: slice 2 or 3
 * - backUpper: slice 1 or 2 of patch/next
 * - backLower: slice 2 or 3 of patch/next
 */
const frontUpperSrc = ref(visibleImage.value)
const frontUpperSlice = ref<Slice>('top')

const frontLowerSrc = ref(visibleImage.value)
const frontLowerSlice = ref<Slice>('middle')

const backUpperSrc = ref(patchLogo.value)
const backUpperSlice = ref<Slice>('top')

const backLowerSrc = ref(hiddenImage.value)
const backLowerSlice = ref<Slice>('middle')

const ariaLabel = computed(() => {
  if (!isAnimating.value && phase.value === 0) {
    return 'Click to run a two-phase flip using 2/3 slices.'
  }
  if (phase.value === 1) {
    return 'First phase: flap over top two-thirds of the image.'
  }
  if (phase.value === 2) {
    return 'Second phase: flap over bottom two-thirds of the image.'
  }
  return 'Running 2-step 2/3 flip animation.'
})

/**
 * Base card: when idle, shows the current visibleImage.
 * During animation, we switch it to the next image so the flap
 * reveals it behind as it folds.
 */
const baseSrc = ref(visibleImage.value)

const baseStyle = computed(() => ({
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

/**
 * Helpers to build styles for each flap part.
 * We treat everything as a 3-slice texture (100% 300%) except the logo,
 * which we want fully fit in its band.
 */
function makePartStyle(src: string, slice: Slice, isLogo = false) {
  if (isLogo) {
    return {
      backgroundImage: `url("${src}")`,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
    }
  }
  return {
    backgroundImage: `url("${src}")`,
    backgroundSize: '100% 300%',
    backgroundPosition: sliceToPosition(slice),
    backgroundRepeat: 'no-repeat',
  }
}

// FRONT UPPER + LOWER (two thirds of the current/patch)
const frontUpperStyle = computed(() =>
  makePartStyle(frontUpperSrc.value, frontUpperSlice.value),
)

const frontLowerStyle = computed(() =>
  makePartStyle(frontLowerSrc.value, frontLowerSlice.value),
)

// BACK UPPER + LOWER (patch + next image)
const backUpperStyle = computed(() =>
  makePartStyle(
    backUpperSrc.value,
    backUpperSlice.value,
    backUpperSrc.value === patchLogo.value,
  ),
)

const backLowerStyle = computed(() =>
  makePartStyle(backLowerSrc.value, backLowerSlice.value),
)

/**
 * Flap positioning for 2/3 coverage:
 * - phase 1: top 2/3 (0% -> 66.6667%)
 * - phase 2: bottom 2/3 (33.3333% -> 100%)
 */
const flapWrapperClass = computed(() => {
  if (phase.value === 1) return 'flip-flap-wrapper--top-two-thirds'
  if (phase.value === 2) return 'flip-flap-wrapper--bottom-two-thirds'
  return ''
})

const flapInnerClass = computed(() => {
  if (phase.value === 1) return 'flip-flap-inner--hinge-bottom'
  if (phase.value === 2) return 'flip-flap-inner--hinge-top'
  return ''
})

/**
 * Start full two-step flip on click if idle.
 */
function handleClick() {
  if (isAnimating.value) return
  if (phase.value === 0) {
    startPhase1()
  }
}

/**
 * Phase 1: flap over slices 1 + 2 (top + middle).
 * We:
 * - Set baseSrc = next image, so it is revealed behind the flap.
 * - Front face = current image, slices [top, middle].
 * - Back face = patchwork (logo on top, bottom-third of next in middle).
 */
function startPhase1() {
  phase.value = 1
  isAnimating.value = true

  const current = visibleImage.value
  const next = hiddenImage.value

  baseSrc.value = next

  frontUpperSrc.value = current
  frontUpperSlice.value = 'top'
  frontLowerSrc.value = current
  frontLowerSlice.value = 'middle'

  backUpperSrc.value = patchLogo.value
  backUpperSlice.value = 'top'
  backLowerSrc.value = next
  backLowerSlice.value = 'bottom'

  animationKey.value += 1
}

/**
 * Phase 2: flap over slices 2 + 3 (middle + bottom).
 * We:
 * - Keep baseSrc = next image.
 * - Front face = patch middle (bottom-third of next) and empty band.
 * - Back face = next image, slices [middle, bottom].
 */
function startPhase2() {
  phase.value = 2
  isAnimating.value = true

  const next = hiddenImage.value

  frontUpperSrc.value = next
  frontUpperSlice.value = 'bottom'
  frontLowerSrc.value = patchLogo.value
  frontLowerSlice.value = 'bottom' // this ends up "mostly empty" conceptually

  backUpperSrc.value = next
  backUpperSlice.value = 'middle'
  backLowerSrc.value = next
  backLowerSlice.value = 'bottom'

  animationKey.value += 1
}

/**
 * When the animation for a given phase finishes:
 * - After phase 1: immediately configure and run phase 2.
 * - After phase 2: swap visible/hidden and go back to idle.
 */
function onAnimationEnd() {
  if (phase.value === 1 && isAnimating.value) {
    isAnimating.value = false
    startPhase2()
    return
  }

  if (phase.value === 2 && isAnimating.value) {
    isAnimating.value = false

    const oldVisible = visibleImage.value
    const oldHidden = hiddenImage.value

    visibleImage.value = oldHidden
    hiddenImage.value = oldVisible

    baseSrc.value = visibleImage.value

    phase.value = 0
  }
}
</script>

<style scoped>
.flip-base-card {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  z-index: 0;
}

/* Flap wrapper: region being flipped (2/3 coverage) */
.flip-flap-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  transform-style: preserve-3d;
  perspective: 1600px;
  z-index: 30;
}

/* Phase 1: top 2/3 (0% -> 66.6667%) */
.flip-flap-wrapper--top-two-thirds {
  top: 0;
  height: 66.6667%;
}

/* Phase 2: bottom 2/3 (33.3333% -> 100%) */
.flip-flap-wrapper--bottom-two-thirds {
  top: 33.3333%;
  height: 66.6667%;
}

/* Inner flap rotates as a whole card */
.flip-flap-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  animation: flip-basic-fold 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
}

/* Hinge at bottom edge for phase 1 (folding down) */
.flip-flap-inner--hinge-bottom {
  transform-origin: 50% 100%;
}

/* Hinge at top edge for phase 2 (folding up) */
.flip-flap-inner--hinge-top {
  transform-origin: 50% 0%;
}

/* Front/back groups share the same rotation; back is rotated 180° */
.flip-face-group {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

.flip-face-group--front {
  backface-visibility: hidden;
}

.flip-face-group--back {
  backface-visibility: hidden;
  transform: rotateX(180deg);
}

/* Each face group is split into two parts: upper and lower halves of the flap */
.flip-face-part {
  position: absolute;
  left: 0;
  right: 0;
  background-repeat: no-repeat;
}

.flip-face-part--upper {
  top: 0;
  height: 50%;
}

.flip-face-part--lower {
  top: 50%;
  bottom: 0;
}

/* Animation keyframes: same curve as flip-basic */
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