<template>
  <canvas ref="canvasRef" class="misty-mountain-ferry" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const LOOP_SECONDS = 90
const RANGES = 5
const MIST_BANDS = 4
const HORN_COOLDOWN_MS = 4000
const HORN_DECAY_PER_SEC = 0.3
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let width = 1
let height = 1
let reducedMotion = false
let horn = 0
let lastHornTs = 0
let pointerX = -1

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
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastHornTs < HORN_COOLDOWN_MS) return
  lastHornTs = now
  horn = 1
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

// Each range is a fixed silhouette; it sways by a whole number of cycles per
// loop so the scene repeats exactly without a visible reset.
function rangeY(range: number, x: number, seconds: number): number {
  const base = height * (0.3 + (range / RANGES) * 0.32)
  const sway = (seconds / LOOP_SECONDS) * TWO_PI
  const u = x / width
  return (
    base -
    (Math.abs(Math.sin(u * (3 + range) + range * 2.3)) * 0.12 +
      Math.sin(u * 11 + range) * 0.015) *
      height +
    Math.sin(sway + range) * 2
  )
}

function drawSky(): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#e9e4d6')
  sky.addColorStop(0.6, '#d3d6cd')
  sky.addColorStop(1, '#a9bcc0')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)
}

function drawRanges(seconds: number): void {
  if (!context) return
  const steps = 56
  for (let r = 0; r < RANGES; r += 1) {
    const tone = 170 - r * 28
    context.fillStyle = `rgb(${tone - 20}, ${tone}, ${tone + 6})`
    context.beginPath()
    context.moveTo(0, height)
    for (let i = 0; i <= steps; i += 1) {
      const x = (i / steps) * width
      context.lineTo(x, rangeY(r, x, seconds))
    }
    context.lineTo(width, height)
    context.closePath()
    context.fill()
    drawMist(r, seconds)
  }
}

// Mist bands drift sideways a whole number of widths per loop and thin out
// near the pointer.
function drawMist(range: number, seconds: number): void {
  if (!context || range >= MIST_BANDS) return
  const y = rangeY(range, width * 0.5, seconds) + height * 0.04
  const drift = fract(seconds / LOOP_SECONDS + hash(range)) * width
  for (let k = -1; k <= 1; k += 1) {
    const cx = drift + k * width
    let alpha = 0.32
    if (pointerX >= 0) {
      alpha *=
        1 - 0.6 * Math.max(0, 1 - Math.abs(cx - pointerX) / (width * 0.3))
    }
    const mist = context.createRadialGradient(cx, y, 0, cx, y, width * 0.45)
    mist.addColorStop(0, `rgba(245, 245, 238, ${alpha})`)
    mist.addColorStop(1, 'rgba(245, 245, 238, 0)')
    context.save()
    context.translate(0, y)
    context.scale(1, 0.18)
    context.translate(0, -y)
    context.fillStyle = mist
    context.fillRect(
      cx - width * 0.45,
      y - width * 0.45,
      width * 0.9,
      width * 0.9,
    )
    context.restore()
  }
}

function drawWater(): void {
  if (!context) return
  const top = height * 0.8
  const water = context.createLinearGradient(0, top, 0, height)
  water.addColorStop(0, 'rgba(120, 150, 158, 0.9)')
  water.addColorStop(1, 'rgba(70, 100, 110, 1)')
  context.fillStyle = water
  context.fillRect(0, top, width, height - top)
}

// The ferry crosses once per loop; a horn blast pushes a brief ring of light
// out from the lantern.
function drawFerry(seconds: number): void {
  if (!context) return
  const t = fract(seconds / LOOP_SECONDS)
  const x = -width * 0.1 + t * width * 1.2
  const y = height * 0.82 + Math.sin(seconds * 1.4) * 1.5
  const size = Math.max(14, width * 0.025)
  context.fillStyle = '#2b2f33'
  context.beginPath()
  context.moveTo(x - size, y)
  context.lineTo(x + size, y)
  context.lineTo(x + size * 0.6, y + size * 0.4)
  context.lineTo(x - size * 0.7, y + size * 0.4)
  context.closePath()
  context.fill()
  context.fillRect(x - size * 0.1, y - size * 0.7, size * 0.1, size * 0.7)
  context.fillStyle = '#ffd88a'
  context.beginPath()
  context.arc(x + size * 0.75, y - size * 0.15, size * 0.15, 0, TWO_PI)
  context.fill()
  if (horn > 0) {
    context.strokeStyle = `rgba(255, 216, 138, ${horn * 0.6})`
    context.lineWidth = 2
    context.beginPath()
    context.arc(
      x + size * 0.75,
      y - size * 0.15,
      size * (1 + (1 - horn) * 6),
      0,
      TWO_PI,
    )
    context.stroke()
  }
}

function drawScene(seconds: number): void {
  drawSky()
  drawRanges(seconds)
  drawWater()
  drawFerry(seconds)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  horn = Math.max(0, horn - HORN_DECAY_PER_SEC * dt)
  drawScene(timestamp / 1000)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  horn = 0
  pointerX = -1
  if (reducedMotion) drawScene(30)
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
    if (reducedMotion) drawScene(30)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(30)
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
.misty-mountain-ferry {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
