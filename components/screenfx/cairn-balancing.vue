<!-- /components/screenfx/cairn-balancing.vue -->
<template>
  <canvas ref="canvasRef" class="cairn-balancing" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface LocalPoint {
  x: number
  y: number
}

interface StoneTemplate {
  points: readonly LocalPoint[]
  halfWidth: number
  halfHeight: number
  mass: number
  biasX: number
  hueOffset: number
}

interface StackStone {
  shapeIndex: number
  x: number
  y: number
  rotation: number
}

interface FallingStone {
  shapeIndex: number
  x: number
  y: number
  targetY: number
  vy: number
  rotation: number
  angularVel: number
}

interface ScatterStone {
  shapeIndex: number
  x: number
  y: number
  rotation: number
  vx: number
  vy: number
  angularVel: number
  frozen: boolean
  quietFrames: number
}

type CyclePhase =
  | 'placing'
  | 'falling'
  | 'settling'
  | 'pacing'
  | 'scattering'
  | 'settled-pause'
  | 'clearing'

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

// Fixed regardless of viewport, cycle count, or elapsed session time, per the pitch's
// performance_risk note: the stone pool, solver iteration budget, and freeze thresholds
// never scale with how many topple-and-rebuild cycles have run.
const STONE_POOL_SIZE = 7
const SOLVER_ITERATIONS = 6
const FREEZE_FRAMES_REQUIRED = 14
const FREEZE_LINEAR_VELOCITY = 0.014
const FREEZE_ANGULAR_VELOCITY = 0.0006
const GRAVITY = 0.0022
const SPAWN_DROP_UNITS = 1.5
const PLACEMENT_PACE_MS = 520
const SETTLE_SPRING_K = 0.00085
const SETTLE_DAMPING = 0.0082
const LEAN_THRESHOLD_MIN_FRACTION = 0.5
const LEAN_THRESHOLD_MAX_FRACTION = 0.72
const LEAN_CARRY = 0.5
const BREEZE_MAX_UNITS = 0.62
const BREEZE_RADIUS_FRACTION = 0.4
const CLEARING_PAUSE_MS = 820
const CLEAR_FADE_MS = 560
// Safety bound: a settle spring is tuned to converge in roughly a second, but this
// guarantees a stone is never left wobbling indefinitely regardless of parameters.
const MAX_SETTLE_MS = 2600
const GROUND_FRICTION = 0.8
const GROUND_BOUNCE = 0.2
const ANGULAR_DAMPING = 0.985

// A small fixed set of pre-defined convex-ish stone silhouettes, reused across every
// cycle rather than allocated fresh. Local coordinates are unit-scaled at draw time.
const STONE_SHAPE_POINTS: readonly (readonly LocalPoint[])[] = [
  [
    { x: -0.55, y: 0.05 },
    { x: -0.4, y: -0.35 },
    { x: 0, y: -0.5 },
    { x: 0.4, y: -0.35 },
    { x: 0.55, y: 0.05 },
    { x: 0.35, y: 0.4 },
    { x: -0.35, y: 0.4 },
  ],
  [
    { x: -0.85, y: 0.15 },
    { x: -0.6, y: -0.2 },
    { x: 0, y: -0.3 },
    { x: 0.6, y: -0.2 },
    { x: 0.85, y: 0.15 },
    { x: 0.5, y: 0.32 },
    { x: -0.5, y: 0.32 },
  ],
  [
    { x: -0.6, y: 0.3 },
    { x: -0.5, y: -0.25 },
    { x: -0.05, y: -0.45 },
    { x: 0.5, y: -0.1 },
    { x: 0.45, y: 0.3 },
    { x: -0.1, y: 0.4 },
  ],
  [
    { x: -0.35, y: 0.4 },
    { x: -0.4, y: -0.1 },
    { x: -0.15, y: -0.5 },
    { x: 0.2, y: -0.45 },
    { x: 0.4, y: -0.05 },
    { x: 0.3, y: 0.35 },
    { x: -0.05, y: 0.45 },
  ],
  [
    { x: -0.5, y: 0.35 },
    { x: -0.55, y: -0.05 },
    { x: -0.25, y: -0.45 },
    { x: 0.2, y: -0.5 },
    { x: 0.55, y: -0.15 },
    { x: 0.5, y: 0.3 },
    { x: 0.1, y: 0.48 },
    { x: -0.2, y: 0.45 },
  ],
  [
    { x: -0.7, y: 0.12 },
    { x: -0.45, y: -0.15 },
    { x: 0, y: -0.22 },
    { x: 0.5, y: -0.12 },
    { x: 0.7, y: 0.14 },
    { x: 0.3, y: 0.26 },
    { x: -0.3, y: 0.26 },
  ],
  [
    { x: -0.3, y: 0.3 },
    { x: -0.35, y: -0.05 },
    { x: -0.1, y: -0.4 },
    { x: 0.25, y: -0.35 },
    { x: 0.4, y: 0.05 },
    { x: 0.25, y: 0.35 },
    { x: -0.05, y: 0.4 },
  ],
]

function buildStoneTemplate(
  points: readonly LocalPoint[],
  index: number,
): StoneTemplate {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let area = 0
  let centroidX = 0

  for (let i = 0; i < points.length; i += 1) {
    const p0 = points[i]
    const p1 = points[(i + 1) % points.length]
    if (!p0 || !p1) continue
    minX = Math.min(minX, p0.x)
    maxX = Math.max(maxX, p0.x)
    minY = Math.min(minY, p0.y)
    maxY = Math.max(maxY, p0.y)
    const cross = p0.x * p1.y - p1.x * p0.y
    area += cross
    centroidX += (p0.x + p1.x) * cross
  }

  const signedArea = area / 2
  const safeArea = Math.abs(signedArea) || 0.01
  const centroid = signedArea !== 0 ? centroidX / (6 * signedArea) : 0

  return {
    points,
    halfWidth: (maxX - minX) / 2,
    halfHeight: (maxY - minY) / 2,
    mass: safeArea,
    biasX: centroid,
    hueOffset: (index * 41) % 37,
  }
}

const STONE_TEMPLATES: readonly StoneTemplate[] = STONE_SHAPE_POINTS.map(
  (points, index) => buildStoneTemplate(points, index),
)

let unit = 40
let groundY = 0
let clearingCenterX = 0

let stack: StackStone[] = []
let fallingStone: FallingStone | null = null
let scatterStones: ScatterStone[] = []
let stackOrder: number[] = []
let nextStoneCursor = 0
let stackComX = 0
let stackMass = 0
let stackTopY = 0
let leanThresholdUnits = LEAN_THRESHOLD_MIN_FRACTION
let phase: CyclePhase = 'placing'
let pauseElapsedMs = 0
let clearFadeElapsedMs = 0
let placementCooldownMs = 0
let clickToppleUsedThisCycle = false
let settleElapsedMs = 0

const pointer = { x: 0, y: 0, active: false }
let breezeUnits = 0

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function shuffledIndices(count: number): number[] {
  const indices = Array.from({ length: count }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = indices[i]
    const b = indices[j]
    if (a === undefined || b === undefined) continue
    indices[i] = b
    indices[j] = a
  }
  return indices
}

function templateFor(shapeIndex: number): StoneTemplate {
  return STONE_TEMPLATES[shapeIndex] ?? STONE_TEMPLATES[0]!
}

function resetCycle(): void {
  stack = []
  fallingStone = null
  scatterStones = []
  stackOrder = shuffledIndices(STONE_POOL_SIZE)
  nextStoneCursor = 0
  stackComX = clearingCenterX
  stackMass = 0
  stackTopY = groundY
  leanThresholdUnits = randomBetween(
    LEAN_THRESHOLD_MIN_FRACTION,
    LEAN_THRESHOLD_MAX_FRACTION,
  )
  phase = 'placing'
  pauseElapsedMs = 0
  clearFadeElapsedMs = 0
  placementCooldownMs = 0
  clickToppleUsedThisCycle = false
}

function spawnNextStone(): void {
  if (nextStoneCursor >= stackOrder.length) {
    beginTopple()
    return
  }

  const shapeIndex = stackOrder[nextStoneCursor] ?? 0
  nextStoneCursor += 1
  const template = templateFor(shapeIndex)

  const comOffset = stackComX - clearingCenterX
  const carriedLean = comOffset * LEAN_CARRY
  const shapeBias = template.biasX * unit * 0.6
  const jitter = randomBetween(-unit * 0.05, unit * 0.05)
  const targetX = clearingCenterX + carriedLean + shapeBias + jitter
  const targetY = stackTopY - template.halfHeight * unit

  fallingStone = {
    shapeIndex,
    x: targetX,
    y: targetY - template.halfHeight * unit * SPAWN_DROP_UNITS * 2,
    targetY,
    vy: 0,
    rotation: randomBetween(-0.32, 0.32),
    angularVel: randomBetween(-0.0016, 0.0016),
  }
  settleElapsedMs = 0
  phase = 'falling'
}

function effectiveLeanOffset(): number {
  const rawOffset = stackComX - clearingCenterX
  const breezeBias = pointer.active ? breezeUnits * unit : 0
  return rawOffset + breezeBias
}

function checkToppleOrContinue(): void {
  const offset = Math.abs(effectiveLeanOffset())
  if (offset > leanThresholdUnits * unit || stack.length >= STONE_POOL_SIZE) {
    beginTopple()
    return
  }

  placementCooldownMs = PLACEMENT_PACE_MS
  phase = 'pacing'
}

function settleFallingStone(delta: number): void {
  const stone = fallingStone
  if (!stone) return

  for (let iter = 0; iter < SOLVER_ITERATIONS; iter += 1) {
    const subDelta = delta / SOLVER_ITERATIONS
    stone.vy += GRAVITY * subDelta
    stone.y += stone.vy * subDelta

    if (stone.y >= stone.targetY) {
      stone.y = stone.targetY
      stone.vy = 0
    }

    const restoring = -stone.rotation * SETTLE_SPRING_K
    stone.angularVel += restoring * subDelta
    stone.angularVel *= 1 - SETTLE_DAMPING
    stone.rotation += stone.angularVel * subDelta
  }

  if (stone.y >= stone.targetY - 0.01 && phase === 'falling') {
    phase = 'settling'
  }

  if (phase !== 'settling') return

  settleElapsedMs += delta
  const quiet =
    (Math.abs(stone.angularVel) < FREEZE_ANGULAR_VELOCITY &&
      Math.abs(stone.rotation) < 0.02) ||
    settleElapsedMs >= MAX_SETTLE_MS

  if (quiet) {
    stack.push({
      shapeIndex: stone.shapeIndex,
      x: stone.x,
      y: stone.y,
      rotation: stone.rotation,
    })

    const template = templateFor(stone.shapeIndex)
    const newMass = stackMass + template.mass
    stackComX =
      newMass > 0
        ? (stackComX * stackMass + stone.x * template.mass) / newMass
        : stone.x
    stackMass = newMass
    stackTopY = stone.y - template.halfHeight * unit

    fallingStone = null
    checkToppleOrContinue()
  }
}

function beginTopple(): void {
  const toppleDirection = effectiveLeanOffset() >= 0 ? 1 : -1

  scatterStones = stack.map((stone, index) => {
    const heightFactor = index / Math.max(1, stack.length - 1)
    return {
      shapeIndex: stone.shapeIndex,
      x: stone.x,
      y: stone.y,
      rotation: stone.rotation,
      vx:
        toppleDirection *
        unit *
        (0.55 + heightFactor * 1.1) *
        randomBetween(0.7, 1.15),
      vy: -unit * 0.4 * randomBetween(0.4, 1),
      angularVel: toppleDirection * randomBetween(0.004, 0.011),
      frozen: false,
      quietFrames: 0,
    }
  })

  if (fallingStone) {
    scatterStones.push({
      shapeIndex: fallingStone.shapeIndex,
      x: fallingStone.x,
      y: fallingStone.y,
      rotation: fallingStone.rotation,
      vx: toppleDirection * unit * 0.6,
      vy: fallingStone.vy,
      angularVel: toppleDirection * 0.01,
      frozen: false,
      quietFrames: 0,
    })
  }

  stack = []
  fallingStone = null
  phase = 'scattering'
}

function stoneGroundY(shapeIndex: number, rotation: number): number {
  const template = templateFor(shapeIndex)
  const extent =
    template.halfHeight * unit +
    Math.abs(Math.sin(rotation)) * template.halfWidth * unit * 0.4
  return groundY - extent
}

function updateScatter(delta: number): void {
  for (let iter = 0; iter < SOLVER_ITERATIONS; iter += 1) {
    const subDelta = delta / SOLVER_ITERATIONS

    for (const stone of scatterStones) {
      if (stone.frozen) continue

      stone.vy += GRAVITY * subDelta
      stone.x += stone.vx * subDelta
      stone.y += stone.vy * subDelta
      stone.rotation += stone.angularVel * subDelta
      stone.angularVel *= ANGULAR_DAMPING
      stone.vx *= 0.999

      const floor = stoneGroundY(stone.shapeIndex, stone.rotation)
      if (stone.y > floor) {
        stone.y = floor
        stone.vy = stone.vy < 0 ? stone.vy : -stone.vy * GROUND_BOUNCE
        if (Math.abs(stone.vy) < FREEZE_LINEAR_VELOCITY * 2) stone.vy = 0
        stone.vx *= GROUND_FRICTION
        stone.angularVel *= GROUND_FRICTION
      }
    }

    for (let i = 0; i < scatterStones.length; i += 1) {
      for (let j = i + 1; j < scatterStones.length; j += 1) {
        const a = scatterStones[i]
        const b = scatterStones[j]
        if (!a || !b || (a.frozen && b.frozen)) continue

        const ta = templateFor(a.shapeIndex)
        const tb = templateFor(b.shapeIndex)
        const minDist = (ta.halfWidth + tb.halfWidth) * unit * 0.62
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy) || 0.001
        if (dist >= minDist) continue

        const push = (minDist - dist) / 2
        const nx = dx / dist
        const ny = dy / dist
        if (!a.frozen) {
          a.x -= nx * push
          a.y -= ny * push * 0.4
        }
        if (!b.frozen) {
          b.x += nx * push
          b.y += ny * push * 0.4
        }
      }
    }
  }

  for (const stone of scatterStones) {
    if (stone.frozen) continue

    const quiet =
      Math.abs(stone.vy) < FREEZE_LINEAR_VELOCITY &&
      Math.abs(stone.vx) < FREEZE_LINEAR_VELOCITY &&
      Math.abs(stone.angularVel) < FREEZE_ANGULAR_VELOCITY

    stone.quietFrames = quiet ? stone.quietFrames + 1 : 0
    if (stone.quietFrames >= FREEZE_FRAMES_REQUIRED) {
      stone.frozen = true
      stone.vx = 0
      stone.vy = 0
      stone.angularVel = 0
    }
  }

  const allFrozen = scatterStones.every((stone) => stone.frozen)
  if (allFrozen) {
    phase = 'settled-pause'
    pauseElapsedMs = 0
  }
}

function updateBreeze(delta: number): void {
  const target = (() => {
    if (reducedMotion || !pointer.active) return 0
    const stackScreenX = clearingCenterX
    const dist = Math.abs(pointer.x - stackScreenX)
    const radius = Math.max(
      60,
      Math.min(width, height) * BREEZE_RADIUS_FRACTION,
    )
    if (dist >= radius) return 0
    const strength = 1 - dist / radius
    const direction = pointer.x >= stackScreenX ? 1 : -1
    return direction * strength * BREEZE_MAX_UNITS
  })()

  breezeUnits += (target - breezeUnits) * Math.min(1, delta * 0.004)
}

function drawStonePolygon(
  ctx: CanvasRenderingContext2D,
  shapeIndex: number,
  x: number,
  y: number,
  rotation: number,
  alpha: number,
): void {
  const template = templateFor(shapeIndex)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(rotation)

  ctx.beginPath()
  template.points.forEach((point, index) => {
    const px = point.x * unit
    const py = point.y * unit
    if (index === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.closePath()

  const lightness = 52 + template.hueOffset * 0.35
  ctx.fillStyle = `hsla(${210 + template.hueOffset}, 10%, ${lightness}%, 0.95)`
  ctx.strokeStyle = `hsla(${210 + template.hueOffset}, 12%, ${Math.max(20, lightness - 24)}%, 0.8)`
  ctx.lineWidth = Math.max(1, unit * 0.03)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  radiusScale: number,
  alpha: number,
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = 'rgba(20, 20, 24, 0.32)'
  ctx.beginPath()
  ctx.ellipse(
    x,
    groundY + unit * 0.06,
    unit * 0.5 * radiusScale,
    unit * 0.14,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.restore()
}

function drawGround(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(120, 120, 128, 0.35)'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.lineTo(width, groundY)
  ctx.stroke()
  ctx.restore()
}

function fadeAlpha(): number {
  if (phase !== 'clearing') return 1
  return clamp(1 - clearFadeElapsedMs / CLEAR_FADE_MS, 0, 1)
}

function drawStack(ctx: CanvasRenderingContext2D): void {
  const alpha = fadeAlpha()
  const shadowSway = reducedMotion
    ? 0
    : Math.sin(simTime * 0.0007) * unit * 0.04

  for (const stone of stack) {
    drawShadow(ctx, stone.x + shadowSway, 0.9, alpha * 0.5)
  }
  for (const stone of stack) {
    drawStonePolygon(
      ctx,
      stone.shapeIndex,
      stone.x,
      stone.y,
      stone.rotation,
      alpha,
    )
  }

  if (fallingStone) {
    drawShadow(ctx, fallingStone.x, 0.7, alpha * 0.4)
    drawStonePolygon(
      ctx,
      fallingStone.shapeIndex,
      fallingStone.x,
      fallingStone.y,
      fallingStone.rotation,
      alpha,
    )
  }
}

function drawScatter(ctx: CanvasRenderingContext2D): void {
  const alpha = fadeAlpha()
  for (const stone of scatterStones) {
    drawShadow(ctx, stone.x, 0.8, alpha * 0.45)
  }
  for (const stone of scatterStones) {
    drawStonePolygon(
      ctx,
      stone.shapeIndex,
      stone.x,
      stone.y,
      stone.rotation,
      alpha,
    )
  }
}

const STATIC_LAYOUT: ReadonlyArray<{
  shapeIndex: number
  xFraction: number
  rotation: number
}> = [
  { shapeIndex: 1, xFraction: 0, rotation: -0.02 },
  { shapeIndex: 4, xFraction: 0.03, rotation: 0.04 },
  { shapeIndex: 0, xFraction: -0.02, rotation: -0.05 },
  { shapeIndex: 3, xFraction: 0.04, rotation: 0.06 },
  { shapeIndex: 6, xFraction: 0, rotation: -0.03 },
]

function drawStaticFrame(ctx: CanvasRenderingContext2D): void {
  drawGround(ctx)
  const shadowSway = Math.sin(simTime * 0.00012) * unit * 0.03
  let cursorTopY = groundY

  const placements = STATIC_LAYOUT.map((entry) => {
    const template = templateFor(entry.shapeIndex)
    const x = clearingCenterX + entry.xFraction * unit * 3
    const y = cursorTopY - template.halfHeight * unit
    cursorTopY = y - template.halfHeight * unit
    return { entry, x, y, template }
  })

  for (const { x } of placements) {
    drawShadow(ctx, x + shadowSway, 0.9, 0.5)
  }
  for (const { entry, x, y } of placements) {
    drawStonePolygon(ctx, entry.shapeIndex, x, y, entry.rotation, 1)
  }
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

  updateBreeze(delta)
  drawGround(context)

  if (phase === 'placing') {
    spawnNextStone()
  } else if (phase === 'falling' || phase === 'settling') {
    settleFallingStone(delta)
  } else if (phase === 'pacing') {
    placementCooldownMs -= delta
    if (placementCooldownMs <= 0) phase = 'placing'
  } else if (phase === 'scattering') {
    updateScatter(delta)
  } else if (phase === 'settled-pause') {
    pauseElapsedMs += delta
    if (pauseElapsedMs >= CLEARING_PAUSE_MS) {
      phase = 'clearing'
      clearFadeElapsedMs = 0
    }
  } else if (phase === 'clearing') {
    clearFadeElapsedMs += delta
    if (clearFadeElapsedMs >= CLEAR_FADE_MS) {
      resetCycle()
    }
  }

  if (stack.length > 0 || fallingStone) drawStack(context)
  if (scatterStones.length > 0) drawScatter(context)

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

const CLICK_TOPPLE_PHASES: ReadonlySet<CyclePhase> = new Set([
  'placing',
  'falling',
  'settling',
  'pacing',
])

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (clickToppleUsedThisCycle) return
  if (!CLICK_TOPPLE_PHASES.has(phase)) return
  if (stack.length === 0) return

  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  clickToppleUsedThisCycle = true
  beginTopple()
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

  unit = clamp(Math.min(width, height) * 0.09, 22, 58)
  groundY = height * 0.76
  clearingCenterX = width / 2

  resetCycle()
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  resetCycle()
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
  stack = []
  scatterStones = []
  fallingStone = null
})
</script>

<style scoped>
.cairn-balancing {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .cairn-balancing {
    opacity: 0.55;
  }
}
</style>
