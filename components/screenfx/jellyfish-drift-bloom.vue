<template>
  <canvas ref="canvasRef" class="jellyfish-drift-bloom" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const JELLY_COUNT = 9
const MOTE_COUNT = 70
const TENTACLES = 7
const BACKGROUND_TOP = '#02101e'
const BACKGROUND_BOTTOM = '#010509'
const PULSE_PERIOD_MIN_MS = 3200
const PULSE_PERIOD_MAX_MS = 5200
const GLOW_RADIUS = 150
const CLICK_COOLDOWN_MS = 900
const BURST_DECAY = 0.0016
const REDUCED_FRAME_MS = 40000

interface Jelly {
  x: number
  y: number
  size: number
  hue: number
  phase: number
  periodMs: number
  driftSeed: number
  glow: number
  burst: number
}

interface Mote {
  x: number
  y: number
  speed: number
  size: number
  seed: number
}

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
let jellies: Jelly[] = []
let motes: Mote[] = []

function seededUnit(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

function buildScene(): void {
  jellies = Array.from({ length: JELLY_COUNT }, (_, index) => {
    const depth = seededUnit(index + 1)
    return {
      x: seededUnit(index * 3 + 5) * width,
      y: height * (0.15 + seededUnit(index * 7 + 2) * 0.75),
      size: Math.max(16, Math.min(width, height) * (0.035 + depth * 0.06)),
      hue: 165 + seededUnit(index * 11 + 9) * 150,
      phase: seededUnit(index * 13 + 4) * Math.PI * 2,
      periodMs:
        PULSE_PERIOD_MIN_MS +
        seededUnit(index * 17 + 1) *
          (PULSE_PERIOD_MAX_MS - PULSE_PERIOD_MIN_MS),
      driftSeed: seededUnit(index * 19 + 3) * 1000,
      glow: 0,
      burst: 0,
    }
  })
  motes = Array.from({ length: MOTE_COUNT }, (_, index) => ({
    x: seededUnit(index * 5 + 1) * width,
    y: seededUnit(index * 9 + 7) * height,
    speed: 0.004 + seededUnit(index * 3 + 2) * 0.012,
    size: 0.6 + seededUnit(index * 23 + 5) * 1.4,
    seed: seededUnit(index * 29 + 6) * 100,
  }))
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
  for (const jelly of jellies) jelly.burst = 1
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
  buildScene()
}

// Pulse is a smooth 0..1 contraction: sharp squeeze, slow relax.
function pulseAt(jelly: Jelly, timeMs: number, burst: number): number {
  const speed = 1 + burst * 1.2
  const cycle =
    ((timeMs * speed) / jelly.periodMs + jelly.phase / (Math.PI * 2)) % 1
  return cycle < 0.3
    ? Math.sin((cycle / 0.3) * Math.PI * 0.5)
    : Math.cos(((cycle - 0.3) / 0.7) * Math.PI * 0.5)
}

function drawJelly(jelly: Jelly, timeMs: number): void {
  if (!context) return
  const squeeze = pulseAt(jelly, timeMs, jelly.burst)
  const bell = jelly.size * (1 - squeeze * 0.22)
  const bellHeight = jelly.size * (0.8 + squeeze * 0.2)
  const intensity = 0.55 + jelly.glow * 0.45 + jelly.burst * 0.3
  const hue = jelly.hue

  const halo = context.createRadialGradient(
    jelly.x,
    jelly.y,
    0,
    jelly.x,
    jelly.y,
    bell * 2.6,
  )
  halo.addColorStop(0, `hsla(${hue}, 90%, 65%, ${0.22 * intensity})`)
  halo.addColorStop(1, `hsla(${hue}, 90%, 65%, 0)`)
  context.fillStyle = halo
  context.beginPath()
  context.arc(jelly.x, jelly.y, bell * 2.6, 0, Math.PI * 2)
  context.fill()

  // Tentacles trail below, lagging the pulse.
  context.lineWidth = Math.max(1, jelly.size * 0.05)
  context.lineCap = 'round'
  context.strokeStyle = `hsla(${hue}, 80%, 75%, ${0.35 * intensity})`
  for (let index = 0; index < TENTACLES; index += 1) {
    const offset = ((index + 0.5) / TENTACLES - 0.5) * 2
    const startX = jelly.x + offset * bell * 0.85
    const length =
      jelly.size * (1.6 + seededUnit(jelly.driftSeed + index) * 1.4)
    context.beginPath()
    context.moveTo(startX, jelly.y + bellHeight * 0.1)
    const steps = 8
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps
      const wave =
        Math.sin(timeMs / 700 - t * 4 + index * 1.3 + jelly.phase) *
        jelly.size *
        0.22 *
        t
      const stretch = 1 + squeeze * 0.12 * (1 - t)
      context.lineTo(
        startX + wave,
        jelly.y + bellHeight * 0.1 + length * t * stretch,
      )
    }
    context.stroke()
  }

  // Bell: a dome with a soft rim.
  const fill = context.createRadialGradient(
    jelly.x,
    jelly.y - bellHeight * 0.3,
    0,
    jelly.x,
    jelly.y,
    bell * 1.1,
  )
  fill.addColorStop(0, `hsla(${hue}, 85%, 82%, ${0.55 * intensity})`)
  fill.addColorStop(1, `hsla(${hue + 20}, 85%, 55%, ${0.18 * intensity})`)
  context.fillStyle = fill
  context.beginPath()
  context.ellipse(jelly.x, jelly.y, bell, bellHeight, 0, Math.PI, 0)
  context.quadraticCurveTo(
    jelly.x,
    jelly.y + bellHeight * 0.28,
    jelly.x - bell,
    jelly.y,
  )
  context.closePath()
  context.fill()
  context.strokeStyle = `hsla(${hue}, 90%, 85%, ${0.6 * intensity})`
  context.lineWidth = 1.2
  context.stroke()
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))

  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, BACKGROUND_TOP)
  sky.addColorStop(1, BACKGROUND_BOTTOM)
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  if (!reducedMotion) clockMs += delta
  const timeMs = reducedMotion ? REDUCED_FRAME_MS : clockMs

  context.fillStyle = 'rgba(170, 220, 255, 0.45)'
  for (const mote of motes) {
    if (!reducedMotion) {
      mote.y -= mote.speed * delta
      if (mote.y < -4) mote.y = height + 4
    }
    const x = mote.x + Math.sin(timeMs / 3000 + mote.seed) * 8
    context.globalAlpha =
      0.25 + 0.3 * Math.abs(Math.sin(timeMs / 2000 + mote.seed))
    context.beginPath()
    context.arc(x, mote.y, mote.size, 0, Math.PI * 2)
    context.fill()
  }
  context.globalAlpha = 1

  for (const jelly of jellies) {
    if (!reducedMotion) {
      const squeeze = pulseAt(jelly, timeMs, jelly.burst)
      // Each squeeze thrusts the jelly upward; between pulses it sinks.
      jelly.y += (0.012 - squeeze * 0.03 * (1 + jelly.burst)) * delta
      jelly.x += Math.sin(timeMs / 4000 + jelly.driftSeed) * 0.012 * delta
      if (jelly.y < -jelly.size * 4) jelly.y = height + jelly.size * 3
      if (jelly.y > height + jelly.size * 4) jelly.y = -jelly.size * 2
      if (jelly.x < -jelly.size * 2) jelly.x = width + jelly.size
      if (jelly.x > width + jelly.size * 2) jelly.x = -jelly.size
      const near =
        pointerActive &&
        Math.hypot(pointerX - jelly.x, pointerY - jelly.y) < GLOW_RADIUS
      jelly.glow = near ? Math.min(1, jelly.glow + 0.04) : jelly.glow * 0.97
      jelly.burst = Math.max(0, jelly.burst - BURST_DECAY * delta)
    }
    drawJelly(jelly, timeMs)
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  clockMs = 0
  buildScene()
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
.jellyfish-drift-bloom {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
