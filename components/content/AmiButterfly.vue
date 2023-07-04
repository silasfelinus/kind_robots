<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'
import { makeNoise2D } from 'open-simplex-noise'

// Random color generator in HSL format
const randomColor = (): string => {
  const h = Math.floor(Math.random() * 360)
  const s = Math.floor(Math.random() * 100)
  const l = Math.floor(Math.random() * 100)
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

// Complementary color generator
const complementaryColor = (color: string): string => {
  const [h, s, l] = color.replace('hsl(', '').replace(')', '').split(',')
  let newH = (parseInt(h) + 180) % 360
  return `hsl(${newH},${s},${l})`
}

interface Butterfly {
  wingTopColor: string
  wingBottomColor: string
  rotation: number
  speed: number
  status: 'random' | 'float' | 'mouse' | 'spaz' | 'flock' | 'clear'
  goal: { x: number; y: number }
  hasReachedGoal: boolean
  sway: boolean
  wingSpeed: number
  scale: number
  countdown: number
}

interface WindowSize {
  width: number
  height: number
}

const windowSize = reactive<WindowSize>({
  width: 0,
  height: 0
})

const wingColorType = Math.floor(Math.random() * 3) // 0:same, 1:complementary, 2:analogous
const primaryColor = randomColor()
let secondaryColor = primaryColor
if (wingColorType === 1) {
  secondaryColor = complementaryColor(primaryColor)
} else if (wingColorType === 2) {
  secondaryColor = analogousColor(primaryColor)
}

const butterfly = reactive<Butterfly>({
  wingTopColor: primaryColor,
  wingBottomColor: secondaryColor,
  rotation: 110, // random initial rotation
  speed: Math.random() * 2 + 1, // speed between 1 and 3
  status: 'random',
  goal: {
    x: Math.random() * windowSize.width,
    y: Math.random() * windowSize.height
  },
  hasReachedGoal: false,
  sway: false,
  wingSpeed: Math.floor(Math.random() * 3), // random initial wing speed
  scale: Math.random() * 0.5 + 0.75, // random initial scale between 0.75 and 1.25
  countdown: 0
})

const noise2D = makeNoise2D(Date.now())
let t = 0

function updatePosition() {
  t += 0.01
  const angle = noise2D(butterfly.goal.x * 0.01, butterfly.goal.y * 0.01 + t) * Math.PI * 2
  const dx = Math.cos(angle) * butterfly.speed
  const dy = Math.sin(angle) * butterfly.speed

  butterfly.goal.x += dx
  butterfly.goal.y += dy

  if (butterfly.goal.x < 0 || butterfly.goal.x > window.innerWidth - 100) {
    butterfly.goal.x = Math.max(Math.min(butterfly.goal.x, window.innerWidth - 100), 0)
  }

  if (butterfly.goal.y < 0 || butterfly.goal.y > window.innerHeight - 100) {
    butterfly.goal.y = Math.max(Math.min(butterfly.goal.y, window.innerHeight - 100), 0)
  }

  // Change scale based on screen position
  butterfly.scale =
    0.33 +
    ((2 - (butterfly.goal.x / window.innerWidth + butterfly.goal.y / window.innerHeight)) / 2) *
      0.67

  // Update the rotation based on the direction
  butterfly.rotation = dx >= 0 ? 120 : 30
}

function animate() {
  updatePosition()
  requestAnimationFrame(animate)
}

onMounted(() => {
  windowSize.width = window.innerWidth
  windowSize.height = window.innerHeight

  window.addEventListener('resize', () => {
    windowSize.width = window.innerWidth
    windowSize.height = window.innerHeight
  })

  animate()
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    windowSize.width = window.innerWidth
    windowSize.height = window.innerHeight
  })
})
</script>

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
