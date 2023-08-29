<template>
  <div class="soap-bubbles relative w-full h-full overflow-hidden">
    <transition-group name="bubble" tag="div">
      <svg
        v-for="(bubble, index) in bubbles"
        :key="index"
        class="bubble absolute cursor-pointer"
        :style="bubbleStyle(bubble)"
        @click="popBubble(index)"
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
    <slot></slot>
  </div>
</template>

<script setup>
const bubbles = ref([])
const MAX_BUBBLES = 50

const createBubble = () => {
  if (bubbles.value.length < MAX_BUBBLES) {
    const size = Math.random() * 15 + 3
    const x = Math.random() * (100 - size)
    const y = 0
    const speed = Math.random() * 6 + 4
    const { randomColor } = useRandomColor()
    const color = randomColor.value

    bubbles.value.push({ x, y, size, speed, color })
  }
}

const popBubble = (index) => {
  bubbles.value.splice(index, 1)
}

const bubbleStyle = (bubble) => ({
  left: `${bubble.x}vw`,
  bottom: `${bubble.y}vh`,
  width: `${bubble.size}vw`,
  height: `${bubble.size}vw`,
  animationDuration: `${bubble.speed}s`
})

let bubbleCreationInterval
onMounted(() => {
  bubbleCreationInterval = setInterval(createBubble, 1000)
})

onBeforeUnmount(() => {
  clearInterval(bubbleCreationInterval)
})
</script>

<style scoped>
.bubble {
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
