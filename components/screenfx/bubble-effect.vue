<!-- /components/content/screenfx/bubble-effect.vue -->
<template>
  <div class="soap-bubbles">
    <transition-group name="bubble" tag="div">
      <svg
        v-for="bubble in bubbles"
        :key="bubble.id"
        class="bubble"
        :style="bubbleStyle(bubble)"
      >
        <circle
          :cx="bubble.size / 2"
          :cy="bubble.size / 2"
          :r="bubble.size / 2"
          :fill="bubble.color"
          :stroke="bubble.color"
          stroke-width="2"
        />
      </svg>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRandomColor } from './../../utils/useRandomColor'

// Define Bubble interface to type bubble objects
interface Bubble {
  id: number
  x: number
  size: number
  speed: number
  color: string
}

// Array of bubbles typed as Bubble[]
const bubbles = ref<Bubble[]>([])
const MAX_BUBBLES = 20

// Function to create a new bubble
const createBubble = () => {
  if (bubbles.value.length < MAX_BUBBLES) {
    const size = Math.random() * 50 + 10
    const x = Math.random() * 100
    const speed = Math.random() * 6 + 4
    const { randomColor } = useRandomColor()
    const color = randomColor.value

    bubbles.value.push({ id: Date.now(), x, size, speed, color }) // Push new bubble into bubbles array
  }
}

// Bubble style computation with typed bubble parameter
const bubbleStyle = (bubble: Bubble) => ({
  left: `${bubble.x}vw`, // Add backticks around interpolations
  bottom: '-10vw', // This one is fine as it's a string
  width: `${bubble.size}vw`, // Add backticks
  height: `${bubble.size}vw`, // Add backticks
  animationDuration: `${bubble.speed}s`, // Add backticks
})

// Type for bubbleCreationInterval, explicitly cast setInterval to number
let bubbleCreationInterval: number | null = null

onMounted(() => {
  for (let i = 0; i < MAX_BUBBLES; i++) {
    createBubble()
  }
  bubbleCreationInterval = setInterval(createBubble, 3000) as unknown as number
})

onBeforeUnmount(() => {
  if (bubbleCreationInterval !== null) {
    clearInterval(bubbleCreationInterval)
  }
})
</script>

<style scoped>
.soap-bubbles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.bubble {
  position: absolute;
  pointer-events: none;
  animation: floatBubbles linear infinite;
}

.bubble-leave-active {
  animation: popBubble 0.3s ease-out forwards;
}

@keyframes floatBubbles {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-100vh);
  }
}

@keyframes popBubble {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(0);
  }
}
</style>
