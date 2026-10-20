<template>
  <canvas ref="canvasRef" class="pinwheel-gust-field" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const LOOP_SECONDS = 60
const ROWS = 5
const PER_ROW = 9
const BLADES = 4
const PUFF_COOLDOWN_MS = 3000
const PUFF_DECAY_PER_SEC = 0.35
const TWO_PI = Math.PI * 2
const COLORS = ['#ff6f61', '#ffd166', '#06d6a0', '#4cc9f0', '#c77dff']

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let width = 1
let height = 1
let reducedMotion = false
let puff = 0
let puffX = 0
let lastPuffTs = 0
let pointerX = -1
let pointerY = -1

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
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastPuffTs < PUFF_COOLDOWN_MS) return
  lastPuffTs = now
  puff = 1
  puffX = point.x
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

// Closed form so a frame needs no state: a steady spin plus two whole extra
// turns that each wheel gains as the front passes, so the loop wraps invisibly.
function spinAngle(seed: number, u: number, seconds: number): number {
  const base = 0.5 * seconds
  const front = (seconds / LOOP_SECONDS) % 1
  const swept = Math.max(0, Math.min(1, (front * 1.6 - 0.3 - u) / 0.4 + 0.5))
  return seed + base + swept * TWO_PI * 2
}

function drawSky(): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#bfe6ff')
  sky.addColorStop(0.7, '#f4fbff')
  sky.addColorStop(1, '#b7e3a2')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#8fcf7a'
  context.fillRect(0, height * 0.72, width, height * 0.28)
}

function drawPinwheel(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
  color: string,
): void {
  if (!context) return
  context.strokeStyle = '#8a6a4a'
  context.lineWidth = Math.max(1.5, radius * 0.12)
  context.beginPath()
  context.moveTo(cx, cy)
  context.lineTo(cx, cy + radius * 2.6)
  context.stroke()
  for (let b = 0; b < BLADES; b += 1) {
    const a = angle + (b / BLADES) * TWO_PI
    const tipX = cx + Math.cos(a) * radius
    const tipY = cy + Math.sin(a) * radius
    const foldX = cx + Math.cos(a + 0.9) * radius * 0.7
    const foldY = cy + Math.sin(a + 0.9) * radius * 0.7
    context.fillStyle = b % 2 === 0 ? color : '#ffffff'
    context.beginPath()
    context.moveTo(cx, cy)
    context.lineTo(tipX, tipY)
    context.lineTo(foldX, foldY)
    context.closePath()
    context.fill()
  }
  context.fillStyle = '#444'
  context.beginPath()
  context.arc(cx, cy, Math.max(1.5, radius * 0.1), 0, TWO_PI)
  context.fill()
}

function drawField(seconds: number): void {
  for (let r = 0; r < ROWS; r += 1) {
    const depth = r / (ROWS - 1)
    const y = height * (0.55 + depth * 0.3)
    const radius = Math.max(8, width * (0.012 + depth * 0.014))
    for (let i = 0; i < PER_ROW; i += 1) {
      const stagger = r % 2 === 0 ? 0 : 0.5
      const u = (i + 0.5 + stagger) / PER_ROW
      if (u > 1) continue
      const x = u * width
      let angle = spinAngle(r * 1.7 + i * 0.9, u, seconds)
      if (pointerX >= 0) {
        const near = Math.max(
          0,
          1 - Math.hypot(x - pointerX, y - pointerY) / (width * 0.18),
        )
        angle += near * seconds * 3
      }
      if (puff > 0) {
        const near = Math.max(0, 1 - Math.abs(x - puffX) / (width * 0.4))
        angle += near * puff * 6
      }
      const color = COLORS[(r + i) % COLORS.length] ?? '#ff6f61'
      drawPinwheel(x, y, radius, angle, color)
    }
  }
}

function drawScene(seconds: number): void {
  drawSky()
  drawField(seconds)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  puff = Math.max(0, puff - PUFF_DECAY_PER_SEC * dt)
  drawScene(timestamp / 1000)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  puff = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) drawScene(20)
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
    if (reducedMotion) drawScene(20)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(20)
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
.pinwheel-gust-field {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
