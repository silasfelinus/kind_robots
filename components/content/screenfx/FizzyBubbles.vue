<template>
  <div class="bubble-container">
    <div
      v-for="bubble in bubbles"
      :key="bubble.id"
      :style="bubble.style"
      class="bubble"
      @animationiteration="removeBubble(bubble.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { CSSProperties } from 'vue'

const bubbles = ref<Array<{ id: number; style: CSSProperties }>>([])

let intervalId: number

onMounted(() => {
  intervalId = window.setInterval(createBubble, 500)
})

onUnmounted(() => {
  window.clearInterval(intervalId)
})

function createBubble() {
  const id = Date.now() // Unique ID based on the current timestamp
  const size = `${Math.random() * 30 + 10}px` // Increased size range for visibility
  const opacity = Math.random() * 0.4 + 0.6 // Higher minimum opacity for better contrast
  const path = Math.random() * 15 - 7.5 // Increased path range for more dynamic movement
  const bubble = {
    id,
    style: {
      left: `${Math.random() * 100}vw`,
      bottom: `${Math.random() * 10}vh`,
      animationDuration: `${Math.random() * 4 + 3}s`, // Slower animations for visibility
      width: size,
      height: size,
      opacity: opacity.toString(),
      backgroundColor: `rgba(255, 255, 255, ${opacity})`, // White bubble color with transparency
      boxShadow: `0 0 10px rgba(255, 255, 255, ${opacity})`, // Added glow for better visibility
      '--path-change': `${path}vw`,
    } as CSSProperties, // Cast the style object to CSSProperties
  }
  bubbles.value.push(bubble)
}

function removeBubble(bubbleId: number) {
  bubbles.value = bubbles.value.filter((b) => b.id !== bubbleId)
}
</script>

<style scoped>
.bubble-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 40;
  pointer-events: none;
}

.bubble {
  position: absolute;
  bottom: 100%;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.8) 0%,
    /* Brighter inner bubble */ rgba(255, 255, 255, 0.2) 100%
      /* Softer outer fade */
  );
  animation: floatBubble linear infinite;
  z-index: 40;
}

@keyframes floatBubble {
  0% {
    transform: translateY(0) translateX(0);
  }
  100% {
    transform: translateY(calc(-100vh - 10px)) translateX(var(--path-change));
  }
}
</style>
