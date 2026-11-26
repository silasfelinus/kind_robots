<template>
  <canvas ref="canvasRef" class="cranberry-bog-harvest" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const TWO_PI = Math.PI * 2
const MAX_BERRIES = 900
const BOOM_SEGMENTS = 56
const MAX_RIPPLES = 10
const CLICK_COOLDOWN_MS = 350
const BOOM_CYCLE_S = 46
const CLUMP_PULL = 0.35
const GATHER_PULL = 0.05

// A flooded cranberry bog at golden hour. Hundreds of buoyant berries float
// on tea-dark water inside a yellow floating boom. Each berry is a little
// disc that collides with its neighbours (spatial hash), bobs on a gentle
// swell and drifts on a wandering breeze. The boom slowly tightens and
// relaxes over a long cycle, so the scattered berries gather into a packed
// crimson raft and loosen again. Moving the pointer draws a wake through the
// berries; a rate-limited click drops a stone whose ripple ring pushes the
// berries outward as it passes. Reduced motion draws a deterministic packed
// still.

interface Ripple {
  x: number
  y: number
  r: number
  strength: number
}

const bx = new Float32Array(MAX_BERRIES)
const by = new Float32Array(MAX_BERRIES)
const bvx = new Float32Array(MAX_BERRIES)
const bvy = new Float32Array(MAX_BERRIES)
const br = new Float32Array(MAX_BERRIES)
const bshade = new Float32Array(MAX_BERRIES)
const bphase = new Float32Array(MAX_BERRIES)
const boomX = new Float32Array(BOOM_SEGMENTS)
const boomY = new Float32Array(BOOM_SEGMENTS)
const ripples: Ripple[] = []

let berryCount = 0
let gridCell = 10
let gridCols = 1
let gridRows = 1
let gridHead = new Int32Array(1)
const gridNext = new Int32Array(MAX_BERRIES)

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let pointerX = -1
let pointerY = -1
let pointerVx = 0
let pointerVy = 0
let lastPointerTs = 0
let lastClickTs = 0
let pendingClickX = -1
let pendingClickY = -1
let seed = 1

// Bog geometry, recomputed on resize.
let horizonY = 0
let boomCx = 0
let boomCy = 0
let boomRx = 1
let boomRy = 1
let boomTight = 0

function random(): number {
  // mulberry32: deterministic so the reduced-motion still is stable.
  seed = (seed + 0x6d2b79f5) | 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function unit(): number {
  return Math.min(width, height) / 700
}

function layoutBog(): void {
  horizonY = height * (width > height ? 0.3 : 0.24)
  boomCx = width * 0.5
  boomCy = horizonY + (height - horizonY) * 0.55
  boomRx = width * 0.44
  boomRy = (height - horizonY) * 0.4
}

function boomScale(t: number): number {
  // 1 = wide open, 0.55 = the tight harvest raft. Eased so the boom lingers
  // at both ends of the cycle.
  const phase = (t / BOOM_CYCLE_S) % 1
  const s = 0.5 - 0.5 * Math.cos(phase * TWO_PI)
  const eased = s * s * (3 - 2 * s)
  return 1 - eased * 0.45
}

function swell(t: number, x: number, y: number): number {
  return (
    Math.sin(x * 0.012 + t * 0.9) * 0.6 +
    Math.sin(y * 0.02 - t * 1.3 + x * 0.004) * 0.4
  )
}

function breezeX(t: number): number {
  return Math.sin(t * 0.07) * 0.6 + Math.sin(t * 0.023 + 1.7) * 0.4
}

function breezeY(t: number): number {
  return Math.sin(t * 0.05 + 0.8) * 0.35
}

function updateBoom(t: number): void {
  const scale = boomScale(t)
  boomTight = (1 - scale) / 0.45
  const driftX = Math.sin(t * 0.031) * width * 0.03
  const driftY = Math.sin(t * 0.027 + 1) * (height - horizonY) * 0.03
  const cx = boomCx + driftX
  const cy = boomCy + driftY
  for (let i = 0; i < BOOM_SEGMENTS; i += 1) {
    const a = (i / BOOM_SEGMENTS) * TWO_PI
    const wobble = 1 + swell(t, Math.cos(a) * 200, Math.sin(a) * 200) * 0.012
    boomX[i] = cx + Math.cos(a) * boomRx * scale * wobble
    boomY[i] = cy + Math.sin(a) * boomRy * scale * wobble
  }
}

function seedBerries(): void {
  const u = unit()
  const area = width * (height - horizonY)
  berryCount = Math.max(
    240,
    Math.min(MAX_BERRIES, Math.floor(area / (1200 * u * u))),
  )
  for (let i = 0; i < berryCount; i += 1) {
    const a = random() * TWO_PI
    const d = Math.sqrt(random()) * 0.92
    bx[i] = boomCx + Math.cos(a) * boomRx * d
    by[i] = boomCy + Math.sin(a) * boomRy * d
    bvx[i] = 0
    bvy[i] = 0
    br[i] = (5.2 + random() * 2.4) * u
    bshade[i] = random()
    bphase[i] = random() * TWO_PI
  }
  gridCell = Math.max(4, 15 * u)
  gridCols = Math.max(1, Math.ceil(width / gridCell))
  gridRows = Math.max(1, Math.ceil(height / gridCell))
  gridHead = new Int32Array(gridCols * gridRows)
}

function buildGrid(): void {
  gridHead.fill(-1)
  for (let i = 0; i < berryCount; i += 1) {
    const cx = Math.min(
      gridCols - 1,
      Math.max(0, Math.floor((bx[i] ?? 0) / gridCell)),
    )
    const cy = Math.min(
      gridRows - 1,
      Math.max(0, Math.floor((by[i] ?? 0) / gridCell)),
    )
    const cell = cy * gridCols + cx
    gridNext[i] = gridHead[cell] ?? -1
    gridHead[cell] = i
  }
}

function resolveCollisions(): void {
  buildGrid()
  for (let i = 0; i < berryCount; i += 1) {
    const xi = bx[i] ?? 0
    const yi = by[i] ?? 0
    const ri = br[i] ?? 1
    const cx = Math.floor(xi / gridCell)
    const cy = Math.floor(yi / gridCell)
    for (let oy = -1; oy <= 1; oy += 1) {
      const gy = cy + oy
      if (gy < 0 || gy >= gridRows) continue
      for (let ox = -1; ox <= 1; ox += 1) {
        const gx = cx + ox
        if (gx < 0 || gx >= gridCols) continue
        let j = gridHead[gy * gridCols + gx] ?? -1
        while (j >= 0) {
          if (j > i) {
            const dx = (bx[j] ?? 0) - (bx[i] ?? 0)
            const dy = (by[j] ?? 0) - (by[i] ?? 0)
            const min = ri + (br[j] ?? 1)
            const d2 = dx * dx + dy * dy
            if (d2 < min * min && d2 > 1e-6) {
              const d = Math.sqrt(d2)
              const push = ((min - d) / d) * 0.5
              const px = dx * push
              const py = dy * push
              bx[i] = (bx[i] ?? 0) - px
              by[i] = (by[i] ?? 0) - py
              bx[j] = (bx[j] ?? 0) + px
              by[j] = (by[j] ?? 0) + py
              // Soft damping of the relative velocity so the raft settles.
              const rvx = ((bvx[j] ?? 0) - (bvx[i] ?? 0)) * 0.08
              const rvy = ((bvy[j] ?? 0) - (bvy[i] ?? 0)) * 0.08
              bvx[i] = (bvx[i] ?? 0) + rvx
              bvy[i] = (bvy[i] ?? 0) + rvy
              bvx[j] = (bvx[j] ?? 0) - rvx
              bvy[j] = (bvy[j] ?? 0) - rvy
            } else if (d2 < min * min * 1.8 && d2 > 1e-6) {
              // Cheerios effect: floating berries share a meniscus and
              // gently draw together into clumps.
              const d = Math.sqrt(d2)
              const pull = (CLUMP_PULL * (1 - (d - min) / (min * 0.34))) / d
              const px = dx * pull
              const py = dy * pull
              bvx[i] = (bvx[i] ?? 0) + px
              bvy[i] = (bvy[i] ?? 0) + py
              bvx[j] = (bvx[j] ?? 0) - px
              bvy[j] = (bvy[j] ?? 0) - py
            }
          }
          j = gridNext[j] ?? -1
        }
      }
    }
  }
}

function containInBoom(t: number): void {
  const scale = boomScale(t)
  const cx = boomCx + Math.sin(t * 0.031) * width * 0.03
  const cy = boomCy + Math.sin(t * 0.027 + 1) * (height - horizonY) * 0.03
  const rx = boomRx * scale
  const ry = boomRy * scale
  for (let i = 0; i < berryCount; i += 1) {
    const r = br[i] ?? 1
    const dx = (bx[i] ?? 0) - cx
    const dy = (by[i] ?? 0) - cy
    const ex = rx - r
    const ey = ry - r
    const k = (dx * dx) / (ex * ex) + (dy * dy) / (ey * ey)
    if (k > 1) {
      // Project back onto the inside of the boom ellipse.
      const f = 1 / Math.sqrt(k)
      const nx = cx + dx * f
      const ny = cy + dy * f
      bvx[i] = (bvx[i] ?? 0) + (nx - (bx[i] ?? 0)) * 0.6
      bvy[i] = (bvy[i] ?? 0) + (ny - (by[i] ?? 0)) * 0.6
      bx[i] = nx
      by[i] = ny
    }
  }
}

function stepPhysics(dt: number): void {
  const u = unit()
  const wx = breezeX(clock) * 6 * u
  const wy = breezeY(clock) * 4 * u
  const drag = Math.exp(-dt * 1.6)
  const wakeR = 70 * u
  const pointerLive = pointerX >= 0 && Math.hypot(pointerVx, pointerVy) > 20
  const gatherX = boomCx + Math.sin(clock * 0.031) * width * 0.03
  const gatherY =
    boomCy + Math.sin(clock * 0.027 + 1) * (height - horizonY) * 0.03
  for (let i = 0; i < berryCount; i += 1) {
    let ax = wx
    let ay = wy
    const x = bx[i] ?? 0
    const y = by[i] ?? 0
    // Swell slope pushes berries a little, giving the raft a living shimmer.
    const s = swell(clock, x, y) - swell(clock, x - 6, y)
    ax += s * 18 * u
    // A slow current toward the middle of the boom keeps the raft together.
    ax += (gatherX - x) * GATHER_PULL
    ay += (gatherY - y) * GATHER_PULL * 1.4
    if (pointerLive) {
      const dx = x - pointerX
      const dy = y - pointerY
      const d2 = dx * dx + dy * dy
      if (d2 < wakeR * wakeR) {
        const d = Math.sqrt(d2) + 1e-3
        const fall = 1 - d / wakeR
        // Drag along with the pointer and part to either side of its path.
        ax += pointerVx * fall * 2.2 + (dx / d) * fall * 260 * u
        ay += pointerVy * fall * 2.2 + (dy / d) * fall * 260 * u
      }
    }
    for (const rp of ripples) {
      const dx = x - rp.x
      const dy = y - rp.y
      const d = Math.hypot(dx, dy) + 1e-3
      const band = Math.abs(d - rp.r)
      if (band < 18 * u) {
        const f = (1 - band / (18 * u)) * rp.strength * 520 * u
        ax += (dx / d) * f
        ay += (dy / d) * f
      }
    }
    bvx[i] = ((bvx[i] ?? 0) + ax * dt) * drag
    bvy[i] = ((bvy[i] ?? 0) + ay * dt) * drag
    bx[i] = x + (bvx[i] ?? 0) * dt
    by[i] = y + (bvy[i] ?? 0) * dt
  }
  resolveCollisions()
  containInBoom(clock)
}

function stepRipples(dt: number): void {
  const u = unit()
  for (let k = ripples.length - 1; k >= 0; k -= 1) {
    const rp = ripples[k]
    if (!rp) continue
    rp.r += dt * 150 * u
    rp.strength *= Math.exp(-dt * 0.9)
    if (rp.strength < 0.03) ripples.splice(k, 1)
  }
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
  const now = performance.now()
  if (!point) {
    pointerX = -1
    pointerY = -1
    return
  }
  if (pointerX >= 0 && lastPointerTs) {
    const dt = Math.max(8, now - lastPointerTs) / 1000
    pointerVx = Math.max(-1400, Math.min(1400, (point.x - pointerX) / dt))
    pointerVy = Math.max(-1400, Math.min(1400, (point.y - pointerY) / dt))
  }
  lastPointerTs = now
  pointerX = point.x
  pointerY = point.y
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastClickTs < CLICK_COOLDOWN_MS) return
  lastClickTs = now
  pendingClickX = point.x
  pendingClickY = Math.max(horizonY + 4, point.y)
}

function applyClick(): void {
  if (ripples.length >= MAX_RIPPLES) ripples.shift()
  ripples.push({ x: pendingClickX, y: pendingClickY, r: 0, strength: 1 })
  pendingClickX = -1
  pendingClickY = -1
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas || !context) return
  const rect = canvas.getBoundingClientRect()
  const oldW = width
  const oldH = height
  width = Math.max(1, rect.width)
  height = Math.max(1, rect.height)
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  layoutBog()
  if (
    berryCount === 0 ||
    Math.abs(oldW - width) > 40 ||
    Math.abs(oldH - height) > 40
  ) {
    seedBerries()
  }
}

function drawSky(): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, horizonY)
  sky.addColorStop(0, '#3a3f6b')
  sky.addColorStop(0.55, '#c9775a')
  sky.addColorStop(1, '#f4c27c')
  context.fillStyle = sky
  context.fillRect(0, 0, width, horizonY + 1)

  // Low sun sitting on the treeline.
  const sunX = width * 0.72
  const sunY = horizonY - height * 0.03
  const glow = context.createRadialGradient(
    sunX,
    sunY,
    0,
    sunX,
    sunY,
    width * 0.35,
  )
  glow.addColorStop(0, 'rgba(255, 236, 190, 0.95)')
  glow.addColorStop(0.08, 'rgba(255, 214, 150, 0.7)')
  glow.addColorStop(1, 'rgba(255, 190, 120, 0)')
  context.fillStyle = glow
  context.fillRect(0, 0, width, horizonY + 1)

  // Distant treeline of pines and bare maples.
  const u = unit()
  context.fillStyle = '#2b2333'
  context.beginPath()
  context.moveTo(0, horizonY)
  const step = 9 * u
  for (let x = 0; x <= width + step; x += step) {
    const n =
      Math.sin(x * 0.031) * 0.5 +
      Math.sin(x * 0.087 + 2) * 0.3 +
      Math.sin(x * 0.21) * 0.2
    const tip = (x / step) % 3 < 1 ? 14 * u : 0
    context.lineTo(x, horizonY - (20 + n * 12) * u - tip)
  }
  context.lineTo(width, horizonY)
  context.closePath()
  context.fill()
}

function drawWater(): void {
  if (!context) return
  const water = context.createLinearGradient(0, horizonY, 0, height)
  water.addColorStop(0, '#8a5a4a')
  water.addColorStop(0.12, '#4a3036')
  water.addColorStop(1, '#1b1418')
  context.fillStyle = water
  context.fillRect(0, horizonY, width, height - horizonY)

  // Sun glitter path on the open water.
  const u = unit()
  const sunX = width * 0.72
  context.save()
  context.globalCompositeOperation = 'lighter'
  for (let k = 0; k < 70; k += 1) {
    const fy = (k + 0.5) / 70
    const y = horizonY + fy * fy * (height - horizonY)
    const spread = (10 + fy * 120) * u
    const flick = Math.sin(clock * 2.1 + k * 1.7) * 0.5 + 0.5
    const x = sunX + Math.sin(k * 12.9898 + clock * 0.4) * spread
    context.fillStyle = `rgba(255, 210, 150, ${0.06 + flick * 0.12 * (1 - fy)})`
    context.fillRect(
      x - spread * 0.3,
      y,
      spread * 0.6 * flick + 2 * u,
      Math.max(1, 1.5 * u),
    )
  }
  context.restore()
}

function drawRipples(): void {
  if (!context) return
  const u = unit()
  context.save()
  for (const rp of ripples) {
    context.strokeStyle = `rgba(255, 225, 190, ${0.35 * rp.strength})`
    context.lineWidth = 1.6 * u
    context.beginPath()
    context.ellipse(rp.x, rp.y, rp.r, rp.r * 0.62, 0, 0, TWO_PI)
    context.stroke()
    if (rp.r > 12 * u) {
      context.strokeStyle = `rgba(255, 225, 190, ${0.18 * rp.strength})`
      context.beginPath()
      context.ellipse(
        rp.x,
        rp.y,
        rp.r - 10 * u,
        (rp.r - 10 * u) * 0.62,
        0,
        0,
        TWO_PI,
      )
      context.stroke()
    }
  }
  context.restore()
}

function drawBoom(): void {
  if (!context) return
  const u = unit()
  context.save()
  // Shadow line on the water.
  context.strokeStyle = 'rgba(0, 0, 0, 0.35)'
  context.lineWidth = 7 * u
  context.lineJoin = 'round'
  context.beginPath()
  for (let i = 0; i <= BOOM_SEGMENTS; i += 1) {
    const k = i % BOOM_SEGMENTS
    const x = boomX[k] ?? 0
    const y = (boomY[k] ?? 0) + 2 * u
    if (i === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.stroke()
  // Floats: alternating sausage segments of a yellow harvest boom.
  for (let i = 0; i < BOOM_SEGMENTS; i += 1) {
    const x0 = boomX[i] ?? 0
    const y0 = boomY[i] ?? 0
    const j = (i + 1) % BOOM_SEGMENTS
    const x1 = boomX[j] ?? 0
    const y1 = boomY[j] ?? 0
    const bob = swell(clock, x0, y0) * 0.6 * u
    context.strokeStyle = i % 2 === 0 ? '#f0c23a' : '#d9a62a'
    context.lineWidth = 5 * u
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(x0 + (x1 - x0) * 0.08, y0 + (y1 - y0) * 0.08 - bob)
    context.lineTo(x0 + (x1 - x0) * 0.92, y0 + (y1 - y0) * 0.92 - bob)
    context.stroke()
    context.strokeStyle = 'rgba(255, 250, 210, 0.55)'
    context.lineWidth = 1.4 * u
    context.beginPath()
    context.moveTo(x0 + (x1 - x0) * 0.15, y0 + (y1 - y0) * 0.15 - bob - 1.4 * u)
    context.lineTo(x0 + (x1 - x0) * 0.85, y0 + (y1 - y0) * 0.85 - bob - 1.4 * u)
    context.stroke()
  }
  context.restore()
}

function drawBerries(): void {
  if (!context) return
  const u = unit()
  const palette = [
    [150, 16, 36],
    [188, 24, 44],
    [214, 44, 52],
    [168, 30, 70],
    [230, 88, 70],
  ]
  for (let i = 0; i < berryCount; i += 1) {
    const x = bx[i] ?? 0
    const r = br[i] ?? 1
    const bob = Math.sin(clock * 1.6 + (bphase[i] ?? 0)) * 0.5 * u
    const y = (by[i] ?? 0) + bob
    const shade = bshade[i] ?? 0
    const c = palette[Math.floor(shade * palette.length) % palette.length] ?? [
      180, 20, 40,
    ]
    context.fillStyle = 'rgba(10, 4, 6, 0.4)'
    context.beginPath()
    context.ellipse(x + r * 0.2, y + r * 0.35, r, r * 0.6, 0, 0, TWO_PI)
    context.fill()
    context.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`
    context.beginPath()
    context.arc(x, y, r, 0, TWO_PI)
    context.fill()
    // Pale blush on the shaded side, warm sun highlight on the other.
    context.fillStyle = 'rgba(255, 200, 170, 0.18)'
    context.beginPath()
    context.arc(x + r * 0.25, y + r * 0.2, r * 0.6, 0, TWO_PI)
    context.fill()
    context.fillStyle = 'rgba(255, 240, 220, 0.75)'
    context.beginPath()
    context.arc(x - r * 0.35, y - r * 0.38, r * 0.22, 0, TWO_PI)
    context.fill()
  }
}

function drawReeds(): void {
  if (!context) return
  const u = unit()
  context.save()
  context.lineCap = 'round'
  const count = Math.ceil(width / (14 * u))
  for (let k = 0; k < count; k += 1) {
    const x = (k + 0.5) * 14 * u + Math.sin(k * 7.13) * 6 * u
    const tall = (40 + (Math.sin(k * 3.7) * 0.5 + 0.5) * 70) * u
    const sway =
      Math.sin(clock * 0.8 + k * 0.6) * 4 * u + breezeX(clock) * 5 * u
    context.strokeStyle = k % 3 === 0 ? '#3d2a22' : '#57402a'
    context.lineWidth = 2.2 * u
    context.beginPath()
    context.moveTo(x, height + 2)
    context.quadraticCurveTo(
      x + sway * 0.4,
      height - tall * 0.6,
      x + sway,
      height - tall,
    )
    context.stroke()
    if (k % 4 === 1) {
      context.fillStyle = '#4a2e1c'
      context.beginPath()
      context.ellipse(
        x + sway,
        height - tall,
        2.6 * u,
        8 * u,
        sway * 0.02,
        0,
        TWO_PI,
      )
      context.fill()
    }
  }
  context.restore()
}

function drawFrame(): void {
  if (!context) return
  drawSky()
  drawWater()
  drawRipples()
  drawBerries()
  drawBoom()
  drawReeds()

  // Warm harvest haze that deepens as the raft tightens.
  context.fillStyle = `rgba(255, 170, 110, ${0.04 + boomTight * 0.05})`
  context.fillRect(0, 0, width, height)
  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.35,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.78,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(20, 8, 12, 0.5)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.05, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  const steps = Math.max(1, Math.ceil(dt * 90))
  const h = dt / steps
  for (let s = 0; s < steps; s += 1) {
    clock += h
    stepPhysics(h)
  }
  if (pendingClickX >= 0) applyClick()
  stepRipples(dt)
  const decay = Math.exp(-dt * 5)
  pointerVx *= decay
  pointerVy *= decay
  updateBoom(clock)
  drawFrame()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function startLive(): void {
  layoutBog()
  seedBerries()
  ripples.length = 0
  clock = 0
  pendingClickX = -1
  pendingClickY = -1
}

function drawStill(): void {
  // A deterministic, settled raft part-way through the gather.
  seed = 23
  pointerX = -1
  pointerY = -1
  pointerVx = 0
  pointerVy = 0
  ripples.length = 0
  layoutBog()
  seedBerries()
  clock = BOOM_CYCLE_S * 0.25
  for (let s = 0; s < 480; s += 1) {
    clock += 1 / 60
    stepPhysics(1 / 60)
  }
  updateBoom(clock)
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
    seed = Math.floor(Math.random() * 1e9)
    startLive()
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
  if (reducedMotion) {
    resizeCanvas()
    drawStill()
  } else {
    seed = Math.floor(Math.random() * 1e9)
    resizeCanvas()
    startLive()
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
  berryCount = 0
})
</script>

<style scoped>
.cranberry-bog-harvest {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
