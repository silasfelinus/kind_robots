<template>
  <div class="flex items-center justify-center h-screen" @click="handleClick">
    <div
      ref="eyeElement"
      class="bg-white rounded-full overflow-hidden shadow relative aspect-w-1 aspect-h-1 blink-animation"
      :style="eyeballStyle"
    >
      <div class="rounded-full absolute" :style="irisStyle">
        <div
          class="bg-black rounded-full w-2/5 h-2/5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'

// Type definitions for timeouts/intervals
let defaultBehaviorInterval: NodeJS.Timeout | null = null
let trackTimeout: NodeJS.Timeout | null = null
let blinkInterval: NodeJS.Timeout | null = null

const eyeballSize = 150
const irisSize = eyeballSize * 0.6
const eyeElement = ref<HTMLElement | null>(null)
const irisX = ref(0)
const irisY = ref(0)
const irisColor = ref(`hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`)
const moveDuration = ref(0.5) // Slower movement
const pupilRadius = irisSize / 2
const maxDistance = eyeballSize / 2 - pupilRadius

const irisStyle = computed(() => ({
  backgroundColor: irisColor.value,
  width: `${irisSize}px`,
  height: `${irisSize}px`,
  top: `calc(50% + ${irisY.value}px)`,
  left: `calc(50% + ${irisX.value}px)`,
  transform: 'translate(-50%, -50%)',
  transition: `top ${moveDuration.value}s, left ${moveDuration.value}s`,
}))

const eyeballStyle = computed(() => ({
  width: `${eyeballSize}px`,
  height: `${eyeballSize}px`,
}))

const handleClick = (event: MouseEvent) => {
  if (eyeElement.value) {
    const eyeBounds = eyeElement.value.getBoundingClientRect()
    const isClickInsideEye =
      event.clientX >= eyeBounds.left &&
      event.clientX <= eyeBounds.right &&
      event.clientY >= eyeBounds.top &&
      event.clientY <= eyeBounds.bottom

    if (isClickInsideEye) {
      blinkEye()
    }

    clearInterval(defaultBehaviorInterval as NodeJS.Timeout)
    clearTimeout(trackTimeout as NodeJS.Timeout)

    moveIris(event)

    document.addEventListener('mousemove', moveIris)

    trackTimeout = setTimeout(() => {
      document.removeEventListener('mousemove', moveIris)
      startDefaultBehavior()
    }, 2000)
  }
}

const startDefaultBehavior = () => {
  defaultBehaviorInterval = setInterval(() => {
    const angle = Math.random() * 2 * Math.PI
    const distance = Math.random() * maxDistance

    irisX.value = Math.cos(angle) * distance
    irisY.value = Math.sin(angle) * distance
  }, 2500)
}

const blinkEye = () => {
  if (eyeElement.value) {
    eyeElement.value.classList.add('blink')
    setTimeout(() => {
      eyeElement.value?.classList.remove('blink')
    }, 200)
  }
}

const moveIris = (event: MouseEvent) => {
  if (eyeElement.value) {
    const eyeBounds = eyeElement.value.getBoundingClientRect()
    const relativeX = event.clientX - eyeBounds.left - eyeballSize / 2
    const relativeY = event.clientY - eyeBounds.top - eyeballSize / 2

    const distance = Math.min(
      maxDistance,
      Math.sqrt(relativeX ** 2 + relativeY ** 2),
    )
    const angle = Math.atan2(relativeY, relativeX)

    irisX.value = Math.cos(angle) * distance
    irisY.value = Math.sin(angle) * distance
  }
}

onMounted(async () => {
  await nextTick()
  eyeElement.value = document.querySelector(
    '.bg-white.rounded-full',
  ) as HTMLElement
  eyeElement.value?.addEventListener('click', handleClick)
  startDefaultBehavior()

  blinkInterval = setInterval(blinkEye, 5000)
})

onBeforeUnmount(() => {
  clearInterval(defaultBehaviorInterval as NodeJS.Timeout)
  clearInterval(blinkInterval as NodeJS.Timeout)
  clearTimeout(trackTimeout as NodeJS.Timeout)

  if (eyeElement.value) {
    eyeElement.value.removeEventListener('click', handleClick)
  }

  document.removeEventListener('mousemove', moveIris)
})
</script>

<style scoped>
.blink-animation {
  animation: blinkAnimation 4s infinite;
}

@keyframes blinkAnimation {
  0%,
  20%,
  100% {
    height: 150px;
  }
  10% {
    height: 5px;
  }
}

.bg-white {
  background: radial-gradient(circle, #fff, #e0e0e0);
}

.rounded-full.absolute {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}
</style>
