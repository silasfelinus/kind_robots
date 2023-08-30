<template>
  <div class="lava-lamp">
    <svg class="lava-lamp-container" viewBox="0 0 200 400">
      <defs>
        <radialGradient id="lampGradient" cx="0.5" cy="0.8">
          <stop offset="0%" style="stop-color: rgba(255, 255, 255, 0.1)" />
          <stop offset="100%" style="stop-color: rgba(0, 0, 0, 0.2)" />
        </radialGradient>
      </defs>
      <g class="lava-lamp-glass">
        <path
          d="M100,10 Q140,60 100,400 Q60,60 100,10"
          fill="url(#lampGradient)"
          stroke="rgba(255, 255, 255, 0.2)"
          stroke-width="2"
        />
      </g>
      <g class="lava-bubbles">
        <circle
          v-for="(bubble, index) in bubbles"
          :key="index"
          :cx="bubble.x"
          :cy="bubble.y"
          :r="bubble.size"
          :style="bubbleStyle(bubble)"
          :fill="`hsla(${bubble.hue}, 100%, 50%, 0.7)`"
        />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const bubbles = ref([])
let bubbleCreationInterval = null

const createBubble = () => {
  const size = Math.random() * 10 + 5
  const x = Math.random() * (160 - size) + 20
  const y = 380
  const hue = Math.floor(Math.random() * 360)
  const duration = Math.random() * 3 + 7

  bubbles.value.push({ x, y, size, hue, duration })
}

const bubbleStyle = (bubble) => ({
  animation: `moveBubbles ${bubble.duration}s ease-in-out infinite`
})

onMounted(() => {
  bubbleCreationInterval = setInterval(createBubble, 2000)
})

onBeforeUnmount(() => {
  clearInterval(bubbleCreationInterval)
})
</script>

<style scoped>
@keyframes moveBubbles {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20%) scale(1.2);
  }
}

.lava-lamp {
  width: 100%;
  max-width: 200px;
  margin: 0 auto;
}
</style>
