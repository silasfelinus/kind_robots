<template>
  <div class="flex flex-col items-center p-8 bg-base-100 rounded-lg shadow-lg">
    <!-- Minimized Avatar -->
    <div
      v-if="minimized"
      class="rounded-full w-16 h-16 bg-accent flex items-center justify-center cursor-pointer relative"
      @click="toggleMinimize"
    >
      <img
        :src="page.image ? `/images/${page.image}` : '/images/default-image.webp'"
        alt="Chat Avatar"
        class="rounded-full w-14 h-14"
      />
      <!-- Ripple Effect -->
      <div class="ripple bg-primary opacity-50"></div>
    </div>

    <!-- Chat Window -->
    <div v-else class="w-full mt-4 p-4 bg-secondary rounded-lg border-4 border-accent">
      <h3 class="text-lg font-semibold text-default mb-2">Silas Says...</h3>

      <!-- Text Container -->
      <div class="streaming-container bg-base rounded-lg p-4">
        <div class="streaming-text text-default text-info">
          <span class="text-default text-xl">{{ streamingText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const minimized = ref(false) // Initialize the minimized ref to false
const { page } = useContent() // Get the page content

const toggleMinimize = () => {
  minimized.value = !minimized.value // Toggle the value of minimized ref
}

const streamingText = ref('Hey there, welcome to KindRobots!') // Initialize with a default value
let index = 0
let timer: number

const startStreaming = () => {
  timer = window.setInterval(() => {
    if (index < (page.tooltip?.length || 0)) {
      // Safely access the tooltip length
      streamingText.value += page.tooltip?.charAt(index) || '' // Safely access characters from tooltip
      index++
    } else {
      clearInterval(timer)
    }
  }, 100) // Adjust the speed as needed
}

onMounted(() => {
  startStreaming() // Start streaming on component mount
})

watch(
  () => page.tooltip,
  (newTooltip) => {
    clearInterval(timer) // Clear the existing timer
    streamingText.value = '' // Reset the streaming text
    index = 0 // Reset the index
    startStreaming() // Start streaming with the new tooltip
  }
)
</script>

<style scoped>
.ripple {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: ripple-animation 1.5s infinite;
  width: 100%;
  height: 100%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@keyframes ripple-animation {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 200%;
    height: 200%;
    opacity: 0;
  }
}
</style>
