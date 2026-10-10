<template>
  <canvas ref="canvasRef" class="lava-lamp-drift" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const LOOP_SECONDS = 48
const BLOBS = 9
const WARMTH_COOLDOWN_MS = 2500
const WARMTH_DECAY_PER_SEC = 0.4
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let width = 1
let height = 1
let reducedMotion = false
let warmth = 0
let lastWarmthTs = 0
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
  if (now - lastWarmthTs < WARMTH_COOLDOWN_MS) return
  lastWarmthTs = now
  warmth = 1
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

// Each blob rides a smooth closed vertical cycle (a whole number of laps per
// loop), so the lamp repeats exactly every LOOP_SECONDS. Heat raises the wax.
function drawBlob(index: number, phase: number): void {
  if (!context) return
  const laps = 1 + (index % 2)
  const offset = hash(index + 7) * TWO_PI
  const lift = 0.5 - 0.5 * Math.cos(phase * laps + offset)
  const sway = Math.sin(phase * (1 + (index % 3)) + offset * 2)
  const x = width * (0.5 + 0.17 * sway + 0.08 * (hash(index + 40) - 0.5))
  const y = height * (0.86 - 0.72 * lift)
  const squash = 1 + 0.18 * Math.sin(phase * laps + offset + 1.2)
  const radius = Math.min(width, height) * (0.07 + 0.06 * hash(index + 90))
  const near =
    pointerX >= 0
      ? Math.max(0, 1 - Math.hypot(pointerX - x, pointerY - y) / (width * 0.25))
      : 0
  const glow = Math.min(1, 0.55 + near * 0.35 + warmth * 0.3)
  const hue = 330 - 55 * lift + warmth * 20
  const rx = radius * (1 + warmth * 0.2)
  context.save()
  context.translate(x, y)
  context.scale(1 / squash, squash)
  const grad = context.createRadialGradient(0, 0, 0, 0, 0, rx * 1.9)
  grad.addColorStop(0, `hsla(${hue}, 95%, 62%, ${glow})`)
  grad.addColorStop(0.5, `hsla(${hue + 15}, 90%, 52%, ${glow * 0.55})`)
  grad.addColorStop(1, `hsla(${hue + 30}, 90%, 45%, 0)`)
  context.fillStyle = grad
  context.beginPath()
  context.arc(0, 0, rx * 1.9, 0, TWO_PI)
  context.fill()
  context.restore()
}

function drawScene(seconds: number): void {
  if (!context) return
  const phase = (seconds / LOOP_SECONDS) * TWO_PI

  const back = context.createLinearGradient(0, 0, 0, height)
  back.addColorStop(0, '#1a0b2e')
  back.addColorStop(1, '#2b0f2a')
  context.fillStyle = back
  context.fillRect(0, 0, width, height)

  // Pool of wax glowing at the heated base.
  const base = context.createRadialGradient(
    width / 2,
    height,
    0,
    width / 2,
    height,
    height * 0.5,
  )
  base.addColorStop(0, `rgba(255, 120, 60, ${0.45 + warmth * 0.3})`)
  base.addColorStop(1, 'rgba(255, 120, 60, 0)')
  context.fillStyle = base
  context.fillRect(0, height * 0.5, width, height * 0.5)

  context.globalCompositeOperation = 'lighter'
  for (let i = 0; i < BLOBS; i += 1) drawBlob(i, phase)
  context.globalCompositeOperation = 'source-over'
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  warmth = Math.max(0, warmth - WARMTH_DECAY_PER_SEC * dt)
  drawScene(timestamp / 1000)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  warmth = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) drawScene(10)
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
    if (reducedMotion) drawScene(10)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(10)
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
.lava-lamp-drift {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
