<template>
  <canvas ref="canvasRef" class="dune-wind-ripples" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const LOOP_SECONDS = 60
const RIDGES = 6
const GRAINS = 90
const GUST_COOLDOWN_MS = 3000
const GUST_DECAY_PER_SEC = 0.35
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

// Ridge height is a sum of sines whose phase advances by a whole number of
// cycles per loop, so the dunes creep and the scene repeats exactly.
function ridgeY(ridge: number, x: number, seconds: number): number {
  const base = height * (0.42 + (ridge / RIDGES) * 0.5)
  const drift = (seconds / LOOP_SECONDS) * TWO_PI * (1 + (ridge % 2))
  const u = x / width
  return (
    base +
    Math.sin(u * 4 + ridge * 1.7 + drift) * height * 0.035 +
    Math.sin(u * 9 + ridge * 0.9 - drift * 2) * height * 0.01
  )
}

function drawSky(seconds: number): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height * 0.7)
  sky.addColorStop(0, '#f6b26b')
  sky.addColorStop(1, '#fbe3b0')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)
  const sunX = width * (0.5 + 0.3 * Math.sin((seconds / LOOP_SECONDS) * TWO_PI))
  const sun = context.createRadialGradient(
    sunX,
    height * 0.28,
    0,
    sunX,
    height * 0.28,
    height * 0.22,
  )
  sun.addColorStop(0, 'rgba(255, 250, 225, 0.95)')
  sun.addColorStop(1, 'rgba(255, 230, 170, 0)')
  context.fillStyle = sun
  context.fillRect(0, 0, width, height)
}

function drawRidges(seconds: number): void {
  if (!context) return
  const steps = 48
  for (let r = 0; r < RIDGES; r += 1) {
    const shade = 200 - r * 22
    context.fillStyle = `rgb(${shade}, ${Math.round(shade * 0.72)}, ${Math.round(shade * 0.42)})`
    context.beginPath()
    context.moveTo(0, height)
    for (let i = 0; i <= steps; i += 1) {
      const x = (i / steps) * width
      context.lineTo(x, ridgeY(r, x, seconds))
    }
    context.lineTo(width, height)
    context.closePath()
    context.fill()
  }
}

// Wind-blown grains skim the crest of the nearest ridges; position is a pure
// function of time with a whole number of crossings per loop.
function drawGrains(seconds: number): void {
  if (!context) return
  const wind = 1 + gust * 2
  for (let i = 0; i < GRAINS; i += 1) {
    const lane = Math.floor(hash(i + 3) * 4)
    const speed = 2 + Math.floor(hash(i + 17) * 3)
    const x = fract((seconds / LOOP_SECONDS) * speed * wind + hash(i)) * width
    const crest = ridgeY(RIDGES - 1 - lane, x, seconds)
    const lift = Math.sin(seconds * 1.3 + i) * 4 + hash(i + 29) * 10
    let y = crest - lift
    if (pointerX >= 0) {
      const dx = x - pointerX
      const dy = y - pointerY
      const d = Math.hypot(dx, dy)
      const reach = width * 0.12
      if (d < reach) y -= (1 - d / reach) * 18
    }
    context.fillStyle = `rgba(255, 236, 190, ${0.35 + hash(i + 5) * 0.4})`
    context.fillRect(x, y, 2 + gust * 2, 1.5)
  }
}

function drawScene(seconds: number): void {
  drawSky(seconds)
  drawRidges(seconds)
  drawGrains(seconds)
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
.dune-wind-ripples {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
