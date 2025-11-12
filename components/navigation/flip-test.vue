// /components/experiments/flip-test.vue
<template>
  <section class="relative w-full max-w-3xl mx-auto">
    <div
      class="relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
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
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/20"
      ></div>
    </div>

    <div class="mt-2 flex items-center justify-between text-xs opacity-80">
      <span class="truncate">Click anywhere to flip</span>
      <span>{{
        isFlipped ? 'Showing bottom reveal' : 'Showing top flap'
      }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const img = ref<string>('https://picsum.photos/1600/900?blur=0')

const isFlipped = ref(false)

const currentSrc = computed(() => img.value)
const nextSrc = computed(() => img.value)

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
.flap-wrapper {
  position: absolute;
  inset: 0;
  clip-path: inset(0 0 50% 0);
  transform-style: preserve-3d;
  perspective: 1200px;
  transform-origin: 50% 100%;
  transition: transform 480ms cubic-bezier(0.2, 0.7, 0.3, 1);
}
.flap-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  clip-path: inset(0 0 50% 0);
  pointer-events: none;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0));
  mix-blend-mode: multiply;
  transition: opacity 480ms ease;
}
.flap-wrapper.is-flipped {
  transform: rotateX(-180deg);
}
.flap-wrapper.is-flipped::after {
  opacity: 0.2;
}

.face {
  position: absolute;
  inset: 0;
  clip-path: inset(0 0 50% 0);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center top;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.face-front {
  transform: rotateX(0deg) translateZ(0.01px);
  background-image: var(--flip-image-front);
}
.face-back {
  transform: rotateX(180deg);
  background-image: var(--flip-image-back);
  filter: brightness(0.95);
}
</style>
