<template>
  <canvas ref="canvasRef" class="honeycomb-hive" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const POUR_COOLDOWN_MS = 3000
const POUR_DURATION = 4 // seconds a golden pour ripple stays visible
const FILL_PERIOD = 48 // seconds for one fill → cap → harvest cycle per cell
const TWO_PI = Math.PI * 2
const SQRT3 = Math.sqrt(3)

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let pourStart = -100
let pourX = 0
let pourY = 0
let lastPourTs = 0
let pointerX = -1
let pointerY = -1

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
  pointerX = point ? point.x : -1
  pointerY = point ? point.y : -1
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastPourTs < POUR_COOLDOWN_MS) return
  lastPourTs = now
  pourStart = clock
  pourX = point.x
  pourY = point.y
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
}

// A warm frame of honeycomb seen up close. Every cell slowly fills with
// honey, is sealed under a pale wax cap, then is harvested and starts again;
// each cell's state is a closed-form function of the clock and a per-cell
// hash, so nothing is stored per frame. Worker bees trace looping paths over
// the comb. Hover draws nearby bees toward the pointer; a rate-limited click
// pours a golden ripple outward through the cells.

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function hexPath(cx: number, cy: number, r: number): void {
  if (!context) return
  context.beginPath()
  for (let k = 0; k < 6; k += 1) {
    const a = Math.PI / 6 + (k * Math.PI) / 3
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    if (k === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.closePath()
}

// 0..1 honey level and whether the cell is capped, for one cell.
function cellState(seed: number): { fill: number; capped: boolean } {
  const u = (clock / FILL_PERIOD + hash(seed)) % 1
  if (u < 0.7) return { fill: u / 0.7, capped: false }
  if (u < 0.93) return { fill: 1, capped: true }
  // Harvest: the cap is lifted and the honey drains quickly.
  return { fill: 1 - (u - 0.93) / 0.07, capped: false }
}

function pourGlow(cx: number, cy: number, r: number): number {
  const age = clock - pourStart
  if (age < 0 || age > POUR_DURATION) return 0
  const radius = age * Math.max(width, height) * 0.35
  const d = Math.hypot(cx - pourX, cy - pourY)
  const band = Math.abs(d - radius)
  if (band > r * 3) return 0
  return (1 - band / (r * 3)) * (1 - age / POUR_DURATION)
}

function drawComb(r: number): void {
  if (!context) return
  const bg = context.createRadialGradient(
    width * 0.5,
    height * 0.45,
    0,
    width * 0.5,
    height * 0.45,
    Math.max(width, height) * 0.75,
  )
  bg.addColorStop(0, '#6b3d0c')
  bg.addColorStop(1, '#2a1503')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)

  const dx = SQRT3 * r
  const dy = 1.5 * r
  const cols = Math.ceil(width / dx) + 2
  const rows = Math.ceil(height / dy) + 2
  for (let row = -1; row < rows; row += 1) {
    for (let col = -1; col < cols; col += 1) {
      const cx = col * dx + (row % 2 ? dx / 2 : 0)
      const cy = row * dy
      const seed = (row + 7) * 131 + col
      const { fill, capped } = cellState(seed)
      const glow = reducedMotion ? 0 : pourGlow(cx, cy, r)

      // Wax wall.
      hexPath(cx, cy, r * 0.98)
      context.fillStyle = '#d9a441'
      context.fill()
      // Cell interior (empty depth).
      hexPath(cx, cy, r * 0.84)
      context.fillStyle = '#4a2706'
      context.fill()

      if (capped) {
        hexPath(cx, cy, r * 0.84)
        const cap = context.createRadialGradient(
          cx - r * 0.25,
          cy - r * 0.3,
          0,
          cx,
          cy,
          r * 0.9,
        )
        cap.addColorStop(0, '#fbe7b0')
        cap.addColorStop(1, '#d8b061')
        context.fillStyle = cap
        context.fill()
      } else if (fill > 0.02) {
        hexPath(cx, cy, r * 0.84 * (0.35 + 0.65 * fill))
        const honey = context.createRadialGradient(
          cx - r * 0.2,
          cy - r * 0.25,
          0,
          cx,
          cy,
          r * 0.85,
        )
        honey.addColorStop(0, '#ffd56a')
        honey.addColorStop(1, fill > 0.6 ? '#d9860b' : '#b8690a')
        context.globalAlpha = 0.45 + 0.55 * fill
        context.fillStyle = honey
        context.fill()
        context.globalAlpha = 1
        // A glint on the honey surface.
        context.fillStyle = `rgba(255, 250, 220, ${0.25 * fill})`
        context.beginPath()
        context.ellipse(
          cx - r * 0.25,
          cy - r * 0.3,
          r * 0.18,
          r * 0.09,
          -0.5,
          0,
          TWO_PI,
        )
        context.fill()
      }

      if (glow > 0) {
        hexPath(cx, cy, r * 0.98)
        context.fillStyle = `rgba(255, 214, 90, ${0.55 * glow})`
        context.fill()
      }
    }
  }

  // Warm light from above and a soft vignette.
  const light = context.createLinearGradient(0, 0, 0, height)
  light.addColorStop(0, 'rgba(255, 220, 140, 0.12)')
  light.addColorStop(1, 'rgba(30, 10, 0, 0.3)')
  context.fillStyle = light
  context.fillRect(0, 0, width, height)
}

function beePosition(k: number, t: number): { x: number; y: number } {
  const fx = 0.11 + hash(k + 20) * 0.12
  const fy = 0.09 + hash(k + 21) * 0.13
  const x =
    width *
    (0.5 +
      0.4 * Math.sin(t * fx + hash(k + 22) * TWO_PI) +
      0.07 * Math.sin(t * fx * 3.7 + k))
  const y =
    height *
    (0.5 +
      0.38 * Math.sin(t * fy + hash(k + 23) * TWO_PI) +
      0.06 * Math.cos(t * fy * 4.3 + k * 2))
  if (pointerX < 0) return { x, y }
  // Hover pulls nearby bees toward the pointer, each to its own orbit.
  const d = Math.hypot(x - pointerX, y - pointerY)
  const pull = Math.exp(-d / (Math.min(width, height) * 0.3)) * 0.85
  const orbit = Math.min(width, height) * (0.05 + hash(k + 24) * 0.05)
  const a = t * (1.5 + hash(k + 25)) + k
  const tx = pointerX + Math.cos(a) * orbit
  const ty = pointerY + Math.sin(a) * orbit * 0.7
  return { x: x + (tx - x) * pull, y: y + (ty - y) * pull }
}

function drawBee(k: number, size: number): void {
  if (!context) return
  const t = clock + hash(k + 30) * 100
  const p = beePosition(k, t)
  const q = beePosition(k, t - 0.05)
  const heading = Math.atan2(p.y - q.y, p.x - q.x)
  const bob = Math.sin(clock * 6 + k) * size * 0.15

  context.save()
  context.translate(p.x, p.y + bob)
  context.rotate(heading)

  // Soft shadow on the comb.
  context.fillStyle = 'rgba(20, 8, 0, 0.25)'
  context.beginPath()
  context.ellipse(
    -size * 0.2,
    size * 0.9,
    size * 0.9,
    size * 0.35,
    0,
    0,
    TWO_PI,
  )
  context.fill()

  // Wings, flickering.
  const flap = reducedMotion
    ? 0.8
    : 0.55 + 0.45 * Math.abs(Math.sin(clock * 38 + k))
  context.fillStyle = 'rgba(235, 245, 255, 0.55)'
  context.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  context.lineWidth = 0.75
  for (const side of [-1, 1]) {
    context.beginPath()
    context.ellipse(
      -size * 0.1,
      side * size * 0.45 * flap,
      size * 0.55,
      size * 0.28 * flap,
      side * 0.5,
      0,
      TWO_PI,
    )
    context.fill()
    context.stroke()
  }

  // Striped abdomen, thorax and head.
  context.fillStyle = '#f6c431'
  context.beginPath()
  context.ellipse(-size * 0.35, 0, size * 0.62, size * 0.42, 0, 0, TWO_PI)
  context.fill()
  context.save()
  context.clip()
  context.fillStyle = '#2b1a05'
  for (let s = 0; s < 3; s += 1) {
    context.fillRect(-size * (0.75 - s * 0.32), -size, size * 0.14, size * 2)
  }
  context.restore()
  context.fillStyle = '#3a2408'
  context.beginPath()
  context.arc(size * 0.3, 0, size * 0.3, 0, TWO_PI)
  context.fill()
  context.beginPath()
  context.arc(size * 0.62, 0, size * 0.22, 0, TWO_PI)
  context.fill()
  context.strokeStyle = '#2b1a05'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(size * 0.75, -size * 0.1)
  context.lineTo(size * 1.0, -size * 0.32)
  context.moveTo(size * 0.75, size * 0.1)
  context.lineTo(size * 1.0, size * 0.32)
  context.stroke()
  context.restore()
}

function drawScene(): void {
  if (!context) return
  const narrow = width < 600
  const r = Math.max(14, Math.min(width, height) * (narrow ? 0.07 : 0.05))
  drawComb(r)
  const beeCount = narrow ? 8 : 13
  const size = r * 0.6
  for (let k = 0; k < beeCount; k += 1) drawBee(k, size)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  clock += dt
  drawScene()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function drawStill(): void {
  clock = 20
  pourStart = -100
  drawScene()
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  pointerX = -1
  pointerY = -1
  if (reducedMotion) {
    if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    drawStill()
  } else if (animationFrameId === null) {
    lastFrameTs = 0
    animationFrameId = window.requestAnimationFrame(renderFrame)
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  context = canvas.getContext('2d')
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)

  resizeObserver = new ResizeObserver(() => {
    resizeCanvas()
    if (reducedMotion) drawStill()
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawStill()
  else animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionChange)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)
  context = null
})
</script>

<style scoped>
.honeycomb-hive {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
