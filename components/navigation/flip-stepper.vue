<!-- /components/experiments/flip-demo.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="advanceStep"
  >
    <div class="flip-back-card" :style="backCardStyle" />

    <div class="flip-front-card">
      <div class="flip-segment flip-segment-top" :style="segmentTopStyle" />
      <div class="flip-segment flip-segment-middle" :style="segmentMiddleStyle" />
      <div class="flip-segment flip-segment-bottom" :style="segmentBottomStyle" />
    </div>

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
        <div class="flip-flap-face" :style="flapFrontStyle" />
        <div
          class="flip-flap-face flip-flap-face--back"
          :style="flapBackStyle"
        />
      </div>
    </div>

    <div
      class="absolute left-2 top-2 z-30 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      <span>{{ stepLabel }}</span>
    </div>

    <div
      v-if="phase !== 0"
      class="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-black/30 z-40"
    />
    <div
      v-if="phase !== 0"
      class="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-black/30 z-40"
    />
  </section>

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
// /components/experiments/flip-demo.vue
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
 * 0 = no flap shown (idle / finished)
 * 1 = working with top+middle flap
 * 2 = working with middle+bottom flap
 */
const phase = ref<0 | 1 | 2>(0)
const animationKey = ref(0)

/**
 * demoStep:
 * 0 = Idle (everything reset)
 * 1 = Setup Phase 1 (top+middle configured, no animation)
 * 2 = Animate Phase 1 (top+middle flipping)
 * 3 = Phase 1 complete, setup Phase 2 available
 * 4 = Animate Phase 2 (middle+bottom flipping)
 * 5 = Finished (new image now current)
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
      return 'Phase 1 setup. Top+middle flap configured.'
    case 2:
      return 'Phase 1 animation running over top+middle segments.'
    case 3:
      return 'Phase 1 complete. Ready to configure phase 2.'
    case 4:
      return 'Phase 2 animation running over middle+bottom segments.'
    case 5:
      return 'Finished. New image is fully visible.'
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
      return 'Idle state. frontCard and backCard both effectively show the current image. Click "Next step" or the card to set up the first flip (top+middle).'
    case 1:
      return 'Phase 1 is configured: backCard now shows the next image; the flap front shows the top slice of the current image; the flap back shows the top slice of the intermediate (old logo). No animation yet.'
    case 2:
      return 'Phase 1 animation should be running: the flap flips top+middle, revealing the intermediate image on its underside while backCard shows the next image behind it. When the animation ends, the demo will move to Step 3.'
    case 3:
      return 'Phase 1 is complete. We now prepare Phase 2: the flap will work over the middle+bottom slices, front showing intermediate, back showing the next image, to finish the transition.'
    case 4:
      return 'Phase 2 animation should be running: the flap flips middle+bottom so the next image replaces the remaining part of the current image. When the animation ends, the new image becomes the current image.'
    case 5:
      return 'Finished. The visible card now shows the new image as the current image. Clicking "Next step" will reset back to Step 0 so you can run the sequence again.'
    default:
      return 'Unknown demo state.'
  }
})

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

const segmentTopStyle = computed(() => ({
  backgroundImage: `url("${visibleImage.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition('top'),
  backgroundRepeat: 'no-repeat',
}))

const segmentMiddleStyle = computed(() => ({
  backgroundImage: `url("${visibleImage.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition('middle'),
  backgroundRepeat: 'no-repeat',
}))

const segmentBottomStyle = computed(() => ({
  backgroundImage: `url("${visibleImage.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition('bottom'),
  backgroundRepeat: 'no-repeat',
}))

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
}

.flip-flap-face--back {
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