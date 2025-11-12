// /components/experiments/flip-test.vue
<template>
  <section class="relative w-full max-w-3xl mx-auto">
    <div
      class="scene relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
      :aria-label="ariaLabel"
      aria-live="polite"
      @click="onClick"
    >
      <img
        :src="underSrc"
        alt=""
        class="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        draggable="false"
      />

      <div class="flap-stage">
        <div
          class="flap flap-left"
          :class="{ 'is-flipped': isFlipped }"
          :style="flapVars"
          @transitionend="onLeftEnd"
        >
          <div class="face face-front"></div>
          <div class="face face-back"></div>
          <div class="shine"></div>
        </div>

        <div
          class="flap flap-right"
          :class="{ 'is-flipped': isFlipped }"
          :style="flapVars"
          @transitionend="onRightEnd"
        >
          <div class="face face-front"></div>
          <div class="face face-back"></div>
          <div class="shine"></div>
        </div>
      </div>
    </div>

    <div class="mt-2 flex items-center justify-between text-xs opacity-80">
      <span class="truncate">Click to flip</span>
      <span class="truncate">{{ statusText }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-test.vue
type SmartStateLocal = 'img1' | 'img2' | 'flipping'

import { ref, computed } from 'vue'

const IMG1 = '/images/botcafe.webp'
const IMG2 = '/images/amibot.webp'

const smartState = ref<SmartStateLocal>('img1')
const isFlipped = ref(false)
const leftDone = ref(false)
const rightDone = ref(false)

const frontRef = ref<'img1' | 'img2'>('img1')
const nextRef = computed<'img1' | 'img2'>(() => (frontRef.value === 'img1' ? 'img2' : 'img1'))

const currentSrc = computed(() => (frontRef.value === 'img1' ? IMG1 : IMG2))
const nextSrc = computed(() => (nextRef.value === 'img1' ? IMG1 : IMG2))
const underSrc = computed(() => nextSrc.value)

const flapVars = computed(
  () =>
    ({
      '--front-image': `url("${currentSrc.value}")`,
      '--back-image': `url("${underSrc.value}")`,
    }) as Record<string, string>,
)

const statusText = computed(() =>
  smartState.value === 'flipping'
    ? 'Flipping…'
    : frontRef.value === 'img1'
      ? 'Image 1 in front'
      : 'Image 2 in front',
)

const ariaLabel = computed(() =>
  smartState.value === 'flipping'
    ? 'Top quadrants folding to reveal the image behind'
    : frontRef.value === 'img1'
      ? 'Image 1 showing'
      : 'Image 2 showing',
)

function onClick() {
  if (smartState.value === 'flipping') return
  smartState.value = 'flipping'
  leftDone.value = false
  rightDone.value = false
  isFlipped.value = true
}

function onLeftEnd(e: TransitionEvent) {
  const el = e.target as HTMLElement
  if (!el.classList.contains('flap-left')) return
  if (getComputedStyle(el).transform === 'none') return
  leftDone.value = true
}

function onRightEnd(e: TransitionEvent) {
  const el = e.target as HTMLElement
  if (!el.classList.contains('flap-right')) return
  if (getComputedStyle(el).transform === 'none') return
  rightDone.value = true
  if (leftDone.value) finalizePass()
}

function finalizePass() {
  frontRef.value = nextRef.value
  isFlipped.value = false
  smartState.value = frontRef.value
}
</script>

<style scoped>
.scene {
  perspective: 1200px;
  perspective-origin: 50% 0%;
}

.flap-stage {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

.flap {
  position: absolute;
  inset: 0 50% 50% 0;
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 900ms cubic-bezier(0.2, 0.7, 0.3, 1);
}

.flap-right {
  inset: 0 0 50% 50%;
  transition: transform 900ms cubic-bezier(0.2, 0.7, 0.3, 1) 120ms;
}

.flap.is-flipped {
  transform: rotateX(180deg);
}

.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  pointer-events: none;
  background-repeat: no-repeat;
  background-size: cover;
}

.flap-left .face,
.flap-left .shine {
  clip-path: polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%);
  background-position: left top;
  transform-origin: 25% 0%;
}

.flap-right .face,
.flap-right .shine {
  clip-path: polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%);
  background-position: right top;
  transform-origin: 75% 0%;
}

.face-front {
  background-image: var(--front-image);
  transform: rotateX(0deg);
}

.face-back {
  background-image: var(--back-image);
  transform: rotateX(180deg);
  filter: brightness(0.96);
}

.shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0));
  mix-blend-mode: multiply;
  opacity: 0.85;
  transition: opacity 900ms ease;
}

.is-flipped .shine {
  opacity: 0.2;
}
</style>