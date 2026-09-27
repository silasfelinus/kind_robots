<!-- /components/screenfx/soap-film-membrane.vue -->
<template>
  <canvas ref="canvasRef" class="soap-film-membrane" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

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

// Fixed regardless of viewport size or how long the session has run, per the
// pitch's performance_risk note: the simulation cost must stay flat.
const GRID_W = 24
const GRID_H = 16
const DRAINAGE_FRACTION_PER_MS = 0.00009
const DIFFUSION_RATE = 0.16
const RUPTURE_THRESHOLD = 0.09
const POINTER_FLOOR_ABOVE_THRESHOLD = 1.45 // pointer thinning alone can never cross RUPTURE_THRESHOLD
const POINTER_THIN_RATE_PER_MS = 0.0011
const POINTER_RADIUS_CELLS = 3
const MAX_CYCLE_MS = 42000 // forced rupture if nothing has naturally thinned out by then
const TEAR_DURATION_MS = 620
const RESEED_PAUSE_MS = 550
const CLICK_RUPTURE_COOLDOWN_MS = TEAR_DURATION_MS + RESEED_PAUSE_MS + 400 // never faster than one natural cycle

type RuptureState =
  | { phase: 'none' }
  | {
      phase: 'tearing'
      originU: number
      originV: number
      maxRadius: number
      elapsedMs: number
    }
  | { phase: 'paused'; elapsedMs: number }

let thickness = new Float32Array(GRID_W * GRID_H)
let thicknessNext = new Float32Array(GRID_W * GRID_H)
let hueSeed = 0
let cycleElapsedMs = 0
let rupture: RuptureState = { phase: 'none' }
let clickCooldownMs = 0

const pointer = { x: 0, y: 0, active: false }

let loopX = 0
let loopY = 0
let loopW = 1
let loopH = 1

let filmCanvas: HTMLCanvasElement | null = null
let filmContext: CanvasRenderingContext2D | null = null
let filmImageData: ImageData | null = null

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function cellIndex(gx: number, gy: number): number {
  return gy * GRID_W + gx
}

function cellAt(grid: Float32Array, gx: number, gy: number): number {
  return grid[cellIndex(gx, gy)] ?? 0
}

function seedThicknessGrid(): void {
  hueSeed = Math.random() * Math.PI * 2
  for (let gy = 0; gy < GRID_H; gy += 1) {
    for (let gx = 0; gx < GRID_W; gx += 1) {
      const noise = (Math.random() - 0.5) * 0.08
      thickness[cellIndex(gx, gy)] = clamp(0.62 + noise, 0.4, 0.85)
    }
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360
  const a = s * Math.min(l, 1 - l)
  const f = (n: number): number => {
    const k = (n + hue / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ]
}

// A compact, non-physical approximation of thin-film interference: thickness
// maps to hue through a couple of stacked periodic terms rather than a real
// spectral integral, giving the continuously drifting rainbow-swirl look.
function colorForThickness(t: number): [number, number, number, number] {
  const hue =
    200 +
    150 * Math.sin(t * 17.5 + hueSeed) +
    55 * Math.sin(t * 6.4 + hueSeed * 1.6)
  const sat = 0.68
  const light = clamp(0.4 + t * 0.32, 0.22, 0.72)
  const [r, g, b] = hslToRgb(hue, sat, light)
  const alpha = clamp(0.3 + t * 0.85, 0.22, 0.92)
  return [r, g, b, Math.round(alpha * 255)]
}

function updateThicknessField(deltaMs: number): void {
  const drainAmount = DRAINAGE_FRACTION_PER_MS * deltaMs

  // Drainage: thickness migrates downward each row; the bottom row's outflow
  // leaves the visible field entirely (absorbed by the wire loop), which is
  // what causes the field to thin out overall rather than just resettle.
  for (let gy = GRID_H - 1; gy >= 0; gy -= 1) {
    for (let gx = 0; gx < GRID_W; gx += 1) {
      const idx = cellIndex(gx, gy)
      const flow = cellAt(thickness, gx, gy) * drainAmount
      thickness[idx] = cellAt(thickness, gx, gy) - flow
      if (gy < GRID_H - 1) {
        const belowIdx = cellIndex(gx, gy + 1)
        thickness[belowIdx] = cellAt(thickness, gx, gy + 1) + flow * 0.85
      }
    }
  }

  // Diffusion: smooth sharp edges via a cheap 4-neighbor blend, ping-ponged
  // into a second buffer so every cell reads the same pre-diffusion frame.
  for (let gy = 0; gy < GRID_H; gy += 1) {
    for (let gx = 0; gx < GRID_W; gx += 1) {
      const idx = cellIndex(gx, gy)
      const left = cellAt(thickness, gx > 0 ? gx - 1 : gx, gy)
      const right = cellAt(thickness, gx < GRID_W - 1 ? gx + 1 : gx, gy)
      const up = cellAt(thickness, gx, gy > 0 ? gy - 1 : gy)
      const down = cellAt(thickness, gx, gy < GRID_H - 1 ? gy + 1 : gy)
      const neighborAvg = (left + right + up + down) / 4
      thicknessNext[idx] =
        cellAt(thickness, gx, gy) * (1 - DIFFUSION_RATE) +
        neighborAvg * DIFFUSION_RATE
    }
  }

  const swap = thickness
  thickness = thicknessNext
  thicknessNext = swap

  if (pointer.active) {
    const gx = clamp(
      Math.round((pointer.x / loopW) * (GRID_W - 1)),
      0,
      GRID_W - 1,
    )
    const gy = clamp(
      Math.round((pointer.y / loopH) * (GRID_H - 1)),
      0,
      GRID_H - 1,
    )
    const floor = RUPTURE_THRESHOLD * POINTER_FLOOR_ABOVE_THRESHOLD
    const thinAmount = POINTER_THIN_RATE_PER_MS * deltaMs
    for (let dy = -POINTER_RADIUS_CELLS; dy <= POINTER_RADIUS_CELLS; dy += 1) {
      for (
        let dx = -POINTER_RADIUS_CELLS;
        dx <= POINTER_RADIUS_CELLS;
        dx += 1
      ) {
        const nx = gx + dx
        const ny = gy + dy
        if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue
        const dist = Math.hypot(dx, dy)
        if (dist > POINTER_RADIUS_CELLS) continue
        const falloff = 1 - dist / POINTER_RADIUS_CELLS
        const idx = cellIndex(nx, ny)
        thickness[idx] = Math.max(
          floor,
          cellAt(thickness, nx, ny) - thinAmount * falloff,
        )
      }
    }
  }
}

function findThinnestCell(): { gx: number; gy: number; value: number } {
  let best = { gx: 0, gy: 0, value: Number.POSITIVE_INFINITY }
  for (let gy = 0; gy < GRID_H; gy += 1) {
    for (let gx = 0; gx < GRID_W; gx += 1) {
      const value = cellAt(thickness, gx, gy)
      if (value < best.value) best = { gx, gy, value }
    }
  }
  return best
}

function startRupture(u: number, v: number): void {
  const corners = [
    Math.hypot(u - 0, v - 0),
    Math.hypot(u - 1, v - 0),
    Math.hypot(u - 0, v - 1),
    Math.hypot(u - 1, v - 1),
  ]
  const maxRadius = Math.max(...corners) * 1.05
  rupture = {
    phase: 'tearing',
    originU: u,
    originV: v,
    maxRadius,
    elapsedMs: 0,
  }
}

function advanceCycle(deltaMs: number): void {
  if (rupture.phase === 'tearing') {
    rupture = { ...rupture, elapsedMs: rupture.elapsedMs + deltaMs }
    if (rupture.elapsedMs >= TEAR_DURATION_MS) {
      rupture = { phase: 'paused', elapsedMs: 0 }
    }
    return
  }

  if (rupture.phase === 'paused') {
    rupture = { phase: 'paused', elapsedMs: rupture.elapsedMs + deltaMs }
    if (rupture.elapsedMs >= RESEED_PAUSE_MS) {
      seedThicknessGrid()
      cycleElapsedMs = 0
      rupture = { phase: 'none' }
    }
    return
  }

  updateThicknessField(deltaMs)
  cycleElapsedMs += deltaMs

  const thinnest = findThinnestCell()
  if (thinnest.value <= RUPTURE_THRESHOLD) {
    startRupture((thinnest.gx + 0.5) / GRID_W, (thinnest.gy + 0.5) / GRID_H)
    return
  }

  if (cycleElapsedMs >= MAX_CYCLE_MS) {
    startRupture(0.5, 0.5)
  }
}

function ensureFilmCanvas(): void {
  if (filmCanvas) return
  filmCanvas = document.createElement('canvas')
  filmCanvas.width = GRID_W
  filmCanvas.height = GRID_H
  filmContext = filmCanvas.getContext('2d', { alpha: true })
  filmImageData = filmContext?.createImageData(GRID_W, GRID_H) ?? null
}

function tearRadiusForPixel(u: number, v: number): number {
  if (rupture.phase !== 'tearing') return Number.POSITIVE_INFINITY
  const progress = clamp(rupture.elapsedMs / TEAR_DURATION_MS, 0, 1)
  const currentRadius = progress * rupture.maxRadius
  const dist = Math.hypot(u - rupture.originU, v - rupture.originV)
  return dist - currentRadius
}

function renderFilmTexture(staticFrame: boolean): void {
  ensureFilmCanvas()
  if (!filmContext || !filmImageData) return

  const data = filmImageData.data
  for (let gy = 0; gy < GRID_H; gy += 1) {
    for (let gx = 0; gx < GRID_W; gx += 1) {
      const idx = cellIndex(gx, gy)
      const t = staticFrame ? 0.62 : cellAt(thickness, gx, gy)
      const [r, g, b, a] = colorForThickness(t)
      const pixelOffset = idx * 4

      let alpha = a
      if (!staticFrame) {
        const u = (gx + 0.5) / GRID_W
        const v = (gy + 0.5) / GRID_H
        if (tearRadiusForPixel(u, v) <= 0) alpha = 0
        if (rupture.phase === 'paused') alpha = 0
      }

      data[pixelOffset] = r
      data[pixelOffset + 1] = g
      data[pixelOffset + 2] = b
      data[pixelOffset + 3] = alpha
    }
  }

  filmContext.putImageData(filmImageData, 0, 0)
}

function drawWireLoop(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(200, 200, 210, 0.85)'
  ctx.lineWidth = Math.max(2, loopW * 0.012)
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
  ctx.shadowBlur = 6
  ctx.strokeRect(loopX, loopY, loopW, loopH)
  ctx.restore()
}

function drawFilm(ctx: CanvasRenderingContext2D, staticFrame: boolean): void {
  renderFilmTexture(staticFrame)
  if (!filmCanvas) return

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(filmCanvas, loopX, loopY, loopW, loopH)
  ctx.restore()

  drawWireLoop(ctx)
}

function drawStaticFrame(ctx: CanvasRenderingContext2D): void {
  const breathe = 0.6 + Math.sin(simTime * 0.0007) * 0.06
  hueSeed = breathe * 3
  drawFilm(ctx, true)
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

  if (clickCooldownMs > 0)
    clickCooldownMs = Math.max(0, clickCooldownMs - delta)

  advanceCycle(delta)
  drawFilm(context, false)

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

  const localX = point.x - loopX
  const localY = point.y - loopY
  if (localX < 0 || localY < 0 || localX > loopW || localY > loopH) {
    pointer.active = false
    return
  }

  pointer.x = localX
  pointer.y = localY
  pointer.active = true
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (rupture.phase !== 'none') return
  if (clickCooldownMs > 0) return

  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  const localX = point.x - loopX
  const localY = point.y - loopY
  if (localX < 0 || localY < 0 || localX > loopW || localY > loopH) return

  clickCooldownMs = CLICK_RUPTURE_COOLDOWN_MS
  startRupture(localX / loopW, localY / loopH)
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

  loopW = clamp(Math.min(width, height) * 0.62, 200, 480)
  loopH = loopW * 0.66
  loopX = (width - loopW) / 2
  loopY = (height - loopH) / 2
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  context = canvas.getContext('2d', { alpha: true })
  if (!context) return

  seedThicknessGrid()

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
  filmCanvas = null
  filmContext = null
  filmImageData = null
})
</script>

<style scoped>
.soap-film-membrane {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .soap-film-membrane {
    opacity: 0.6;
  }
}
</style>
