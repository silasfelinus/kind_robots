<template>
  <canvas ref="canvasRef" class="starling-murmuration" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const TWO_PI = Math.PI * 2
const MAX_BIRDS = 420
const CELL = 36 // spatial-hash cell size in CSS pixels
const STOOP_COOLDOWN_MS = 2200
const STOOP_SECONDS = 2.4

// Starlings gather over a reed bed at dusk. Every bird follows three local
// rules (keep a little space, match the neighbours' heading, drift toward
// the neighbours' centre) plus a slow wandering "roost pull", and the whole
// flock folds into ribbons, funnels and dark knots that no single bird is
// steering. Neighbours are found through a fixed spatial hash, so each
// frame is linear in the flock size and nothing grows over time.
// Hovering is a hawk: birds near it swerve away and the flock parts round
// it. A rate-limited click makes the hawk stoop, sending a wave of panic
// rippling outward through the flock.

const xs = new Float32Array(MAX_BIRDS)
const ys = new Float32Array(MAX_BIRDS)
const vxs = new Float32Array(MAX_BIRDS)
const vys = new Float32Array(MAX_BIRDS)
const panic = new Float32Array(MAX_BIRDS)
const nextInCell = new Int32Array(MAX_BIRDS)
let cellHeads = new Int32Array(1)
let gridCols = 1
let gridRows = 1

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let birdCount = MAX_BIRDS
let reducedMotion = false
let pointerX = -1
let pointerY = -1
let lastStoopTs = 0
let stoopX = 0
let stoopY = 0
let stoopStart = -100
let seed = 1

function random(): number {
  // mulberry32: deterministic so the reduced-motion still is stable.
  seed = (seed + 0x6d2b79f5) | 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
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
  pointerX = point ? point.x : -1
  pointerY = point ? point.y : -1
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastStoopTs < STOOP_COOLDOWN_MS) return
  lastStoopTs = now
  stoopX = point.x
  stoopY = point.y
  stoopStart = clock
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
  birdCount = width < 600 ? 240 : MAX_BIRDS
  gridCols = Math.max(1, Math.ceil(width / CELL))
  gridRows = Math.max(1, Math.ceil(height / CELL))
  if (cellHeads.length !== gridCols * gridRows)
    cellHeads = new Int32Array(gridCols * gridRows)
  for (let i = 0; i < MAX_BIRDS; i += 1) {
    xs[i] = Math.min(width - 1, Math.max(0, xs[i] ?? 0))
    ys[i] = Math.min(height - 1, Math.max(0, ys[i] ?? 0))
  }
}

function unit(): number {
  return Math.min(width, height) / 700
}

function horizon(): number {
  return height * 0.8
}

function seedFlock(): void {
  // Start as a loose cloud in the upper middle of the sky.
  const cx = width * 0.5
  const cy = height * 0.38
  const spread = Math.min(width, height) * 0.22
  for (let i = 0; i < MAX_BIRDS; i += 1) {
    const a = random() * TWO_PI
    const r = Math.sqrt(random()) * spread
    xs[i] = cx + Math.cos(a) * r * 1.6
    ys[i] = cy + Math.sin(a) * r * 0.7
    const h = random() * 0.8 - 0.4
    vxs[i] = Math.cos(h) * 80
    vys[i] = Math.sin(h) * 80
    panic[i] = 0
  }
  stoopStart = -100
}

function roostPoint(): { x: number; y: number } {
  // A slow Lissajous wander keeps the flock moving over the reed bed.
  return {
    x: width * (0.5 + 0.3 * Math.sin(clock * 0.11)),
    y: height * (0.38 + 0.14 * Math.sin(clock * 0.17 + 1.3)),
  }
}

function buildGrid(): void {
  cellHeads.fill(-1)
  for (let i = 0; i < birdCount; i += 1) {
    const cx = Math.min(gridCols - 1, Math.max(0, Math.floor(xs[i]! / CELL)))
    const cy = Math.min(gridRows - 1, Math.max(0, Math.floor(ys[i]! / CELL)))
    const cell = cy * gridCols + cx
    nextInCell[i] = cellHeads[cell]!
    cellHeads[cell] = i
  }
}

function stepFlock(dt: number): void {
  if (dt <= 0) return
  buildGrid()
  const u = Math.max(0.6, unit())
  const minSpeed = 70 * u
  const maxSpeed = 150 * u
  const sepRadius = 13 * u
  const margin = Math.min(width, height) * 0.12
  const roost = roostPoint()
  const hawkReach = 120 * u
  const stoopAge = clock - stoopStart
  const waveRadius = stoopAge * 420 * u
  const waveActive = stoopAge >= 0 && stoopAge < STOOP_SECONDS

  for (let i = 0; i < birdCount; i += 1) {
    const x = xs[i]!
    const y = ys[i]!
    let ax = 0
    let ay = 0
    let avx = 0
    let avy = 0
    let cx = 0
    let cy = 0
    let sx = 0
    let sy = 0
    let n = 0
    let neighbourPanic = 0
    const gx = Math.floor(x / CELL)
    const gy = Math.floor(y / CELL)
    for (let oy = -1; oy <= 1; oy += 1) {
      const row = gy + oy
      if (row < 0 || row >= gridRows) continue
      for (let ox = -1; ox <= 1; ox += 1) {
        const col = gx + ox
        if (col < 0 || col >= gridCols) continue
        let j = cellHeads[row * gridCols + col]!
        // Topological rule: seven nearest-ish neighbours are plenty.
        let seen = 0
        while (j !== -1 && seen < 10) {
          if (j !== i) {
            const dx = xs[j]! - x
            const dy = ys[j]! - y
            const d2 = dx * dx + dy * dy
            if (d2 < CELL * CELL) {
              avx += vxs[j]!
              avy += vys[j]!
              cx += dx
              cy += dy
              n += 1
              seen += 1
              if (panic[j]! > neighbourPanic) neighbourPanic = panic[j]!
              if (d2 < sepRadius * sepRadius && d2 > 0.0001) {
                const d = Math.sqrt(d2)
                sx -= (dx / d) * (sepRadius - d)
                sy -= (dy / d) * (sepRadius - d)
              }
            }
          }
          j = nextInCell[j]!
        }
      }
    }
    if (n > 0) {
      ax += (avx / n - vxs[i]!) * 1.6 // alignment
      ay += (avy / n - vys[i]!) * 1.6
      ax += (cx / n) * 0.7 // cohesion
      ay += (cy / n) * 0.7
    }
    ax += sx * 22 // separation
    ay += sy * 22

    // Roost pull, gentle so ribbons can stretch before folding back.
    ax += (roost.x - x) * 0.18
    ay += (roost.y - y) * 0.28

    // Keep above the reeds and inside the sky.
    const floor = horizon() - 30 * u
    if (y > floor) ay -= (y - floor) * 6
    if (y < margin) ay += (margin - y) * 8
    if (x < margin) ax += (margin - x) * 8
    if (x > width - margin) ax -= (x - (width - margin)) * 8

    // Hawk: birds within reach flare away.
    if (pointerX >= 0) {
      const dx = x - pointerX
      const dy = y - pointerY
      const d2 = dx * dx + dy * dy
      if (d2 < hawkReach * hawkReach && d2 > 0.01) {
        const d = Math.sqrt(d2)
        const push = (1 - d / hawkReach) * 1400 * u
        ax += (dx / d) * push
        ay += (dy / d) * push
        panic[i] = Math.max(panic[i]!, 1 - d / hawkReach)
      }
    }

    // Stoop: an expanding shell of panic passes through the flock.
    if (waveActive) {
      const dx = x - stoopX
      const dy = y - stoopY
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      const shell = Math.abs(d - waveRadius)
      if (shell < 40 * u) {
        const strength = (1 - shell / (40 * u)) * (1 - stoopAge / STOOP_SECONDS)
        ax += (dx / d) * 2200 * u * strength
        ay += (dy / d) * 2200 * u * strength
        panic[i] = Math.max(panic[i]!, strength)
      }
    }

    // Panic is contagious: it travels bird to bird, decaying as it goes.
    panic[i] = Math.max(panic[i]! - dt * 1.2, neighbourPanic * 0.9 - 0.04, 0)
    const jitter = panic[i]! * 260 * u
    ax += (hash(i * 1.3 + clock * 9) - 0.5) * jitter
    ay += (hash(i * 2.7 + clock * 9) - 0.5) * jitter

    let vx = vxs[i]! + ax * dt
    let vy = vys[i]! + ay * dt
    const speed = Math.hypot(vx, vy) || 1
    const cap = maxSpeed * (1 + panic[i]! * 0.6)
    if (speed > cap) {
      vx = (vx / speed) * cap
      vy = (vy / speed) * cap
    } else if (speed < minSpeed) {
      vx = (vx / speed) * minSpeed
      vy = (vy / speed) * minSpeed
    }
    vxs[i] = vx
    vys[i] = vy
  }

  for (let i = 0; i < birdCount; i += 1) {
    // Bounce rather than pin if a panicked bird reaches the frame edge.
    let nx = xs[i]! + vxs[i]! * dt
    let ny = ys[i]! + vys[i]! * dt
    if (nx < 0 || nx > width) {
      vxs[i] = -vxs[i]!
      nx = Math.min(width, Math.max(0, nx))
    }
    if (ny < 0 || ny > height) {
      vys[i] = -vys[i]!
      ny = Math.min(height, Math.max(0, ny))
    }
    xs[i] = nx
    ys[i] = ny
  }
}

function drawSky(): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, horizon())
  sky.addColorStop(0, '#2a2f5a')
  sky.addColorStop(0.45, '#8a5a7a')
  sky.addColorStop(0.8, '#e69a6a')
  sky.addColorStop(1, '#f6c98a')
  context.fillStyle = sky
  context.fillRect(0, 0, width, horizon())

  // Low sun sitting on the far marsh.
  const sunX = width * 0.68
  const sunY = horizon() - 6
  const glow = context.createRadialGradient(
    sunX,
    sunY,
    0,
    sunX,
    sunY,
    height * 0.5,
  )
  glow.addColorStop(0, 'rgba(255, 220, 160, 0.55)')
  glow.addColorStop(1, 'rgba(255, 200, 140, 0)')
  context.fillStyle = glow
  context.fillRect(0, 0, width, horizon())
  context.fillStyle = 'rgba(255, 232, 190, 0.9)'
  context.beginPath()
  context.arc(sunX, sunY, Math.max(14, height * 0.035), Math.PI, 0)
  context.fill()

  // A few thin cloud bars, closed-form in time.
  for (let k = 0; k < 4; k += 1) {
    const y = height * (0.12 + k * 0.11)
    const x =
      ((hash(k * 4.1) * width + clock * (4 + k * 2)) % (width + 400)) - 200
    context.fillStyle = `rgba(255, 190, 170, ${0.12 + hash(k) * 0.08})`
    context.beginPath()
    context.ellipse(x, y, 160 + hash(k * 2.3) * 120, 5 + k, 0, 0, TWO_PI)
    context.fill()
  }
}

function drawMarsh(): void {
  if (!context) return
  const h = horizon()
  // Water band reflecting the sky.
  const water = context.createLinearGradient(0, h, 0, height)
  water.addColorStop(0, '#c98a6a')
  water.addColorStop(1, '#2a2338')
  context.fillStyle = water
  context.fillRect(0, h, width, height - h)
  // Glints on the water.
  context.fillStyle = 'rgba(255, 225, 180, 0.35)'
  for (let k = 0; k < 18; k += 1) {
    const gx = width * 0.68 + (hash(k * 3.7) - 0.5) * width * 0.25
    const gy = h + 6 + hash(k * 5.1) * (height - h) * 0.6
    const len = 8 + hash(k * 9.2) * 26 + Math.sin(clock * 1.5 + k) * 4
    context.fillRect(gx - len / 2, gy, len, 1.2)
  }
  // Reed silhouettes swaying in the evening breeze.
  context.strokeStyle = '#1a1424'
  context.lineCap = 'round'
  const reeds = width < 600 ? 70 : 150
  for (let k = 0; k < reeds; k += 1) {
    const rx = hash(k * 1.9) * width
    const base = h + 10 + hash(k * 6.1) * (height - h)
    // Perspective: nearer reeds (lower on screen) stand taller.
    const tall = 10 + (base - h) * (0.5 + hash(k * 2.9) * 0.7)
    const sway = Math.sin(clock * 0.9 + rx * 0.02) * 6 * (tall / 100)
    context.lineWidth = 1.2 + hash(k * 4.4) * 1.4
    context.beginPath()
    context.moveTo(rx, base)
    context.quadraticCurveTo(
      rx + sway * 0.3,
      base - tall * 0.6,
      rx + sway,
      base - tall,
    )
    context.stroke()
    if (hash(k * 8.8) > 0.6) {
      context.fillStyle = '#1a1424'
      context.beginPath()
      context.ellipse(
        rx + sway,
        base - tall - 6,
        2.5,
        8,
        sway * 0.03,
        0,
        TWO_PI,
      )
      context.fill()
    }
  }
}

function drawBirds(): void {
  if (!context) return
  const u = Math.max(0.7, unit())
  context.fillStyle = 'rgba(20, 14, 26, 0.92)'
  context.beginPath()
  for (let i = 0; i < birdCount; i += 1) {
    const x = xs[i]!
    const y = ys[i]!
    const speed = Math.hypot(vxs[i]!, vys[i]!) || 1
    const dx = vxs[i]! / speed
    const dy = vys[i]! / speed
    // A tiny wing-flap: the span pulses with a per-bird phase.
    const flap = 0.6 + 0.4 * Math.sin(clock * 14 + i * 1.7)
    const len = 2.6 * u
    const span = (2.2 + flap * 1.4) * u
    context.moveTo(x + dx * len, y + dy * len)
    context.lineTo(x - dx * len - dy * span, y - dy * len + dx * span)
    context.lineTo(x - dx * len * 0.3, y - dy * len * 0.3)
    context.lineTo(x - dx * len + dy * span, y - dy * len - dx * span)
    context.closePath()
  }
  context.fill()
}

function drawHawk(): void {
  if (!context || pointerX < 0) return
  const u = Math.max(0.7, unit())
  const glide = Math.sin(clock * 2) * 2 * u
  context.fillStyle = 'rgba(30, 18, 22, 0.85)'
  context.beginPath()
  context.moveTo(pointerX, pointerY - 4 * u + glide)
  context.quadraticCurveTo(
    pointerX - 10 * u,
    pointerY - 8 * u,
    pointerX - 20 * u,
    pointerY + 2 * u + glide,
  )
  context.lineTo(pointerX - 4 * u, pointerY + 2 * u)
  context.lineTo(pointerX, pointerY + 8 * u)
  context.lineTo(pointerX + 4 * u, pointerY + 2 * u)
  context.lineTo(pointerX + 20 * u, pointerY + 2 * u + glide)
  context.quadraticCurveTo(
    pointerX + 10 * u,
    pointerY - 8 * u,
    pointerX,
    pointerY - 4 * u + glide,
  )
  context.fill()
}

function drawFrame(): void {
  if (!context) return
  drawSky()
  drawBirds()
  drawMarsh()
  drawHawk()
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.05, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  clock += dt
  stepFlock(dt)
  drawFrame()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function drawStill(): void {
  // A deterministic frame: settle the flock for a few simulated seconds.
  seed = 11
  clock = 0
  pointerX = -1
  pointerY = -1
  seedFlock()
  for (let k = 0; k < 120; k += 1) {
    clock += 1 / 30
    stepFlock(1 / 30)
  }
  drawFrame()
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
    seedFlock()
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
  else {
    seed = Math.floor(Math.random() * 1e9)
    seedFlock()
    animationFrameId = window.requestAnimationFrame(renderFrame)
  }
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
.starling-murmuration {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
