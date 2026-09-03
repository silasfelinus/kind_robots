<!-- /components/screenfx/kintsugi-weather.vue -->
<template>
  <canvas ref="canvasRef" class="kintsugi-weather" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface PointerState {
  x: number
  y: number
  active: boolean
}

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface CrackSystem {
  segments: Segment[]
  path: Path2D
  length: number
  phase: 'growing' | 'paused' | 'healing' | 'fading'
  phaseElapsed: number
  growthDuration: number
  pauseDuration: number
  healDuration: number
  fadeDuration: number
  hueBase: number
}

interface Spark {
  x: number
  y: number
  branchAngles: number[]
  startedAt: number
  life: number
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
let simTime = 0

const MAX_SYSTEMS = 2
const MAX_DEPTH = 4
const MAX_SEGMENTS = 26

const systems: CrackSystem[] = []
const sparks: Spark[] = []
const pointer: PointerState = { x: 0, y: 0, active: false }
let spawnTimer = 0
let staticSeamPath: Path2D | null = null
const staticSeamHueBase = 40

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

function pickEdgeOrigin(): { x: number; y: number; angle: number } {
  const edge = Math.floor(Math.random() * 4)
  const margin = 24

  switch (edge) {
    case 0:
      // top edge, aim broadly downward into the frame
      return {
        x: randomBetween(margin, Math.max(margin + 1, width - margin)),
        y: margin,
        angle: randomBetween(Math.PI * 0.3, Math.PI * 0.7),
      }
    case 1:
      // right edge, aim broadly leftward
      return {
        x: width - margin,
        y: randomBetween(margin, Math.max(margin + 1, height - margin)),
        angle: randomBetween(Math.PI * 0.8, Math.PI * 1.2),
      }
    case 2:
      // bottom edge, aim broadly upward
      return {
        x: randomBetween(margin, Math.max(margin + 1, width - margin)),
        y: height - margin,
        angle: randomBetween(-Math.PI * 0.7, -Math.PI * 0.3),
      }
    default:
      // left edge, aim broadly rightward
      return {
        x: margin,
        y: randomBetween(margin, Math.max(margin + 1, height - margin)),
        angle: randomBetween(-Math.PI * 0.2, Math.PI * 0.2),
      }
  }
}

function buildCrackSegments(
  originX: number,
  originY: number,
  initialAngle: number,
  maxDepth: number = MAX_DEPTH,
  maxSegments: number = MAX_SEGMENTS,
): Segment[] {
  const segments: Segment[] = []

  interface StackNode {
    x: number
    y: number
    angle: number
    depth: number
  }

  const stack: StackNode[] = [
    { x: originX, y: originY, angle: initialAngle, depth: 0 },
  ]

  while (stack.length > 0 && segments.length < maxSegments) {
    const node = stack.pop()
    if (!node || node.depth > maxDepth) continue

    const segLen = randomBetween(36, 88) * (1 - node.depth * 0.12)
    const angle = node.angle + randomBetween(-0.3, 0.3)
    const endX = node.x + Math.cos(angle) * segLen
    const endY = node.y + Math.sin(angle) * segLen

    segments.push({ x1: node.x, y1: node.y, x2: endX, y2: endY })

    if (node.depth >= maxDepth || segments.length >= maxSegments) continue

    stack.push({ x: endX, y: endY, angle, depth: node.depth + 1 })

    const branchChance = Math.max(0.12, 0.7 - node.depth * 0.16)
    if (Math.random() < branchChance) {
      const branchSign = Math.random() < 0.5 ? -1 : 1
      stack.push({
        x: endX,
        y: endY,
        angle: angle + branchSign * randomBetween(0.5, 1.05),
        depth: node.depth + 1,
      })
    }
  }

  return segments
}

function segmentsToPath(segments: Segment[]): { path: Path2D; length: number } {
  const path = new Path2D()
  let length = 0

  for (const segment of segments) {
    path.moveTo(segment.x1, segment.y1)
    path.lineTo(segment.x2, segment.y2)
    length += Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1)
  }

  return { path, length: Math.max(1, length) }
}

function pointAtFraction(
  segments: Segment[],
  totalLength: number,
  fraction: number,
): { x: number; y: number } {
  const targetLength = totalLength * Math.min(1, Math.max(0, fraction))
  let consumed = 0

  for (const segment of segments) {
    const segLen = Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1)

    if (consumed + segLen >= targetLength) {
      const remaining = Math.max(0, targetLength - consumed)
      const t = segLen > 0 ? Math.min(1, remaining / segLen) : 0
      return {
        x: segment.x1 + (segment.x2 - segment.x1) * t,
        y: segment.y1 + (segment.y2 - segment.y1) * t,
      }
    }

    consumed += segLen
  }

  const last = segments[segments.length - 1]
  return last ? { x: last.x2, y: last.y2 } : { x: 0, y: 0 }
}

function spawnSystem(): CrackSystem {
  const origin = pickEdgeOrigin()
  const segments = buildCrackSegments(origin.x, origin.y, origin.angle)
  const { path, length } = segmentsToPath(segments)

  return {
    segments,
    path,
    length,
    phase: 'growing',
    phaseElapsed: 0,
    growthDuration: randomBetween(4200, 6200),
    pauseDuration: randomBetween(700, 1400),
    healDuration: randomBetween(5000, 7200),
    fadeDuration: randomBetween(1200, 1900),
    hueBase: randomBetween(34, 48),
  }
}

function computePointerBoost(system: CrackSystem): number {
  if (!pointer.active || system.phase !== 'healing') return 1

  const healFraction = Math.min(1, system.phaseElapsed / system.healDuration)
  const point = pointAtFraction(system.segments, system.length, healFraction)
  const dx = point.x - pointer.x
  const dy = point.y - pointer.y
  const radius = 170
  const falloff = Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius))

  return 1 + falloff * 2.2
}

function updateSystem(
  system: CrackSystem,
  delta: number,
  boost: number,
): boolean {
  switch (system.phase) {
    case 'growing':
      system.phaseElapsed += delta
      if (system.phaseElapsed >= system.growthDuration) {
        system.phase = 'paused'
        system.phaseElapsed = 0
      }
      return true
    case 'paused':
      system.phaseElapsed += delta
      if (system.phaseElapsed >= system.pauseDuration) {
        system.phase = 'healing'
        system.phaseElapsed = 0
      }
      return true
    case 'healing':
      system.phaseElapsed += delta * boost
      if (system.phaseElapsed >= system.healDuration) {
        system.phase = 'fading'
        system.phaseElapsed = 0
      }
      return true
    case 'fading':
      system.phaseElapsed += delta
      return system.phaseElapsed < system.fadeDuration
    default:
      return false
  }
}

function drawSystem(system: CrackSystem): void {
  if (!context) return

  const growthFraction =
    system.phase === 'growing'
      ? Math.min(1, system.phaseElapsed / system.growthDuration)
      : 1

  let healFraction = 0
  if (system.phase === 'healing') {
    healFraction = Math.min(1, system.phaseElapsed / system.healDuration)
  } else if (system.phase === 'fading') {
    healFraction = 1
  }

  let alpha = 1
  if (system.phase === 'fading') {
    alpha = Math.max(0, 1 - system.phaseElapsed / system.fadeDuration)
  }

  context.save()
  context.globalAlpha = alpha
  context.lineCap = 'round'
  context.lineJoin = 'round'

  context.setLineDash([system.length, system.length])
  context.lineDashOffset = system.length * (1 - growthFraction)
  context.strokeStyle = 'rgba(20, 16, 14, 0.6)'
  context.lineWidth = 1.6
  context.stroke(system.path)

  if (healFraction > 0) {
    const hue = normalizeHue(system.hueBase + Math.sin(simTime * 0.00004) * 6)
    context.lineDashOffset = system.length * (1 - healFraction)
    context.globalCompositeOperation = 'lighter'
    context.strokeStyle = `hsla(${hue}, 82%, 62%, 0.9)`
    context.lineWidth = 2.4
    context.shadowColor = `hsla(${hue}, 90%, 60%, 0.6)`
    context.shadowBlur = 6
    context.stroke(system.path)
    context.shadowBlur = 0
    context.globalCompositeOperation = 'source-over'
  }

  context.setLineDash([])
  context.restore()
}

function spawnSpark(x: number, y: number): void {
  if (sparks.length >= 1) sparks.shift()

  const baseAngle = randomBetween(0, Math.PI * 2)
  sparks.push({
    x,
    y,
    branchAngles: [
      baseAngle,
      baseAngle + randomBetween(0.8, 1.6),
      baseAngle - randomBetween(0.8, 1.6),
    ],
    startedAt: performance.now(),
    life: 1100,
  })
}

function drawSpark(spark: Spark, timestamp: number): boolean {
  if (!context) return false

  const age = timestamp - spark.startedAt
  if (age >= spark.life) return false

  const progress = age / spark.life
  const fade = 1 - progress
  const length = 8 + progress * 16

  context.save()
  context.globalAlpha = fade * 0.75
  context.strokeStyle = 'rgba(24, 20, 16, 0.85)'
  context.lineWidth = 1.1
  context.lineCap = 'round'
  context.beginPath()
  for (const angle of spark.branchAngles) {
    const endX = spark.x + Math.cos(angle) * length
    const endY = spark.y + Math.sin(angle) * length
    context.moveTo(spark.x, spark.y)
    context.lineTo(endX, endY)
  }
  context.stroke()
  context.restore()

  return true
}

function buildStaticSeam(): void {
  const originX = width * 0.3
  const originY = height * 0.6
  const segments = buildCrackSegments(originX, originY, -Math.PI * 0.35, 2, 6)
  const { path } = segmentsToPath(segments)
  staticSeamPath = path
}

function drawStaticSeam(t: number): void {
  if (!context || !staticSeamPath) return

  const hue = normalizeHue(staticSeamHueBase + Math.sin(t * 0.00003) * 5)

  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.globalCompositeOperation = 'lighter'
  context.strokeStyle = `hsla(${hue}, 78%, 60%, 0.85)`
  context.lineWidth = 2.2
  context.shadowColor = `hsla(${hue}, 88%, 58%, 0.5)`
  context.shadowBlur = 5
  context.stroke(staticSeamPath)
  context.shadowBlur = 0
  context.restore()
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

  spawnSpark(point.x, point.y)
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

  systems.length = 0
  sparks.length = 0
  spawnTimer = 0
  staticSeamPath = null

  if (reducedMotion) buildStaticSeam()
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(48, Math.max(4, elapsed))
  simTime += delta

  context.clearRect(0, 0, width, height)

  if (reducedMotion) {
    drawStaticSeam(simTime)
    animationFrameId = window.requestAnimationFrame(renderFrame)
    return
  }

  spawnTimer -= delta
  if (systems.length < MAX_SYSTEMS && spawnTimer <= 0) {
    systems.push(spawnSystem())
    spawnTimer = randomBetween(1800, 3600)
  }

  for (let index = systems.length - 1; index >= 0; index -= 1) {
    const system = systems[index]
    if (!system) continue

    const boost = computePointerBoost(system)
    const alive = updateSystem(system, delta, boost)
    if (!alive) {
      systems.splice(index, 1)
      continue
    }

    drawSystem(system)
  }

  for (let index = sparks.length - 1; index >= 0; index -= 1) {
    const spark = sparks[index]
    if (!spark || !drawSpark(spark, timestamp)) sparks.splice(index, 1)
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  systems.length = 0
  sparks.length = 0
  spawnTimer = 0
  staticSeamPath = null

  if (reducedMotion) buildStaticSeam()
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
  systems.length = 0
  sparks.length = 0
  staticSeamPath = null
})
</script>

<style scoped>
.kintsugi-weather {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .kintsugi-weather {
    opacity: 0.55;
  }
}
</style>
