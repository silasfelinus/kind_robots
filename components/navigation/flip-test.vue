// /components/experiments/flip-test.vue
<template>
  <section class="relative w-full max-w-3xl mx-auto">
    <div
      class="scene relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
      :aria-label="ariaLabel"
      aria-live="polite"
      @click="handleFlip"
    >
      <div class="absolute inset-0">
        <img
          :src="nextSrc"
          alt=""
          class="w-full h-full object-cover select-none pointer-events-none"
          draggable="false"
        />
      </div>

      <div
        class="flap-wrapper"
        :class="{ 'is-flipped': isFlipped }"
        :style="flapVars"
      >
        <div class="face face-front"></div>
        <div class="face face-back"></div>
        <div class="shine"></div>
      </div>

      <div class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/20"></div>
    </div>

    <div class="mt-2 flex items-center justify-between text-xs opacity-80">
      <span class="truncate">Click anywhere to flip</span>
      <span>{{ isFlipped ? 'Showing bottom reveal' : 'Showing top flap' }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const img1 = ref<string>('images/backtree.webp')
const img2 = ref<string>('images/botcafe.webp')

const isFlipped = ref(false)

const currentSrc = computed(() => img1.value)
const nextSrc = computed(() => img2.value)

const flapVars = computed(
  () =>
    ({
      '--flip-image-front': `url("${currentSrc.value}")`,
      '--flip-image-back': `url("${nextSrc.value}")`,
    }) as Record<string, string>,
)

const ariaLabel = computed(() =>
  isFlipped.value
    ? 'Image revealed after vertical fold'
    : 'Image with top half ready to fold down',
)

function handleFlip() {
  isFlipped.value = !isFlipped.value
}
</script>

<style scoped>
.scene {
  perspective: 1200px;
  perspective-origin: 50% 0%;
}

.flap-wrapper {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: 50% 0%;
  transition: transform 520ms cubic-bezier(0.2, 0.7, 0.3, 1);
  will-change: transform;
}

.flap-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  clip-path: inset(0 0 50% 0);
  background: var(--flip-image-front) center top / cover no-repeat;
  opacity: 0;
}

.face {
  position: absolute;
  inset: 0;
  clip-path: inset(0 0 50% 0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  pointer-events: none;
}

.face-front {
  background-image: var(--flip-image-front);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center top;
  transform: rotateX(0deg);
}

.face-back {
  background-image: var(--flip-image-back);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center bottom;
  clip-path: inset(50% 0 0 0);
  transform: rotateX(180deg);
  filter: brightness(0.96);
}

.shine {
  position: absolute;
  inset: 0;
  clip-path: inset(0 0 50% 0);
  background: linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0));
  mix-blend-mode: multiply;
  opacity: 0.85;
  transition: opacity 520ms ease;
  pointer-events: none;
}

.flap-wrapper.is-flipped {
  transform: rotateX(180deg);
}

.flap-wrapper.is-flipped .shine {
  opacity: 0.2;
}
</style>