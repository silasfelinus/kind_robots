<template>
  <canvas ref="canvasRef" class="glowworm-grotto" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const LOOP_SECONDS = 60
const WORMS = 70
const BOOST_COOLDOWN_MS = 3000
const BOOST_DECAY_PER_SEC = 0.4
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

// Each worm's glow is a pure function of time with a whole number of pulses per
// loop, so a travelling pulse wave sweeps the ceiling and repeats exactly.
function drawWorm(index: number, seconds: number): void {
  if (!context) return
  const x = width * (0.03 + 0.94 * hash(index + 11))
  const top = height * (0.06 + 0.1 * Math.sin((x / width) * 5 + 1) ** 2)
  const length = height * (0.08 + 0.22 * hash(index + 41))
  const phase = (seconds / LOOP_SECONDS) * TWO_PI * 3 - (x / width) * TWO_PI
  const pulse = 0.5 + 0.5 * Math.sin(phase + hash(index) * 0.8)
  const near =
    pointerX >= 0
      ? Math.max(
          0,
          1 -
            Math.hypot(pointerX - x, pointerY - (top + length)) /
              (width * 0.18),
        )
      : 0
  const glow = Math.min(1, 0.25 + pulse * 0.55 + near * 0.4 + boost * 0.3)
  const sway = Math.sin(seconds * 0.5 + index) * 3
  context.strokeStyle = `rgba(150, 255, 220, ${0.25 + glow * 0.2})`
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(x, top)
  context.quadraticCurveTo(
    x + sway,
    top + length * 0.5,
    x + sway * 1.5,
    top + length,
  )
  context.stroke()
  const radius = 2 + glow * 3
  const halo = context.createRadialGradient(
    x + sway * 1.5,
    top + length,
    0,
    x + sway * 1.5,
    top + length,
    radius * 5,
  )
  halo.addColorStop(0, `rgba(140, 255, 210, ${glow * 0.8})`)
  halo.addColorStop(1, 'rgba(140, 255, 210, 0)')
  context.fillStyle = halo
  context.beginPath()
  context.arc(x + sway * 1.5, top + length, radius * 5, 0, TWO_PI)
  context.fill()
}

function drawScene(seconds: number): void {
  if (!context) return
  const cave = context.createLinearGradient(0, 0, 0, height)
  cave.addColorStop(0, '#04090f')
  cave.addColorStop(1, '#0a2230')
  context.fillStyle = cave
  context.fillRect(0, 0, width, height)

  // Rock ceiling edge.
  context.fillStyle = '#02050a'
  context.beginPath()
  context.moveTo(0, 0)
  for (let i = 0; i <= 24; i += 1) {
    const x = (i / 24) * width
    context.lineTo(x, height * (0.06 + 0.1 * Math.sin((i / 24) * 5 + 1) ** 2))
  }
  context.lineTo(width, 0)
  context.closePath()
  context.fill()

  // Still water at the bottom reflecting the glow faintly.
  context.fillStyle = 'rgba(80, 200, 190, 0.05)'
  context.fillRect(0, height * 0.88, width, height * 0.12)

  for (let i = 0; i < WORMS; i += 1) drawWorm(i, seconds)
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
.glowworm-grotto {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
