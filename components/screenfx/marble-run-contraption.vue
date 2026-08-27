<!-- /components/screenfx/marble-run-contraption.vue -->
<template>
  <canvas ref="canvasRef" class="marble-run-contraption" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Point {
  x: number
  y: number
}

type ContactType = 'seesaw' | 'pinwheel' | 'bell'

interface TrackSegment {
  from: Point
  control: Point
  to: Point
  durationMs: number
  contacts: Array<{ t: number; type: ContactType }>
}

type SegmentKey = 'S1' | 'S2a' | 'S2b' | 'S3' | 'S4' | 'R1'

interface Marble {
  id: number
  hue: number
  state: 'track' | 'elevator'
  segmentKey: SegmentKey | null
  t: number
  elapsedInSegment: number
  bucketId: number | null
}

interface Bucket {
  id: number
  phase: number
  marbleId: number | null
}

interface PointerState {
  x: number
  y: number
  active: boolean
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

let segments: Partial<Record<SegmentKey, TrackSegment>> = {}
let marbles: Marble[] = []
let buckets: Bucket[] = []
let hopperQueue: number[] = []
let elevatorQueue: number[] = []
let nextMarbleId = 0
let nextBucketId = 0
let hopperCooldown = 0
let spawnBoostUntil = 0

let seesawTilt = 0
let seesawTarget = 0
let seesawHoldRemaining = 0
let pinwheelAngle = 0
let pinwheelBoost = 0
let bellSwing = 0
let leverAngle = 0

let hopperPos: Point = { x: 0, y: 0 }
let seesawPivot: Point = { x: 0, y: 0 }
let leverPivot: Point = { x: 0, y: 0 }
let pinwheelPos: Point = { x: 0, y: 0 }
let bellPos: Point = { x: 0, y: 0 }
let collectorPos: Point = { x: 0, y: 0 }
let elevatorX = 0
let elevatorTopY = 0
let elevatorBottomY = 0
let leverRadius = 40

const pointer: PointerState = { x: 0, y: 0, active: false }

const MARBLE_COUNT = 5
const BUCKET_COUNT = 4
const ELEVATOR_DURATION_MS = 7000
const SPAWN_INTERVAL_MS = 1800
const SPAWN_BOOST_INTERVAL_MS = 400
const SPAWN_BOOST_DURATION_MS = 2600
const PICKUP_WINDOW = 0.045
const MARBLE_RADIUS = 6.5

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function distance(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function bezierPoint(segment: TrackSegment, t: number): Point {
  const mt = 1 - t
  return {
    x:
      mt * mt * segment.from.x +
      2 * mt * t * segment.control.x +
      t * t * segment.to.x,
    y:
      mt * mt * segment.from.y +
      2 * mt * t * segment.control.y +
      t * t * segment.to.y,
  }
}

function isLeverActive(): boolean {
  if (reducedMotion || !pointer.active) return false
  return distance(pointer, leverPivot) < leverRadius
}

function buildSegments(): void {
  hopperPos = { x: width * 0.14, y: height * 0.1 }
  seesawPivot = { x: width * 0.32, y: height * 0.4 }
  leverPivot = { x: width * 0.26, y: height * 0.33 }
  pinwheelPos = { x: width * 0.6, y: height * 0.46 }
  bellPos = { x: width * 0.8, y: height * 0.64 }
  collectorPos = { x: width * 0.88, y: height * 0.86 }
  elevatorX = width * 0.92
  elevatorTopY = height * 0.12
  elevatorBottomY = height * 0.86
  leverRadius = Math.min(width, height) * 0.11

  const seesawExit: Point = {
    x: seesawPivot.x + width * 0.04,
    y: seesawPivot.y + height * 0.02,
  }
  const pinwheelEntry: Point = {
    x: pinwheelPos.x - width * 0.05,
    y: pinwheelPos.y + height * 0.05,
  }
  const bellEntry: Point = {
    x: bellPos.x - width * 0.05,
    y: bellPos.y - height * 0.04,
  }

  segments = {
    S1: {
      from: hopperPos,
      control: { x: width * 0.2, y: height * 0.24 },
      to: { x: seesawPivot.x - width * 0.01, y: seesawPivot.y - height * 0.02 },
      durationMs: 1700,
      contacts: [],
    },
    S2a: {
      from: seesawExit,
      control: { x: width * 0.46, y: height * 0.4 },
      to: pinwheelEntry,
      durationMs: 2000,
      contacts: [],
    },
    S2b: {
      from: seesawExit,
      control: { x: width * 0.4, y: height * 0.62 },
      to: pinwheelEntry,
      durationMs: 2300,
      contacts: [],
    },
    S3: {
      from: pinwheelEntry,
      control: { x: width * 0.66, y: pinwheelPos.y - height * 0.07 },
      to: bellEntry,
      durationMs: 1800,
      contacts: [{ t: 0.52, type: 'pinwheel' }],
    },
    S4: {
      from: bellEntry,
      control: { x: width * 0.82, y: height * 0.58 },
      to: collectorPos,
      durationMs: 1500,
      contacts: [{ t: 0.32, type: 'bell' }],
    },
    R1: {
      from: hopperPos,
      control: { x: width * 0.5, y: height * 0.2 },
      to: collectorPos,
      durationMs: 2400,
      contacts: [],
    },
  }
}

function resetMachine(): void {
  marbles = []
  buckets = []
  hopperQueue = []
  elevatorQueue = []
  nextMarbleId = 0
  nextBucketId = 0
  seesawTilt = 0
  seesawTarget = 0
  seesawHoldRemaining = 0
  pinwheelAngle = 0
  pinwheelBoost = 0
  bellSwing = 0
  leverAngle = 0
  hopperCooldown = reducedMotion ? SPAWN_INTERVAL_MS * 2 : SPAWN_INTERVAL_MS
  spawnBoostUntil = 0

  const bucketCount = reducedMotion ? 1 : BUCKET_COUNT
  for (let i = 0; i < bucketCount; i += 1) {
    buckets.push({
      id: nextBucketId++,
      phase: bucketCount > 1 ? i / bucketCount : 0,
      marbleId: null,
    })
  }

  const marbleCount = reducedMotion ? 1 : MARBLE_COUNT
  for (let i = 0; i < marbleCount; i += 1) {
    const marble: Marble = {
      id: nextMarbleId++,
      hue: randomBetween(190, 280),
      state: 'track',
      segmentKey: null,
      t: 0,
      elapsedInSegment: 0,
      bucketId: null,
    }
    marbles.push(marble)

    if (i === 0) {
      marble.segmentKey = reducedMotion ? 'R1' : 'S1'
    } else {
      hopperQueue.push(marble.id)
    }
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

  buildSegments()
  resetMachine()
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

  const now = performance.now()
  spawnBoostUntil = now + SPAWN_BOOST_DURATION_MS

  if (hopperQueue.length > 0) {
    releaseFromHopper()
    hopperCooldown = SPAWN_BOOST_INTERVAL_MS
  }
}

function releaseFromHopper(): void {
  const id = hopperQueue.shift()
  if (id === undefined) return
  const marble = marbles.find((candidate) => candidate.id === id)
  if (!marble) return

  marble.state = 'track'
  marble.segmentKey = reducedMotion ? 'R1' : 'S1'
  marble.t = 0
  marble.elapsedInSegment = 0
}

function triggerContact(type: ContactType, sign: number): void {
  if (type === 'seesaw') {
    seesawTarget = sign
    seesawHoldRemaining = 260
    return
  }
  if (type === 'pinwheel') {
    pinwheelBoost = Math.min(pinwheelBoost + 0.01, 0.024)
    return
  }
  if (type === 'bell') {
    bellSwing = 1
  }
}

function advanceMarble(marble: Marble, delta: number): void {
  if (marble.state !== 'track' || !marble.segmentKey) return
  const segment = segments[marble.segmentKey]
  if (!segment) return

  const previousT = marble.t
  marble.elapsedInSegment += delta
  marble.t = Math.min(1, marble.elapsedInSegment / segment.durationMs)

  for (const contact of segment.contacts) {
    if (previousT < contact.t && marble.t >= contact.t) {
      triggerContact(contact.type, marble.id % 2 === 0 ? 1 : -1)
    }
  }

  if (marble.t < 1) return

  if (marble.segmentKey === 'S1') {
    const useAltBranch = isLeverActive()
    triggerContact('seesaw', useAltBranch ? -1 : 1)
    marble.segmentKey = useAltBranch ? 'S2b' : 'S2a'
    marble.t = 0
    marble.elapsedInSegment = 0
    return
  }

  if (marble.segmentKey === 'S2a' || marble.segmentKey === 'S2b') {
    marble.segmentKey = 'S3'
    marble.t = 0
    marble.elapsedInSegment = 0
    return
  }

  if (marble.segmentKey === 'S3') {
    marble.segmentKey = 'S4'
    marble.t = 0
    marble.elapsedInSegment = 0
    return
  }

  // S4 or the reduced-motion direct drop (R1) both end at the collector.
  marble.state = 'elevator'
  marble.segmentKey = null
  marble.t = 0
  marble.elapsedInSegment = 0
  elevatorQueue.push(marble.id)
}

function updateBucket(bucket: Bucket, delta: number): void {
  if (bucket.marbleId === null && bucket.phase < PICKUP_WINDOW) {
    const id = elevatorQueue.shift()
    if (id !== undefined) {
      const marble = marbles.find((candidate) => candidate.id === id)
      if (marble) {
        marble.bucketId = bucket.id
        bucket.marbleId = marble.id
      }
    }
  }

  const duration = reducedMotion
    ? ELEVATOR_DURATION_MS * 1.4
    : ELEVATOR_DURATION_MS
  bucket.phase += delta / duration

  if (bucket.phase < 1) return

  if (bucket.marbleId !== null) {
    const marble = marbles.find((candidate) => candidate.id === bucket.marbleId)
    if (marble) {
      marble.bucketId = null
      hopperQueue.push(marble.id)
    }
    bucket.marbleId = null
  }
  bucket.phase = 0
}

function updateHopperSpawn(delta: number, now: number): void {
  if (hopperQueue.length === 0) return

  hopperCooldown -= delta
  if (hopperCooldown > 0) return

  releaseFromHopper()
  hopperCooldown =
    now < spawnBoostUntil ? SPAWN_BOOST_INTERVAL_MS : SPAWN_INTERVAL_MS
}

function updateFlourishes(delta: number): void {
  if (seesawHoldRemaining > 0) {
    seesawHoldRemaining -= delta
    if (seesawHoldRemaining <= 0) seesawTarget = 0
  }
  seesawTilt += (seesawTarget - seesawTilt) * Math.min(1, delta * 0.006)

  const idleSpeed = reducedMotion ? 0.00035 : 0.0007
  pinwheelAngle += (idleSpeed + pinwheelBoost) * delta
  pinwheelBoost = Math.max(0, pinwheelBoost - delta * 0.000012)

  bellSwing = Math.max(0, bellSwing - delta * 0.0026)

  const targetLever = isLeverActive() ? 1 : 0
  leverAngle += (targetLever - leverAngle) * Math.min(1, delta * 0.01)
}

function drawTrack(): void {
  if (!context) return

  context.lineCap = 'round'
  context.strokeStyle = 'rgba(120, 90, 54, 0.55)'
  context.lineWidth = 4

  const activeSegments: TrackSegment[] = reducedMotion
    ? [segments.R1].filter((segment): segment is TrackSegment => !!segment)
    : (['S1', 'S2a', 'S2b', 'S3', 'S4'] as SegmentKey[])
        .map((key) => segments[key])
        .filter((segment): segment is TrackSegment => !!segment)

  for (const segment of activeSegments) {
    context.beginPath()
    context.moveTo(segment.from.x, segment.from.y)
    context.quadraticCurveTo(
      segment.control.x,
      segment.control.y,
      segment.to.x,
      segment.to.y,
    )
    context.stroke()
  }
}

function drawHopper(): void {
  if (!context) return
  const w = Math.max(18, width * 0.045)
  const h = Math.max(14, height * 0.05)

  context.fillStyle = 'rgba(150, 110, 62, 0.85)'
  context.beginPath()
  context.moveTo(hopperPos.x - w, hopperPos.y - h)
  context.lineTo(hopperPos.x + w, hopperPos.y - h)
  context.lineTo(hopperPos.x + w * 0.35, hopperPos.y + h * 0.4)
  context.lineTo(hopperPos.x - w * 0.35, hopperPos.y + h * 0.4)
  context.closePath()
  context.fill()
}

function drawSeesaw(): void {
  if (!context || reducedMotion) return
  const plankLength = Math.max(30, width * 0.09)

  context.save()
  context.translate(seesawPivot.x, seesawPivot.y)
  context.rotate(seesawTilt * 0.32)
  context.strokeStyle = 'rgba(150, 110, 62, 0.9)'
  context.lineWidth = 5
  context.beginPath()
  context.moveTo(-plankLength, 0)
  context.lineTo(plankLength, 0)
  context.stroke()
  context.restore()

  context.beginPath()
  context.arc(seesawPivot.x, seesawPivot.y, 4.5, 0, Math.PI * 2)
  context.fillStyle = 'rgba(90, 66, 40, 0.9)'
  context.fill()
}

function drawLever(): void {
  if (!context || reducedMotion) return
  const armLength = leverRadius * 0.55

  context.save()
  context.translate(leverPivot.x, leverPivot.y)
  context.rotate(-0.5 + leverAngle * 0.9)
  context.strokeStyle = `rgba(198, 150, 90, ${0.5 + leverAngle * 0.4})`
  context.lineWidth = 3.4
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(0, -armLength)
  context.stroke()

  context.beginPath()
  context.arc(0, -armLength, 4, 0, Math.PI * 2)
  context.fillStyle = `rgba(220, 178, 120, ${0.6 + leverAngle * 0.4})`
  context.fill()
  context.restore()
}

function drawPinwheel(): void {
  if (!context || reducedMotion) return
  const bladeCount = 5
  const radius = Math.max(14, Math.min(width, height) * 0.035)

  context.save()
  context.translate(pinwheelPos.x, pinwheelPos.y)
  context.rotate(pinwheelAngle)
  for (let i = 0; i < bladeCount; i += 1) {
    const angle = (i / bladeCount) * Math.PI * 2
    context.save()
    context.rotate(angle)
    context.fillStyle = `hsla(${205 + i * 8}, 55%, 62%, 0.9)`
    context.beginPath()
    context.moveTo(0, 0)
    context.lineTo(radius, -radius * 0.32)
    context.lineTo(radius, radius * 0.32)
    context.closePath()
    context.fill()
    context.restore()
  }
  context.beginPath()
  context.arc(0, 0, radius * 0.22, 0, Math.PI * 2)
  context.fillStyle = 'rgba(90, 66, 40, 0.9)'
  context.fill()
  context.restore()
}

function drawBell(): void {
  if (!context || reducedMotion) return
  const scale = 1 + bellSwing * 0.08

  context.save()
  context.translate(bellPos.x, bellPos.y)
  context.scale(scale, scale)
  context.fillStyle = 'rgba(196, 150, 78, 0.92)'
  context.beginPath()
  context.arc(0, 0, 11, Math.PI, 0)
  context.lineTo(9, 6)
  context.lineTo(-9, 6)
  context.closePath()
  context.fill()

  context.save()
  context.rotate(Math.sin(bellSwing * Math.PI) * bellSwing * 0.5)
  context.strokeStyle = 'rgba(80, 60, 34, 0.9)'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(0, 2)
  context.lineTo(0, 10)
  context.stroke()
  context.restore()
  context.restore()
}

function drawElevator(): void {
  if (!context) return

  context.strokeStyle = 'rgba(120, 90, 54, 0.4)'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(elevatorX, elevatorBottomY)
  context.lineTo(elevatorX, elevatorTopY)
  context.stroke()

  for (const bucket of buckets) {
    const y = elevatorBottomY + (elevatorTopY - elevatorBottomY) * bucket.phase
    context.fillStyle = 'rgba(150, 110, 62, 0.85)'
    context.fillRect(elevatorX - 7, y - 5, 14, 10)
  }
}

function drawMarble(marble: Marble): void {
  if (!context) return

  let point: Point | null = null

  if (marble.state === 'track' && marble.segmentKey) {
    const segment = segments[marble.segmentKey]
    if (segment) point = bezierPoint(segment, marble.t)
  } else if (marble.state === 'elevator') {
    if (marble.bucketId !== null) {
      const bucket = buckets.find(
        (candidate) => candidate.id === marble.bucketId,
      )
      if (bucket) {
        const y =
          elevatorBottomY + (elevatorTopY - elevatorBottomY) * bucket.phase
        point = { x: elevatorX, y: y - 9 }
      }
    } else {
      const queueIndex = elevatorQueue.indexOf(marble.id)
      const offset = queueIndex >= 0 ? queueIndex : 0
      point = { x: collectorPos.x - offset * 9, y: collectorPos.y - 4 }
    }
  }

  if (!point) return

  context.beginPath()
  context.arc(point.x, point.y, MARBLE_RADIUS, 0, Math.PI * 2)
  const gradient = context.createRadialGradient(
    point.x - 2,
    point.y - 2,
    1,
    point.x,
    point.y,
    MARBLE_RADIUS,
  )
  gradient.addColorStop(0, `hsla(${marble.hue}, 80%, 82%, 0.95)`)
  gradient.addColorStop(1, `hsla(${marble.hue}, 65%, 48%, 0.95)`)
  context.fillStyle = gradient
  context.fill()
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67)) * 16.67

  context.clearRect(0, 0, width, height)

  updateHopperSpawn(delta, timestamp)
  updateFlourishes(delta)

  for (const marble of marbles) advanceMarble(marble, delta)
  for (const bucket of buckets) updateBucket(bucket, delta)

  drawTrack()
  drawElevator()
  drawHopper()
  drawSeesaw()
  drawLever()
  drawPinwheel()
  drawBell()
  for (const marble of marbles) drawMarble(marble)

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  buildSegments()
  resetMachine()
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
  segments = {}
  marbles = []
  buckets = []
  hopperQueue = []
  elevatorQueue = []
})
</script>

<style scoped>
.marble-run-contraption {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.85;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .marble-run-contraption {
    opacity: 0.6;
  }
}
</style>
