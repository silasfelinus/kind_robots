<!-- /components/screenfx/cloud-city-drift.vue -->
<template>
  <canvas ref="canvasRef" class="cloud-city-drift" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Building {
  offset: number
  width: number
  height: number
  lit: boolean
  twinklePhase: number
}

interface Cloud {
  x: number
  y: number
  vx: number
  depth: number
  puffBucket: number
  hue: number
  buildings: Building[]
  cityWidth: number
  flipPhase: number
  nextFlipAt: number
  flipping: boolean
  beaconUntil: number
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

const clouds: Cloud[] = []
const puffShapes = new Map<number, Path2D>()
const pointer: PointerState = { x: 0, y: 0, active: false }

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function cloudCount(): number {
  if (reducedMotion) return 6
  return Math.round(Math.min(16, Math.max(7, (width * height) / 95000)))
}

function puffBucketFor(radius: number): number {
  return Math.max(6, Math.round(radius))
}

// A loose cluster of overlapping puffs, drawn once per size bucket and reused every frame
// (same caching approach as paper-lantern-weather's folded shapes).
function getPuffShape(bucket: number): Path2D {
  const cached = puffShapes.get(bucket)
  if (cached) return cached

  const r = bucket
  const path = new Path2D()
  const puffs = [
    { dx: -r * 1.6, dy: r * 0.3, pr: r * 0.85 },
    { dx: -r * 0.7, dy: -r * 0.35, pr: r * 1.05 },
    { dx: r * 0.3, dy: -r * 0.5, pr: r * 1.15 },
    { dx: r * 1.3, dy: -r * 0.1, pr: r * 0.9 },
    { dx: r * 2, dy: r * 0.35, pr: r * 0.7 },
  ]

  for (const puff of puffs) {
    path.moveTo(puff.dx + puff.pr, puff.dy)
    path.arc(puff.dx, puff.dy, puff.pr, 0, Math.PI * 2)
  }

  puffShapes.set(bucket, path)
  return path
}

function createBuildings(cityWidth: number): Building[] {
  const buildings: Building[] = []
  let offset = -cityWidth / 2

  while (offset < cityWidth / 2) {
    const buildingWidth = randomBetween(3, 7)
    buildings.push({
      offset,
      width: buildingWidth,
      height: randomBetween(4, 16),
      lit: Math.random() < 0.4,
      twinklePhase: Math.random() * Math.PI * 2,
    })
    offset += buildingWidth + randomBetween(0.5, 2)
  }

  return buildings
}

function createCloud(): Cloud {
  const depth = randomBetween(0.35, 1)
  const radius = randomBetween(24, 52) * depth
  const cityWidth = radius * 2.6

  return {
    x: Math.random() * width,
    y: randomBetween(height * 0.08, height * 0.62),
    vx: randomBetween(0.006, 0.02) * depth * (Math.random() < 0.5 ? -1 : 1),
    depth,
    puffBucket: puffBucketFor(radius),
    hue: randomBetween(196, 224),
    buildings: createBuildings(cityWidth),
    cityWidth,
    flipPhase: 0,
    nextFlipAt: 0,
    flipping: false,
    beaconUntil: 0,
  }
}

function seedClouds(): void {
  const count = cloudCount()

  while (clouds.length < count) clouds.push(createCloud())
  if (clouds.length > count) clouds.splice(count)

  const now = performance.now()
  for (const cloud of clouds) {
    if (cloud.nextFlipAt === 0) {
      cloud.nextFlipAt = now + randomBetween(9000, 26000)
    }
  }
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

// A distant beacon response: the farthest (lowest-depth) cloud not already mid-flip or
// mid-flash answers the click with a brief window-light pulse, rather than reacting at the
// click point itself.
function triggerBeacon(): void {
  if (reducedMotion) return

  let candidate: Cloud | null = null
  for (const cloud of clouds) {
    if (cloud.flipping || cloud.beaconUntil > performance.now()) continue
    if (!candidate || cloud.depth < candidate.depth) candidate = cloud
  }

  if (candidate) candidate.beaconUntil = performance.now() + 900
}

function handlePointerDown(event: PointerEvent): void {
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  triggerBeacon()
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

  clouds.forEach((cloud) => {
    cloud.x *= scaleX
    cloud.y *= scaleY
  })

  seedClouds()
}

function updateCloud(cloud: Cloud, delta: number, timestamp: number): void {
  const driftScale = reducedMotion ? 0 : 1
  cloud.x += cloud.vx * delta * driftScale

  const margin = cloud.puffBucket * 4
  if (cloud.x < -margin) cloud.x = width + margin
  if (cloud.x > width + margin) cloud.x = -margin

  // Wind parting: nearby puffs drift away from the pointer and settle back once it moves on.
  if (pointer.active && !reducedMotion) {
    const distance = Math.hypot(pointer.x - cloud.x, pointer.y - cloud.y)
    const partRadius = 160 * cloud.depth
    if (distance < partRadius) {
      const push = (1 - distance / partRadius) * 0.6 * delta
      const away = cloud.x >= pointer.x ? 1 : -1
      cloud.x += away * push
    }
  }

  if (!reducedMotion && !cloud.flipping && timestamp >= cloud.nextFlipAt) {
    cloud.flipping = true
    cloud.flipPhase = 0
  }

  if (cloud.flipping) {
    cloud.flipPhase += delta * 0.012
    if (cloud.flipPhase >= 1) {
      cloud.flipping = false
      cloud.flipPhase = 0
      cloud.nextFlipAt = timestamp + randomBetween(20000, 42000)
    }
  }

  drawCloud(cloud, timestamp)
}

function drawCloud(cloud: Cloud, timestamp: number): void {
  if (!context) return

  const alpha = 0.34 + cloud.depth * 0.4
  const flip = cloud.flipping ? Math.sin(cloud.flipPhase * Math.PI) : 0
  const showingCity = cloud.flipping && cloud.flipPhase > 0.5

  context.save()
  context.translate(cloud.x, cloud.y)
  context.scale(1, Math.max(0.06, 1 - flip))

  if (!showingCity) {
    const glow = context.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      cloud.puffBucket * 2.6,
    )
    glow.addColorStop(0, `hsla(${cloud.hue}, 60%, 92%, ${alpha})`)
    glow.addColorStop(1, `hsla(${cloud.hue}, 70%, 80%, 0)`)
    context.fillStyle = glow
    context.fill(getPuffShape(cloud.puffBucket))
  } else {
    // Underside reveal: a dark skyline silhouette with a scattering of lit windows.
    context.fillStyle = `hsla(${cloud.hue + 30}, 30%, 14%, ${alpha + 0.1})`
    context.beginPath()
    context.rect(-cloud.cityWidth / 2, -2, cloud.cityWidth, 2)
    for (const building of cloud.buildings) {
      context.rect(building.offset, 0, building.width, building.height)
    }
    context.fill()

    for (const building of cloud.buildings) {
      if (!building.lit) continue
      const twinkle =
        0.5 + 0.5 * Math.sin(timestamp * 0.002 + building.twinklePhase)
      context.fillStyle = `hsla(42, 90%, 70%, ${alpha * (0.4 + twinkle * 0.5)})`
      context.fillRect(
        building.offset + building.width * 0.3,
        building.height * 0.35,
        building.width * 0.4,
        building.width * 0.4,
      )
    }
  }

  context.restore()

  if (cloud.beaconUntil > timestamp) {
    const remaining = (cloud.beaconUntil - timestamp) / 900
    const pulse = Math.sin(remaining * Math.PI)
    context.save()
    context.translate(cloud.x, cloud.y)
    context.globalCompositeOperation = 'lighter'
    const beaconGlow = context.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      cloud.puffBucket * 3.4,
    )
    beaconGlow.addColorStop(0, `hsla(46, 95%, 78%, ${pulse * 0.55})`)
    beaconGlow.addColorStop(1, 'hsla(46, 95%, 78%, 0)')
    context.fillStyle = beaconGlow
    context.beginPath()
    context.arc(0, 0, cloud.puffBucket * 3.4, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67))

  context.clearRect(0, 0, width, height)

  // Back-to-front by depth so nearer clouds occlude farther ones.
  const ordered = [...clouds].sort((a, b) => a.depth - b.depth)
  for (const cloud of ordered) updateCloud(cloud, delta, timestamp)

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  for (const cloud of clouds) {
    cloud.flipping = false
    cloud.flipPhase = 0
    cloud.beaconUntil = 0
  }
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
  puffShapes.clear()
  clouds.length = 0
})
</script>

<style scoped>
.cloud-city-drift {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .cloud-city-drift {
    opacity: 0.65;
  }
}
</style>
