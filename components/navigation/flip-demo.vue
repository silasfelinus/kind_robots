<!-- /components/experiments/flip-demo.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <div class="flip-basic-base" :style="baseStyle" />

    <template v-if="isAnimating">
      <div class="flip-basic-bottom" :style="bottomStyle" />

      <div class="flip-basic-flap">
        <div
          class="flip-basic-flap-inner"
          :key="animationKey"
          @animationend="onAnimationEnd"
        >
          <div
            class="flip-basic-face flip-basic-face--front"
            :style="frontStyle"
          />
          <div
            class="flip-basic-face flip-basic-face--back"
            :style="backStyle"
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
import { ref, computed } from 'vue'

type Slice = 'top' | 'middle' | 'bottom'

const image1 = ref('/images/backtree.webp')
const image2 = ref('/images/botcafe.webp')
const intermediateImage = ref('/images/old_logo.webp')

const visibleImage = ref(image1.value)
const hiddenImage = ref(image2.value)

const isAnimating = ref(false)
/**
 * 0 = idle
 * 1 = first flip (front -> old_logo)
 * 2 = second flip (old_logo -> next image)
 */
const phase = ref<0 | 1 | 2>(0)
const animationKey = ref(0)

const flapFrontSrc = ref(visibleImage.value)
const flapBackSrc = ref(hiddenImage.value)
const bottomSrc = ref(visibleImage.value)

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

const bottomStyle = computed(() => ({
  backgroundImage: `url("${bottomSrc.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition(bottomSlice.value),
  backgroundRepeat: 'no-repeat',
}))

const frontStyle = computed(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition(frontSlice.value),
  backgroundRepeat: 'no-repeat',
}))

const backStyle = computed(() => ({
  backgroundImage: `url("${flapBackSrc.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: sliceToPosition(backSlice.value),
  backgroundRepeat: 'no-repeat',
}))

function startFlip() {
  if (isAnimating.value) return

  phase.value = 1
  isAnimating.value = true

  bottomSrc.value = visibleImage.value
  bottomSlice.value = 'bottom'

  flapFrontSrc.value = visibleImage.value
  frontSlice.value = 'top'

  flapBackSrc.value = intermediateImage.value
  backSlice.value = 'top'

  animationKey.value += 1
}

function onAnimationEnd() {
  if (phase.value === 1) {
    phase.value = 2

    bottomSrc.value = visibleImage.value
    bottomSlice.value = 'bottom'

    flapFrontSrc.value = intermediateImage.value
    frontSlice.value = 'middle'

    flapBackSrc.value = hiddenImage.value
    backSlice.value = 'middle'

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

    bottomSrc.value = visibleImage.value
    bottomSlice.value = 'bottom'
  }
}

function handleClick() {
  startFlip()
}
</script>

<style scoped>
.flip-basic-base {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  z-index: 0;
}
.flip-basic-bottom {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  bottom: 0;
  background-repeat: no-repeat;
  z-index: 20;
}
.flip-basic-flap {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 50%;
  transform-style: preserve-3d;
  perspective: 1600px;
  z-index: 25;
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
