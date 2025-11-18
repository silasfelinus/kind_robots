<!-- /components/experiments/flip-demo.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <div class="flip-back-card" :style="backCardStyle" />

    <div class="flip-front-card">
      <div class="flip-segment flip-segment-top" :style="segmentTopStyle" />
      <div
        class="flip-segment flip-segment-middle"
        :style="segmentMiddleStyle"
      />
      <div
        class="flip-segment flip-segment-bottom"
        :style="segmentBottomStyle"
      />
    </div>

    <div v-if="isAnimating" class="flip-flap-wrapper" :class="flapWrapperClass">
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
      <span v-if="!isAnimating">Ready • click for two-step flip</span>
      <span v-else>
        {{
          phase === 1
            ? 'Step 1 of 2 • top+middle'
            : 'Step 2 of 2 • middle+bottom'
        }}
      </span>
    </div>

    <div
      v-if="isAnimating"
      class="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-black/30 z-40"
    />
    <div
      v-if="isAnimating"
      class="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-black/30 z-40"
    />
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-demo.vue
import { ref, computed } from 'vue'

type Slice = 'top' | 'middle' | 'bottom'

const image1 = ref('/images/backtree.webp')
const image2 = ref('/images/botcafe.webp')
const intermediateImage = ref('/images/logo_old.webp')

const visibleImage = ref(image1.value)
const hiddenImage = ref(image2.value)

const baseSrc = ref(visibleImage.value)

const isAnimating = ref(false)
const phase = ref<0 | 1 | 2>(0)
const animationKey = ref(0)

const flapFrontSrc = ref(visibleImage.value)
const flapBackSrc = ref(hiddenImage.value)
const flapFrontSlice = ref<Slice>('top')
const flapBackSlice = ref<Slice>('top')

const ariaLabel = computed(() => {
  if (!isAnimating.value) {
    return 'Click to run a two-step flip across three segments'
  }
  if (phase.value === 1) {
    return 'First staged flip over top and middle segments'
  }
  if (phase.value === 2) {
    return 'Second staged flip over middle and bottom segments'
  }
  return 'Running flip sequence'
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
  if (phase.value === 1) {
    return 'flip-flap-inner--hinge-bottom'
  }
  if (phase.value === 2) {
    return 'flip-flap-inner--hinge-top'
  }
  return ''
})

function startFlip() {
  if (isAnimating.value) return

  phase.value = 1
  isAnimating.value = true

  baseSrc.value = hiddenImage.value

  flapFrontSrc.value = visibleImage.value
  flapFrontSlice.value = 'top'

  flapBackSrc.value = intermediateImage.value
  flapBackSlice.value = 'top'

  animationKey.value += 1
}

function onAnimationEnd() {
  if (phase.value === 1) {
    phase.value = 2

    flapFrontSrc.value = intermediateImage.value
    flapFrontSlice.value = 'middle'

    flapBackSrc.value = hiddenImage.value
    flapBackSlice.value = 'middle'

    animationKey.value += 1
    return
  }

  if (phase.value === 2) {
    phase.value = 0
    isAnimating.value = false

    const fromSrc = visibleImage.value
    const toSrc = hiddenImage.value

    visibleImage.value = toSrc
    hiddenImage.value = fromSrc

    baseSrc.value = visibleImage.value
  }
}

function handleClick() {
  startFlip()
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
  animation: flip-basic-fold 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
}

.flip-flap-inner--hinge-bottom {
  transform-origin: 50% 100%;
}

.flip-flap-inner--hinge-top {
  transform-origin: 50% 0%;
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
