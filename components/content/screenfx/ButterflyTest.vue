<template>
  <div
    class="butterfly"
    :style="{
      left: butterfly.goal.x + 'px',
      top: butterfly.goal.y + 'px',
      transform: 'rotate3d(1, 0.5, 0, ' + butterfly.rotation + 'deg) scale(' + butterfly.scale + ')'
    }"
  >
    <div class="left-wing">
      <div class="top" :style="{ background: butterfly.wingTopColor }"></div>
      <div class="bottom" :style="{ background: butterfly.wingBottomColor }"></div>
    </div>
    <div class="right-wing">
      <div class="top" :style="{ background: butterfly.wingTopColor }"></div>
      <div class="bottom" :style="{ background: butterfly.wingBottomColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'
import { makeNoise2D } from 'open-simplex-noise'
const animationFrameId = ref<number | null>(null)

const randomColor = (): string => {
  const h = Math.floor(Math.random() * 360)
  const s = Math.floor(Math.random() * 50 + 50) // keep saturation between 50 and 100
  const l = Math.floor(Math.random() * 40 + 30) // keep lightness between 30 and 70
  return `hsl(${h},${s}%,${l}%)`
}

// Analogous color generator
const analogousColor = (hsl: string): string => {
  const hslMatch = hsl.match(/\d+/g)
  if (!hslMatch) {
    throw new Error('Invalid color format')
  }
  const [h, s, l] = hslMatch.map(Number)
  let newH = (h + 30) % 360
  return `hsl(${newH},${s}%,${l}%)`
}
const noise2D = makeNoise2D(Date.now())
let t = 0

interface Butterfly {
  wingTopColor: string
  wingBottomColor: string
  rotation: number
  speed: number
  goal: { x: number; y: number }
  scale: number
}

const butterfly = reactive<Butterfly>({
  wingTopColor: randomColor(),
  wingBottomColor: analogousColor(randomColor()),
  rotation: 110,
  scale: 1,
  speed: Math.random() * 2 + 1,
  goal: {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }
})

function updatePosition() {
  t += 0.01
  const angle = noise2D(butterfly.goal.x * 0.01, butterfly.goal.y * 0.01 + t) * Math.PI * 2
  const dx = Math.cos(angle) * butterfly.speed
  const dy = Math.sin(angle) * butterfly.speed

  butterfly.goal.x += dx
  butterfly.goal.y += dy

  butterfly.rotation = dx >= 0 ? 120 : 30
}

function animate() {
  updatePosition()
  animationFrameId.value = requestAnimationFrame(animate)
}

onMounted(() => {
  animate()
})
onUnmounted(() => {
  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value)
  }
})
</script>

<style scoped>
body {
  background: #111;
  pointer-events: none;
}

@keyframes flutter-left {
  0% {
    transform: rotate3d(0, 1, 0, 20deg);
  }
  50% {
    transform: rotate3d(0, 1, 0, 70deg);
  }
  100% {
    transform: rotate3d(0, 1, 0, 20deg);
  }
}

@keyframes flutter-right {
  0% {
    transform: rotate3d(0, 1, 0, -20deg);
  }
  50% {
    transform: rotate3d(0, 1, 0, -70deg);
  }
  100% {
    transform: rotate3d(0, 1, 0, -20deg);
  }
}

.butterfly {
  width: 100px;
  height: 100px;
  position: absolute;
  transform-style: preserve-3d;
  transform: rotate3d(1, 0.5, 0, 110deg);
  pointer-events: none;
}

.left-wing,
.right-wing {
  width: 24px;
  height: 42px;
  position: absolute;
  top: 10px;
  pointer-events: none;
}

.left-wing {
  left: 10px;
  top: 10px;
  transform-origin: 24px 50%;
  transform: rotate3d(0, 1, 0, 20deg);
  animation: flutter-left 0.3s infinite;
  pointer-events: none;
}

.right-wing {
  left: 34px;
  transform: rotate3d(0, 1, 0, -20deg);
  transform-origin: 0px 50%;
  animation: flutter-right 0.3s infinite;
  pointer-events: none;
}

.left-wing .top {
  right: 0;
  pointer-events: none;
}

.top,
.bottom {
  opacity: 0.7;
  position: absolute;
  pointer-events: none;
}
.top {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  pointer-events: none;
}

.bottom {
  top: 18px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  pointer-events: none;
}
</style>
