<script setup lang="ts">
// Imports
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// Initialization
const eyeballSize = Math.floor(Math.random() * 100) + 50
const irisSize = eyeballSize * 0.6
const maxIrisDist = eyeballSize / 2 - irisSize / 2
const irisColor = ref(generateRandomColor())

const eyeElement = ref<HTMLElement | null>(null)
const upperEyelidY = ref(0)
const lowerEyelidY = ref(0)
const irisX = ref(0)
const irisY = ref(0)
let currentBehavior: 'trackMouse' | 'moveRandomly' | '' = ''

// Computed styles
const eyeballStyle = computed(() => ({
  width: `${eyeballSize}px`,
  height: `${eyeballSize}px`,
}))

const irisStyle = computed(() => ({
  width: `${irisSize}px`,
  height: `${irisSize}px`,
  backgroundColor: irisColor.value,
  top: `calc(50% + ${irisY.value}px)`,
  left: `calc(50% + ${irisX.value}px)`,
  transform: `translate(${irisX.value}px, ${irisY.value}px)`,
  transition: 'transform 0.5s',
}))

const upperEyelidStyle = computed(() => ({
  height: `${upperEyelidY.value}px`,
  transition: 'height 0.15s',
}))

const lowerEyelidStyle = computed(() => ({
  height: `${lowerEyelidY.value}px`,
  transition: 'height 0.15s',
}))

// Utility Functions
function generateRandomColor() {
  return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(
    Math.random() * 256,
  )})`
}

function setNextBlink() {
  const randomDuration = Math.random() * 5000 + 2000 // Between 2s to 7s
  setTimeout(() => {
    currentBehavior = '' // Reset behavior on blink
    blink()
  }, randomDuration)
}

function moveRandomlyAfterBlink() {
  if (currentBehavior !== 'moveRandomly') return

  const angle = Math.random() * 2 * Math.PI
  const distance = Math.random() * maxIrisDist
  irisX.value = Math.cos(angle) * distance
  irisY.value = Math.sin(angle) * distance

  setTimeout(moveRandomlyAfterBlink, Math.random() * 2000 + 500) // Randomize movement timing
}

function blink() {
  upperEyelidY.value = eyeballSize / 2
  lowerEyelidY.value = eyeballSize / 2
  setTimeout(() => {
    openEye()

    // Determine post-blink behavior
    currentBehavior = Math.random() < 0.5 ? 'moveRandomly' : 'trackMouse'
    if (currentBehavior === 'moveRandomly') moveRandomlyAfterBlink()

    setNextBlink()
  }, 150)
}

function openEye() {
  upperEyelidY.value = 0
  lowerEyelidY.value = 0
}

function handleMouseMove(event: MouseEvent) {
  if (currentBehavior !== 'trackMouse') return
  const rect = eyeElement.value?.getBoundingClientRect()
  if (!rect) return

  const eyeCenterX = rect.left + rect.width / 2
  const eyeCenterY = rect.top + rect.height / 2
  const dx = event.clientX - eyeCenterX
  const dy = event.clientY - eyeCenterY
  const dist = Math.min(maxIrisDist, Math.hypot(dx, dy))
  const angle = Math.atan2(dy, dx)
  irisX.value = Math.cos(angle) * dist
  irisY.value = Math.sin(angle) * dist
}

// Lifecycle Hooks
onMounted(() => {
  eyeElement.value = document.querySelector(
    '.bg-white.rounded-full',
  ) as HTMLElement | null

  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', handleMouseMove)
    setNextBlink()
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', handleMouseMove)
  }
})
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <div
      class="bg-white rounded-full overflow-hidden shadow relative aspect-w-1 aspect-h-1"
      :style="eyeballStyle"
    >
      <!-- Iris -->
      <div class="rounded-full absolute" :style="irisStyle">
        <div
          class="bg-black rounded-full w-2/5 h-2/5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <!-- Eyelids -->
      <div class="bg-white absolute w-full" :style="upperEyelidStyle" />
      <div
        class="bg-white absolute w-full bottom-0"
        :style="lowerEyelidStyle"
      />
    </div>
  </div>
</template>

<style>
/* Add any additional styles here */
</style>
