<!-- /components/screenfx/celestial-mobile.vue -->
<template>
  <canvas ref="canvasRef" class="celestial-mobile" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type LeafKind = 'moon' | 'robot' | 'key' | 'planet'

interface LeafWeight {
  kind: LeafKind
  massPhase: number
  massPhaseSpeed: number
  bonusMass: number
  bonusUntil: number
}

interface BarNode {
  angle: number // radians, tilt away from horizontal
  angularVelocity: number
  barHalfLength: number
  stringLength: number
  left: BarNode | LeafWeight
  right: BarNode | LeafWeight
}

interface Point {
  x: number
  y: number
}

interface BarLayout {
  node: BarNode
  pivot: Point
  leftEnd: Point
  rightEnd: Point
}

interface LeafLayout {
  leaf: LeafWeight
  pos: Point
}

interface StringSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface Star {
  x: number
  y: number
  r: number
  alpha: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let context: CanvasRenderingContext2D | null = null

let width = 1
let height = 1
let reducedMotion = false
let previousTimestamp = 0
let physAccumulator = 0
let currentScale = 1
let root: BarNode | null = null
let stars: Star[] = []
let lastBars: BarLayout[] = []
let lastLeaves: LeafLayout[] = []

let lastPointerX = 0
let lastPointerY = 0
let lastPointerMoveAt = 0

let moonPath: Path2D | null = null
let robotBodyPath: Path2D | null = null
let robotDetailPath: Path2D | null = null
let keyPath: Path2D | null = null
let planetBodyPath: Path2D | null = null
let planetRingPath: Path2D | null = null

const BASE_MASS = 1
const MAX_TILT = 0.62 // ~35deg -- keeps the hierarchy from ever flipping past vertical
const PHYS_STEP_MS = 32
const MAX_PHYS_STEPS = 5
const ANCHOR_Y_FRACTION = 0.14
const BAR_COLOR = '#b08d57'
const JOINT_COLOR = '#8a6a3d'

function hasWindow(): boolean {
  return typeof window !== 'undefined'
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function isLeaf(node: BarNode | LeafWeight): node is LeafWeight {
  return 'kind' in node
}

function springK(): number {
  return reducedMotion ? 1.6 : 3.2
}

function damping(): number {
  return reducedMotion ? 4.6 : 3.4
}

function maxAngularVelocity(): number {
  return reducedMotion ? 1.4 : 3.2
}

function createLeaf(kind: LeafKind): LeafWeight {
  return {
    kind,
    massPhase: randomBetween(0, Math.PI * 2),
    massPhaseSpeed:
      randomBetween(0.00028, 0.00052) * (reducedMotion ? 0.35 : 1),
    bonusMass: 0,
    bonusUntil: 0,
  }
}

function createTree(): BarNode {
  return {
    angle: 0,
    angularVelocity: 0,
    barHalfLength: 78,
    stringLength: 30,
    left: {
      angle: 0,
      angularVelocity: 0,
      barHalfLength: 46,
      stringLength: 24,
      left: createLeaf('moon'),
      right: createLeaf('robot'),
    },
    right: {
      angle: 0,
      angularVelocity: 0,
      barHalfLength: 46,
      stringLength: 24,
      left: createLeaf('key'),
      right: createLeaf('planet'),
    },
  }
}

function buildShapes(): void {
  const moon = new Path2D()
  moon.moveTo(6, -10)
  moon.bezierCurveTo(-8, -10, -8, 10, 6, 10)
  moon.bezierCurveTo(-2, 6, -2, -6, 6, -10)
  moon.closePath()
  moonPath = moon

  const body = new Path2D()
  body.rect(-9, -7, 18, 14)
  robotBodyPath = body

  const detail = new Path2D()
  detail.rect(-5.5, -2, 3, 3)
  detail.rect(2.5, -2, 3, 3)
  detail.moveTo(0, -7)
  detail.lineTo(0, -12)
  detail.moveTo(3.4, -12)
  detail.arc(0, -12, 3.4, 0, Math.PI * 2)
  robotDetailPath = detail

  const key = new Path2D()
  key.arc(-6, 0, 5, 0, Math.PI * 2)
  key.moveTo(-3, 0)
  key.arc(-6, 0, 2, 0, Math.PI * 2, true)
  key.rect(-1, -1.5, 15, 3)
  key.rect(12, -3, 2.4, 2.4)
  key.rect(12, 1, 2.4, 2.4)
  keyPath = key

  const planetBody = new Path2D()
  planetBody.arc(0, 0, 7, 0, Math.PI * 2)
  planetBodyPath = planetBody

  const ring = new Path2D()
  ring.ellipse(0, 0, 13, 4.4, -0.4, 0, Math.PI * 2)
  planetRingPath = ring
}

function totalMass(node: BarNode | LeafWeight, now: number): number {
  if (isLeaf(node)) {
    const wobble = 0.7 + 0.5 * Math.sin(node.massPhase)
    const bonus = now < node.bonusUntil ? node.bonusMass : 0
    return BASE_MASS * wobble + bonus
  }
  return totalMass(node.left, now) + totalMass(node.right, now)
}

function stepPhysics(
  node: BarNode | LeafWeight,
  now: number,
  dtMs: number,
): void {
  if (isLeaf(node)) {
    node.massPhase += node.massPhaseSpeed * dtMs
    return
  }

  stepPhysics(node.left, now, dtMs)
  stepPhysics(node.right, now, dtMs)

  const massL = totalMass(node.left, now)
  const massR = totalMass(node.right, now)
  const total = massL + massR
  const diff = total > 0 ? (massL - massR) / total : 0
  const target = clamp(diff * MAX_TILT * 1.3, -MAX_TILT, MAX_TILT)

  const dt = dtMs / 1000
  const maxVel = maxAngularVelocity()
  node.angularVelocity += (target - node.angle) * springK() * dt
  node.angularVelocity -= node.angularVelocity * damping() * dt
  node.angularVelocity = clamp(node.angularVelocity, -maxVel, maxVel)
  node.angle += node.angularVelocity * dt
}

function attach(
  child: BarNode | LeafWeight,
  endPoint: Point,
  stringLength: number,
  scale: number,
  bars: BarLayout[],
  leaves: LeafLayout[],
  strings: StringSegment[],
): void {
  const childPivot: Point = { x: endPoint.x, y: endPoint.y + stringLength }
  strings.push({
    x1: endPoint.x,
    y1: endPoint.y,
    x2: childPivot.x,
    y2: childPivot.y,
  })
  if (isLeaf(child)) {
    leaves.push({ leaf: child, pos: childPivot })
  } else {
    layoutTree(child, childPivot, scale, bars, leaves, strings)
  }
}

function layoutTree(
  node: BarNode,
  pivot: Point,
  scale: number,
  bars: BarLayout[],
  leaves: LeafLayout[],
  strings: StringSegment[],
): void {
  const half = node.barHalfLength * scale
  const dx = Math.cos(node.angle) * half
  const dy = Math.sin(node.angle) * half
  const leftEnd: Point = { x: pivot.x - dx, y: pivot.y - dy }
  const rightEnd: Point = { x: pivot.x + dx, y: pivot.y + dy }
  bars.push({ node, pivot, leftEnd, rightEnd })

  attach(
    node.left,
    leftEnd,
    node.stringLength * scale,
    scale,
    bars,
    leaves,
    strings,
  )
  attach(
    node.right,
    rightEnd,
    node.stringLength * scale,
    scale,
    bars,
    leaves,
    strings,
  )
}

function computeScale(): number {
  return clamp(Math.min(width, height) / 560, 0.55, 1.8)
}

function seedStars(): void {
  const next: Star[] = []
  const count = Math.round((width * height) / 42000)
  for (let i = 0; i < count; i += 1) {
    next.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.75,
      r: randomBetween(0.5, 1.6),
      alpha: randomBetween(0.12, 0.5),
    })
  }
  stars = next
}

function drawStars(): void {
  if (!context) return
  context.save()
  context.fillStyle = '#ffffff'
  for (const star of stars) {
    context.globalAlpha = star.alpha
    context.beginPath()
    context.arc(star.x, star.y, star.r, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  layout: LeafLayout,
  scale: number,
): void {
  if (
    !moonPath ||
    !robotBodyPath ||
    !robotDetailPath ||
    !keyPath ||
    !planetBodyPath ||
    !planetRingPath
  )
    return

  ctx.save()
  ctx.translate(layout.pos.x, layout.pos.y)
  ctx.scale(scale, scale)

  switch (layout.leaf.kind) {
    case 'moon':
      ctx.fillStyle = '#e5e7eb'
      ctx.fill(moonPath)
      break
    case 'robot':
      ctx.fillStyle = '#38bdf8'
      ctx.fill(robotBodyPath)
      ctx.fillStyle = '#0f172a'
      ctx.fill(robotDetailPath)
      break
    case 'key':
      ctx.fillStyle = '#facc15'
      ctx.fill(keyPath, 'evenodd')
      break
    case 'planet':
      ctx.fillStyle = '#8b5cf6'
      ctx.fill(planetBodyPath)
      ctx.strokeStyle = '#c4b5fd'
      ctx.lineWidth = 1.4
      ctx.stroke(planetRingPath)
      break
  }

  ctx.restore()
}

function render(): void {
  if (!context || !canvasRef.value || !root) return

  context.clearRect(0, 0, width, height)
  drawStars()

  const bars: BarLayout[] = []
  const leaves: LeafLayout[] = []
  const strings: StringSegment[] = []
  const rootPivot: Point = { x: width * 0.5, y: height * ANCHOR_Y_FRACTION }
  layoutTree(root, rootPivot, currentScale, bars, leaves, strings)

  context.lineCap = 'round'

  // ceiling string
  context.strokeStyle = BAR_COLOR
  context.lineWidth = Math.max(1, 1.2 * currentScale)
  context.beginPath()
  context.moveTo(rootPivot.x, 0)
  context.lineTo(rootPivot.x, rootPivot.y)
  context.stroke()

  context.globalAlpha = 0.85
  for (const segment of strings) {
    context.beginPath()
    context.moveTo(segment.x1, segment.y1)
    context.lineTo(segment.x2, segment.y2)
    context.stroke()
  }
  context.globalAlpha = 1

  context.strokeStyle = BAR_COLOR
  context.lineWidth = Math.max(1.4, 2.4 * currentScale)
  for (const bar of bars) {
    context.beginPath()
    context.moveTo(bar.leftEnd.x, bar.leftEnd.y)
    context.lineTo(bar.rightEnd.x, bar.rightEnd.y)
    context.stroke()

    context.fillStyle = JOINT_COLOR
    context.beginPath()
    context.arc(
      bar.pivot.x,
      bar.pivot.y,
      Math.max(1.6, 2.6 * currentScale),
      0,
      Math.PI * 2,
    )
    context.fill()
  }

  for (const leaf of leaves) {
    drawLeaf(context, leaf, currentScale)
  }

  lastBars = bars
  lastLeaves = leaves
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

  currentScale = computeScale()
  seedStars()
}

function renderFrame(timestamp: number): void {
  if (!context || !root) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  physAccumulator += elapsed

  const now = performance.now()
  let steps = 0
  while (physAccumulator >= PHYS_STEP_MS && steps < MAX_PHYS_STEPS) {
    stepPhysics(root, now, PHYS_STEP_MS)
    physAccumulator -= PHYS_STEP_MS
    steps += 1
  }
  if (steps === MAX_PHYS_STEPS) physAccumulator = 0

  render()

  animationFrameId = window.requestAnimationFrame(renderFrame)
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
  if (!point) return

  const now = performance.now()
  const dtMs = lastPointerMoveAt ? Math.max(1, now - lastPointerMoveAt) : 16
  const vx = (point.x - lastPointerX) / dtMs
  const vy = (point.y - lastPointerY) / dtMs
  lastPointerX = point.x
  lastPointerY = point.y
  lastPointerMoveAt = now

  let nearest: BarLayout | null = null
  let nearestDist = Infinity
  for (const bar of lastBars) {
    const dist = Math.hypot(point.x - bar.pivot.x, point.y - bar.pivot.y)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = bar
    }
  }

  const threshold = 130 * currentScale
  if (nearest && nearestDist < threshold) {
    const falloff = 1 - nearestDist / threshold
    const speed = Math.hypot(vx, vy)
    const direction = vx === 0 ? 0 : vx / Math.max(speed, 0.0001)
    const impulse = clamp(direction * speed * 0.018 * falloff, -0.8, 0.8)
    const maxVel = maxAngularVelocity()
    nearest.node.angularVelocity = clamp(
      nearest.node.angularVelocity + impulse,
      -maxVel,
      maxVel,
    )
  }
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point || lastLeaves.length === 0) return

  let nearest: LeafLayout | null = null
  let nearestDist = Infinity
  for (const leaf of lastLeaves) {
    const dist = Math.hypot(point.x - leaf.pos.x, point.y - leaf.pos.y)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = leaf
    }
  }
  if (!nearest) return

  const now = performance.now()
  nearest.leaf.bonusMass = 1.6
  nearest.leaf.bonusUntil = now + randomBetween(4200, 6800)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  resizeCanvas()
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  context = canvas.getContext('2d', { alpha: true })
  if (!context) return

  if (hasWindow()) {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion = motionQuery.matches
    motionQuery.addEventListener('change', handleMotionPreference)
  }

  buildShapes()
  root = createTree()

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
  root = null
  stars = []
  lastBars = []
  lastLeaves = []
  moonPath = null
  robotBodyPath = null
  robotDetailPath = null
  keyPath = null
  planetBodyPath = null
  planetRingPath = null
})
</script>

<style scoped>
.celestial-mobile {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .celestial-mobile {
    opacity: 0.8;
  }
}
</style>
