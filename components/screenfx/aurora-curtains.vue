<template>
  <canvas ref="canvasRef" class="aurora-curtains" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const LOOP_SECONDS = 60
const CURTAINS = 3
const STRANDS = 72
const STAR_COUNT = 70
const PULSE_COOLDOWN_MS = 2500
const PULSE_DECAY_PER_SEC = 0.5
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let width = 1
let height = 1
let reducedMotion = false
let pulse = 0
let pulseX = 0.5
let lastPulseTs = 0
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
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastPulseTs < PULSE_COOLDOWN_MS) return
  lastPulseTs = now
  pulse = 1
  pulseX = point.x / width
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

// Every curtain parameter is a pure function of the loop clock, so the sky
// repeats exactly each LOOP_SECONDS.
function drawCurtain(index: number, phase: number): void {
  if (!context) return
  const hue = [140, 170, 285][index % 3] ?? 150
  const baseY = height * (0.34 + index * 0.07)
  const reach = height * (0.28 + 0.06 * (2 - index))
  const stepX = width / STRANDS
  for (let s = 0; s <= STRANDS; s += 1) {
    const u = s / STRANDS
    const x = u * width
    const fold =
      Math.sin(u * TWO_PI * (1.5 + index * 0.5) + phase * (index + 1) + index) *
        0.5 +
      Math.sin(u * TWO_PI * 3.2 - phase * 2 + index * 2) * 0.25
    const top = baseY - reach * (0.55 + 0.45 * fold)
    const bottom = baseY + fold * height * 0.06
    const shimmer = 0.55 + 0.45 * Math.sin(phase * 3 + s * 0.5 + index)
    const near =
      pointerX >= 0
        ? Math.max(0, 1 - Math.abs(pointerX - x) / (width * 0.2))
        : 0
    const wave = Math.max(0, 1 - Math.abs(u - pulseX) * 3) * pulse
    const alpha = Math.min(
      0.85,
      0.12 + 0.16 * shimmer + near * 0.3 + wave * 0.4,
    )
    const grad = context.createLinearGradient(0, top, 0, bottom)
    grad.addColorStop(0, `hsla(${hue + 30}, 85%, 65%, 0)`)
    grad.addColorStop(0.7, `hsla(${hue}, 80%, 60%, ${alpha})`)
    grad.addColorStop(1, `hsla(${hue}, 90%, 75%, ${Math.min(1, alpha + 0.1)})`)
    context.fillStyle = grad
    context.fillRect(x - stepX / 2, top, stepX + 1, bottom - top)
  }
}

function drawScene(seconds: number): void {
  if (!context) return
  const phase = (seconds / LOOP_SECONDS) * TWO_PI

  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#050b1f')
  sky.addColorStop(1, '#10223a')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  for (let i = 0; i < STAR_COUNT; i += 1) {
    const twinkle = 0.55 + 0.45 * Math.sin(phase * 4 + hash(i + 300) * TWO_PI)
    context.fillStyle = `rgba(235, 240, 255, ${0.25 + 0.5 * twinkle})`
    context.fillRect(
      hash(i + 1) * width,
      hash(i + 101) * height * 0.7,
      1.4,
      1.4,
    )
  }

  context.globalCompositeOperation = 'lighter'
  for (let c = 0; c < CURTAINS; c += 1) drawCurtain(c, phase)
  context.globalCompositeOperation = 'source-over'

  // Dark ridge silhouette along the horizon.
  context.fillStyle = '#04070f'
  context.beginPath()
  context.moveTo(0, height)
  const steps = 40
  for (let s = 0; s <= steps; s += 1) {
    const u = s / steps
    const ridge =
      height * 0.88 -
      height * 0.05 * (0.5 + 0.5 * Math.sin(u * TWO_PI * 2.3 + 1)) -
      height * 0.03 * hash(s + 500)
    context.lineTo(u * width, ridge)
  }
  context.lineTo(width, height)
  context.closePath()
  context.fill()
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  pulse = Math.max(0, pulse - PULSE_DECAY_PER_SEC * dt)
  drawScene(timestamp / 1000)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  pulse = 0
  pointerX = -1
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
.aurora-curtains {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
