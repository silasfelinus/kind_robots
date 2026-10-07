<template>
  <canvas ref="canvasRef" class="snow-globe-village" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const FLAKE_COUNT = 140
const SHAKE_COOLDOWN_MS = 2000
const SHAKE_DECAY_PER_SEC = 0.45
const GRAVITY = 26
const TWO_PI = Math.PI * 2

interface Flake {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  phase: number
}

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let shake = 0
let tilt = 0
let tiltTarget = 0
let reducedMotion = false
let lastShakeTs = 0
const flakes: Flake[] = []

function fract(value: number): number {
  return value - Math.floor(value)
}

function hash(n: number): number {
  return fract(Math.sin(n * 127.1) * 43758.5453)
}

// Globe geometry derived from the canvas size; everything is clipped to it.
function globe(): { cx: number; cy: number; r: number } {
  const r = Math.min(width, height) * 0.4
  return { cx: width / 2, cy: height * 0.47, r }
}

function seedFlakes(settled: boolean): void {
  flakes.length = 0
  const { cx, cy, r } = globe()
  for (let i = 0; i < FLAKE_COUNT; i += 1) {
    const angle = hash(i + 1) * TWO_PI
    const dist = Math.sqrt(hash(i + 50)) * r * 0.95
    flakes.push({
      x: cx + Math.cos(angle) * dist,
      y: settled
        ? cy + r * (0.55 + hash(i + 9) * 0.4)
        : cy + Math.sin(angle) * dist,
      vx: 0,
      vy: 0,
      size: 1.2 + hash(i + 120) * 2.2,
      phase: hash(i + 300) * TWO_PI,
    })
  }
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
  if (!point) return
  tiltTarget = ((point.x / width) * 2 - 1) * 0.12
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastShakeTs < SHAKE_COOLDOWN_MS) return
  lastShakeTs = now
  shake = 1
  for (const flake of flakes) {
    flake.vx += (Math.random() - 0.5) * 240
    flake.vy -= 60 + Math.random() * 220
  }
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
  seedFlakes(reducedMotion)
}

function drawHouse(
  x: number,
  ground: number,
  w: number,
  h: number,
  lit: boolean,
): void {
  if (!context) return
  context.fillStyle = '#5b3a2e'
  context.fillRect(x, ground - h, w, h)
  context.fillStyle = '#c9d6e6'
  context.beginPath()
  context.moveTo(x - w * 0.15, ground - h)
  context.lineTo(x + w / 2, ground - h - w * 0.6)
  context.lineTo(x + w * 1.15, ground - h)
  context.closePath()
  context.fill()
  context.fillStyle = lit ? '#ffd27a' : '#2b2030'
  context.fillRect(x + w * 0.3, ground - h * 0.7, w * 0.4, h * 0.4)
}

function drawScene(timestamp: number): void {
  if (!context) return
  const { cx, cy, r } = globe()
  context.fillStyle = '#16122b'
  context.fillRect(0, 0, width, height)

  // Wooden base under the globe.
  context.fillStyle = '#4a2f22'
  context.fillRect(cx - r * 0.85, cy + r * 0.82, r * 1.7, r * 0.3)
  context.fillStyle = '#6a4330'
  context.fillRect(cx - r * 0.85, cy + r * 0.82, r * 1.7, r * 0.06)

  context.save()
  context.beginPath()
  context.arc(cx, cy, r, 0, TWO_PI)
  context.clip()
  const sky = context.createLinearGradient(0, cy - r, 0, cy + r)
  sky.addColorStop(0, '#27386b')
  sky.addColorStop(1, '#6a6fa6')
  context.fillStyle = sky
  context.fillRect(cx - r, cy - r, r * 2, r * 2)

  const ground = cy + r * 0.62
  context.fillStyle = '#e8eef7'
  context.beginPath()
  context.ellipse(cx, ground + r * 0.35, r * 1.1, r * 0.55, 0, 0, TWO_PI)
  context.fill()

  const glow = 0.8 + 0.2 * Math.sin(timestamp / 600)
  context.globalAlpha = reducedMotion ? 1 : glow
  drawHouse(cx - r * 0.5, ground, r * 0.3, r * 0.22, true)
  drawHouse(cx - r * 0.05, ground - r * 0.02, r * 0.26, r * 0.3, true)
  drawHouse(cx + r * 0.38, ground, r * 0.24, r * 0.18, hash(3) > 0.2)
  context.globalAlpha = 1

  // A tiny pine beside the houses.
  context.fillStyle = '#1f4a3a'
  for (let i = 0; i < 3; i += 1) {
    const top = ground - r * (0.36 - i * 0.1)
    context.beginPath()
    context.moveTo(cx + r * 0.72, top)
    context.lineTo(cx + r * (0.72 + 0.1 + i * 0.04), top + r * 0.14)
    context.lineTo(cx + r * (0.72 - 0.1 - i * 0.04), top + r * 0.14)
    context.closePath()
    context.fill()
  }

  context.fillStyle = 'rgba(255, 255, 255, 0.92)'
  for (const flake of flakes) {
    context.beginPath()
    context.arc(flake.x, flake.y, flake.size, 0, TWO_PI)
    context.fill()
  }
  context.restore()

  // Glass rim and highlight.
  context.strokeStyle = 'rgba(210, 225, 255, 0.55)'
  context.lineWidth = 3
  context.beginPath()
  context.arc(cx, cy, r, 0, TWO_PI)
  context.stroke()
  context.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  context.lineWidth = 5
  context.beginPath()
  context.arc(cx, cy, r * 0.86, Math.PI * 1.1, Math.PI * 1.4)
  context.stroke()
}

function stepFlakes(delta: number, timestamp: number): void {
  const { cx, cy, r } = globe()
  const floor = cy + r * 0.62
  tilt += (tiltTarget - tilt) * Math.min(1, delta * 3)
  shake = Math.max(0, shake - SHAKE_DECAY_PER_SEC * delta)
  for (const flake of flakes) {
    const swirl = Math.sin(timestamp / 900 + flake.phase) * (14 + shake * 90)
    flake.vx += (swirl + tilt * 160) * delta
    flake.vy += (GRAVITY * (0.5 + flake.size / 3) - shake * 40) * delta
    flake.vx *= 1 - Math.min(0.9, delta * 1.6)
    flake.vy *= 1 - Math.min(0.9, delta * 1.2)
    flake.x += flake.vx * delta
    flake.y += flake.vy * delta
    if (flake.y > floor + r * 0.3 * hash(flake.phase * 10)) {
      flake.y = floor + r * 0.3 * hash(flake.phase * 10)
      flake.vy = 0
      flake.vx *= 0.5
    }
    // Keep flakes inside the glass; slide back toward the centre at the wall.
    const dx = flake.x - cx
    const dy = flake.y - cy
    const dist = Math.hypot(dx, dy)
    if (dist > r * 0.95) {
      flake.x = cx + (dx / dist) * r * 0.95
      flake.y = cy + (dy / dist) * r * 0.95
      flake.vx *= -0.3
    }
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed)) / 1000
  if (!reducedMotion) stepFlakes(delta, timestamp)
  drawScene(timestamp)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  shake = 0
  tilt = 0
  tiltTarget = 0
  seedFlakes(reducedMotion)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  context = canvas.getContext('2d')
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)

  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionChange)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)
  flakes.length = 0
  context = null
})
</script>

<style scoped>
.snow-globe-village {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
