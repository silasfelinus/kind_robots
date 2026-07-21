<!-- /components/screenfx/magnetic-sand-garden.vue -->
<template>
  <canvas ref="canvasRef" class="magnetic-sand-garden" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface PointerState {
  x: number
  y: number
  active: boolean
}

interface Ripple {
  x: number
  y: number
  startedAt: number
  life: number
  polarity: 1 | -1
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
let polarity: 1 | -1 = 1

let cols = 0
let rows = 0
let cellSize = 16
let heights = new Float32Array(0)
let jitterX = new Float32Array(0)
let jitterY = new Float32Array(0)
let grainScale = new Float32Array(0)

const ripples: Ripple[] = []
const pointer: PointerState = { x: 0, y: 0, active: false }

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function computeGrid(): { cols: number; rows: number; cellSize: number } {
  const targetCells = reducedMotion ? 260 : 760
  const rawCellSize = Math.sqrt((width * height) / targetCells)
  const size = Math.min(26, Math.max(11, rawCellSize))

  return {
    cols: Math.max(8, Math.ceil(width / size) + 1),
    rows: Math.max(8, Math.ceil(height / size) + 1),
    cellSize: size,
  }
}

function seedGrid(): void {
  const grid = computeGrid()
  cols = grid.cols
  rows = grid.rows
  cellSize = grid.cellSize

  const total = cols * rows
  heights = new Float32Array(total)
  jitterX = new Float32Array(total)
  jitterY = new Float32Array(total)
  grainScale = new Float32Array(total)

  for (let index = 0; index < total; index += 1) {
    jitterX[index] = randomBetween(-cellSize * 0.28, cellSize * 0.28)
    jitterY[index] = randomBetween(-cellSize * 0.28, cellSize * 0.28)
    grainScale[index] = randomBetween(0.78, 1.16)
  }

  ripples.length = 0
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

function spawnRipple(x: number, y: number): void {
  if (ripples.length >= 3) ripples.shift()

  ripples.push({
    x,
    y,
    startedAt: performance.now(),
    life: randomBetween(2200, 2800),
    polarity,
  })
}

function handlePointerDown(event: PointerEvent): void {
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  polarity = polarity === 1 ? -1 : 1
  spawnRipple(point.x, point.y)
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

  seedGrid()
}

function flowField(cx: number, cy: number, t: number): number {
  // Layered sine bands that comb the field into ridges, valleys, and the
  // occasional interference "bloom" where bands cross constructively.
  const a = Math.sin(cx * 0.011 + t * 0.00026)
  const b = Math.sin(cy * 0.014 - t * 0.00019)
  const c = Math.sin((cx + cy) * 0.0075 + t * 0.00033)
  const d = Math.sin((cx - cy) * 0.017 - t * 0.00015)

  return a * 0.4 + b * 0.35 + c * 0.35 + d * 0.25
}

function magnetInfluence(cx: number, cy: number): number {
  if (!pointer.active) return 0

  const dx = cx - pointer.x
  const dy = cy - pointer.y
  const radius = 170
  const falloff = Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius))

  return polarity * falloff * 1.1
}

function rippleInfluence(cx: number, cy: number, timestamp: number): number {
  if (ripples.length === 0) return 0

  let total = 0
  const maxRadius = Math.max(width, height) * 0.8
  const bandWidth = 62

  for (const ripple of ripples) {
    const age = timestamp - ripple.startedAt
    if (age < 0 || age >= ripple.life) continue

    const progress = age / ripple.life
    const front = progress * maxRadius
    const dist = Math.hypot(cx - ripple.x, cy - ripple.y)
    const offset = Math.abs(dist - front)
    if (offset > bandWidth) continue

    const proximity = 1 - offset / bandWidth
    const fade = 1 - progress
    total += ripple.polarity * proximity * fade * 1.7
  }

  return total
}

function pruneRipples(timestamp: number): void {
  for (let index = ripples.length - 1; index >= 0; index -= 1) {
    const ripple = ripples[index]
    if (!ripple || timestamp - ripple.startedAt >= ripple.life)
      ripples.splice(index, 1)
  }
}

function drawCell(index: number, cx: number, cy: number, value: number): void {
  if (!context) return

  const magnitude = Math.min(1, Math.abs(value))
  if (magnitude < 0.04) return

  const scale = grainScale[index] ?? 1
  const radius = cellSize * (0.16 + 0.42 * magnitude) * scale
  const x = cx + (jitterX[index] ?? 0)
  const y = cy + (jitterY[index] ?? 0)

  const hue = value >= 0 ? 36 + magnitude * 14 : 206 + magnitude * 14
  const lightness = 42 + magnitude * 26
  const alpha = 0.16 + magnitude * 0.5

  context.fillStyle = `hsla(${hue}, 46%, ${lightness}%, ${alpha})`
  context.beginPath()
  context.arc(x, y, Math.max(0.5, radius), 0, Math.PI * 2)
  context.fill()
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67))

  simTime += delta * (reducedMotion ? 2 : 16.67)
  pruneRipples(timestamp)

  context.clearRect(0, 0, width, height)

  const easeRate = reducedMotion ? 0.006 : 0.022
  const half = cellSize / 2

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col
      const cx = col * cellSize + half
      const cy = row * cellSize + half

      const target =
        flowField(cx, cy, simTime) +
        magnetInfluence(cx, cy) +
        rippleInfluence(cx, cy, timestamp)
      const clampedTarget = Math.max(-1.4, Math.min(1.4, target))

      const current = heights[index] ?? 0
      const next = current + (clampedTarget - current) * easeRate * delta
      heights[index] = next

      drawCell(index, cx, cy, next)
    }
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  seedGrid()
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
  heights = new Float32Array(0)
  jitterX = new Float32Array(0)
  jitterY = new Float32Array(0)
  grainScale = new Float32Array(0)
  ripples.length = 0
})
</script>

<style scoped>
.magnetic-sand-garden {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.9;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .magnetic-sand-garden {
    opacity: 0.55;
  }
}
</style>
