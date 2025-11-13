<!-- /components/experiments/flip-basic.vue -->
<template>
  <section class="relative w-full max-w-4xl mx-auto">
    <div
      class="relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
      :aria-label="ariaLabel"
      aria-live="polite"
      @click="handleClick"
    >
      <div class="absolute inset-0 z-0">
        <img
          :src="backgroundSrc"
          alt=""
          class="w-full h-full object-cover select-none pointer-events-none"
          draggable="false"
        />
      </div>

      <div
        v-if="isAnimating"
        class="flip-basic-bottom"
        :style="bottomStyle"
      ></div>

      <div v-if="isAnimating" class="flip-basic-flap">
        <div class="flip-basic-flap-inner" @animationend="onAnimationEnd">
          <div
            class="flip-basic-face flip-basic-face--front"
            :style="frontStyle"
          ></div>
          <div
            class="flip-basic-face flip-basic-face--back"
            :style="backStyle"
          ></div>
        </div>
      </div>

      <div
        class="absolute left-2 top-2 z-20 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold flex items-center gap-1"
      >
        <span>Flip basic</span>
        <span class="opacity-70">click to toggle</span>
        <span class="ml-1 px-1.5 py-0.5 rounded bg-primary/70 text-[10px]">
          {{ showingImage2 ? 'Showing image 2' : 'Showing image 1' }}
        </span>
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/30"
      ></div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-basic.vue
import { ref, computed } from 'vue'

const image1 = ref<string>('/images/backtree.webp')
const image2 = ref<string>('/images/botcafe.webp')

const currentImage = ref<string>(image1.value)
const otherImage = ref<string>(image2.value)

const backgroundSrc = ref<string>(currentImage.value)

const isAnimating = ref(false)

const flapFrontSrc = ref<string>(currentImage.value)
const flapBackSrc = ref<string>(otherImage.value)

const showingImage2 = computed<boolean>(
  () => currentImage.value === image2.value,
)

const ariaLabel = computed(() =>
  isAnimating.value
    ? 'Running a midline flip between two images'
    : 'Image ready; click to fold the top half over the bottom and switch images',
)

const frontStyle = computed<Record<string, string>>(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center top',
}))

const backStyle = computed<Record<string, string>>(() => ({
  backgroundImage: `url("${flapBackSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center bottom',
}))

const bottomStyle = computed<Record<string, string>>(() => ({
  backgroundImage: `url("${flapFrontSrc.value}")`,
  backgroundSize: '100% 200%',
  backgroundPosition: 'center bottom',
}))

function startFlip() {
  if (isAnimating.value) return

  isAnimating.value = true

  const fromSrc = currentImage.value
  const toSrc = otherImage.value

  flapFrontSrc.value = fromSrc
  flapBackSrc.value = toSrc

  backgroundSrc.value = toSrc
}

function onAnimationEnd() {
  const tmp = currentImage.value
  currentImage.value = otherImage.value
  otherImage.value = tmp

  backgroundSrc.value = currentImage.value
  flapFrontSrc.value = currentImage.value
  flapBackSrc.value = otherImage.value

  isAnimating.value = false
}

function handleClick() {
  startFlip()
}
</script>

<style scoped>
.flip-basic-bottom {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  bottom: 0;
  background-repeat: no-repeat;
}

.flip-basic-flap {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 50%;
  transform-style: preserve-3d;
  perspective: 1600px;
}

.flip-basic-flap-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: 50% 100%;
  animation: flip-basic-fold 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01) forwards;
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

.flip-basic-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background-repeat: no-repeat;
}

.flip-basic-face--back {
  transform: rotateX(180deg) scaleY(-1);
}
</style>
