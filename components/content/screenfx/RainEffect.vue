<template>
  <div class="rain-container">
    <div
      v-for="(drop, index) in rainDrops"
      :key="index"
      class="rain-drop bg-accent"
      :style="rainDropStyle(drop)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface RainDrop {
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
  windAngle: { type: Number, default: 0 }
})

const rainDrops: RainDrop[] = Array.from({ length: props.numberOfDrops }).map(() => {
  const size = 1 + Math.random() * 2
  return {
    x: Math.floor(Math.random() * window.innerWidth),
    y: Math.floor(Math.random() * -window.innerHeight),
    duration: (window.innerHeight / (70 * props.intensity)) * (size / 3) * (1 + Math.random()),
    delay: Math.random() * 5,
    size,
    angle: props.windAngle + Math.floor(Math.random() * 21) - 10
  }
})

const rainDropStyle = (drop: RainDrop) => ({
  left: drop.x + 'px',
  top: drop.y + 'px',
  animationDuration: drop.duration + 's',
  animationDelay: drop.delay + 's',
  width: drop.size + 'px',
  height: drop.size * 6 + 'px',
  transform: `translateY(-120%) rotate(${drop.angle}deg)`
})

onMounted(() => {
  document.documentElement.style.setProperty('--wind-angle', `${props.windAngle}deg`)
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
  z-index: 1;
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
