<template>
  <div class="flex items-center justify-center h-screen">
    <div
      ref="eyeElement"
      class="bg-white rounded-full overflow-hidden shadow relative aspect-w-1 aspect-h-1 blink-animation"
      :style="eyeballStyle"
    >
      <div class="rounded-full absolute" :style="irisStyle">
        <div
          class="bg-black rounded-full w-2/5 h-2/5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// Initialization
const eyeballSize = 150
const irisSize = eyeballSize * 0.6
const maxIrisDist = eyeballSize / 2 - irisSize / 2
const eyeElement = ref(null)
const irisX = ref(0)
const irisY = ref(0)

const eyeballStyle = computed(() => ({
  width: `${eyeballSize}px`,
  height: `${eyeballSize}px`
}))

const irisStyle = computed(() => ({
  width: `${irisSize}px`,
  height: `${irisSize}px`,
  top: `calc(50% + ${irisY.value}px)`,
  left: `calc(50% + ${irisX.value}px)`
}))

// Random movement of iris
let intervalId
onMounted(() => {
  eyeElement.value = document.querySelector('.bg-white.rounded-full')

  intervalId = setInterval(() => {
    const angle = Math.random() * 2 * Math.PI
    const distance = Math.random() * maxIrisDist
    irisX.value = Math.cos(angle) * distance
    irisY.value = Math.sin(angle) * distance
  }, 1000)

  // Random blinking
  function randomBlink() {
    setTimeout(
      () => {
        eyeElement.value.classList.add('blink')
        setTimeout(() => {
          eyeElement.value.classList.remove('blink')
          randomBlink()
        }, 200) // Blink duration
      },
      Math.random() * 5000 + 2000
    ) // Random time between 2s to 7s
  }

  randomBlink()
})

onBeforeUnmount(() => {
  clearInterval(intervalId)
})
</script>

<style>
.blink-animation {
  animation: blinkAnimation 1s infinite;
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
</style>
