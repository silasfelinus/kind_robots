<!-- /components/screenfx/zoetrope-lantern-drum.vue -->
<template>
  <canvas ref="canvasRef" class="zoetrope-lantern-drum" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface PoseFrame {
  points: readonly { x: number; y: number }[]
}

interface FigureStrip {
  name: string
  hue: number
  poses: readonly PoseFrame[]
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let reducedMotion = false
let simTime = 0

// Fixed regardless of viewport or elapsed session time, per the pitch's performance_risk note.
const SLAT_COUNT = 22
const VIEWER_ARC_RADIANS = (Math.PI * 2) / SLAT_COUNT
const MIN_ROTATION_PERIOD_MS = 9000
const MAX_ROTATION_PERIOD_MS = 2200
const DRAG_EASE = 0.0022
const ROTATIONS_PER_FIGURE = 3
const DIM_SWAP_DURATION_MS = 1000
const CLICK_SWAP_COOLDOWN_MS = DIM_SWAP_DURATION_MS + 200

// Each figure is a short ordered strip of pre-authored silhouette poses (local unit
// coordinates, scaled at draw time). Never generated procedurally per frame.
const FIGURES: readonly FigureStrip[] = [
  {
    name: 'walker',
    hue: 32,
    poses: [
      {
        points: [
          { x: -0.1, y: -0.9 },
          { x: 0.12, y: -0.9 },
          { x: 0.16, y: -0.3 },
          { x: 0.34, y: 0.05 },
          { x: 0.24, y: 0.15 },
          { x: 0.06, y: -0.1 },
          { x: -0.02, y: 0.3 },
          { x: -0.28, y: 0.55 },
          { x: -0.38, y: 0.48 },
          { x: -0.12, y: 0.1 },
          { x: -0.2, y: -0.3 },
        ],
      },
      {
        points: [
          { x: -0.1, y: -0.9 },
          { x: 0.12, y: -0.9 },
          { x: 0.2, y: -0.32 },
          { x: 0.38, y: -0.12 },
          { x: 0.3, y: -0.02 },
          { x: 0.08, y: -0.1 },
          { x: 0.02, y: 0.3 },
          { x: 0.2, y: 0.58 },
          { x: 0.1, y: 0.6 },
          { x: -0.14, y: 0.28 },
          { x: -0.24, y: -0.3 },
        ],
      },
      {
        points: [
          { x: -0.1, y: -0.9 },
          { x: 0.12, y: -0.9 },
          { x: 0.18, y: -0.3 },
          { x: 0.1, y: 0.05 },
          { x: 0.28, y: 0.4 },
          { x: 0.18, y: 0.48 },
          { x: -0.02, y: 0.12 },
          { x: -0.2, y: 0.1 },
          { x: -0.4, y: 0.3 },
          { x: -0.48, y: 0.22 },
          { x: -0.24, y: -0.28 },
        ],
      },
      {
        points: [
          { x: -0.1, y: -0.9 },
          { x: 0.12, y: -0.9 },
          { x: 0.24, y: -0.3 },
          { x: 0.14, y: 0.1 },
          { x: 0.02, y: 0.55 },
          { x: -0.1, y: 0.58 },
          { x: -0.06, y: 0.1 },
          { x: -0.18, y: -0.1 },
          { x: -0.42, y: -0.02 },
          { x: -0.4, y: -0.14 },
          { x: -0.18, y: -0.3 },
        ],
      },
      {
        points: [
          { x: -0.1, y: -0.9 },
          { x: 0.12, y: -0.9 },
          { x: 0.2, y: -0.3 },
          { x: 0.06, y: -0.05 },
          { x: 0.14, y: 0.48 },
          { x: 0.02, y: 0.55 },
          { x: -0.1, y: 0.15 },
          { x: -0.24, y: 0.35 },
          { x: -0.44, y: 0.5 },
          { x: -0.5, y: 0.4 },
          { x: -0.2, y: -0.28 },
        ],
      },
      {
        points: [
          { x: -0.1, y: -0.9 },
          { x: 0.12, y: -0.9 },
          { x: 0.16, y: -0.3 },
          { x: 0.34, y: 0.05 },
          { x: 0.24, y: 0.15 },
          { x: 0.06, y: -0.1 },
          { x: -0.02, y: 0.3 },
          { x: -0.28, y: 0.55 },
          { x: -0.38, y: 0.48 },
          { x: -0.12, y: 0.1 },
          { x: -0.2, y: -0.3 },
        ],
      },
    ],
  },
  {
    name: 'wingbeat',
    hue: 198,
    poses: [
      {
        points: [
          { x: 0, y: -0.1 },
          { x: 0.65, y: -0.55 },
          { x: 0.28, y: -0.15 },
          { x: 0.6, y: 0.1 },
          { x: 0.14, y: 0.05 },
          { x: 0, y: 0.5 },
          { x: -0.14, y: 0.05 },
          { x: -0.6, y: 0.1 },
          { x: -0.28, y: -0.15 },
          { x: -0.65, y: -0.55 },
        ],
      },
      {
        points: [
          { x: 0, y: -0.12 },
          { x: 0.5, y: -0.4 },
          { x: 0.22, y: -0.08 },
          { x: 0.48, y: 0.24 },
          { x: 0.12, y: 0.08 },
          { x: 0, y: 0.5 },
          { x: -0.12, y: 0.08 },
          { x: -0.48, y: 0.24 },
          { x: -0.22, y: -0.08 },
          { x: -0.5, y: -0.4 },
        ],
      },
      {
        points: [
          { x: 0, y: -0.14 },
          { x: 0.24, y: -0.1 },
          { x: 0.14, y: 0.02 },
          { x: 0.3, y: 0.42 },
          { x: 0.1, y: 0.1 },
          { x: 0, y: 0.5 },
          { x: -0.1, y: 0.1 },
          { x: -0.3, y: 0.42 },
          { x: -0.14, y: 0.02 },
          { x: -0.24, y: -0.1 },
        ],
      },
      {
        points: [
          { x: 0, y: -0.12 },
          { x: 0.5, y: -0.4 },
          { x: 0.22, y: -0.08 },
          { x: 0.48, y: 0.24 },
          { x: 0.12, y: 0.08 },
          { x: 0, y: 0.5 },
          { x: -0.12, y: 0.08 },
          { x: -0.48, y: 0.24 },
          { x: -0.22, y: -0.08 },
          { x: -0.5, y: -0.4 },
        ],
      },
      {
        points: [
          { x: 0, y: -0.1 },
          { x: 0.65, y: -0.55 },
          { x: 0.28, y: -0.15 },
          { x: 0.6, y: 0.1 },
          { x: 0.14, y: 0.05 },
          { x: 0, y: 0.5 },
          { x: -0.14, y: 0.05 },
          { x: -0.6, y: 0.1 },
          { x: -0.28, y: -0.15 },
          { x: -0.65, y: -0.55 },
        ],
      },
      {
        points: [
          { x: 0, y: -0.12 },
          { x: 0.5, y: -0.6 },
          { x: 0.2, y: -0.2 },
          { x: 0.55, y: -0.02 },
          { x: 0.12, y: 0 },
          { x: 0, y: 0.5 },
          { x: -0.12, y: 0 },
          { x: -0.55, y: -0.02 },
          { x: -0.2, y: -0.2 },
          { x: -0.5, y: -0.6 },
        ],
      },
      {
        points: [
          { x: 0, y: -0.1 },
          { x: 0.65, y: -0.55 },
          { x: 0.28, y: -0.15 },
          { x: 0.6, y: 0.1 },
          { x: 0.14, y: 0.05 },
          { x: 0, y: 0.5 },
          { x: -0.14, y: 0.05 },
          { x: -0.6, y: 0.1 },
          { x: -0.28, y: -0.15 },
          { x: -0.65, y: -0.55 },
        ],
      },
    ],
  },
  {
    name: 'juggler',
    hue: 280,
    poses: [
      {
        points: [
          { x: -0.08, y: -0.85 },
          { x: 0.1, y: -0.85 },
          { x: 0.18, y: -0.2 },
          { x: 0.5, y: -0.5 },
          { x: 0.4, y: -0.62 },
          { x: 0.1, y: -0.24 },
          { x: -0.1, y: -0.24 },
          { x: -0.4, y: -0.62 },
          { x: -0.5, y: -0.5 },
          { x: -0.18, y: -0.2 },
          { x: -0.14, y: 0.1 },
          { x: -0.3, y: 0.55 },
          { x: -0.18, y: 0.58 },
          { x: 0, y: 0.16 },
          { x: 0.18, y: 0.58 },
          { x: 0.3, y: 0.55 },
          { x: 0.14, y: 0.1 },
        ],
      },
      {
        points: [
          { x: -0.08, y: -0.85 },
          { x: 0.1, y: -0.85 },
          { x: 0.16, y: -0.2 },
          { x: 0.58, y: -0.28 },
          { x: 0.54, y: -0.4 },
          { x: 0.1, y: -0.26 },
          { x: -0.1, y: -0.26 },
          { x: -0.3, y: -0.42 },
          { x: -0.38, y: -0.32 },
          { x: -0.16, y: -0.18 },
          { x: -0.12, y: 0.12 },
          { x: -0.28, y: 0.56 },
          { x: -0.16, y: 0.58 },
          { x: 0, y: 0.18 },
          { x: 0.16, y: 0.58 },
          { x: 0.28, y: 0.56 },
          { x: 0.12, y: 0.12 },
        ],
      },
      {
        points: [
          { x: -0.08, y: -0.85 },
          { x: 0.1, y: -0.85 },
          { x: 0.14, y: -0.2 },
          { x: 0.3, y: -0.42 },
          { x: 0.38, y: -0.32 },
          { x: 0.16, y: -0.18 },
          { x: -0.1, y: -0.26 },
          { x: -0.54, y: -0.4 },
          { x: -0.58, y: -0.28 },
          { x: -0.16, y: -0.2 },
          { x: -0.12, y: 0.12 },
          { x: -0.28, y: 0.56 },
          { x: -0.16, y: 0.58 },
          { x: 0, y: 0.18 },
          { x: 0.16, y: 0.58 },
          { x: 0.28, y: 0.56 },
          { x: 0.12, y: 0.12 },
        ],
      },
      {
        points: [
          { x: -0.08, y: -0.85 },
          { x: 0.1, y: -0.85 },
          { x: 0.18, y: -0.2 },
          { x: 0.5, y: -0.5 },
          { x: 0.4, y: -0.62 },
          { x: 0.1, y: -0.24 },
          { x: -0.1, y: -0.24 },
          { x: -0.4, y: -0.62 },
          { x: -0.5, y: -0.5 },
          { x: -0.18, y: -0.2 },
          { x: -0.14, y: 0.1 },
          { x: -0.3, y: 0.55 },
          { x: -0.18, y: 0.58 },
          { x: 0, y: 0.16 },
          { x: 0.18, y: 0.58 },
          { x: 0.3, y: 0.55 },
          { x: 0.14, y: 0.1 },
        ],
      },
      {
        points: [
          { x: -0.08, y: -0.85 },
          { x: 0.1, y: -0.85 },
          { x: 0.16, y: -0.2 },
          { x: 0.44, y: -0.06 },
          { x: 0.4, y: 0.06 },
          { x: 0.1, y: -0.2 },
          { x: -0.1, y: -0.26 },
          { x: -0.32, y: -0.5 },
          { x: -0.4, y: -0.42 },
          { x: -0.16, y: -0.18 },
          { x: -0.12, y: 0.12 },
          { x: -0.28, y: 0.56 },
          { x: -0.16, y: 0.58 },
          { x: 0, y: 0.18 },
          { x: 0.16, y: 0.58 },
          { x: 0.28, y: 0.56 },
          { x: 0.12, y: 0.12 },
        ],
      },
      {
        points: [
          { x: -0.08, y: -0.85 },
          { x: 0.1, y: -0.85 },
          { x: 0.14, y: -0.2 },
          { x: 0.32, y: -0.5 },
          { x: 0.4, y: -0.42 },
          { x: 0.16, y: -0.18 },
          { x: -0.1, y: -0.2 },
          { x: -0.44, y: -0.06 },
          { x: -0.4, y: 0.06 },
          { x: -0.16, y: -0.2 },
          { x: -0.12, y: 0.12 },
          { x: -0.28, y: 0.56 },
          { x: -0.16, y: 0.58 },
          { x: 0, y: 0.18 },
          { x: 0.16, y: 0.58 },
          { x: 0.28, y: 0.56 },
          { x: 0.12, y: 0.12 },
        ],
      },
    ],
  },
]

let centerX = 0
let centerY = 0
let drumRadius = 40
let interiorRadius = 24
let slatWidthUnits = 1

let drumAngle = 0
let rotationPeriodMs = MIN_ROTATION_PERIOD_MS
let currentFigureIndex = 0
let dimming = false
let dimElapsedMs = 0
let clickCooldownMs = 0
let fullRotations = 0
let lastAnglePhase = 0

const pointer = { x: 0, y: 0, active: false }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2
  const wrapped = angle % twoPi
  return wrapped < 0 ? wrapped + twoPi : wrapped
}

function currentFigure(): FigureStrip {
  return FIGURES[currentFigureIndex] ?? FIGURES[0]!
}

function poseIndexForSlatAngle(slatAngle: number): number {
  const figure = currentFigure()
  const normalized = normalizeAngle(slatAngle) / (Math.PI * 2)
  const index =
    Math.floor(normalized * figure.poses.length) % figure.poses.length
  return index
}

function updateRotationSpeed(delta: number): void {
  const dragTarget = (() => {
    if (reducedMotion || !pointer.active) return MIN_ROTATION_PERIOD_MS
    const dx = pointer.x - centerX
    const dy = pointer.y - centerY
    const dist = Math.hypot(dx, dy)
    const rimDistance = Math.abs(dist - drumRadius)
    const rimBand = drumRadius * 0.28
    if (rimDistance > rimBand) return MIN_ROTATION_PERIOD_MS
    const proximity = 1 - rimDistance / rimBand
    return (
      MIN_ROTATION_PERIOD_MS -
      proximity * (MIN_ROTATION_PERIOD_MS - MAX_ROTATION_PERIOD_MS)
    )
  })()

  rotationPeriodMs +=
    (dragTarget - rotationPeriodMs) * Math.min(1, delta * DRAG_EASE)
  rotationPeriodMs = clamp(
    rotationPeriodMs,
    MAX_ROTATION_PERIOD_MS,
    MIN_ROTATION_PERIOD_MS,
  )
}

function advanceDrum(delta: number): void {
  updateRotationSpeed(delta)

  if (dimming) {
    dimElapsedMs += delta
    if (dimElapsedMs >= DIM_SWAP_DURATION_MS) {
      dimming = false
      dimElapsedMs = 0
      currentFigureIndex = (currentFigureIndex + 1) % FIGURES.length
      fullRotations = 0
    }
    if (clickCooldownMs > 0) clickCooldownMs -= delta
    return
  }

  const angularVelocity = (Math.PI * 2) / rotationPeriodMs
  const previousAngle = drumAngle
  drumAngle = normalizeAngle(drumAngle + angularVelocity * delta)

  const phase = drumAngle / (Math.PI * 2)
  if (phase < lastAnglePhase) {
    fullRotations += 1
    if (fullRotations >= ROTATIONS_PER_FIGURE) {
      dimming = true
      dimElapsedMs = 0
    }
  }
  lastAnglePhase = phase
  void previousAngle

  if (clickCooldownMs > 0) clickCooldownMs -= delta
}

function drawSilhouette(
  ctx: CanvasRenderingContext2D,
  poseIndex: number,
  hue: number,
  scale: number,
  alpha: number,
): void {
  const figure = currentFigure()
  const pose = figure.poses[poseIndex] ?? figure.poses[0]
  if (!pose) return

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = `hsla(${hue}, 70%, 18%, 1)`
  ctx.beginPath()
  pose.points.forEach((point, index) => {
    const px = point.x * scale
    const py = point.y * scale
    if (index === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawInteriorGlow(
  ctx: CanvasRenderingContext2D,
  glowAlpha: number,
): void {
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    interiorRadius,
  )
  gradient.addColorStop(0, `rgba(255, 200, 120, ${0.85 * glowAlpha})`)
  gradient.addColorStop(0.6, `rgba(230, 140, 60, ${0.5 * glowAlpha})`)
  gradient.addColorStop(1, `rgba(180, 70, 30, 0)`)
  ctx.save()
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, interiorRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawSlatRing(ctx: CanvasRenderingContext2D, glowAlpha: number): void {
  const halfArc = VIEWER_ARC_RADIANS * 0.42

  for (let i = 0; i < SLAT_COUNT; i += 1) {
    const slatAngle = normalizeAngle(drumAngle + (i * Math.PI * 2) / SLAT_COUNT)
    const viewerFacing = slatAngle > Math.PI * 0.5 && slatAngle < Math.PI * 1.5
    if (!viewerFacing) continue

    const gapStart = slatAngle - halfArc
    const gapEnd = slatAngle + halfArc

    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, drumRadius, gapStart, gapEnd)
    ctx.arc(centerX, centerY, interiorRadius * 0.85, gapEnd, gapStart, true)
    ctx.closePath()
    ctx.clip()

    const figure = currentFigure()
    const poseIndex = poseIndexForSlatAngle(slatAngle)
    const hue = figure.hue
    drawInteriorGlow(ctx, glowAlpha)
    drawSilhouette(
      ctx,
      poseIndex,
      hue,
      interiorRadius * 1.7,
      Math.min(1, glowAlpha + 0.15),
    )
    ctx.restore()
  }

  ctx.save()
  ctx.strokeStyle = 'rgba(40, 26, 14, 0.9)'
  ctx.lineWidth = Math.max(2, slatWidthUnits)
  for (let i = 0; i < SLAT_COUNT; i += 1) {
    const slatAngle = normalizeAngle(drumAngle + (i * Math.PI * 2) / SLAT_COUNT)
    const innerX = centerX + Math.cos(slatAngle) * interiorRadius * 0.8
    const innerY = centerY + Math.sin(slatAngle) * interiorRadius * 0.8
    const outerX = centerX + Math.cos(slatAngle) * drumRadius * 1.05
    const outerY = centerY + Math.sin(slatAngle) * drumRadius * 1.05
    ctx.beginPath()
    ctx.moveTo(innerX, innerY)
    ctx.lineTo(outerX, outerY)
    ctx.stroke()
  }
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = 'rgba(60, 40, 20, 0.85)'
  ctx.lineWidth = Math.max(2, slatWidthUnits * 1.4)
  ctx.beginPath()
  ctx.arc(centerX, centerY, drumRadius * 1.05, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawPedestal(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.fillStyle = 'rgba(30, 22, 16, 0.6)'
  ctx.beginPath()
  ctx.ellipse(
    centerX,
    centerY + drumRadius * 1.15,
    drumRadius * 0.7,
    drumRadius * 0.18,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.restore()
}

function glowAlphaForState(): number {
  if (reducedMotion) return 0.65
  if (!dimming) return 1
  return clamp(1 - dimElapsedMs / DIM_SWAP_DURATION_MS, 0.05, 1)
}

function drawStaticFrame(ctx: CanvasRenderingContext2D): void {
  drawPedestal(ctx)
  const breathe = 0.55 + Math.sin(simTime * 0.0009) * 0.08
  const figure = currentFigure()
  const midPose = Math.floor(figure.poses.length / 2)

  for (let i = 0; i < SLAT_COUNT; i += 1) {
    const slatAngle = (i * Math.PI * 2) / SLAT_COUNT
    const viewerFacing = slatAngle > Math.PI * 0.5 && slatAngle < Math.PI * 1.5
    if (!viewerFacing) continue

    const halfArc = VIEWER_ARC_RADIANS * 0.42
    const gapStart = slatAngle - halfArc
    const gapEnd = slatAngle + halfArc

    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, drumRadius, gapStart, gapEnd)
    ctx.arc(centerX, centerY, interiorRadius * 0.85, gapEnd, gapStart, true)
    ctx.closePath()
    ctx.clip()

    drawInteriorGlow(ctx, breathe)
    drawSilhouette(
      ctx,
      midPose,
      figure.hue,
      interiorRadius * 1.7,
      breathe + 0.1,
    )
    ctx.restore()
  }

  ctx.save()
  ctx.strokeStyle = 'rgba(40, 26, 14, 0.9)'
  ctx.lineWidth = Math.max(2, slatWidthUnits)
  for (let i = 0; i < SLAT_COUNT; i += 1) {
    const slatAngle = (i * Math.PI * 2) / SLAT_COUNT
    const innerX = centerX + Math.cos(slatAngle) * interiorRadius * 0.8
    const innerY = centerY + Math.sin(slatAngle) * interiorRadius * 0.8
    const outerX = centerX + Math.cos(slatAngle) * drumRadius * 1.05
    const outerY = centerY + Math.sin(slatAngle) * drumRadius * 1.05
    ctx.beginPath()
    ctx.moveTo(innerX, innerY)
    ctx.lineTo(outerX, outerY)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(centerX, centerY, drumRadius * 1.05, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(48, Math.max(4, elapsed))
  simTime += delta

  context.clearRect(0, 0, width, height)

  if (reducedMotion) {
    drawStaticFrame(context)
    animationFrameId = window.requestAnimationFrame(renderFrame)
    return
  }

  advanceDrum(delta)
  drawPedestal(context)
  drawSlatRing(context, glowAlphaForState())

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function canvasPoint(
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
  return { x, y }
}

function handlePointerMove(event: PointerEvent): void {
  if (reducedMotion) {
    pointer.active = false
    return
  }

  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) {
    pointer.active = false
    return
  }

  pointer.x = point.x
  pointer.y = point.y
  pointer.active = true
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (dimming) return
  if (clickCooldownMs > 0) return

  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  clickCooldownMs = CLICK_SWAP_COOLDOWN_MS
  dimming = true
  dimElapsedMs = 0
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas || !context) return

  const rect = canvas.getBoundingClientRect()
  width = Math.max(1, rect.width)
  height = Math.max(1, rect.height)

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  centerX = width / 2
  centerY = height / 2
  drumRadius = clamp(Math.min(width, height) * 0.32, 60, 220)
  interiorRadius = drumRadius * 0.58
  slatWidthUnits = Math.max(1.5, drumRadius * 0.02)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  context = canvas.getContext('2d', { alpha: true })
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionPreference)

  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas)
  resizeCanvas()

  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })

  animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
  }

  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionPreference)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)

  animationFrameId = null
  resizeObserver = null
  motionQuery = null
  context = null
})
</script>

<style scoped>
.zoetrope-lantern-drum {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .zoetrope-lantern-drum {
    opacity: 0.6;
  }
}
</style>
