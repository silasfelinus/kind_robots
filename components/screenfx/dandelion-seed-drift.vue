<template>
  <canvas ref="canvasRef" class="dandelion-seed-drift" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const LOOP_SECONDS = 60
const SEEDS = 22
const GUST_COOLDOWN_MS = 3000
const GUST_DECAY_PER_SEC = 0.5
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let width = 1
let height = 1
let reducedMotion = false
let gust = 0
let lastGustTs = 0
let pointerX = -1
let pointerY = -1

function fract(value: number): number {
  return value - Math.floor(value)
}

function hash(n: number): number {
  return fract(Math.sin(n * 127.1) * 43758.5453)
}

function canvasPoint(event: PointerEvent): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
  return { x, y }
}

function handlePointerMove(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event)
  pointerX = point ? point.x : -1
  pointerY = point ? point.y : -1
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastGustTs < GUST_COOLDOWN_MS) return
  lastGustTs = now
  gust = 1
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas || !context) return
  const rect = canvas.getBoundingClientRect()
  width = Math.max(1, rect.width)
  height = Math.max(1, rect.height)
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
}

// Each seed crosses the screen a whole number of times per loop, so the field
// repeats exactly every LOOP_SECONDS. Position is a pure function of time.
function drawSeed(index: number, seconds: number): void {
  if (!context) return
  const crossings = 1 + (index % 2)
  const progress = fract(
    (seconds / LOOP_SECONDS) * crossings + hash(index + 3),
  )
  const bob = Math.sin(
    (seconds / LOOP_SECONDS) * TWO_PI * (2 + (index % 3)) + hash(index) * TWO_PI,
  )
  const x = width * (-0.1 + 1.2 * progress) + gust * progress * width * 0.05
  const baseY = height * (0.12 + 0.7 * hash(index + 20))
  const y = baseY + bob * height * 0.04 + progress * height * 0.08
  const size = Math.min(width, height) * (0.018 + 0.016 * hash(index + 60))
  const spin = bob * 0.5 + (hash(index + 5) - 0.5)
  const near =
    pointerX >= 0
      ? Math.max(0, 1 - Math.hypot(pointerX - x, pointerY - y) / (width * 0.2))
      : 0
  const alpha = Math.min(1, 0.55 + near * 0.4)
  context.save()
  context.translate(x, y)
  context.rotate(spin)
  context.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`
  context.lineWidth = 1
  // Filaments fan out from the tuft.
  context.beginPath()
  for (let f = 0; f < 9; f += 1) {
    const angle = -Math.PI + (f / 8) * Math.PI
    context.moveTo(0, 0)
    context.lineTo(Math.cos(angle) * size, Math.sin(angle) * size)
  }
  context.stroke()
  // Stem and seed body below the tuft.
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(0, size * 1.6)
  context.stroke()
  context.fillStyle = `rgba(255, 244, 214, ${alpha})`
  context.beginPath()
  context.arc(0, size * 1.7, Math.max(1.2, size * 0.12), 0, TWO_PI)
  context.fill()
  const halo = context.createRadialGradient(0, 0, 0, 0, 0, size * (1.4 + near))
  halo.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.35})`)
  halo.addColorStop(1, 'rgba(255, 255, 255, 0)')
  context.fillStyle = halo
  context.beginPath()
  context.arc(0, 0, size * (1.4 + near), 0, TWO_PI)
  context.fill()
  context.restore()
}

function drawScene(seconds: number): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#2a6f9e')
  sky.addColorStop(0.7, '#8fd0e6')
  sky.addColorStop(1, '#f7e3a1')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // Meadow ridge along the bottom.
  context.fillStyle = '#3d7a45'
  context.beginPath()
  context.moveTo(0, height)
  for (let i = 0; i <= 24; i += 1) {
    const x = (i / 24) * width
    context.lineTo(x, height * (0.9 + 0.025 * Math.sin(i * 0.8 + 1)))
  }
  context.lineTo(width, height)
  context.closePath()
  context.fill()

  for (let i = 0; i < SEEDS; i += 1) drawSeed(i, seconds)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  gust = Math.max(0, gust - GUST_DECAY_PER_SEC * dt)
  drawScene(timestamp / 1000)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  gust = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) drawScene(12)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  context = canvas.getContext('2d')
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)

  resizeObserver = new ResizeObserver(() => {
    resizeCanvas()
    if (reducedMotion) drawScene(12)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(12)
  else animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionChange)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)
  context = null
})
</script>

<style scoped>
.dandelion-seed-drift {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
