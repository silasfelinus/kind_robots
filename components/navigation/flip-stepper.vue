<!-- /components/experiments/flip-stepper.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="advanceStep"
  >
    <!-- Base card: whatever is currently considered the background card -->
    <div class="flip-base-card" :style="baseCardStyle" />

    <!-- Flap: only visible during the two animated phases -->
    <div
      v-if="isAnimating"
      class="flip-flap-wrapper"
      :class="flapWrapperClass"
    >
      <div
        class="flip-flap-inner"
        :class="flapInnerClass"
        @animationend="onAnimationEnd"
      >
        <div class="flip-flap-face" :style="flapFrontStyle">
          <span class="flip-label flip-label-front">Flap front</span>
        </div>
        <div
          class="flip-flap-face flip-flap-face--back"
          :style="flapBackStyle"
        >
          <span class="flip-label flip-label-back">Flap back</span>
        </div>
      </div>
    </div>

    <!-- Debug guideline lines at 1/3 and 2/3 -->
    <div
      class="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-black/30 z-40"
    />
    <div
      class="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-black/30 z-40"
    />

    <!-- Step label -->
    <div
      class="absolute left-2 top-2 z-50 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      <span>{{ stepLabel }}</span>
    </div>
  </section>

  <!-- Debug panel: controls + explanation + image inspector -->
  <section class="mt-3 w-full max-w-3xl mx-auto px-2 pb-3">
    <div class="flex flex-wrap items-center gap-2 mb-2">
      <button class="btn btn-xs" @click.stop="resetDemo">
        Reset
      </button>
      <button class="btn btn-xs" @click.stop="advanceStep">
        Next step
      </button>
      <span class="text-[11px] opacity-80">
        Current step: {{ demoStep }} • Phase: {{ phase }}
      </span>
    </div>

    <p class="text-[11px] leading-snug mb-3">
      {{ stepExplanation }}
    </p>

    <div class="grid grid-cols-3 gap-3 text-[11px]">
      <div class="flex flex-col gap-1">
        <span class="font-semibold">Current image (frontCard at rest)</span>
        <div
          class="w-full aspect-video rounded-md border border-base-300 overflow-hidden"
        >
          <div
            class="w-full h-full bg-cover bg-center"
            :style="{ backgroundImage: `url('${currentImageSrc}')` }"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <span class="font-semibold">
          Patchwork back (logo + upside-down bottom)
        </span>
        <div
          class="w-full aspect-video rounded-md border border-base-300 overflow-hidden relative"
        >
          <div class="absolute inset-0 flex flex-col">
            <div class="flex-1 patch-row" :style="patchTopStyle" />
            <div class="flex-1 patch-row" :style="patchMiddleStyle" />
            <div class="flex-1 patch-row" :style="patchBottomStyle" />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <span class="font-semibold">Next image (will become current)</span>
        <div
          class="w-full aspect-video rounded-md border border-base-300 overflow-hidden"
        >
          <div
            class="w-full h-full bg-cover bg-center"
            :style="{ backgroundImage: `url('${nextImageSrc}')` }"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-stepper.vue
import { ref, computed } from 'vue'

type Slice = 'top' | 'middle' | 'bottom'
type DemoStep = 0 | 1 | 2 | 3 | 4 | 5

const image1 = ref('/images/backtree.webp')
const image2 = ref('/images/botcafe.webp')
const intermediateImage = ref('/images/logo_old.webp')

const visibleImage = ref(image1.value)
const hiddenImage = ref(image2.value)

/**
 * baseSrc:
 * - Step 0 / idle: current image (visibleImage)
 * - During animation: we set this to hiddenImage so it acts as the "next card"
 */
const baseSrc = ref(visibleImage.value)

const isAnimating = ref(false)
/**
 * phase:
 * 0 = no flap
 * 1 = flap over top 2/3 (from the top)
 * 2 = flap over bottom 2/3 (from the bottom)
 */
const phase = ref<0 | 1 | 2>(0)

/**
 * demoStep:
 * 0 = idle
 * 1 = setup phase 1 (no animation yet)
 * 2 = animate phase 1 (top 2/3)
 * 3 = setup phase 2 (no animation yet)
 * 4 = animate phase 2 (bottom 2/3)
 * 5 = finished (new image is current)
 */
const demoStep = ref<DemoStep>(0)

const flapFrontSrc = ref(visibleImage.value)
const flapBackSrc = ref(hiddenImage.value)
const flapFrontSlice = ref<Slice>('top')
const flapBackSlice = ref<Slice>('top')

const ariaLabel = computed(() => {
  switch (demoStep.value) {
    case 0:
      return 'Idle flip demo. Click to step into phase 1 setup.'
    case 1:
      return 'Phase 1 setup: flap configured over the top 2/3 of the card.'
    case 2:
      return 'Phase 1 animation: flap folding down over the top 2/3.'
    case 3:
      return 'Phase 2 setup: flap configured over the bottom 2/3 of the card.'
    case 4:
      return 'Phase 2 animation: flap folding up over the bottom 2/3.'
    case 5:
      return 'Finished: new image is now the current image.'
    default:
      return 'Flip demo state machine.'
  }
})

const stepLabel = computed(() => {
  switch (demoStep.value) {
    case 0:
      return 'Step 0 • Idle'
    case 1:
      return 'Step 1 • Setup Phase 1 (top 2/3)'
    case 2:
      return 'Step 2 • Animate Phase 1'
    case 3:
      return 'Step 3 • Setup Phase 2 (bottom 2/3)'
    case 4:
      return 'Step 4 • Animate Phase 2'
    case 5:
      return 'Step 5 • Finished (new image)'
    default:
      return 'Unknown step'
  }
})

const stepExplanation = computed(() => {
  switch (demoStep.value) {
    case 0:
      return 'Idle. The card shows the current image with no seam. Click anywhere or Next step to prepare the first flip (top 2/3).'
    case 1:
      return 'Phase 1 setup: base card now shows the next image. The flap is configured over the top 2/3 of the card. Flap front shows the top slice of the current image; flap back will show the patchwork top band.'
    case 2:
      return 'Phase 1 animation: the flap should fold down, covering the top 2/3 of the card. You should see the flap flip and briefly expose its back (patchwork) while revealing the next image behind.'
    case 3:
      return 'Phase 2 setup: the flap moves to the bottom 2/3 region. Flap front shows the patchwork middle band (upside-down bottom of current); flap back shows the middle band of the next image.'
    case 4:
      return 'Phase 2 animation: the flap folds over the bottom 2/3. When it finishes, the next image becomes the current entire card.'
    case 5:
      return 'Finished. The card is now resting on the new image with no flap. Clicking again will restart the sequence, now using this image as the current image.'
    default:
      return 'Unknown demo state.'
  }
})

/**
 * Base card: "back card" we are revealing behind the flap.
 */
const baseCardStyle = computed(() => ({
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
 * Flap front/back styles
 * These use 3-slice math (300% height) so 'top'/'middle'/'bottom'
 * select thirds of the texture.
 */
const flapFrontStyle = computed(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition(flapFrontSlice.value),
  backgroundRepeat: 'no-repeat',
}))

const flapBackStyle = computed(() => ({
  backgroundImage: `url("${flapBackSrc.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition(flapBackSlice.value),
  backgroundRepeat: 'no-repeat',
}))

/**
 * Patchwork preview:
 * - Top band: full logo_old.webp, upside-down (via .patch-row)
 * - Middle band: upside-down bottom third of current image
 * - Bottom band: empty
 */
const patchTopStyle = computed(() => ({
  backgroundImage: `url("${intermediateImage.value}")`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

const patchMiddleStyle = computed(() => ({
  backgroundImage: `url("${visibleImage.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition('bottom'),
  backgroundRepeat: 'no-repeat',
}))

const patchBottomStyle = computed(() => ({
  backgroundImage: 'none',
  backgroundColor: 'transparent',
}))

/**
 * Flap position:
 * - Phase 1: top 2/3 of card (0 -> 66.6667%)
 * - Phase 2: bottom 2/3 of card (33.3333% -> 100%)
 */
const flapWrapperClass = computed(() => {
  if (phase.value === 1) {
    return 'flip-flap-wrapper--top-two-thirds'
  }
  if (phase.value === 2) {
    return 'flip-flap-wrapper--bottom-two-thirds'
  }
  return ''
})

const flapInnerClass = computed(() => {
  const classes: string[] = []
  if (phase.value === 1) {
    classes.push('flip-flap-inner--hinge-bottom') // folds down from midline of the flap
  } else if (phase.value === 2) {
    classes.push('flip-flap-inner--hinge-top') // folds up from midline of the flap
  }
  return classes.join(' ')
})

const currentImageSrc = computed(() => visibleImage.value)
const nextImageSrc = computed(() => hiddenImage.value)

/**
 * State machine controls
 */
function resetDemo() {
  demoStep.value = 0
  phase.value = 0
  isAnimating.value = false

  visibleImage.value = image1.value
  hiddenImage.value = image2.value
  baseSrc.value = visibleImage.value

  flapFrontSrc.value = visibleImage.value
  flapBackSrc.value = hiddenImage.value
  flapFrontSlice.value = 'top'
  flapBackSlice.value = 'top'
}

/**
 * Phase 1 setup:
 * - baseSrc = next image (back card)
 * - flap covers top 2/3
 * - flap front = top third of current image
 * - flap back = top third of patchwork (logo band)
 */
function setupPhase1() {
  phase.value = 1

  baseSrc.value = hiddenImage.value

  flapFrontSrc.value = visibleImage.value
  flapFrontSlice.value = 'top'

  flapBackSrc.value = intermediateImage.value
  flapBackSlice.value = 'top'

  isAnimating.value = false
  demoStep.value = 1
}

/**
 * Phase 1 animation
 */
function runPhase1Animation() {
  if (demoStep.value !== 1 || isAnimating.value) return
  isAnimating.value = true
  demoStep.value = 2
}

/**
 * Phase 2 setup:
 * - flap moves to bottom 2/3
 * - flap front = patchwork middle band (upside-down bottom of current)
 * - flap back = middle band of next image
 */
function setupPhase2() {
  phase.value = 2

  flapFrontSrc.value = visibleImage.value
  flapFrontSlice.value = 'bottom'

  flapBackSrc.value = hiddenImage.value
  flapBackSlice.value = 'middle'

  isAnimating.value = false
  demoStep.value = 3
}

/**
 * Phase 2 animation
 */
function runPhase2Animation() {
  if (demoStep.value !== 3 || isAnimating.value) return
  isAnimating.value = true
  demoStep.value = 4
}

/**
 * Animation end:
 * - We do NOT advance steps here; user clicks do that.
 * - Only do the final swap after phase 2 is finished.
 */
function onAnimationEnd() {
  isAnimating.value = false

  if (phase.value === 1) {
    // Phase 1 finished: wait for user to click to setupPhase2
    return
  }

  if (phase.value === 2) {
    // Phase 2 finished: promote next image to current
    const fromSrc = visibleImage.value
    const toSrc = hiddenImage.value

    visibleImage.value = toSrc
    hiddenImage.value = fromSrc
    baseSrc.value = visibleImage.value

    phase.value = 0
    // demoStep stays 4 until user advances to step 5
  }
}

/**
 * Click handler: each click advances exactly one logical step.
 */
function advanceStep() {
  if (isAnimating.value) return

  switch (demoStep.value) {
    case 0:
      setupPhase1()
      break
    case 1:
      runPhase1Animation()
      break
    case 2:
      setupPhase2()
      break
    case 3:
      runPhase2Animation()
      break
    case 4:
      demoStep.value = 5
      break
    case 5:
      resetDemo()
      break
    default:
      resetDemo()
      break
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

/* Flap wrapper: region being flipped. */
.flip-flap-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  transform-style: preserve-3d;
  perspective: 1600px;
  z-index: 30;
}

/* Phase 1: top 2/3 of the card (0% -> 66.6667%) */
.flip-flap-wrapper--top-two-thirds {
  top: 0;
  height: 66.6667%;
}

/* Phase 2: bottom 2/3 of the card (33.3333% -> 100%) */
.flip-flap-wrapper--bottom-two-thirds {
  top: 33.3333%;
  height: 66.6667%;
}

/* Inner flap: rotates as a whole. */
.flip-flap-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  animation: flip-basic-fold 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
}

/* Hinge at bottom of flap for Phase 1 (folding down) */
.flip-flap-inner--hinge-bottom {
  transform-origin: 50% 100%;
}

/* Hinge at top of flap for Phase 2 (folding up) */
.flip-flap-inner--hinge-top {
  transform-origin: 50% 0%;
}

/* Faces of the flap */
.flip-flap-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background-repeat: no-repeat;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.flip-flap-face--back {
  transform: rotateX(180deg);
}

/* Labels for debugging */
.flip-label {
  margin: 4px 4px 0 4px;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 9px;
  line-height: 1;
  color: white;
  background-color: rgba(0, 0, 0, 0.35);
}

.flip-label-front {
  background-color: rgba(0, 128, 0, 0.6);
}

.flip-label-back {
  background-color: rgba(128, 0, 128, 0.6);
}

/* Patchwork preview rows; flipped vertically via scaleY(-1) */
.patch-row {
  background-repeat: no-repeat;
  transform: scaleY(-1);
  transform-origin: center;
}

/* Same animation curve as flip-basic */
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