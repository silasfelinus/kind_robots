<!-- /components/screenfx/ink-oracle.vue -->
<template>
  <canvas ref="canvasRef" class="ink-oracle" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Vortex {
  cx: number // grid-space center, x
  cy: number // grid-space center, y
  strength: number // signed: positive = counter-clockwise
  driftPhaseX: number
  driftPhaseY: number
  driftSpeed: number
  driftRadius: number
  baseX: number
  baseY: number
}

interface VoidStamp {
  x: number // grid-space
  y: number
  radius: number
  startedAt: number
  duration: number
}

interface PointerState {
  x: number // grid-space
  y: number
  vx: number
  vy: number
  active: boolean
  lastMoveAt: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let context: CanvasRenderingContext2D | null = null
let offscreen: HTMLCanvasElement | null = null
let offscreenCtx: CanvasRenderingContext2D | null = null

let width = 1
let height = 1
let cols = 1
let rows = 1
let reducedMotion = false
let previousTimestamp = 0
let simAccumulator = 0
let nextBloomAt = 0
let field: Float32Array = new Float32Array(1)
let scratch: Float32Array = new Float32Array(1)
let imageBuffer: Uint8ClampedArray = new Uint8ClampedArray(4)

const vortices: Vortex[] = []
const voids: VoidStamp[] = []
const pointer: PointerState = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  active: false,
  lastMoveAt: 0,
}

const SIM_STEP_MS = 38 // "update below display refresh" -- ~26 sim steps/sec, rendered every RAF
const MAX_VOIDS = 4

function hasWindow(): boolean {
  return typeof window !== 'undefined'
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function gridDimensions(): { cols: number; rows: number } {
  const cellSize = reducedMotion ? 22 : 15
  const nextCols = Math.min(72, Math.max(20, Math.round(width / cellSize)))
  const nextRows = Math.min(44, Math.max(12, Math.round(height / cellSize)))
  return { cols: nextCols, rows: nextRows }
}

function createVortex(): Vortex {
  const cx = randomBetween(cols * 0.2, cols * 0.8)
  const cy = randomBetween(rows * 0.2, rows * 0.8)
  return {
    cx,
    cy,
    baseX: cx,
    baseY: cy,
    strength: randomBetween(1.1, 2.1) * (Math.random() < 0.5 ? -1 : 1),
    driftPhaseX: randomBetween(0, Math.PI * 2),
    driftPhaseY: randomBetween(0, Math.PI * 2),
    driftSpeed: randomBetween(0.00025, 0.00055),
    driftRadius: randomBetween(cols * 0.08, cols * 0.18),
  }
}

function vortexCount(): number {
  return reducedMotion ? 2 : 3
}

function seedVortices(): void {
  vortices.length = 0
  const count = vortexCount()
  for (let i = 0; i < count; i += 1) vortices.push(createVortex())
}

function bloomInterval(): [number, number] {
  return reducedMotion ? [9000, 15000] : [2600, 5200]
}

function seedBloom(now: number, atX?: number, atY?: number): void {
  const x = atX ?? randomBetween(cols * 0.25, cols * 0.75)
  const y = atY ?? randomBetween(rows * 0.25, rows * 0.75)
  const radius = randomBetween(1.6, reducedMotion ? 3.2 : 2.6)

  for (
    let j = Math.max(0, Math.floor(y - radius));
    j <= Math.min(rows - 1, Math.ceil(y + radius));
    j += 1
  ) {
    for (
      let i = Math.max(0, Math.floor(x - radius));
      i <= Math.min(cols - 1, Math.ceil(x + radius));
      i += 1
    ) {
      const d = Math.hypot(i - x, j - y)
      if (d > radius) continue
      const falloff = 1 - d / radius
      const index = j * cols + i
      field[index] = Math.min(1, field[index]! + falloff * falloff * 0.9)
    }
  }

  const [minMs, maxMs] = bloomInterval()
  nextBloomAt = now + randomBetween(minMs, maxMs)
}

// Sum of potential-vortex contributions -- cheap curl-noise-like flow without a real noise
// library; the rotational folding of two or three overlapping vortices is what produces the
// "expand, fold, fade" pareidolia-friendly shapes the pitch calls for.
function sampleFlow(
  x: number,
  y: number,
  now: number,
): { vx: number; vy: number } {
  let vx = 0
  let vy = 0

  for (const vortex of vortices) {
    const dx = x - vortex.cx
    const dy = y - vortex.cy
    const r2 = dx * dx + dy * dy + 0.6
    vx += (-dy / r2) * vortex.strength
    vy += (dx / r2) * vortex.strength
  }

  if (!reducedMotion && pointer.active && now - pointer.lastMoveAt < 900) {
    const dx = x - pointer.x
    const dy = y - pointer.y
    const radius = Math.max(4, Math.min(cols, rows) * 0.22)
    const dist = Math.hypot(dx, dy)
    if (dist < radius) {
      const falloff = (1 - dist / radius) * 0.9
      vx += pointer.vx * falloff
      vy += pointer.vy * falloff
    }
  }

  return { vx, vy }
}

function sampleBilinear(source: Float32Array, x: number, y: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = x0 + 1
  const y1 = y0 + 1
  const tx = x - x0
  const ty = y - y0

  const cx0 = Math.min(cols - 1, Math.max(0, x0))
  const cx1 = Math.min(cols - 1, Math.max(0, x1))
  const cy0 = Math.min(rows - 1, Math.max(0, y0))
  const cy1 = Math.min(rows - 1, Math.max(0, y1))

  const v00 = source[cy0 * cols + cx0]!
  const v10 = source[cy0 * cols + cx1]!
  const v01 = source[cy1 * cols + cx0]!
  const v11 = source[cy1 * cols + cx1]!

  const top = v00 + (v10 - v00) * tx
  const bottom = v01 + (v11 - v01) * tx
  return top + (bottom - top) * ty
}

function stepSimulation(now: number, dtMs: number): void {
  const dtScale =
    Math.min(2.4, Math.max(0.4, dtMs / SIM_STEP_MS)) *
    (reducedMotion ? 0.55 : 1)
  const decay = reducedMotion ? 0.997 : 0.985

  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const { vx, vy } = sampleFlow(i, j, now)
      // Semi-Lagrangian advection: trace this cell's value back along the flow field.
      const srcX = i - vx * dtScale
      const srcY = j - vy * dtScale
      const advected = sampleBilinear(field, srcX, srcY)
      scratch[j * cols + i] = advected * decay
    }
  }

  // Light diffusion pass (coarse reaction-diffusion blur) so folded tendrils stay soft rather
  // than aliased -- one 3x3 average blended lightly into the advected field.
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const index = j * cols + i
      let sum = 0
      let n = 0
      for (let dj = -1; dj <= 1; dj += 1) {
        const nj = j + dj
        if (nj < 0 || nj >= rows) continue
        for (let di = -1; di <= 1; di += 1) {
          const ni = i + di
          if (ni < 0 || ni >= cols) continue
          sum += scratch[nj * cols + ni]!
          n += 1
        }
      }
      const blurred = n > 0 ? sum / n : scratch[index]!
      field[index] = scratch[index]! * 0.82 + blurred * 0.18
    }
  }

  // Voids: a click stamps a temporary hole the ink must flow around. Forcing it to zero every
  // step (rather than once) keeps it carved out as ink continues advecting toward it.
  for (let v = voids.length - 1; v >= 0; v -= 1) {
    const stamp = voids[v]!
    const age = now - stamp.startedAt
    if (age >= stamp.duration) {
      voids.splice(v, 1)
      continue
    }
    const closing = age / stamp.duration
    const radius = stamp.radius * (1 - closing * 0.35)
    const minJ = Math.max(0, Math.floor(stamp.y - radius))
    const maxJ = Math.min(rows - 1, Math.ceil(stamp.y + radius))
    const minI = Math.max(0, Math.floor(stamp.x - radius))
    const maxI = Math.min(cols - 1, Math.ceil(stamp.x + radius))
    for (let j = minJ; j <= maxJ; j += 1) {
      for (let i = minI; i <= maxI; i += 1) {
        const d = Math.hypot(i - stamp.x, j - stamp.y)
        if (d > radius) continue
        const index = j * cols + i
        field[index]! *= Math.max(0, d / radius - 0.15)
      }
    }
  }

  if (now >= nextBloomAt) seedBloom(now)
}

function driftVortices(dtMs: number): void {
  if (reducedMotion) return
  for (const vortex of vortices) {
    vortex.driftPhaseX += vortex.driftSpeed * dtMs
    vortex.driftPhaseY += vortex.driftSpeed * dtMs * 1.3
    vortex.cx = vortex.baseX + Math.sin(vortex.driftPhaseX) * vortex.driftRadius
    vortex.cy = vortex.baseY + Math.cos(vortex.driftPhaseY) * vortex.driftRadius
  }
}

function renderField(): void {
  if (!offscreenCtx || !offscreen || !context || !canvasRef.value) return

  for (let index = 0; index < field.length; index += 1) {
    const alpha = Math.max(0, Math.min(1, field[index]!))
    const pixel = index * 4
    imageBuffer[pixel] = 18
    imageBuffer[pixel + 1] = 20
    imageBuffer[pixel + 2] = 38
    imageBuffer[pixel + 3] = Math.round(alpha * 235)
  }

  const imageData = new ImageData(
    imageBuffer as unknown as Uint8ClampedArray<ArrayBuffer>,
    cols,
    rows,
  )
  offscreenCtx.putImageData(imageData, 0, 0)

  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.drawImage(offscreen, 0, 0, cols, rows, 0, 0, width, height)
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
  if (reducedMotion) return
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) {
    pointer.active = false
    return
  }
  const gx = (point.x / width) * cols
  const gy = (point.y / height) * rows
  const now = performance.now()
  const dtMs = pointer.lastMoveAt ? Math.max(1, now - pointer.lastMoveAt) : 16
  pointer.vx = ((gx - pointer.x) / dtMs) * 16
  pointer.vy = ((gy - pointer.y) / dtMs) * 16
  pointer.x = gx
  pointer.y = gy
  pointer.active = true
  pointer.lastMoveAt = now
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  const gx = (point.x / width) * cols
  const gy = (point.y / height) * rows
  const now = performance.now()

  if (voids.length >= MAX_VOIDS) voids.shift()
  voids.push({
    x: gx,
    y: gy,
    radius: randomBetween(2.4, 3.4),
    startedAt: now,
    duration: randomBetween(2400, 3600),
  })
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

  const dims = gridDimensions()
  cols = dims.cols
  rows = dims.rows

  field = new Float32Array(cols * rows)
  scratch = new Float32Array(cols * rows)
  imageBuffer = new Uint8ClampedArray(cols * rows * 4)

  offscreen = document.createElement('canvas')
  offscreen.width = cols
  offscreen.height = rows
  offscreenCtx = offscreen.getContext('2d', { alpha: true })

  seedVortices()
  seedBloom(performance.now(), cols / 2, rows / 2)
  voids.length = 0
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  simAccumulator += elapsed

  driftVortices(elapsed)

  while (simAccumulator >= SIM_STEP_MS) {
    stepSimulation(performance.now(), SIM_STEP_MS)
    simAccumulator -= SIM_STEP_MS
  }

  renderField()

  animationFrameId = window.requestAnimationFrame(renderFrame)
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
  offscreen = null
  offscreenCtx = null
  vortices.length = 0
  voids.length = 0
})
</script>

<style scoped>
.ink-oracle {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.88;
  transform: translateZ(0);
  filter: blur(0.6px);
}

@media (prefers-reduced-motion: reduce) {
  .ink-oracle {
    opacity: 0.7;
  }
}
</style>
