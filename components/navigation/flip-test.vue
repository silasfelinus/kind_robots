// /components/experiments/flip-test.vue
<template>
  <section class="relative w-full max-w-3xl mx-auto">
    <div
      class="scene relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl select-none"
      :aria-label="ariaLabel"
      aria-live="polite"
    >
      <img
        :src="nextSrc"
        alt=""
        class="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable="false"
      />
      <div
        class="current-bottom absolute inset-0 pointer-events-none"
        :style="{ '--current-image': `url('${currentSrc}')` }"
      ></div>

      <div class="flap-stage">
        <div
          class="flap flap-left"
          :style="leftStyle"
          @transitionend="onFlapEnd('left', $event)"
          @click="queuePanel('left')"
        >
          <div class="face face-front"></div>
          <div class="face face-back"></div>
          <div class="shine"></div>
        </div>

        <div
          class="flap flap-right"
          :style="rightStyle"
          @transitionend="onFlapEnd('right', $event)"
          @click="queuePanel('right')"
        >
          <div class="face face-front"></div>
          <div class="face face-back"></div>
          <div class="shine"></div>
        </div>
      </div>
    </div>

    <div class="mt-3 rounded-2xl border border-base-300 bg-base-200 px-3 py-2 text-xs leading-tight grid grid-cols-2 gap-x-4 gap-y-1">
      <div><b>smartState:</b> <span class="opacity-80">{{ smartState }}</span></div>
      <div><b>step L/R:</b> <span class="opacity-80">{{ leftStep }}/{{ rows }} · {{ rightStep }}/{{ rows }}</span></div>
      <div><b>front:</b> <span class="opacity-80">{{ frontRef }}</span></div>
      <div><b>under:</b> <span class="opacity-80">{{ nextRef }}</span></div>
      <div><b>TL:</b> <span class="opacity-80">{{ tlVisible }}</span></div>
      <div><b>TR:</b> <span class="opacity-80">{{ trVisible }}</span></div>
      <div><b>BL:</b> <span class="opacity-80">{{ blVisible }}</span></div>
      <div><b>BR:</b> <span class="opacity-80">{{ brVisible }}</span></div>
      <div class="col-span-2"><b>active:</b> <span class="opacity-80">{{ activePanel ?? 'none' }}</span></div>
    </div>
  </section>
</template>

<script setup lang="ts">
type SmartStateLocal = 'img1' | 'img2' | 'flipping'
type Panel = 'left' | 'right'

import { ref, computed, watch } from 'vue'

const IMG1 = '/images/botcafe.webp'
const IMG2 = '/images/amibot.webp'
const TINY = '/images/botcafe.webp'

const rows = ref(2)
const cols = ref(2)

const smartState = ref<SmartStateLocal>('img1')
const frontRef = ref<'img1' | 'img2'>('img1')
const nextRef = computed<'img1' | 'img2'>(() => (frontRef.value === 'img1' ? 'img2' : 'img1'))

const currentSrc = computed(() => (frontRef.value === 'img1' ? IMG1 : IMG2))
const nextSrc = computed(() => (nextRef.value === 'img1' ? IMG1 : IMG2))

const leftStep = ref(0)
const rightStep = ref(0)
const animating = ref(false)
const activePanel = ref<Panel | null>(null)

const degPerStep = computed(() => 180 / Math.max(1, rows.value))

const isLastStepLeft = computed(() => leftStep.value + 1 >= rows.value)
const isLastStepRight = computed(() => rightStep.value + 1 >= rows.value)

const flapVarsBase = computed(
  () =>
    ({
      '--front-image': `url("${currentSrc.value}")`,
    }) as Record<string, string>,
)

const leftStyle = computed(() => {
  const rot = `rotateX(${leftStep.value * degPerStep.value}deg)`
  const backImg =
    leftStep.value === 0
      ? `url("${TINY}")`
      : leftStep.value < rows.value
      ? isLastStepLeft.value
        ? `url("${nextSrc.value}")`
        : `url("${TINY}")`
      : `url("${nextSrc.value}")`
  return {
    ...flapVarsBase.value,
    '--rotation': rot,
    '--back-image': backImg,
  } as Record<string, string>
})

const rightStyle = computed(() => {
  const rot = `rotateX(${rightStep.value * degPerStep.value}deg)`
  const backImg =
    rightStep.value === 0
      ? `url("${TINY}")`
      : rightStep.value < rows.value
      ? isLastStepRight.value
        ? `url("${nextSrc.value}")`
        : `url("${TINY}")`
      : `url("${nextSrc.value}")`
  return {
    ...flapVarsBase.value,
    '--rotation': rot,
    '--back-image': backImg,
  } as Record<string, string>
})

const tlVisible = computed(() => (leftStep.value >= rows.value ? nextRef.value : frontRef.value))
const trVisible = computed(() => (rightStep.value >= rows.value ? nextRef.value : frontRef.value))
const blVisible = computed(() => frontRef.value)
const brVisible = computed(() => frontRef.value)

const ariaLabel = computed(() =>
  smartState.value === 'flipping'
    ? `Folding ${activePanel ?? ''} step`
    : `Showing ${frontRef.value}`,
)

function queuePanel(side: Panel) {
  if (animating.value) return
  if (smartState.value !== 'flipping') smartState.value = 'flipping'
  activePanel.value = side
  advance(side)
}

function advance(side: Panel) {
  if (animating.value) return
  animating.value = true
  if (side === 'left') {
    if (leftStep.value < rows.value) {
      leftStep.value += 1
    }
  } else {
    if (rightStep.value < rows.value) {
      rightStep.value += 1
    }
  }
}

function onFlapEnd(side: Panel, e: TransitionEvent) {
  if (e.propertyName !== 'transform') return
  animating.value = false

  if (side === 'left') {
    if (leftStep.value < rows.value) {
      setTimeout(() => advance('left'))
      return
    }
  } else {
    if (rightStep.value < rows.value) {
      setTimeout(() => advance('right'))
      return
    }
  }

  if (leftStep.value >= rows.value && rightStep.value >= rows.value) {
    frontRef.value = nextRef.value
    leftStep.value = 0
    rightStep.value = 0
    smartState.value = frontRef.value
    activePanel.value = null
  } else {
    activePanel.value = side === 'left' ? 'right' : 'left'
  }
}

watch(rows, () => {
  leftStep.value = 0
  rightStep.value = 0
})
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
  display: grid;
}

.current-bottom {
  background-image: var(--current-image);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center bottom;
  clip-path: inset(50% 0 0 0);
}

.flap {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform 500ms cubic-bezier(0.2, 0.7, 0.3, 1);
  will-change: transform;
  cursor: pointer;
}

.flap-left {
  clip-path: polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%);
  transform-origin: 25% 0%;
}

.flap-right {
  clip-path: polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%);
  transform-origin: 75% 0%;
}

.flap {
  transform: var(--rotation);
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

.flap-left .face-front,
.flap-right .face-front {
  background-image: var(--front-image);
  transform: rotateX(0deg);
  background-position: top left;
}

.flap-right .face-front {
  background-position: top right;
}

.flap-left .face-back,
.flap-right .face-back {
  background-image: var(--back-image);
  transform: rotateX(180deg);
  background-position: center top;
  background-size: 24px 24px;
  background-repeat: no-repeat;
}

.flap-left .face-back.is-final,
.flap-right .face-back.is-final {
  background-size: cover;
  background-repeat: no-repeat;
}

.shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0));
  mix-blend-mode: multiply;
  opacity: 0.85;
  transition: opacity 500ms ease;
}

.flap .shine { opacity: 0.8; }
</style>