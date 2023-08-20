<template>
  <div
    class="bg-white rounded-full overflow-hidden shadow relative"
    :style="eyeballStyle"
    @mousemove="handleMouseMove"
    @click="blink"
  >
    <div
      class="rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-500"
      :style="irisStyle"
    >
      <div
        class="bg-black rounded-full w-2/5 h-2/5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      ></div>
    </div>

    <!-- Upper eyelid -->
    <div class="bg-white absolute w-full" :style="upperEyelidStyle"></div>
    <!-- Lower eyelid -->
    <div class="bg-white absolute w-full bottom-0" :style="lowerEyelidStyle"></div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, nextTick, inject } from 'vue'

const eyeballSize = Math.floor(Math.random() * 100) + 50 // Size between 50 and 150
const irisSize = eyeballSize * 0.6
const irisColor = ref(generateRandomColor())

const eyeballStyle = ref({
  width: `${eyeballSize}px`,
  height: `${eyeballSize}px`
})

const irisStyle = computed(() => ({
  width: `${irisSize}px`,
  height: `${irisSize}px`,
  backgroundColor: irisColor.value,
  transform: irisPosition.value,
  transition: 'transform 0.5s' // This ensures fluid transitions
}))

function generateRandomColor() {
  return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(
    Math.random() * 256
  )})`
}

const mouseX = inject('globalMouseX')
const mouseY = inject('globalMouseY')
const shouldFollowMouse = ref(Math.random() < 0.25)

function getRandomIrisPosition() {
  const randomX = (Math.random() - 0.5) * (eyeballSize / 4)
  const randomY = (Math.random() - 0.5) * (eyeballSize / 4)
  return `translate(${randomX}px, ${randomY}px)`
}

const irisPosition = computed(() => {
  if (shouldFollowMouse.value) {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 0

    const dx = mouseX.value - windowWidth / 2
    const dy = mouseY.value - windowHeight / 2
    const dist = Math.min(eyeballSize / 4, Math.hypot(dx, dy))

    const angle = Math.atan2(dy, dx)
    const x = Math.cos(angle) * dist
    const y = Math.sin(angle) * dist

    return `translate(${x}px, ${y}px)`
  } else {
    return getRandomIrisPosition()
  }
})

// Eyelid states
const upperEyelidY = ref(0)
const lowerEyelidY = ref(0)

const upperEyelidStyle = computed(() => ({
  height: `${upperEyelidY.value}px`,
  transition: 'height 0.15s'
}))

const lowerEyelidStyle = computed(() => ({
  height: `${lowerEyelidY.value}px`,
  transition: 'height 0.15s'
}))

function blink() {
  upperEyelidY.value = eyeballSize / 2
  lowerEyelidY.value = eyeballSize / 2

  setTimeout(() => {
    openEye()
  }, 150)
}

function openEye() {
  upperEyelidY.value = 0
  lowerEyelidY.value = 0
}
onMounted(async () => {
  await nextTick()
  openEye()

  // Randomized blinking for all eyes
  setInterval(() => {
    if (Math.random() < 0.1) {
      // 10% chance to blink at each interval
      blink()
    }
  }, 1000) // Check to blink every second

  if (!shouldFollowMouse.value) {
    const moveEye = () => {
      irisPosition.value = getRandomIrisPosition()

      // The next movement will be triggered after a random duration, making the movement organic
      const randomDuration = Math.random() * 2000 + 500 // between 0.5 to 2.5 seconds
      setTimeout(moveEye, randomDuration)
    }
    moveEye() // Initialize the first movement
  }
})
</script>
