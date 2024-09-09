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
import type { CSSProperties } from 'vue' // Import CSSProperties for type casting

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
  const size = `${Math.random() * 20 + 5}px`
  const opacity = Math.random() * 0.5 + 0.2
  const path = Math.random() * 10 - 5 // random number between -5 and 5
  const bubble = {
    id,
    style: {
      left: `${Math.random() * 100}vw`,
      bottom: `${Math.random() * 10}vh`,
      animationDuration: `${Math.random() * 3 + 2}s`,
      width: size,
      height: size,
      opacity: opacity.toString(),
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
  z-index: 0;
}

.bubble {
  position: absolute;
  bottom: 100%;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: floatBubble linear infinite;
  z-index: 0;
}
.bubble-container,
.bubble {
  pointer-events: none;
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
