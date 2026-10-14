<template>
  <canvas ref="canvasRef" class="paper-lantern-rise" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const LOOP_SECONDS = 60
const LANTERNS = 18
const BOOST_COOLDOWN_MS = 3000
const BOOST_DECAY_PER_SEC = 0.5
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let width = 1
let height = 1
let reducedMotion = false
let boost = 0
let lastBoostTs = 0
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
  if (now - lastBoostTs < BOOST_COOLDOWN_MS) return
  lastBoostTs = now
  boost = 1
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

// Each lantern rises through the screen a whole number of times per loop, so
// the sky repeats exactly every LOOP_SECONDS. Position is a pure function of time.
function drawLantern(index: number, seconds: number): void {
  if (!context) return
  const rises = 1 + (index % 2)
  const progress = fract((seconds / LOOP_SECONDS) * rises + hash(index + 3))
  const sway = Math.sin(
    (seconds / LOOP_SECONDS) * TWO_PI * (2 + (index % 3)) +
      hash(index) * TWO_PI,
  )
  const x = width * (0.05 + 0.9 * hash(index + 20)) + sway * width * 0.025
  const lift = Math.min(1, progress + boost * 0.05)
  const y = height * (1.08 - 1.2 * lift)
  const size = Math.min(width, height) * (0.025 + 0.02 * hash(index + 60))
  const near =
    pointerX >= 0
      ? Math.max(0, 1 - Math.hypot(pointerX - x, pointerY - y) / (width * 0.2))
      : 0
  const fade = Math.min(1, progress * 6, (1 - progress) * 4)
  const flicker = 0.85 + 0.15 * Math.sin(seconds * 5 + index * 2.3)
  const glow = Math.min(1, (0.6 + near * 0.4) * flicker) * fade
  context.save()
  context.translate(x, y)
  context.rotate(sway * 0.06)
  const halo = context.createRadialGradient(
    0,
    0,
    0,
    0,
    0,
    size * (3 + near * 2),
  )
  halo.addColorStop(0, `rgba(255, 170, 70, ${glow * 0.45})`)
  halo.addColorStop(1, 'rgba(255, 170, 70, 0)')
  context.fillStyle = halo
  context.beginPath()
  context.arc(0, 0, size * (3 + near * 2), 0, TWO_PI)
  context.fill()
  context.fillStyle = `rgba(255, ${190 + Math.round(40 * flicker)}, 110, ${glow})`
  context.beginPath()
  context.moveTo(-size * 0.7, size)
  context.lineTo(-size, -size * 0.2)
  context.quadraticCurveTo(0, -size * 1.5, size, -size * 0.2)
  context.lineTo(size * 0.7, size)
  context.closePath()
  context.fill()
  context.strokeStyle = `rgba(120, 50, 20, ${glow * 0.6})`
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(-size * 0.35, size)
  context.lineTo(-size * 0.4, -size * 0.6)
  context.moveTo(size * 0.35, size)
  context.lineTo(size * 0.4, -size * 0.6)
  context.stroke()
  context.restore()
}

function drawScene(seconds: number): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#0b1030')
  sky.addColorStop(0.7, '#2a2358')
  sky.addColorStop(1, '#5a3a62')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // Distant stars, fixed positions.
  context.fillStyle = 'rgba(255, 255, 255, 0.7)'
  for (let i = 0; i < 40; i += 1) {
    context.fillRect(
      hash(i + 100) * width,
      hash(i + 200) * height * 0.6,
      1.2,
      1.2,
    )
  }

  // Dark shoreline with a faint lantern reflection.
  context.fillStyle = '#10142e'
  context.beginPath()
  context.moveTo(0, height)
  for (let i = 0; i <= 24; i += 1) {
    const x = (i / 24) * width
    context.lineTo(x, height * (0.92 + 0.02 * Math.sin(i * 0.9 + 2)))
  }
  context.lineTo(width, height)
  context.closePath()
  context.fill()

  for (let i = 0; i < LANTERNS; i += 1) drawLantern(i, seconds)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  boost = Math.max(0, boost - BOOST_DECAY_PER_SEC * dt)
  drawScene(timestamp / 1000)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  boost = 0
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
.paper-lantern-rise {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
