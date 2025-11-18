<!-- /components/experiments/flip-stepper.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="advanceStep"
  >
    <!-- backCard: what the rear card is currently showing -->
    <div class="flip-back-card" :style="backCardStyle" />

    <!-- frontCard segments: just visual thirds of the currentImage -->
    <div class="flip-front-card">
      <div class="flip-segment flip-segment-top" :style="segmentTopStyle">
        <span class="flip-label">Top segment</span>
      </div>
      <div class="flip-segment flip-segment-middle" :style="segmentMiddleStyle">
        <span class="flip-label">Middle segment</span>
      </div>
      <div class="flip-segment flip-segment-bottom" :style="segmentBottomStyle">
        <span class="flip-label">Bottom segment</span>
      </div>
    </div>

    <!-- flap: only visible when phase != 0 -->
    <div
      v-if="phase !== 0"
      class="flip-flap-wrapper"
      :class="flapWrapperClass"
    >
      <div
        class="flip-flap-inner"
        :class="flapInnerClass"
        :key="animationKey"
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

    <!-- step label -->
    <div
      class="absolute left-2 top-2 z-30 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      <span>{{ stepLabel }}</span>
    </div>

    <!-- third markers -->
    <div
      v-if="phase !== 0"
      class="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-black/30 z-40"
    />
    <div
      v-if="phase !== 0"
      class="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-black/30 z-40"
    />
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
        <img
          :src="currentImageSrc"
          alt="Current image"
          class="w-full aspect-video object-cover rounded-md border border-base-300"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="font-semibold">Rear image (backCard)</span>
        <img
          :src="rearImageSrc"
          alt="Rear image"
          class="w-full aspect-video object-cover rounded-md border border-base-300"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="font-semibold">Next image (will become current)</span>
        <img
          :src="nextImageSrc"
          alt="Next image"
          class="w-full aspect-video object-cover rounded-md border border-base-300"
        />
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
const intermediateImage = ref('/images/old_logo.webp')

const visibleImage = ref(image1.value)
const hiddenImage = ref(image2.value)
const baseSrc = ref(visibleImage.value)

const isAnimating = ref(false)
/**
 * phase:
 * 0 = no flap
 * 1 = flap working over top+middle region
 * 2 = flap working over middle+bottom region
 */
const phase = ref<0 | 1 | 2>(0)
const animationKey = ref(0)

/**
 * demoStep:
 * 0 = idle
 * 1 = setup phase 1
 * 2 = animate phase 1
 * 3 = setup phase 2
 * 4 = animate phase 2
 * 5 = finished
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
      return 'Phase 1 setup: flap configured over top+middle.'
    case 2:
      return 'Phase 1 animation: flap flipping over top+middle.'
    case 3:
      return 'Phase 2 setup: flap configured over middle+bottom.'
    case 4:
      return 'Phase 2 animation: flap flipping over middle+bottom.'
    case 5:
      return 'Finished: new image now current.'
    default:
      return 'Flip demo state machine.'
  }
})

const stepLabel = computed(() => {
  switch (demoStep.value) {
    case 0:
      return 'Step 0 • Idle'
    case 1:
      return 'Step 1 • Setup Phase 1 (top+middle)'
    case 2:
      return 'Step 2 • Animate Phase 1'
    case 3:
      return 'Step 3 • Setup Phase 2 (middle+bottom)'
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
      return 'Idle. All three segments show the current image. Rear card and next image are set but not visible. Click Next step or the card to configure the first flip.'
    case 1:
      return 'Phase 1 setup: backCard now shows the next image. The flap is configured to work over the top+middle region, with its front showing the top slice of the current image, and its back showing the top slice of the intermediate (old_logo). No animation yet.'
    case 2:
      return 'Phase 1 animation should be running: the flap flips down over the top+middle region. You should see the flap front and back alternate as it moves. When the animation ends, the demo advances to Phase 2 setup.'
    case 3:
      return 'Phase 1 is complete. Phase 2 is now configured: the flap moves to the middle+bottom region, with the front showing intermediate (old_logo) and the back showing the next image. No animation yet.'
    case 4:
      return 'Phase 2 animation should be running: the flap flips over the middle+bottom region. When it finishes, the next image becomes the current image.'
    case 5:
      return 'Finished. The visible card now shows the new image as the current image. Next image has swapped. Click Next step to reset back to idle.'
    default:
      return 'Unknown demo state.'
  }
})

const backCardStyle = computed(() => ({
  backgroundImage: `url("${baseSrc.value}")`,
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

function sliceToPosition(slice: Slice): string {
  if (slice === 'top') return 'center top'
  if (slice === 'middle') return 'center center'
  return 'center bottom'
}

/**
 * IMPORTANT: For debugging, all three segments use backgroundSize: 'cover'.
 * That means they are NOT mathematically perfect 1/3 slices; they are
 * three views of the same image with different vertical focus, so there is
 * no weird 300% zoom. This is just to make the layout visually sane while we
 * debug the state machine.
 */

const segmentTopStyle = computed(() => ({
  backgroundImage: `url("${visibleImage.value}")`,
  backgroundSize: 'cover',
  backgroundPosition: sliceToPosition('top'),
  backgroundRepeat: 'no-repeat',
}))

const segmentMiddleStyle = computed(() => ({
  backgroundImage: `url("${visibleImage.value}")`,
  backgroundSize: 'cover',
  backgroundPosition: sliceToPosition('middle'),
  backgroundRepeat: 'no-repeat',
}))

const segmentBottomStyle = computed(() => ({
  backgroundImage: `url("${visibleImage.value}")`,
  backgroundSize: 'cover',
  backgroundPosition: sliceToPosition('bottom'),
  backgroundRepeat: 'no-repeat',
}))

const flapFrontStyle = computed(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: 'cover',
  backgroundPosition: sliceToPosition(flapFrontSlice.value),
  backgroundRepeat: 'no-repeat',
}))

const flapBackStyle = computed(() => ({
  backgroundImage: `url("${flapBackSrc.value}")`,
  backgroundSize: 'cover',
  backgroundPosition: sliceToPosition(flapBackSlice.value),
  backgroundRepeat: 'no-repeat',
}))

const flapWrapperClass = computed(() => {
  if (phase.value === 1) {
    return 'flip-flap-wrapper--top-middle'
  }
  if (phase.value === 2) {
    return 'flip-flap-wrapper--middle-bottom'
  }
  return ''
})

const flapInnerClass = computed(() => {
  const classes: string[] = []
  if (phase.value === 1) {
    classes.push('flip-flap-inner--hinge-bottom')
  } else if (phase.value === 2) {
    classes.push('flip-flap-inner--hinge-top')
  }
  if (isAnimating.value) {
    classes.push('flip-flap-inner--animating')
  }
  return classes.join(' ')
})

const currentImageSrc = computed(() => visibleImage.value)
const rearImageSrc = computed(() => baseSrc.value)
const nextImageSrc = computed(() => hiddenImage.value)

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

  animationKey.value += 1
}

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

function runPhase1Animation() {
  if (demoStep.value !== 1 || isAnimating.value) return
  isAnimating.value = true
  animationKey.value += 1
  demoStep.value = 2
}

function setupPhase2() {
  phase.value = 2
  flapFrontSrc.value = intermediateImage.value
  flapFrontSlice.value = 'middle'
  flapBackSrc.value = hiddenImage.value
  flapBackSlice.value = 'middle'
  isAnimating.value = false
  demoStep.value = 3
}

function runPhase2Animation() {
  if (demoStep.value !== 3 || isAnimating.value) return
  isAnimating.value = true
  animationKey.value += 1
  demoStep.value = 4
}

function onAnimationEnd() {
  isAnimating.value = false

  if (demoStep.value === 2) {
    demoStep.value = 3
    return
  }

  if (demoStep.value === 4) {
    const fromSrc = visibleImage.value
    const toSrc = hiddenImage.value

    visibleImage.value = toSrc
    hiddenImage.value = fromSrc
    baseSrc.value = visibleImage.value

    phase.value = 0
    demoStep.value = 5
  }
}

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
      break
    case 3:
      setupPhase2()
      break
    case 4:
      runPhase2Animation()
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
.flip-back-card {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  z-index: 0;
}

.flip-front-card {
  position: absolute;
  inset: 0;
  z-index: 10;
}

.flip-segment {
  position: absolute;
  left: 0;
  right: 0;
  background-repeat: no-repeat;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.flip-segment-top {
  top: 0;
  height: 33.3333%;
}

.flip-segment-middle {
  top: 33.3333%;
  height: 33.3333%;
}

.flip-segment-bottom {
  top: 66.6667%;
  bottom: 0;
}

.flip-flap-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  transform-style: preserve-3d;
  perspective: 1600px;
  z-index: 30;
}

.flip-flap-wrapper--top-middle {
  top: 0;
  height: 66.6667%;
}

.flip-flap-wrapper--middle-bottom {
  top: 33.3333%;
  height: 66.6667%;
}

.flip-flap-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

.flip-flap-inner--hinge-bottom {
  transform-origin: 50% 100%;
}

.flip-flap-inner--hinge-top {
  transform-origin: 50% 0%;
}

.flip-flap-inner--animating {
  animation: flip-basic-fold 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
}

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

.flip-label {
  margin: 4px 4px 0 4px;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 9px;
  line-height: 1;
  background-color: rgba(0, 0, 0, 0.35);
  color: white;
}

.flip-label-front {
  background-color: rgba(0, 128, 0, 0.6);
}

.flip-label-back {
  background-color: rgba(128, 0, 128, 0.6);
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