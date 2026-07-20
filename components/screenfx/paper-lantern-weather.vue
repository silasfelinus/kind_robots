<!-- /components/screenfx/paper-lantern-weather.vue -->
<template>
  <canvas ref="canvasRef" class="paper-lantern-weather" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Lantern {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  hue: number
  phase: number
  depth: number
  dim: number
  shapeBucket: number
}

interface Bird {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  flap: number
}

interface PointerState {
  x: number
  y: number
  active: boolean
}

interface GustState {
  startedAt: number
  duration: number
  direction: 1 | -1
  strength: number
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
let nextGustAt = 0
let activeGust: GustState | null = null

const lanterns: Lantern[] = []
const birds: Bird[] = []
const lanternShapes = new Map<number, Path2D>()
const pointer: PointerState = { x: 0, y: 0, active: false }

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function lanternCount(): number {
  if (reducedMotion) return 10
  return Math.round(Math.min(38, Math.max(16, (width * height) / 46000)))
}

function shapeBucketFor(radius: number): number {
  return Math.max(4, Math.round(radius))
}

function getLanternShape(bucket: number): Path2D {
  const cached = lanternShapes.get(bucket)
  if (cached) return cached

  // A folded-paper hexagonal lantern: flat top and bottom creases with two
  // gently bowed sides, drawn once per size bucket and reused every frame.
  const r = bucket
  const path = new Path2D()
  path.moveTo(-r * 0.55, -r)
  path.lineTo(r * 0.55, -r)
  path.quadraticCurveTo(r * 1.05, 0, r * 0.55, r)
  path.lineTo(-r * 0.55, r)
  path.quadraticCurveTo(-r * 1.05, 0, -r * 0.55, -r)
  path.closePath()
  // Center crease line, gives the "folded paper" read at rest.
  path.moveTo(0, -r)
  path.lineTo(0, r)

  lanternShapes.set(bucket, path)
  return path
}

function createLantern(): Lantern {
  const depth = randomBetween(0.4, 1)
  const radius = randomBetween(6, 13) * depth

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: randomBetween(-0.02, 0.02) * depth,
    vy: randomBetween(-0.05, 0.05) * depth,
    radius,
    hue: randomBetween(26, 44),
    phase: Math.random() * Math.PI * 2,
    depth,
    dim: 1,
    shapeBucket: shapeBucketFor(radius),
  }
}

function seedLanterns(): void {
  const count = lanternCount()

  while (lanterns.length < count) lanterns.push(createLantern())
  if (lanterns.length > count) lanterns.splice(count)
}

function canvasPoint(clientX: number, clientY: number): { x: number; y: number } | null {
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

function releaseBird(x: number, y: number): void {
  if (birds.length > 4) birds.shift()

  const direction = activeGust ? activeGust.direction : Math.random() < 0.5 ? -1 : 1

  birds.push({
    x,
    y,
    vx: direction * randomBetween(0.55, 0.95),
    vy: randomBetween(-0.4, -0.15),
    age: 0,
    life: randomBetween(3200, 4600),
    flap: Math.random() * Math.PI * 2,
  })
}

function handlePointerDown(event: PointerEvent): void {
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  releaseBird(point.x, point.y)
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas || !context) return

  const rect = canvas.getBoundingClientRect()
  const nextWidth = Math.max(1, rect.width)
  const nextHeight = Math.max(1, rect.height)
  const scaleX = nextWidth / width
  const scaleY = nextHeight / height

  width = nextWidth
  height = nextHeight

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  lanterns.forEach((lantern) => {
    lantern.x *= scaleX
    lantern.y *= scaleY
  })

  seedLanterns()
}

function maybeStartGust(timestamp: number): void {
  if (reducedMotion || activeGust) return
  if (timestamp < nextGustAt) return

  activeGust = {
    startedAt: timestamp,
    duration: randomBetween(3600, 5200),
    direction: Math.random() < 0.5 ? -1 : 1,
    strength: randomBetween(0.55, 1),
  }
}

function gustFrontX(gust: GustState, timestamp: number): number {
  const progress = Math.min(1, (timestamp - gust.startedAt) / gust.duration)
  const span = width * 1.3

  return gust.direction === 1 ? -width * 0.15 + progress * span : width * 1.15 - progress * span
}

function updateGust(timestamp: number, delta: number): void {
  if (!activeGust) return

  const elapsed = timestamp - activeGust.startedAt
  if (elapsed >= activeGust.duration) {
    nextGustAt = timestamp + randomBetween(15000, 27000)
    activeGust = null
    return
  }

  const front = gustFrontX(activeGust, timestamp)
  const bandWidth = width * 0.22

  for (const lantern of lanterns) {
    const distance = Math.abs(lantern.x - front)
    if (distance > bandWidth) continue

    const sheltered =
      pointer.active && Math.hypot(pointer.x - lantern.x, pointer.y - lantern.y) < 130

    const proximity = 1 - distance / bandWidth
    lantern.vx += activeGust.direction * proximity * activeGust.strength * 0.05 * delta

    if (!sheltered) {
      lantern.dim = Math.max(0.28, lantern.dim - proximity * 0.04 * delta)
    }
  }
}

function updateLantern(lantern: Lantern, delta: number, timestamp: number): void {
  const driftScale = reducedMotion ? 0.18 : 1
  const creaseFlex = Math.sin(timestamp * 0.0014 + lantern.phase)

  lantern.vx += Math.sin(timestamp * 0.0002 + lantern.phase) * 0.0006 * delta
  lantern.vx *= 0.992
  lantern.vy *= 0.995
  lantern.x += lantern.vx * delta * driftScale
  lantern.y += lantern.vy * delta * driftScale

  // Relight: dim recovers toward full brightness once the gust front has moved on,
  // faster in sheltered pockets near the pointer.
  const sheltered =
    pointer.active && Math.hypot(pointer.x - lantern.x, pointer.y - lantern.y) < 130
  const relightRate = sheltered ? 0.03 : 0.012
  lantern.dim = Math.min(1, lantern.dim + relightRate * delta)

  const margin = lantern.radius * 5

  if (lantern.x < -margin) lantern.x = width + margin
  if (lantern.x > width + margin) lantern.x = -margin
  if (lantern.y < -margin) lantern.y = height + margin
  if (lantern.y > height + margin) lantern.y = -margin

  drawLantern(lantern, creaseFlex)
}

function drawLantern(lantern: Lantern, creaseFlex: number): void {
  if (!context) return

  const breathe = reducedMotion ? Math.sin(performance.now() * 0.0004 + lantern.phase) * 0.5 + 0.5 : 1
  const alpha = (0.32 + lantern.depth * 0.32) * lantern.dim * (reducedMotion ? 0.55 + breathe * 0.25 : 1)
  const glowRadius = lantern.radius * 3.4

  context.save()
  context.translate(lantern.x, lantern.y)
  context.rotate(creaseFlex * 0.06 * lantern.depth)
  context.scale(1 + creaseFlex * 0.03, 1 - creaseFlex * 0.03)

  context.globalCompositeOperation = 'lighter'
  const glow = context.createRadialGradient(0, 0, 0, 0, 0, glowRadius)
  glow.addColorStop(0, `hsla(${lantern.hue}, 92%, 70%, ${alpha * 0.9})`)
  glow.addColorStop(1, `hsla(${lantern.hue}, 90%, 55%, 0)`)
  context.fillStyle = glow
  context.beginPath()
  context.arc(0, 0, glowRadius, 0, Math.PI * 2)
  context.fill()

  const shape = getLanternShape(lantern.shapeBucket)
  context.fillStyle = `hsla(${lantern.hue}, 78%, 62%, ${alpha})`
  context.fill(shape)
  context.strokeStyle = `hsla(${lantern.hue + 10}, 80%, 40%, ${alpha * 0.7})`
  context.lineWidth = Math.max(0.5, lantern.depth * 0.8)
  context.stroke(shape)

  context.restore()
}

function updateBird(bird: Bird, delta: number): boolean {
  if (!context) return false

  bird.age += delta * 16.67
  bird.flap += delta * 0.25
  bird.x += bird.vx * delta
  bird.y += bird.vy * delta - Math.sin(bird.flap) * 0.12

  const lifeFade = Math.max(0, 1 - bird.age / bird.life)
  if (lifeFade <= 0) return false
  if (bird.x < -40 || bird.x > width + 40 || bird.y < -40 || bird.y > height + 40) return false

  const wingSpan = 9
  const wingLift = Math.sin(bird.flap) * 5

  context.save()
  context.translate(bird.x, bird.y)
  context.globalAlpha = lifeFade
  context.strokeStyle = 'hsla(30, 60%, 88%, 0.9)'
  context.lineWidth = 1.4
  context.lineCap = 'round'

  context.beginPath()
  context.moveTo(0, 0)
  context.quadraticCurveTo(-wingSpan * 0.6, -wingLift, -wingSpan, 1)
  context.moveTo(0, 0)
  context.quadraticCurveTo(wingSpan * 0.6, -wingLift, wingSpan, 1)
  context.stroke()

  context.restore()
  return true
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67))

  context.clearRect(0, 0, width, height)

  maybeStartGust(timestamp)
  updateGust(timestamp, delta)
  lanterns.forEach((lantern) => updateLantern(lantern, delta, timestamp))

  for (let index = birds.length - 1; index >= 0; index -= 1) {
    const bird = birds[index]
    if (!bird || !updateBird(bird, delta)) birds.splice(index, 1)
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  activeGust = null
  seedLanterns()
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

  nextGustAt = performance.now() + randomBetween(6000, 12000)

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
  lanternShapes.clear()
  lanterns.length = 0
  birds.length = 0
  activeGust = null
})
</script>

<style scoped>
.paper-lantern-weather {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .paper-lantern-weather {
    opacity: 0.6;
  }
}
</style>
