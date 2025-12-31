<!-- /components/experiments/flip-stepper.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <div class="flip-base-card" :style="baseStyle" />

    <div v-if="isAnimating" class="flip-flap-wrapper" :class="flapWrapperClass">
      <div
        class="flip-flap-inner"
        :key="animationKey"
        :class="flapInnerClass"
        @animationend="onAnimationEnd"
      >
        <div class="flip-face-group flip-face-group--front">
          <div
            class="flip-face-part flip-face-part--upper"
            :style="frontUpperStyle"
          />
          <div
            class="flip-face-part flip-face-part--lower"
            :style="frontLowerStyle"
          />
        </div>

        <div class="flip-face-group flip-face-group--back">
          <div
            class="flip-face-part flip-face-part--upper"
            :style="backUpperStyle"
          />
          <div
            class="flip-face-part flip-face-part--lower"
            :style="backLowerStyle"
          />
        </div>
      </div>
    </div>

    <div
      v-if="isAnimating"
      class="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-black/30 z-40"
    />
    <div
      v-if="isAnimating"
      class="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-black/30 z-40"
    />

    <div
      class="absolute left-2 top-2 z-50 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      <span v-if="!isAnimating && phase === 0">
        Ready • click for 2-step 2/3 flip
      </span>
      <span v-else-if="phase === 1"> Phase 1 • top 2/3 </span>
      <span v-else-if="phase === 2"> Phase 2 • bottom 2/3 </span>
      <span v-else> Finishing… </span>
    </div>

    <div
      class="pointer-events-none absolute inset-x-2 bottom-2 z-50 flex flex-col gap-1 rounded-md bg-base-300/85 px-2 py-1 text-[10px] leading-tight"
    >
      <div class="flex gap-1">
        <div class="flex-1 min-w-0">
          <div class="font-semibold mb-0.5 truncate">
            Base
          </div>
          <div
            class="h-6 rounded-[4px] border border-base-100"
            :style="miniBaseStyle"
          />
        </div>

        <div class="flex-1 min-w-0">
          <div class="font-semibold mb-0.5 truncate">
            Flap front
          </div>
          <div
            class="grid grid-cols-2 h-6 gap-[1px] rounded-[4px] overflow-hidden border border-base-100"
          >
            <div :style="miniFrontUpperStyle" />
            <div :style="miniFrontLowerStyle" />
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <div class="font-semibold mb-0.5 truncate">
            Flap back
          </div>
          <div
            class="grid grid-cols-2 h-6 gap-[1px] rounded-[4px] overflow-hidden border border-base-100"
          >
            <div :style="miniBackUpperStyle" />
            <div :style="miniBackLowerStyle" />
          </div>
        </div>
      </div>

      <p class="mt-0.5">
        {{ stepExplanation }}
      </p>
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

const phase = ref<0 | 1 | 2>(0)
const isAnimating = ref(false)
const animationKey = ref(0)

const frontUpperSrc = ref(visibleImage.value)
const frontUpperSlice = ref<Slice>('top')

const frontLowerSrc = ref(visibleImage.value)
const frontLowerSlice = ref<Slice>('middle')

const backUpperSrc = ref(patchLogo.value)
const backUpperSlice = ref<Slice>('top')

const backLowerSrc = ref(hiddenImage.value)
const backLowerSlice = ref<Slice>('middle')

const stepExplanation = ref(
  'Ready: click to fold the top two-thirds over using the patch logo.',
)

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

const baseStyle = computed(() => ({
  backgroundImage: `url("${visibleImage.value}")`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

function sliceToPosition(slice: Slice): string {
  if (slice === 'top') return 'center top'
  if (slice === 'middle') return 'center center'
  return 'center bottom'
}

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

function makePreviewStyle(src: string) {
  return {
    backgroundImage: `url("${src}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
  }
}

const frontUpperStyle = computed(() =>
  makePartStyle(frontUpperSrc.value, frontUpperSlice.value),
)

const frontLowerStyle = computed(() =>
  makePartStyle(frontLowerSrc.value, frontLowerSlice.value),
)

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

const flapWrapperClass = computed(() => {
  if (phase.value === 1) return 'flip-flap-wrapper--top-two-thirds'
  if (phase.value === 2) return 'flip-flap-wrapper--bottom-two-thirds'
  return ''
})

const flapInnerClass = computed(() => {
  if (phase.value === 1) return 'flip-flap-inner--phase1'
  if (phase.value === 2) return 'flip-flap-inner--phase2'
  return ''
})

const miniBaseStyle = computed(() => makePreviewStyle(visibleImage.value))
const miniFrontUpperStyle = computed(() =>
  makePreviewStyle(frontUpperSrc.value),
)
const miniFrontLowerStyle = computed(() =>
  makePreviewStyle(frontLowerSrc.value),
)
const miniBackUpperStyle = computed(() => makePreviewStyle(backUpperSrc.value))
const miniBackLowerStyle = computed(() => makePreviewStyle(backLowerSrc.value))

function handleClick() {
  if (isAnimating.value) return

  if (phase.value === 0) {
    stepExplanation.value =
      'Step 1: Folding the top two-thirds over. Front shows current image; back uses the logo and next image.'
    startPhase1()
    return
  }

  if (phase.value === 1) {
    stepExplanation.value =
      'Step 2: Folding the bottom two-thirds over. Logo covers the middle and bottom while the next image waits behind.'
    startPhase2()
  }
}

function startPhase1() {
  phase.value = 1
  isAnimating.value = true

  const current = visibleImage.value
  const next = hiddenImage.value

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

function startPhase2() {
  phase.value = 2
  isAnimating.value = true

  const next = hiddenImage.value

  frontUpperSrc.value = patchLogo.value
  frontUpperSlice.value = 'middle'
  frontLowerSrc.value = patchLogo.value
  frontLowerSlice.value = 'bottom'

  backUpperSrc.value = next
  backUpperSlice.value = 'middle'
  backLowerSrc.value = next
  backLowerSlice.value = 'bottom'

  animationKey.value += 1
}

function onAnimationEnd() {
  if (phase.value === 1 && isAnimating.value) {
    isAnimating.value = false
    stepExplanation.value =
      'Phase 1 complete: top two-thirds have flipped. Logo is now facing forward over the top and middle thirds.'
    return
  }

  if (phase.value === 2 && isAnimating.value) {
    isAnimating.value = false

    const oldVisible = visibleImage.value
    const oldHidden = hiddenImage.value

    visibleImage.value = oldHidden
    hiddenImage.value = oldVisible

    phase.value = 0
    stepExplanation.value =
      'Flip completed: the next image is now the base. Ready for another two-step run.'
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

.flip-flap-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  transform-style: preserve-3d;
  perspective: 1600px;
  z-index: 30;
}

.flip-flap-wrapper--top-two-thirds {
  top: 0;
  height: 66.6667%;
}

.flip-flap-wrapper--bottom-two-thirds {
  top: 33.3333%;
  height: 66.6667%;
}

.flip-flap-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

.flip-flap-inner--phase1 {
  transform-origin: 50% 100%;
  animation: flip-stepper-fold 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
}

.flip-flap-inner--phase2 {
  transform-origin: 50% 0%;
  animation: flip-stepper-fold 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
}

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

@keyframes flip-stepper-fold {
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