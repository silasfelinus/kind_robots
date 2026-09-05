<template>
  <canvas ref="canvasRef" class="geode-bloom" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type ClusterPhase = 'growing' | 'holding' | 'receding'

interface Facet {
  path: Path2D
  cx: number
  cy: number
  hue: number
}

interface Cluster {
  facets: Facet[]
  phase: ClusterPhase
  visible: number
  accumulator: number
  holdElapsed: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const clusters: Cluster[] = []

const MAX_CLUSTERS = 4
const MAX_FACETS = 12
const STEP_MS = 420
const HOLD_MS = 2400

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let reducedMotion = false
let spawnElapsed = 0
let seedCounter = 1
let pointerX = 0
let pointerY = 0
let pointerActive = false

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function createHexPath(cx: number, cy: number, radius: number, rotation: number): Path2D {
  const path = new Path2D()
  for (let index = 0; index < 6; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / 6
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    if (index === 0) path.moveTo(x, y)
    else path.lineTo(x, y)
  }
  path.closePath()
  return path
}

function createCluster(x: number, y: number): Cluster {
  const random = seededRandom(seedCounter++)
  const facets: Facet[] = []
  const baseRadius = Math.max(9, Math.min(width, height) * 0.018)
  const count = 7 + Math.floor(random() * (MAX_FACETS - 6))
  const baseHue = 188 + random() * 92

  for (let index = 0; index < count; index += 1) {
    const ring = index === 0 ? 0 : 1 + Math.floor((index - 1) / 6)
    const spoke = index === 0 ? 0 : (index - 1) % 6
    const angle = (Math.PI * 2 * spoke) / 6 + random() * 0.18
    const distance = ring * baseRadius * (1.35 + random() * 0.35)
    const cx = x + Math.cos(angle) * distance
    const cy = y + Math.sin(angle) * distance
    const radius = baseRadius * (0.7 + random() * 0.5)

    facets.push({
      path: createHexPath(cx, cy, radius, random() * Math.PI),
      cx,
      cy,
      hue: baseHue + random() * 34 - 17,
    })
  }

  return { facets, phase: 'growing', visible: 1, accumulator: 0, holdElapsed: 0 }
}

function randomSeedPoint(): { x: number; y: number } {
  const marginX = width * 0.16
  const marginY = height * 0.16
  const random = seededRandom(seedCounter * 7919)
  return {
    x: marginX + random() * Math.max(1, width - marginX * 2),
    y: marginY + random() * Math.max(1, height - marginY * 2),
  }
}

function seedCluster(x?: number, y?: number): void {
  if (clusters.length >= MAX_CLUSTERS) return
  const point = x === undefined || y === undefined ? randomSeedPoint() : { x, y }
  clusters.push(createCluster(point.x, point.y))
}

function updateCluster(cluster: Cluster, delta: number): boolean {
  if (cluster.phase === 'holding') {
    cluster.holdElapsed += delta
    if (cluster.holdElapsed >= HOLD_MS) {
      cluster.phase = 'receding'
      cluster.accumulator = 0
    }
    return true
  }

  cluster.accumulator += delta
  while (cluster.accumulator >= STEP_MS) {
    cluster.accumulator -= STEP_MS
    if (cluster.phase === 'growing') {
      cluster.visible += 1
      if (cluster.visible >= cluster.facets.length) {
        cluster.visible = cluster.facets.length
        cluster.phase = 'holding'
        cluster.holdElapsed = 0
        break
      }
    } else {
      cluster.visible -= 1
      if (cluster.visible <= 0) return false
    }
  }
  return true
}

function drawCavity(timestamp: number): void {
  if (!context) return
  const gradient = context.createRadialGradient(
    width * 0.5,
    height * 0.48,
    Math.min(width, height) * 0.08,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.7,
  )
  gradient.addColorStop(0, 'rgba(18, 28, 42, 0.18)')
  gradient.addColorStop(0.62, 'rgba(15, 23, 42, 0.08)')
  gradient.addColorStop(1, 'rgba(2, 6, 23, 0.32)')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  context.save()
  context.globalAlpha = 0.1 + Math.sin(timestamp * 0.00025) * 0.02
  context.strokeStyle = 'rgba(148, 163, 184, 0.7)'
  context.lineWidth = Math.max(8, Math.min(width, height) * 0.035)
  context.beginPath()
  context.ellipse(width * 0.5, height * 0.5, width * 0.47, height * 0.43, 0, 0, Math.PI * 2)
  context.stroke()
  context.restore()
}

function drawFacet(facet: Facet, timestamp: number): void {
  if (!context) return
  let light = 56 + Math.sin(timestamp * 0.0008 + facet.cx * 0.013 + facet.cy * 0.009) * 8
  if (pointerActive) {
    const distance = Math.hypot(facet.cx - pointerX, facet.cy - pointerY)
    light += Math.max(0, 20 * (1 - distance / 220))
  }
  context.fillStyle = `hsla(${facet.hue}, 72%, ${Math.min(78, light)}%, 0.48)`
  context.strokeStyle = `hsla(${facet.hue + 18}, 82%, ${Math.min(88, light + 12)}%, 0.7)`
  context.lineWidth = 1.2
  context.fill(facet.path)
  context.stroke(facet.path)
}

function drawCluster(cluster: Cluster, timestamp: number): void {
  if (!context) return
  context.save()
  context.globalCompositeOperation = 'lighter'
  for (let index = 0; index < cluster.visible; index += 1) {
    const facet = cluster.facets[index]
    if (facet) drawFacet(facet, timestamp)
  }
  context.restore()
}

function drawStaticBloom(timestamp: number): void {
  if (clusters.length === 0) {
    const points = [
      [0.28, 0.34],
      [0.68, 0.4],
      [0.46, 0.7],
    ] as const
    for (const [x, y] of points) {
      const cluster = createCluster(width * x, height * y)
      cluster.visible = cluster.facets.length
      cluster.phase = 'holding'
      clusters.push(cluster)
    }
  }
  for (const cluster of clusters) drawCluster(cluster, timestamp)
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
  if (reducedMotion || clusters.length >= MAX_CLUSTERS) return
  const point = canvasPoint(event)
  if (point) seedCluster(point.x, point.y)
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
  clusters.length = 0
  spawnElapsed = 0
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))
  context.clearRect(0, 0, width, height)
  drawCavity(timestamp)

  if (reducedMotion) {
    drawStaticBloom(timestamp)
  } else {
    spawnElapsed += delta
    if (clusters.length < 2 || (clusters.length < MAX_CLUSTERS && spawnElapsed >= 4200)) {
      seedCluster()
      spawnElapsed = 0
    }
    for (let index = clusters.length - 1; index >= 0; index -= 1) {
      const cluster = clusters[index]
      if (!cluster) continue
      if (!updateCluster(cluster, delta)) clusters.splice(index, 1)
      else drawCluster(cluster, timestamp)
    }
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  clusters.length = 0
  spawnElapsed = 0
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
  clusters.length = 0
  context = null
})
</script>

<style scoped>
.geode-bloom {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
