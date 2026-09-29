<template>
  <canvas ref="canvasRef" class="pendulum-wave-garden" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const BOB_COUNT = 17
const BASE_OSCILLATIONS = 15
const CYCLE_MS = 40000
const AMPLITUDE_RAD = 0.34
const BACKGROUND_COLOR = '#060a12'
const NUDGE_RADIUS = 70
const NUDGE_MAX_RAD = 0.22
const NUDGE_EASE = 0.045
const CLICK_COOLDOWN_MS = 1200
const REDUCED_SWAY_PERIOD_MS = 24000
const REDUCED_SWAY_RAD = 0.015

// Bob i completes BASE_OSCILLATIONS + i swings per cycle, so its period is a
// fixed constant and its angle a closed-form function of the shared clock.
const FREQUENCIES: number[] = Array.from(
  { length: BOB_COUNT },
  (_, index) => (2 * Math.PI * (BASE_OSCILLATIONS + index)) / CYCLE_MS,
)
// Thread length follows physical length ~ 1/f^2, normalised to the longest.
const LENGTH_RATIOS: number[] = Array.from(
  { length: BOB_COUNT },
  (_, index) => (BASE_OSCILLATIONS / (BASE_OSCILLATIONS + index)) ** 2,
)

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let clockMs = 0
let reducedMotion = false
let lastClickTs = 0
let pointerActive = false
let pointerX = 0
let pointerY = 0
const nudges: number[] = new Array(BOB_COUNT).fill(0)
const bobX: number[] = new Array(BOB_COUNT).fill(0)
const bobY: number[] = new Array(BOB_COUNT).fill(0)

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
  pointerActive = Boolean(point)
  if (point) {
    pointerX = point.x
    pointerY = point.y
  }
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastClickTs < CLICK_COOLDOWN_MS) return
  lastClickTs = now
  clockMs = 0
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

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))

  context.clearRect(0, 0, width, height)
  context.fillStyle = BACKGROUND_COLOR
  context.fillRect(0, 0, width, height)

  if (!reducedMotion) clockMs = (clockMs + delta) % (CYCLE_MS * 4)

  const marginX = Math.max(24, width * 0.08)
  const spacing = (width - marginX * 2) / (BOB_COUNT - 1)
  const pivotY = height * 0.1
  const maxLength = Math.max(40, height * 0.74)
  const bobRadius = Math.max(5, Math.min(14, spacing * 0.34))

  // Support beam
  context.strokeStyle = 'rgba(180, 200, 235, 0.35)'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(marginX - 18, pivotY)
  context.lineTo(width - marginX + 18, pivotY)
  context.stroke()

  for (let index = 0; index < BOB_COUNT; index += 1) {
    const pivotX = marginX + spacing * index
    const length = maxLength * (LENGTH_RATIOS[index] ?? 1)
    let angle: number
    if (reducedMotion) {
      angle =
        REDUCED_SWAY_RAD *
        Math.sin(
          (2 * Math.PI * (timestamp % REDUCED_SWAY_PERIOD_MS)) /
            REDUCED_SWAY_PERIOD_MS,
        )
    } else {
      const previousX = bobX[index] ?? pivotX
      const previousY = bobY[index] ?? pivotY + length
      const near =
        pointerActive &&
        Math.hypot(pointerX - previousX, pointerY - previousY) < NUDGE_RADIUS
      const current = nudges[index] ?? 0
      nudges[index] = near
        ? Math.min(NUDGE_MAX_RAD, current + 0.02)
        : current * (1 - NUDGE_EASE)
      angle =
        AMPLITUDE_RAD * Math.cos((FREQUENCIES[index] ?? 0) * clockMs) +
        (nudges[index] ?? 0)
    }
    const x = pivotX + length * Math.sin(angle)
    const y = pivotY + length * Math.cos(angle)
    bobX[index] = x
    bobY[index] = y

    const hue = 190 + (index / (BOB_COUNT - 1)) * 150
    context.strokeStyle = `hsla(${hue}, 60%, 75%, 0.4)`
    context.lineWidth = 1.2
    context.beginPath()
    context.moveTo(pivotX, pivotY)
    context.lineTo(x, y)
    context.stroke()

    const glow = context.createRadialGradient(x, y, 0, x, y, bobRadius * 2.6)
    glow.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.45)`)
    glow.addColorStop(1, `hsla(${hue}, 90%, 70%, 0)`)
    context.fillStyle = glow
    context.beginPath()
    context.arc(x, y, bobRadius * 2.6, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = `hsl(${hue}, 85%, ${reducedMotion ? 58 : 66}%)`
    context.beginPath()
    context.arc(x, y, bobRadius, 0, Math.PI * 2)
    context.fill()
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  clockMs = 0
  nudges.fill(0)
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
.pendulum-wave-garden {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
