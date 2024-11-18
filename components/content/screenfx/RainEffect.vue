<template>
  <div class="container mx-auto p-4 relative h-full flex flex-col">
    <!-- Main container for the rain effect -->
    <div class="flex flex-col md:flex-row flex-grow">
      <div class="flex-grow p-2 rounded-2xl m-2 border relative">
        <!-- Rain Effect Area -->
        <div class="rain-container">
          <div
            v-for="drop in rainDrops"
            :key="drop.id"
            class="rain-drop"
            :style="rainDropStyle(drop)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface RainDrop {
  id: number
  x: number
  y: number
  duration: number
  delay: number
  size: number
  angle: number
}

const props = defineProps({
  intensity: { type: Number, default: 2 },
  numberOfDrops: { type: Number, default: 100 },
  windAngle: { type: Number, default: 0 },
})

const rainDrops = ref<RainDrop[]>([])

const updateRainDrops = () => {
  if (typeof window !== 'undefined') {
    rainDrops.value = Array.from({ length: props.numberOfDrops }, (_, id) => {
      const size = 1 + Math.random() * 2
      return {
        id,
        x: Math.random() * window.innerWidth,
        y: -Math.random() * window.innerHeight,
        duration:
          (window.innerHeight / (70 * props.intensity)) *
          (size / 3) *
          (1 + Math.random()),
        delay: Math.random() * 5,
        size,
        angle: props.windAngle + Math.floor(Math.random() * 21) - 10,
      }
    })
  }
}

const rainDropStyle = (drop: RainDrop) => ({
  left: `${drop.x}px`,
  top: `${drop.y}px`,
  animationDuration: `${drop.duration}s`,
  animationDelay: `${drop.delay}s`,
  width: `${drop.size}px`,
  height: `${drop.size * 6}px`,
  transform: `translateY(-120%) rotate(${drop.angle}deg)`,
})

const handleResize = () => {
  updateRainDrops()
}

onMounted(() => {
  updateRainDrops()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.rain-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 40;
  pointer-events: none;
}

.rain-drop {
  position: absolute;
  opacity: 0.8;
  animation: fall linear infinite;
  pointer-events: none;
  will-change: transform;
}

@keyframes fall {
  to {
    transform: translateY(120vh) rotate(var(--wind-angle));
  }
}
</style>
