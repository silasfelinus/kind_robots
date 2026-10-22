<template>
  <canvas ref="canvasRef" class="spirograph-gear-bloom" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const BACKGROUND_COLOR = '#0b0714'
const BASE_SPEED = 0.0006
const POINTER_SPEED_BOOST = 3.2
const POINTER_RADIUS = 160
const CLICK_COOLDOWN_MS = 1500
const FADE_ALPHA = 0.045
const SEGMENT_STEPS = 6
const PATTERN_MS = 42000
const MAX_PATTERNS_BEFORE_WRAP = 1000
// [fixed ring teeth, rolling gear teeth, pen offset ratio]. Every pair is
// coprime-ish so the curve closes after `rolling` laps of the ring.
const PATTERNS: ReadonlyArray<readonly [number, number, number]> = [
  [96, 40, 0.8],
  [105, 44, 0.7],
  [84, 29, 0.9],
  [90, 63, 0.75],
  [112, 37, 0.85],
]

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let phase = 0
let patternClockMs = 0
let patternIndex = 0
let reducedMotion = false
let lastClickTs = 0
let pointerActive = false
let pointerX = 0
let pointerY = 0
let lastPenX: number | null = null
let lastPenY: number | null = null

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

function nextPattern(): void {
  patternIndex = (patternIndex + 1) % PATTERNS.length
  patternClockMs = 0
  phase = 0
  lastPenX = null
  lastPenY = null
  paintBackground()
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastClickTs < CLICK_COOLDOWN_MS) return
  lastClickTs = now
  nextPattern()
}

function paintBackground(): void {
  if (!context) return
  context.fillStyle = BACKGROUND_COLOR
  context.fillRect(0, 0, width, height)
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
  lastPenX = null
  lastPenY = null
  paintBackground()
}

// Hypotrochoid: a gear of radius r rolling inside a ring of radius R, with the
// pen sitting `d` from the rolling gear's centre.
function penAt(
  angle: number,
  ringR: number,
  gearR: number,
  penD: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  const k = (ringR - gearR) / gearR
  return {
    x: cx + (ringR - gearR) * Math.cos(angle) + penD * Math.cos(k * angle),
    y: cy + (ringR - gearR) * Math.sin(angle) - penD * Math.sin(k * angle),
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))

  const pattern = PATTERNS[patternIndex % PATTERNS.length] ?? PATTERNS[0]!
  const [ringTeeth, gearTeeth, penRatio] = pattern
  const cx = width / 2
  const cy = height / 2
  const ringR = Math.min(width, height) * 0.42
  const gearR = ringR * (gearTeeth / ringTeeth)
  const penD = gearR * penRatio

  if (reducedMotion) {
    // Static, fully drawn composition: no travelling pen, no fading.
    paintBackground()
    context.strokeStyle = 'hsla(285, 70%, 70%, 0.7)'
    context.lineWidth = 1
    context.beginPath()
    const total = gearTeeth * 2 * Math.PI
    const steps = 1800
    for (let i = 0; i <= steps; i += 1) {
      const p = penAt((total * i) / steps, ringR, gearR, penD, cx, cy)
      if (i === 0) context.moveTo(p.x, p.y)
      else context.lineTo(p.x, p.y)
    }
    context.stroke()
    animationFrameId = window.requestAnimationFrame(renderFrame)
    return
  }

  patternClockMs += delta
  if (patternClockMs >= PATTERN_MS) nextPattern()

  // Slow fade leaves a long glowing trail instead of a hard reset.
  context.fillStyle = `rgba(11, 7, 20, ${FADE_ALPHA})`
  context.fillRect(0, 0, width, height)

  let speed = BASE_SPEED
  if (pointerActive) {
    const near = penAt(phase, ringR, gearR, penD, cx, cy)
    const dist = Math.hypot(pointerX - near.x, pointerY - near.y)
    if (dist < POINTER_RADIUS) {
      speed *=
        1 + (POINTER_SPEED_BOOST * (POINTER_RADIUS - dist)) / POINTER_RADIUS
    }
  }

  const advance = speed * delta
  const hueBase =
    (patternIndex * 57 + (patternClockMs / PATTERN_MS) * 120) % 360
  for (let step = 0; step < SEGMENT_STEPS; step += 1) {
    phase += advance / SEGMENT_STEPS
    if (phase > gearTeeth * 2 * Math.PI * MAX_PATTERNS_BEFORE_WRAP) phase = 0
    const p = penAt(phase, ringR, gearR, penD, cx, cy)
    if (lastPenX !== null && lastPenY !== null) {
      context.strokeStyle = `hsla(${(hueBase + step * 4) % 360}, 85%, 68%, 0.85)`
      context.lineWidth = 1.4
      context.beginPath()
      context.moveTo(lastPenX, lastPenY)
      context.lineTo(p.x, p.y)
      context.stroke()
    }
    lastPenX = p.x
    lastPenY = p.y
  }

  // Pen bead
  if (lastPenX !== null && lastPenY !== null) {
    context.fillStyle = 'rgba(255, 245, 255, 0.95)'
    context.beginPath()
    context.arc(lastPenX, lastPenY, 2.4, 0, Math.PI * 2)
    context.fill()
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  lastPenX = null
  lastPenY = null
  paintBackground()
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
.spirograph-gear-bloom {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
