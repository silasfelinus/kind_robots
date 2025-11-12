// /components/experiments/flip-test.vue
<template>
  <section class="relative w-full max-w-3xl mx-auto">
    <div
      class="scene relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
      :aria-label="ariaLabel"
      aria-live="polite"
      @click="onClick"
    >
      <!-- 1) Bottom: NEXT image, full -->
      <img
        :src="nextSrc"
        alt=""
        class="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        draggable="false"
      />

      <!-- 2) Middle: CURRENT image, bottom half only -->
      <div
        class="current-bottom absolute inset-0"
        :style="{ '--current-image': `url('${currentSrc}')` }"
      ></div>

      <!-- 3) Top: two flaps (top-left, top-right) from CURRENT image that fold to reveal NEXT -->
      <div class="flap-stage">
        <div
          class="flap flap-left"
          :class="{ half: pass >= 1 && pass < 2, full: pass >= 2 }"
          :style="flapVars"
          @transitionend="onFlapEnd('left', $event)"
        >
          <div class="face face-front"></div>
          <div class="face face-back"></div>
          <div class="shine"></div>
        </div>

        <div
          class="flap flap-right"
          :class="{ half: pass >= 3 && pass < 4, full: pass >= 4 }"
          :style="flapVars"
          @transitionend="onFlapEnd('right', $event)"
        >
          <div class="face face-front"></div>
          <div class="face face-back"></div>
          <div class="shine"></div>
        </div>
      </div>
    </div>

    <!-- Debug / status -->
    <div class="mt-3 rounded-2xl border border-base-300 bg-base-200 px-3 py-2 text-xs leading-tight grid grid-cols-2 gap-x-4 gap-y-1">
      <div><b>smartState(local):</b> <span class="opacity-80">{{ smartState }}</span></div>
      <div><b>step:</b> <span class="opacity-80">{{ stepLabel }}</span></div>
      <div><b>front image:</b> <span class="opacity-80">{{ frontRef }}</span></div>
      <div><b>under image:</b> <span class="opacity-80">{{ nextRef }}</span></div>
      <div><b>TL visible:</b> <span class="opacity-80">{{ topLeftVisible }}</span></div>
      <div><b>TR visible:</b> <span class="opacity-80">{{ topRightVisible }}</span></div>
      <div><b>BL visible:</b> <span class="opacity-80">{{ bottomLeftVisible }}</span></div>
      <div><b>BR visible:</b> <span class="opacity-80">{{ bottomRightVisible }}</span></div>
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
const frontRef = ref<'img1' | 'img2'>('img1')   // which image is in front overall
const nextRef = computed<'img1' | 'img2'>(() => (frontRef.value === 'img1' ? 'img2' : 'img1'))

// four-step sequence: 0 idle, 1 L1, 2 L2, 3 R1, 4 R2 -> swap & reset to 0
const pass = ref(0)
const animating = ref(false)

// sources
const currentSrc = computed(() => (frontRef.value === 'img1' ? IMG1 : IMG2))
const nextSrc = computed(() => (nextRef.value === 'img1' ? IMG1 : IMG2))

// css vars for flaps
const flapVars = computed(
  () =>
    ({
      '--front-image': `url("${currentSrc.value}")`,
      '--back-image': `url("${nextSrc.value}")`,
    }) as Record<string, string>,
)

// labels
const stepLabel = computed(() => {
  switch (pass.value) {
    case 0: return 'Ready'
    case 1: return 'Left drop 1'
    case 2: return 'Left drop 2'
    case 3: return 'Right drop 1'
    case 4: return 'Right drop 2'
    default: return 'Ready'
  }
})

const ariaLabel = computed(() =>
  smartState.value === 'flipping'
    ? `Folding: ${stepLabel.value}`
    : `Showing ${frontRef.value}`,
)

// visibility report (which image should be visible in each quadrant right now)
const topLeftVisible = computed(() =>
  pass.value >= 2 ? nextRef.value : frontRef.value,
)
const topRightVisible = computed(() =>
  pass.value >= 4 ? nextRef.value : frontRef.value,
)
const bottomLeftVisible = computed(() => frontRef.value)
const bottomRightVisible = computed(() => frontRef.value)

// click advances one step
function onClick() {
  if (animating.value) return
  if (pass.value === 0) {
    smartState.value = 'flipping'
  }
  if (pass.value < 4) {
    pass.value += 1
    animating.value = true
  }
}

// handle each flap finishing its transition for the current step
function onFlapEnd(side: 'left' | 'right', e: TransitionEvent) {
  const el = e.currentTarget as HTMLElement
  // guard: only when the transform transition finished on the relevant step
  if (e.propertyName !== 'transform') return

  if (side === 'left' && (pass.value === 1 || pass.value === 2)) {
    // after L1 or L2 finishes, release animation lock
    animating.value = false
    // fallthrough; nothing else to do here
  }

  if (side === 'right' && (pass.value === 3 || pass.value === 4)) {
    animating.value = false
  }

  // if we just completed pass 4, finalize the swap and reset
  if (pass.value === 4) {
    // full reveal completed: swap images
    frontRef.value = nextRef.value
    // reset sequence
    pass.value = 0
    smartState.value = frontRef.value
  }
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

/* middle base: current image bottom half only */
.current-bottom {
  background-image: var(--current-image);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center bottom;
  clip-path: inset(50% 0 0 0);
}

/* two independent flaps for the top half */
.flap {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 900ms cubic-bezier(0.2, 0.7, 0.3, 1);
}

/* left flap covers top-left quadrant of CURRENT image */
.flap-left .face,
.flap-left .shine {
  clip-path: polygon(0% 0%, 50% 0%, 50% 50%, 0% 50%);
  background-position: left top;
  transform-origin: 25% 0%;
}

/* right flap covers top-right quadrant of CURRENT image */
.flap-right .face,
.flap-right .shine {
  clip-path: polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%);
  background-position: right top;
  transform-origin: 75% 0%;
}

/* face plumbing */
.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  pointer-events: none;
  background-repeat: no-repeat;
  background-size: cover;
}

/* front of flap shows CURRENT image's top-half quadrant */
.face-front {
  background-image: var(--front-image);
  transform: rotateX(0deg);
}

/* back of flap shows NEXT image's top-half quadrant (so when flap rotates, the revealed side matches the next image) */
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

/* states: half = 90deg, full = 180deg */
.flap-left.half    { transform: rotateX(90deg); }
.flap-left.full    { transform: rotateX(180deg); }
.flap-right.half   { transform: rotateX(90deg); }
.flap-right.full   { transform: rotateX(180deg); }

/* dim highlights when folded */
.flap-left.half .shine,
.flap-left.full .shine,
.flap-right.half .shine,
.flap-right.full .shine { opacity: 0.2; }
</style>