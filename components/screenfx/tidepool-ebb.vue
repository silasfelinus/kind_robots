<template>
  <canvas ref="canvasRef" class="tidepool-ebb" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const LOOP_SECONDS = 60
const ANEMONE_COUNT = 7
const TENTACLES = 9
const SURGE_COOLDOWN_MS = 2500
const SURGE_DECAY_PER_SEC = 0.4
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let reducedMotion = false
let surge = 0
let lastSurgeTs = 0
let pointerX = -1

function fract(value: number): number {
  return value - Math.floor(value)
}

function hash(n: number): number {
  return fract(Math.sin(n * 127.1) * 43758.5453)
}

// Tide height 0 (ebb, rocks exposed) .. 1 (flood), periodic in the loop clock.
function tideAt(seconds: number): number {
  return 0.5 - 0.5 * Math.cos((seconds / LOOP_SECONDS) * TWO_PI)
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
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastSurgeTs < SURGE_COOLDOWN_MS) return
  lastSurgeTs = now
  surge = 1
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

function drawAnemone(
  x: number,
  base: number,
  size: number,
  hue: number,
  seconds: number,
  submerged: number,
  index: number,
): void {
  if (!context) return
  // Tentacles splay open when covered by water and droop when exposed.
  const open = 0.25 + 0.75 * submerged
  const near =
    pointerX >= 0 ? Math.max(0, 1 - Math.abs(pointerX - x) / (size * 4)) : 0
  const curl = near * 0.6
  context.lineCap = 'round'
  for (let t = 0; t < TENTACLES; t += 1) {
    const spread = (t / (TENTACLES - 1) - 0.5) * 2
    const sway =
      Math.sin((seconds / LOOP_SECONDS) * TWO_PI * 3 + index * 1.7 + t * 0.6) *
      0.18 *
      (0.4 + submerged)
    const angle = -Math.PI / 2 + spread * 0.9 * open + sway
    const len = size * (0.7 + 0.5 * open) * (1 - curl * 0.5)
    const mx = x + Math.cos(angle) * len * 0.55
    const my = base + Math.sin(angle) * len * 0.55
    const tx = x + Math.cos(angle + sway * 0.8) * len
    const ty = base + Math.sin(angle + sway * 0.8) * len
    context.strokeStyle = `hsl(${hue}, 75%, ${58 + t * 1.5}%)`
    context.lineWidth = Math.max(1.5, size * 0.09)
    context.beginPath()
    context.moveTo(x, base)
    context.quadraticCurveTo(mx, my, tx, ty)
    context.stroke()
  }
  context.fillStyle = `hsl(${hue}, 55%, 38%)`
  context.beginPath()
  context.ellipse(x, base, size * 0.28, size * 0.16, 0, 0, TWO_PI)
  context.fill()
}

function drawScene(seconds: number): void {
  if (!context) return
  const tide = reducedMotion ? 0.62 : tideAt(seconds)
  const surgeBoost = reducedMotion ? 0 : surge * 0.08
  const floorY = height * 0.78
  const shoreTop = height * 0.38
  // Water line travels between the top of the pool and just above the floor.
  const waterY = floorY - (floorY - shoreTop) * Math.min(1, tide + surgeBoost)

  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#1d2f4d')
  sky.addColorStop(1, '#3d5a73')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // Rock floor with fixed stones.
  context.fillStyle = '#2a2f36'
  context.fillRect(0, floorY, width, height - floorY)
  for (let i = 0; i < 14; i += 1) {
    const rx = hash(i + 4) * width
    const ry = floorY + hash(i + 40) * (height - floorY) * 0.7
    context.fillStyle = `hsl(215, 10%, ${20 + hash(i + 90) * 12}%)`
    context.beginPath()
    context.ellipse(
      rx,
      ry,
      width * (0.03 + hash(i + 7) * 0.04),
      height * 0.025,
      0,
      0,
      TWO_PI,
    )
    context.fill()
  }

  // Anemones sit on the floor; tide decides how submerged they are.
  for (let i = 0; i < ANEMONE_COUNT; i += 1) {
    const x =
      width * (0.1 + (i / (ANEMONE_COUNT - 1)) * 0.8) +
      (hash(i + 2) - 0.5) * width * 0.04
    const base = floorY + hash(i + 20) * (height - floorY) * 0.35
    const size = Math.min(width, height) * (0.08 + hash(i + 33) * 0.05)
    const hue = [340, 20, 160, 280][i % 4]
    const submerged = Math.min(
      1,
      Math.max(0, (waterY < base - size ? 1 : 0.3) * (0.4 + tide)),
    )
    drawAnemone(x, base, size, hue, seconds, submerged, i)
  }

  // Water body: translucent layer with a rippling surface.
  const water = context.createLinearGradient(
    0,
    waterY,
    0,
    floorY + (height - floorY),
  )
  water.addColorStop(0, 'rgba(110, 200, 220, 0.42)')
  water.addColorStop(1, 'rgba(20, 70, 110, 0.55)')
  context.fillStyle = water
  context.beginPath()
  context.moveTo(0, height)
  const steps = 48
  for (let s = 0; s <= steps; s += 1) {
    const px = (s / steps) * width
    const wave =
      Math.sin(
        (px / width) * TWO_PI * 3 + (seconds / LOOP_SECONDS) * TWO_PI * 6,
      ) *
      (3 + surge * 8)
    context.lineTo(px, waterY + wave)
  }
  context.lineTo(width, height)
  context.closePath()
  context.fill()

  context.strokeStyle = 'rgba(220, 245, 255, 0.55)'
  context.lineWidth = 1.5
  context.beginPath()
  for (let s = 0; s <= steps; s += 1) {
    const px = (s / steps) * width
    const wave =
      Math.sin(
        (px / width) * TWO_PI * 3 + (seconds / LOOP_SECONDS) * TWO_PI * 6,
      ) *
      (3 + surge * 8)
    if (s === 0) context.moveTo(px, waterY + wave)
    else context.lineTo(px, waterY + wave)
  }
  context.stroke()
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const seconds = timestamp / 1000
  surge = Math.max(0, surge - SURGE_DECAY_PER_SEC / 60)
  drawScene(seconds)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  surge = 0
  pointerX = -1
  if (reducedMotion) drawScene(0)
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
  context = null
})
</script>

<style scoped>
.tidepool-ebb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
