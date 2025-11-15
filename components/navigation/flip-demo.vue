<!-- /components/experiments/flip-demo.vue -->
<template>
  <section
    class="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
    :aria-label="ariaLabel"
    aria-live="polite"
    @click="handleClick"
  >
    <div v-if="!isAnimating" class="flip-demo-full" :style="fullStyle" />

    <template v-else>
      <div class="flip-demo-base" :style="nextBaseStyle" />

      <div
        v-if="showTopRow"
        class="flip-demo-row flip-demo-row--top"
        :style="rowTopStyle"
      />

      <div
        v-if="showMiddleRow"
        class="flip-demo-row flip-demo-row--middle"
        :style="rowMiddleStyle"
      />

      <div
        v-if="showBottomRow"
        class="flip-demo-row flip-demo-row--bottom"
        :style="rowBottomStyle"
      />

      <div class="flip-demo-flap flip-demo-flap--top">
        <div
          class="flip-demo-flap-inner flip-demo-flap-inner--top"
          @animationend="onTopFoldEnd"
        >
          <div
            class="flip-demo-face flip-demo-face--front"
            :style="topFlapFrontStyle"
          />
          <div
            class="flip-demo-face flip-demo-face--back"
            :style="topFlapBackStyle"
          />
        </div>
      </div>

      <div class="flip-demo-flap flip-demo-flap--middle">
        <div
          class="flip-demo-flap-inner flip-demo-flap-inner--middle"
          @animationend="onMiddleFoldEnd"
        >
          <div
            class="flip-demo-face flip-demo-face--front"
            :style="middleFlapFrontStyle"
          />
          <div
            class="flip-demo-face flip-demo-face--back"
            :style="middleFlapBackStyle"
          />
        </div>
      </div>
    </template>

    <div
      class="absolute left-2 top-2 z-30 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
    >
      {{
        isAnimating
          ? 'Demo: double flip running…'
          : 'Three-row demo • click to flip'
      }}
    </div>

    <div
      v-if="isAnimating"
      class="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-black/30 z-25"
    />
    <div
      v-if="isAnimating"
      class="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-black/30 z-25"
    />
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-demo.vue
import { ref, computed } from 'vue'

const image1 = ref('/images/backtree.webp')
const image2 = ref('/images/botcafe.webp')
const logoImage = ref('/images/old_logo.webp')

const currentImage = ref(image1.value)
const otherImage = ref(image2.value)

const isAnimating = ref(false)

const showTopRow = ref(true)
const showMiddleRow = ref(true)
const showBottomRow = ref(true)

const ariaLabel = computed(() =>
  isAnimating.value
    ? 'Running three row double flip between images'
    : 'Click to run a two step flip that reveals the new image',
)

const fullStyle = computed(() => ({
  backgroundImage: `url("${currentImage.value}")`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

const nextBaseStyle = computed(() => ({
  backgroundImage: `url("${otherImage.value}")`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

const rowTopStyle = computed(() => ({
  backgroundImage: `url("${currentImage.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: 'center top',
  backgroundRepeat: 'no-repeat',
}))

const rowMiddleStyle = computed(() => ({
  backgroundImage: `url("${currentImage.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

const rowBottomStyle = computed(() => ({
  backgroundImage: `url("${currentImage.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: 'center bottom',
  backgroundRepeat: 'no-repeat',
}))

const topFlapFrontStyle = computed(() => ({
  backgroundImage: `url("${logoImage.value}")`,
  backgroundSize: 'contain',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

const topFlapBackStyle = computed(() => ({
  backgroundImage: `url("${logoImage.value}")`,
  backgroundSize: 'contain',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

const middleFlapFrontStyle = computed(() => ({
  backgroundImage: `url("${currentImage.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
}))

const middleFlapBackStyle = computed(() => ({
  backgroundImage: `url("${otherImage.value}")`,
  backgroundSize: '100% 300%',
  backgroundPosition: 'center bottom',
  backgroundRepeat: 'no-repeat',
}))

function resetRows() {
  showTopRow.value = true
  showMiddleRow.value = true
  showBottomRow.value = true
}

function startFlip() {
  if (isAnimating.value) return

  isAnimating.value = true
  resetRows()
}

function onTopFoldEnd() {
  showTopRow.value = false
}

function onMiddleFoldEnd() {
  showMiddleRow.value = false
  showBottomRow.value = false

  const tmp = currentImage.value
  currentImage.value = otherImage.value
  otherImage.value = tmp

  isAnimating.value = false
}

function handleClick() {
  startFlip()
}
</script>

<style scoped>
.flip-demo-full,
.flip-demo-base {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
}

.flip-demo-row {
  position: absolute;
  left: 0;
  right: 0;
  background-repeat: no-repeat;
  z-index: 20;
}

.flip-demo-row--top {
  top: 0;
  height: 33.334%;
}

.flip-demo-row--middle {
  top: 33.334%;
  height: 33.333%;
}

.flip-demo-row--bottom {
  top: 66.667%;
  bottom: 0;
}

.flip-demo-flap {
  position: absolute;
  left: 0;
  right: 0;
  transform-style: preserve-3d;
  perspective: 1600px;
  z-index: 25;
}

.flip-demo-flap--top {
  top: 0;
  height: 33.334%;
}

.flip-demo-flap--middle {
  top: 33.334%;
  height: 33.333%;
}

.flip-demo-flap-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: 50% 100%;
  animation: flip-demo-fold 0.6s cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
}

.flip-demo-flap-inner--middle {
  animation-delay: 0.6s;
}

.flip-demo-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background-repeat: no-repeat;
}

.flip-demo-face--back {
  transform: rotateX(180deg);
}

@keyframes flip-demo-fold {
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
