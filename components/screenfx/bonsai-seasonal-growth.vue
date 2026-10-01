<template>
  <canvas ref="canvasRef" class="bonsai-seasonal-growth" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const YEAR_MS = 96000
const BACKGROUND_TOP = '#14182a'
const BACKGROUND_BOTTOM = '#2a2433'
const LEAVES_PER_TIP = 9
const SWAY_RADIUS = 90
const SWAY_MAX_RAD = 0.2
const SWAY_EASE = 0.04
const CLICK_COOLDOWN_MS = 1200
const CLICK_ADVANCE_MS = 4000
const REDUCED_PHASE = 0.55
const REDUCED_BREATHE_MS = 20000
// Phase boundaries within one year (0..1): bare, budding, canopy, colour+drop.
const BUD_START = 0.12
const CANOPY_START = 0.3
const COLOUR_START = 0.62
const DROP_START = 0.72
const BARE_START = 0.92

interface Segment {
  // Quadratic curve in normalised bonsai space (x -0.5..0.5, y 0..1 upward).
  x0: number
  y0: number
  cx: number
  cy: number
  x1: number
  y1: number
  width: number
}

// Trunk plus branches; tips are the segments flagged below.
const SEGMENTS: Segment[] = [
  { x0: 0, y0: 0, cx: -0.05, cy: 0.18, x1: 0.02, y1: 0.36, width: 9 },
  { x0: 0.02, y0: 0.36, cx: 0.06, cy: 0.5, x1: -0.02, y1: 0.64, width: 6 },
  { x0: 0.02, y0: 0.36, cx: -0.12, cy: 0.38, x1: -0.3, y1: 0.46, width: 4.5 },
  { x0: -0.02, y0: 0.64, cx: 0.14, cy: 0.64, x1: 0.34, y1: 0.7, width: 4 },
  { x0: -0.02, y0: 0.64, cx: -0.12, cy: 0.74, x1: -0.26, y1: 0.76, width: 3.5 },
  { x0: -0.02, y0: 0.64, cx: -0.02, cy: 0.78, x1: 0.03, y1: 0.9, width: 3.5 },
  { x0: -0.3, y0: 0.46, cx: -0.38, cy: 0.5, x1: -0.44, y1: 0.43, width: 2.5 },
  { x0: 0.34, y0: 0.7, cx: 0.42, cy: 0.74, x1: 0.46, y1: 0.69, width: 2.5 },
]
// Segment indexes that carry a leaf cluster.
const TIP_SEGMENTS = [2, 3, 4, 5, 6, 7]

interface Leaf {
  dx: number
  dy: number
  size: number
  rotation: number
  // Fractions of the drop phase / bud phase unique to this leaf.
  dropAt: number
  budAt: number
  tint: number
}

interface Tip {
  x: number
  y: number
  // Delay as a fraction of a year; tips further from the trunk lag a little.
  lag: number
  leaves: Leaf[]
  sway: number
}

function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function buildTips(): Tip[] {
  const random = seeded(7919)
  return TIP_SEGMENTS.map((segmentIndex) => {
    const segment = SEGMENTS[segmentIndex] as Segment
    const distance = Math.hypot(segment.x1, segment.y1 - 0.3)
    const leaves: Leaf[] = Array.from({ length: LEAVES_PER_TIP }, () => ({
      dx: (random() - 0.5) * 0.17,
      dy: (random() - 0.35) * 0.1,
      size: 7 + random() * 6,
      rotation: random() * Math.PI,
      dropAt: random() * 0.8,
      budAt: random() * 0.7,
      tint: random(),
    }))
    return {
      x: segment.x1,
      y: segment.y1,
      lag: distance * 0.07 + random() * 0.015,
      leaves,
      sway: 0,
    }
  })
}

const tips: Tip[] = buildTips()

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let clockMs = YEAR_MS * 0.4
let reducedMotion = false
let lastClickTs = 0
let pointerActive = false
let pointerX = 0
let pointerY = 0

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function smooth(value: number): number {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
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
  // Every tip advances together by a small, equal increment.
  clockMs = (clockMs + CLICK_ADVANCE_MS) % YEAR_MS
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

function leafColor(tint: number, colour: number): string {
  // Green -> amber -> red as colour progresses.
  const hue = 112 - colour * (80 + tint * 70)
  const light = 38 + colour * 12 + tint * 8
  return `hsl(${hue}, ${58 + colour * 12}%, ${light}%)`
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))
  if (!reducedMotion) clockMs = (clockMs + delta) % YEAR_MS

  const background = context.createLinearGradient(0, 0, 0, height)
  background.addColorStop(0, BACKGROUND_TOP)
  background.addColorStop(1, BACKGROUND_BOTTOM)
  context.fillStyle = background
  context.fillRect(0, 0, width, height)

  const scale = Math.min(width * 0.9, height * 0.62)
  const originX = width / 2
  const baseY = height * 0.84
  const toX = (nx: number): number => originX + nx * scale
  const toY = (ny: number): number => baseY - ny * scale

  // Stone ledge and pot
  context.fillStyle = '#4a4650'
  context.fillRect(originX - scale * 0.5, baseY + scale * 0.07, scale, 10)
  context.fillStyle = '#6b4a3a'
  context.beginPath()
  context.moveTo(originX - scale * 0.16, baseY)
  context.lineTo(originX + scale * 0.16, baseY)
  context.lineTo(originX + scale * 0.12, baseY + scale * 0.07)
  context.lineTo(originX - scale * 0.12, baseY + scale * 0.07)
  context.closePath()
  context.fill()

  // Branch skeleton
  context.lineCap = 'round'
  context.strokeStyle = '#5a4030'
  for (const segment of SEGMENTS) {
    context.lineWidth = Math.max(1.5, segment.width * (scale / 520))
    context.beginPath()
    context.moveTo(toX(segment.x0), toY(segment.y0))
    context.quadraticCurveTo(
      toX(segment.cx),
      toY(segment.cy),
      toX(segment.x1),
      toY(segment.y1),
    )
    context.stroke()
  }

  const yearPhase = reducedMotion ? REDUCED_PHASE : clockMs / YEAR_MS
  const breathe = reducedMotion
    ? Math.sin(
        (2 * Math.PI * (timestamp % REDUCED_BREATHE_MS)) / REDUCED_BREATHE_MS,
      ) * 0.02
    : 0

  for (const tip of tips) {
    const tipX = toX(tip.x)
    const tipY = toY(tip.y)
    if (!reducedMotion) {
      const near =
        pointerActive &&
        Math.hypot(pointerX - tipX, pointerY - (tipY - scale * 0.04)) <
          SWAY_RADIUS
      tip.sway = near
        ? Math.min(SWAY_MAX_RAD, tip.sway + 0.015)
        : tip.sway * (1 - SWAY_EASE)
    }
    // Each tip reads the shared clock through its own lag.
    const phase = (((yearPhase - tip.lag) % 1) + 1) % 1
    const sway = tip.sway + breathe

    const bud = smooth((phase - BUD_START) / (CANOPY_START - BUD_START))
    const colour = smooth((phase - COLOUR_START) / (DROP_START - COLOUR_START))
    const dropProgress = clamp01(
      (phase - DROP_START) / (BARE_START - DROP_START),
    )

    for (const leaf of tip.leaves) {
      // Closed-form per-leaf growth and fall; no particle list is kept.
      const grow = smooth((bud - leaf.budAt * 0.6) / 0.4)
      if (grow <= 0.001) continue
      const fall = clamp01((dropProgress - leaf.dropAt) / 0.2)
      if (fall >= 1) continue
      const offsetX = leaf.dx * scale
      const offsetY = -leaf.dy * scale
      const lx =
        tipX +
        offsetX * Math.cos(sway) -
        offsetY * Math.sin(sway) +
        Math.sin(fall * 5 + leaf.rotation) * 12 * fall
      const ly =
        tipY +
        offsetY * Math.cos(sway) +
        offsetX * Math.sin(sway) +
        fall * fall * scale * 0.5
      const alpha = (1 - fall) * grow
      const radius = leaf.size * (0.25 + 0.75 * grow) * (scale / 520 + 0.3)
      context.globalAlpha = alpha
      context.fillStyle = leafColor(leaf.tint, colour)
      context.beginPath()
      context.ellipse(
        lx,
        ly,
        radius,
        radius * 0.55,
        leaf.rotation + fall * 3,
        0,
        Math.PI * 2,
      )
      context.fill()
    }
    context.globalAlpha = 1
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  for (const tip of tips) tip.sway = 0
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
.bonsai-seasonal-growth {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
