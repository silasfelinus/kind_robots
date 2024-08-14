<template>
  <div
    class="flex items-center justify-center h-screen"
    @click="handleClick"
  >
    <div
      ref="eyeElement"
      class="bg-white rounded-full overflow-hidden shadow relative aspect-w-1 aspect-h-1 blink-animation"
      :style="eyeballStyle"
    >
      <div
        class="rounded-full absolute"
        :style="irisStyle"
      >
        <div
          class="bg-black rounded-full w-2/5 h-2/5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const eyeballSize = 150
const irisSize = eyeballSize * 0.6
const eyeElement = ref(null)
const irisX = ref(0)
const irisY = ref(0)
const irisColor = ref(`hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`)
const moveDuration = ref(0.5) // Slower movement
const pupilRadius = irisSize / 2
const maxDistance = eyeballSize / 2 - pupilRadius
let defaultBehaviorInterval
let trackTimeout
let blinkInterval

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

const handleClick = (event) => {
  console.log('ow!')
  const eyeBounds = eyeElement.value.getBoundingClientRect()
  const isClickInsideEye
    = event.clientX >= eyeBounds.left
    && event.clientX <= eyeBounds.right
    && event.clientY >= eyeBounds.top
    && event.clientY <= eyeBounds.bottom

  if (isClickInsideEye) {
    blinkEye() // Call the blink function without disturbing the shared timer
  }

  clearInterval(defaultBehaviorInterval) // Stop default behavior
  clearTimeout(trackTimeout) // Clear any existing timeouts

  moveIris(event)

  // Change from eyeElement.value to document
  document.addEventListener('mousemove', moveIris)

  trackTimeout = setTimeout(() => {
    // Change from eyeElement.value to document
    document.removeEventListener('mousemove', moveIris)
    startDefaultBehavior()
  }, 2000) // 2 seconds of tracking
}

const startDefaultBehavior = () => {
  defaultBehaviorInterval = setInterval(() => {
    const angle = Math.random() * 2 * Math.PI
    const distance = Math.random() * maxDistance

    irisX.value = Math.cos(angle) * distance
    irisY.value = Math.sin(angle) * distance
  }, 2500) // 2.5 seconds per random movement
}

const blinkEye = () => {
  eyeElement.value.classList.add('blink')
  setTimeout(() => {
    eyeElement.value.classList.remove('blink')
  }, 200) // Assuming 200ms for blink animation
}

onMounted(async () => {
  await nextTick()
  eyeElement.value = document.querySelector('.bg-white.rounded-full')
  eyeElement.value.addEventListener('click', handleClick)
  startDefaultBehavior()

  // Shared blink timer for all eyes
  blinkInterval = setInterval(blinkEye, 5000) // Blink every 5 seconds
})

onBeforeUnmount(() => {
  clearInterval(defaultBehaviorInterval)
  clearInterval(blinkInterval)
  clearTimeout(trackTimeout)
  eyeElement.value.removeEventListener('click', handleClick)

  // Remove the event listener from the document
  document.removeEventListener('mousemove', moveIris)
})

const moveIris = (event) => {
  const eyeBounds = eyeElement.value.getBoundingClientRect()

  // Calculate the relative position of the mouse inside the eye element.
  const relativeX = event.clientX - eyeBounds.left - eyeballSize / 2
  const relativeY = event.clientY - eyeBounds.top - eyeballSize / 2

  // Limit the iris movement to the boundaries of the eye
  const distance = Math.min(maxDistance, Math.sqrt(relativeX ** 2 + relativeY ** 2))
  const angle = Math.atan2(relativeY, relativeX)

  irisX.value = Math.cos(angle) * distance
  irisY.value = Math.sin(angle) * distance
}
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
