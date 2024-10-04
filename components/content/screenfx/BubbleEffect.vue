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

// Define Bubble interface to type bubble objects
interface Bubble {
  id: number
  x: number
  y: number
  size: number
  speed: number
  color: string
}

// Array of bubbles typed as Bubble[]
const bubbles = ref<Bubble[]>([])
const MAX_BUBBLES = 30 // Increased number of bubbles
const MAX_SIZE = 120 // Larger bubble size

// DaisyUI color palette excluding bg-base-300
const daisyColors = [
  'var(--b-info)', // bg-info
  'var(--b-accent)', // bg-accent
  'var(--b-primary)', // bg-primary
  'var(--b-secondary)', // bg-secondary
]

// Function to create a new bubble
const createBubble = () => {
  if (bubbles.value.length < MAX_BUBBLES) {
    const size = Math.random() * (MAX_SIZE - 30) + 30 // Larger bubble sizes
    const x = Math.random() * 100
    const y = Math.random() * 100 // Random Y start positions
    const speed = Math.random() * 8 + 4 // Slow down speed for better visibility
    const color = daisyColors[Math.floor(Math.random() * daisyColors.length)] // Random DaisyUI color

    bubbles.value.push({ id: Date.now(), x, y, size, speed, color }) // Push new bubble into bubbles array
  }
}

// Bubble style computation with typed bubble parameter
const bubbleStyle = (bubble: Bubble) => ({
  left: `${bubble.x}vw`,
  top: `${bubble.y}vh`, // Bubbles start at random Y positions
  width: `${bubble.size}px`,
  height: `${bubble.size}px`,
  animationDuration: `${bubble.speed}s`,
})

// Type for bubbleCreationInterval, explicitly cast setInterval to number
let bubbleCreationInterval: number | null = null

onMounted(() => {
  for (let i = 0; i < MAX_BUBBLES; i++) {
    createBubble()
  }
  bubbleCreationInterval = setInterval(createBubble, 2000) as unknown as number // Speed up bubble creation
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
    transform: translateY(-200vh); /* Increased translation for longer travel */
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
