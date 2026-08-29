<!-- /components/screenfx/strandbeest-migration.vue -->
<template>
  <canvas ref="canvasRef" class="strandbeest-migration" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Point {
  x: number
  y: number
}

// Theo Jansen's "holy numbers" -- the twelve fixed link lengths of the leg
// linkage, plus the crank radius. Values are scale-invariant; everything is
// computed in these native units once, then scaled/translated per walker at
// draw time. See PITCHES.yaml (strandbeest-migration) for the pitch and
// SPEC.md for the experience contract this build satisfies.
const LEN_OA = 15 // crank radius (the driven link)
const LEN_AB = 50
const LEN_PB = 41.5
const LEN_AC = 61.9
const LEN_PC = 39.3
const LEN_BD = 55.8
const LEN_PD = 40.1
const LEN_CE = 36.7
const LEN_DE = 39.4
const LEN_CG = 49
const LEN_EG = 65.7

// Fixed pivots: O is the crank center, P is the second frame pivot. Their
// relative offset is itself a fixed construction of two more holy-number
// links (7.8 and 38) forming a rigid bracket -- baked in directly here
// rather than re-deriving it via its own circle intersection every load.
const PIVOT_O: Point = { x: 0, y: 0 }
const PIVOT_P: Point = { x: -38, y: -7.8 }

const JANSEN_STEPS = 180

interface JansenFrame {
  a: Point
  b: Point
  c: Point
  d: Point
  e: Point
  g: Point
}

function circleIntersections(
  c1: Point,
  r1: number,
  c2: Point,
  r2: number,
): [Point, Point] | null {
  const dx = c2.x - c1.x
  const dy = c2.y - c1.y
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d === 0 || d > r1 + r2 || d < Math.abs(r1 - r2)) return null

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a))
  const xm = c1.x + (a * dx) / d
  const ym = c1.y + (a * dy) / d

  return [
    { x: xm + (h * dy) / d, y: ym - (h * dx) / d },
    { x: xm - (h * dy) / d, y: ym + (h * dx) / d },
  ]
}

function nearer(
  candidates: [Point, Point] | null,
  previous: Point | null,
): Point | null {
  if (!candidates) return null
  if (!previous) return candidates[0]
  const d0 =
    (candidates[0].x - previous.x) ** 2 + (candidates[0].y - previous.y) ** 2
  const d1 =
    (candidates[1].x - previous.x) ** 2 + (candidates[1].y - previous.y) ** 2
  return d0 <= d1 ? candidates[0] : candidates[1]
}

// Precompute one full crank revolution as a lookup table (module scope, once
// per session, not per walker or per frame) -- the pitch's own performance
// note calls for a lookup table instead of solving the eight-bar linkage
// live every frame for every leg of every walker.
function buildJansenTable(): JansenFrame[] {
  const frames: JansenFrame[] = []
  let prevB: Point | null = null
  let prevC: Point | null = null
  let prevD: Point | null = null
  let prevE: Point | null = null
  let prevG: Point | null = null

  for (let i = 0; i < JANSEN_STEPS; i += 1) {
    const theta = (i / JANSEN_STEPS) * Math.PI * 2
    const a: Point = {
      x: PIVOT_O.x + LEN_OA * Math.cos(theta),
      y: PIVOT_O.y + LEN_OA * Math.sin(theta),
    }

    const b: Point =
      nearer(circleIntersections(a, LEN_AB, PIVOT_P, LEN_PB), prevB) ?? a
    const c: Point =
      nearer(circleIntersections(a, LEN_AC, PIVOT_P, LEN_PC), prevC) ?? a
    const d: Point =
      nearer(circleIntersections(b, LEN_BD, PIVOT_P, LEN_PD), prevD) ?? b
    const e: Point =
      nearer(circleIntersections(c, LEN_CE, d, LEN_DE), prevE) ?? c
    const g: Point =
      nearer(circleIntersections(c, LEN_CG, e, LEN_EG), prevG) ?? e

    frames.push({ a, b, c, d, e, g })
    prevB = b
    prevC = c
    prevD = d
    prevE = e
    prevG = g
  }
  return frames
}

const jansenTable = buildJansenTable()

// The branch chosen above is arbitrary with respect to which way "down" is
// -- normalize so the foot (g) sits below the hip (O) on average, matching
// a leg that hangs from the body rather than rearing above it.
const footYBias =
  jansenTable.reduce((sum, frame) => sum + (frame.g.y - PIVOT_O.y), 0) /
  jansenTable.length
const FLIP_Y = footYBias < 0 ? -1 : 1
if (FLIP_Y === -1) {
  for (const frame of jansenTable) {
    for (const point of [
      frame.a,
      frame.b,
      frame.c,
      frame.d,
      frame.e,
      frame.g,
    ]) {
      point.y *= -1
    }
  }
  PIVOT_P.y *= -1
}

function jansenFrameAt(phase: number): JansenFrame {
  const wrapped = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const index =
    Math.floor((wrapped / (Math.PI * 2)) * JANSEN_STEPS) % JANSEN_STEPS
  // index is always within [0, JANSEN_STEPS) by construction; the fallback
  // only satisfies noUncheckedIndexedAccess, it is never actually reached.
  return jansenTable[index] ?? jansenTable[0]!
}

interface Walker {
  id: number
  worldX: number
  depth: number // 0 = nearest/largest, 1 = farthest/smallest
  speedMult: number
  crankPhase: number
  gust: number
  tilt: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let context: CanvasRenderingContext2D | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let reducedMotion = false
let windTime = 0
let nextWalkerId = 0

let walkers: Walker[] = []

const pointer: { x: number; y: number; active: boolean } = {
  x: 0,
  y: 0,
  active: false,
}

const MAX_WALKERS = 9
// Three leg positions per walker, each reading the same Jansen table at a
// phase offset so at least one leg is always mid-stance. localX is a
// fraction of the leg span, spreading the three legs along the belly.
const LEG_LAYOUT: ReadonlyArray<{ phaseOffset: number; localX: number }> = [
  { phaseOffset: 0, localX: -0.62 },
  { phaseOffset: (Math.PI * 2) / 3, localX: 0 },
  { phaseOffset: (Math.PI * 4) / 3, localX: 0.62 },
]
const GUST_RADIUS_FRACTION = 0.22
const WRAP_BUFFER_FRACTION = 0.16
const BASE_WALK_SPEED = 0.05 // px per delta-unit at depth 0, wind 1, no gust
const BASE_CRANK_SPEED = 0.05 // radians per delta-unit at the same reference

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function spawnWalker(atHorizon: boolean): void {
  const depth = atHorizon ? randomBetween(0.15, 0.85) : randomBetween(0, 1)
  walkers.push({
    id: nextWalkerId++,
    worldX: atHorizon ? -width * WRAP_BUFFER_FRACTION : randomBetween(0, width),
    depth,
    speedMult: randomBetween(0.85, 1.15),
    crankPhase: randomBetween(0, Math.PI * 2),
    gust: 0,
    tilt: 0,
  })
}

function resetHerd(): void {
  walkers = []
  const count = reducedMotion ? 2 : 5
  for (let i = 0; i < count; i += 1) {
    spawnWalker(false)
  }
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

  if (walkers.length === 0) resetHerd()
}

function canvasPoint(clientX: number, clientY: number): Point | null {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
  return { x, y }
}

function handlePointerMove(event: PointerEvent): void {
  if (reducedMotion) return
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
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return
  if (walkers.length >= MAX_WALKERS) return
  spawnWalker(true)
}

function walkerBaseline(depth: number): number {
  return height * (0.56 + depth * 0.16)
}

function walkerScale(depth: number): number {
  const legSpan = Math.max(48, Math.min(width, height) * 0.16)
  return (legSpan / 90) * (1.15 - depth * 0.55)
}

function drawDuneHorizon(): void {
  if (!context) return
  const bands = [
    { y: height * 0.6, amp: height * 0.02, color: 'rgba(196, 158, 104, 0.28)' },
    { y: height * 0.7, amp: height * 0.03, color: 'rgba(168, 128, 82, 0.32)' },
    { y: height * 0.82, amp: height * 0.045, color: 'rgba(140, 102, 62, 0.4)' },
  ]

  for (const band of bands) {
    context.beginPath()
    context.moveTo(0, height)
    context.lineTo(0, band.y)
    const steps = 24
    for (let i = 0; i <= steps; i += 1) {
      const x = (i / steps) * width
      const y = band.y + Math.sin(i * 0.7 + band.y * 0.01) * band.amp
      context.lineTo(x, y)
    }
    context.lineTo(width, height)
    context.closePath()
    context.fillStyle = band.color
    context.fill()
  }
}

function wrapCycle(): number {
  return width + width * WRAP_BUFFER_FRACTION * 2
}

function screenXFor(walker: Walker): number {
  const cycle = wrapCycle()
  const wrapped = ((walker.worldX % cycle) + cycle) % cycle
  return wrapped - width * WRAP_BUFFER_FRACTION
}

function drawLegStrut(from: Point, to: Point): void {
  if (!context) return
  context.moveTo(from.x, from.y)
  context.lineTo(to.x, to.y)
}

function drawWalker(walker: Walker, screenX: number): void {
  if (!context) return

  const baselineY = walkerBaseline(walker.depth)
  const scale = walkerScale(walker.depth)
  const alpha = 0.9 - walker.depth * 0.5
  const legSpread = scale * 34

  context.save()
  context.translate(screenX, baselineY)
  context.rotate(walker.tilt)

  // Legs -- three Jansen linkages sharing one crank phase, offset so at
  // least one is always mid-stance while another swings.
  context.strokeStyle = `rgba(70, 52, 34, ${alpha})`
  context.lineWidth = Math.max(1, scale * 1.1)
  context.lineCap = 'round'
  context.beginPath()

  for (const leg of LEG_LAYOUT) {
    const frame = jansenFrameAt(walker.crankPhase + leg.phaseOffset)
    const localX = leg.localX * legSpread
    const toScreen = (p: Point): Point => ({
      x: localX + p.x * scale,
      y: p.y * scale,
    })
    const o = toScreen(PIVOT_O)
    const p = toScreen(PIVOT_P)
    const a = toScreen(frame.a)
    const b = toScreen(frame.b)
    const c = toScreen(frame.c)
    const d = toScreen(frame.d)
    const e = toScreen(frame.e)
    const g = toScreen(frame.g)

    drawLegStrut(o, a)
    drawLegStrut(a, b)
    drawLegStrut(p, b)
    drawLegStrut(a, c)
    drawLegStrut(p, c)
    drawLegStrut(b, d)
    drawLegStrut(p, d)
    drawLegStrut(c, e)
    drawLegStrut(d, e)
    drawLegStrut(c, g)
    drawLegStrut(e, g)
  }
  context.stroke()

  // Body -- a simple faceted capsule riding above the hip line.
  const bodyW = scale * 30
  const bodyH = scale * 13
  context.fillStyle = `rgba(96, 70, 44, ${alpha})`
  context.beginPath()
  context.moveTo(-bodyW, PIVOT_O.y * scale - bodyH * 0.2)
  context.lineTo(-bodyW * 0.5, PIVOT_O.y * scale - bodyH)
  context.lineTo(bodyW * 0.5, PIVOT_O.y * scale - bodyH)
  context.lineTo(bodyW, PIVOT_O.y * scale - bodyH * 0.2)
  context.lineTo(bodyW * 0.6, PIVOT_O.y * scale + bodyH * 0.35)
  context.lineTo(-bodyW * 0.6, PIVOT_O.y * scale + bodyH * 0.35)
  context.closePath()
  context.fill()

  context.restore()
}

function updateWalker(walker: Walker, delta: number, windValue: number): void {
  const targetGust = (() => {
    if (reducedMotion || !pointer.active) return 0
    const screenX = screenXFor(walker)
    const baselineY = walkerBaseline(walker.depth)
    const dx = pointer.x - screenX
    const dy = pointer.y - baselineY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const radius = Math.max(60, Math.min(width, height) * GUST_RADIUS_FRACTION)
    return dist < radius ? 1 - dist / radius : 0
  })()

  walker.gust += (targetGust - walker.gust) * Math.min(1, delta * 0.05)

  const screenX = screenXFor(walker)
  const gustDirection = pointer.active ? Math.sign(pointer.x - screenX) : 0
  const targetTilt = gustDirection * walker.gust * 0.22
  walker.tilt += (targetTilt - walker.tilt) * Math.min(1, delta * 0.05)

  const depthSpeed = 0.5 + (1 - walker.depth) * 0.8
  const gustSpeed = 1 + walker.gust * 0.9
  const effectiveSpeed =
    BASE_WALK_SPEED * walker.speedMult * depthSpeed * windValue * gustSpeed

  walker.worldX += effectiveSpeed * delta
  walker.crankPhase +=
    BASE_CRANK_SPEED * walker.speedMult * windValue * gustSpeed * delta
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67)) * 16.67
  const deltaUnits = delta / 16.67

  windTime += reducedMotion ? 0 : deltaUnits
  const windValue = reducedMotion
    ? 1
    : Math.max(
        0.5,
        1 +
          Math.sin(windTime * 0.015) * 0.35 +
          Math.sin(windTime * 0.037 + 1.3) * 0.12,
      )

  context.clearRect(0, 0, width, height)
  drawDuneHorizon()

  const ordered = [...walkers].sort((a, b) => b.depth - a.depth)
  for (const walker of ordered) {
    updateWalker(walker, deltaUnits, windValue)
    drawWalker(walker, screenXFor(walker))
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  resetHerd()
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
  walkers = []
})
</script>

<style scoped>
.strandbeest-migration {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.88;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .strandbeest-migration {
    opacity: 0.6;
  }
}
</style>
