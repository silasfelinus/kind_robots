<template>
  <div class="rain-container">
    <div
      v-for="(drop, index) in rainDrops"
      :key="index"
      class="rain-drop"
      :style="{
        left: drop.x + 'px',
        top: drop.y + 'px',
        animationDuration: drop.duration + 's',
        animationDelay: drop.delay + 's',
        width: drop.size + 'px',
        height: drop.size * 5 + 'px',
        transform: `translateY(-100%) rotate(${drop.angle}deg)`,
        'z-index': 9999,
        'background-color': drop.color
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
interface RainDrop {
  x: number
  y: number
  duration: number
  delay: number
  size: number
  angle: number
  color: string
}
const props = defineProps({
  intensity: {
    type: Number,
    default: 2
  },
  numberOfDrops: {
    type: Number,
    default: 100
  },
  windAngle: {
    type: Number,
    default: 0
  },
  colors: {
    type: Array as () => string[], // Added as () => string[] to indicate the array elements are strings
    default: () => ['#00f', '#0f0', '#f00']
  }
})

const rainDrops: RainDrop[] = Array.from({ length: props.numberOfDrops }).map(() => {
  const size = 1 + Math.random() * 3
  const color = props.colors[Math.floor(Math.random() * props.colors.length)]
  return {
    x: Math.floor(Math.random() * window.innerWidth),
    y: Math.floor(Math.random() * -window.innerHeight),
    duration: (window.innerHeight / (50 * props.intensity)) * (size / 2),
    delay: Math.random() * 2,
    size,
    angle: props.windAngle + Math.floor(Math.random() * 21) - 10,
    color
  }
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
  bottom: 100%;
  opacity: 0.5;
  animation: fall linear infinite;
  pointer-events: none;
}

@keyframes fall {
  to {
    transform: translateY(100vh) rotate(var(--wind-angle));
  }
}
</style>
