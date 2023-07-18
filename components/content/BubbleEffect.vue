<template>
  <div class="soap-bubbles">
    <transition-group name="bubble" tag="div">
      <svg
        v-for="(bubble, index) in bubbles"
        :key="index"
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
        ></circle>
      </svg>
    </transition-group>
  </div>
</template>

<script setup>
import { useRandomColor } from '../../composables/useRandomColor'

const bubbles = ref([])
const MAX_BUBBLES = 20 // Reduced number of bubbles

const createBubble = () => {
  if (bubbles.value.length < MAX_BUBBLES) {
    const size = Math.random() * 50 + 10 // Increased range of bubble sizes
    const x = Math.random() * (100 - size)
    const speed = Math.random() * 6 + 4
    const { randomColor } = useRandomColor()
    const color = randomColor.value

    bubbles.value.push({ x, size, speed, color })
  }
}

const bubbleStyle = (bubble) => ({
  left: `${bubble.x}vw`,
  bottom: `${Math.random() * 100}vh`, // bubbles start at a random position on screen
  width: `${bubble.size}vw`,
  height: `${bubble.size}vw`,
  animationDuration: `${bubble.speed}s`
})

let bubbleCreationInterval
onMounted(() => {
  // Create initial bubbles
  for (let i = 0; i < MAX_BUBBLES; i++) {
    createBubble()
  }
  bubbleCreationInterval = setInterval(createBubble, 3000) // Adjust time interval as needed
})

onBeforeUnmount(() => {
  clearInterval(bubbleCreationInterval)
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
  z-index: 20;
  pointer-events: none;
}

.bubble {
  position: absolute;
  pointer-events: auto;
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
