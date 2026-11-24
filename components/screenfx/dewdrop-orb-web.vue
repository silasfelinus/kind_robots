<template>
  <canvas ref="canvasRef" class="dewdrop-orb-web" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const TWO_PI = Math.PI * 2
const SPOKES = 28
const RINGS = 22
const NODES = SPOKES * RINGS
const MAX_DROPS = 1500
const MAX_FALLING = 80
const PLUCK_COOLDOWN_MS = 900
const REGROW_SECONDS = 7

// An orb-weaver's web at dawn, strung between grass stems and beaded with
// dew. The capture spiral is a mass-spring mesh: every junction of spoke
// and spiral is a node pulled back to rest, coupled to its neighbours along
// both threads, and nudged by a slow wandering breeze, so a touch anywhere
// travels across the web as a real wave. Dew beads sit only on the sticky
// spiral (the dry radial spokes stay clean), each bead catching the low sun
// as a highlight and an amber refraction rim; now and then one glints.
// Hovering breathes on the web and pushes the threads aside; a rate-limited
// click plucks it, sending a ripple outward and shaking loose the nearby
// beads, which fall from a fixed pool and slowly re-condense.

const baseAngle = new Float32Array(NODES)
const baseFrac = new Float32Array(NODES)
const baseX = new Float32Array(NODES)
const baseY = new Float32Array(NODES)
const dispX = new Float32Array(NODES)
const dispY = new Float32Array(NODES)
const velX = new Float32Array(NODES)
const velY = new Float32Array(NODES)
const posX = new Float32Array(NODES)
const posY = new Float32Array(NODES)

// Spiral segments: node a -> node b.
const MAX_SEGMENTS = NODES
const segA = new Int32Array(MAX_SEGMENTS)
const segB = new Int32Array(MAX_SEGMENTS)
let segmentCount = 0

const dropSeg = new Int32Array(MAX_DROPS)
const dropT = new Float32Array(MAX_DROPS)
const dropSize = new Float32Array(MAX_DROPS)
const dropPhase = new Float32Array(MAX_DROPS)
const dropFellAt = new Float32Array(MAX_DROPS)
let dropCount = 0

const fallX = new Float32Array(MAX_FALLING)
const fallY = new Float32Array(MAX_FALLING)
const fallVy = new Float32Array(MAX_FALLING)
const fallR = new Float32Array(MAX_FALLING)
const fallActive = new Uint8Array(MAX_FALLING)
let fallCursor = 0

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let centerX = 0
let centerY = 0
let radius = 1
let reducedMotion = false
let pointerX = -1
let pointerY = -1
let lastPluckTs = 0
let pluckX = 0
let pluckY = 0
let pluckStart = -100
let pendingPluck = false
let nextDrip = 0
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

function unit(): number {
  return Math.min(width, height) / 700
}

function nodeIndex(spoke: number, ring: number): number {
  return ring * SPOKES + spoke
}

function buildWeb(): void {
  // Spoke angles are slightly irregular, and the spiral radius climbs a
  // little with every spoke so the rings join into one continuous spiral.
  const angles: number[] = []
  for (let i = 0; i < SPOKES; i += 1) {
    angles.push((i / SPOKES) * TWO_PI + (random() - 0.5) * 0.08)
  }
  const inner = 0.2
  const step = (1 - inner) / RINGS
  for (let j = 0; j < RINGS; j += 1) {
    for (let i = 0; i < SPOKES; i += 1) {
      const n = nodeIndex(i, j)
      baseAngle[n] = angles[i] ?? 0
      // Orb webs are a little taller below the hub than above it.
      const below = Math.sin(angles[i] ?? 0) > 0 ? 1.08 : 0.94
      baseFrac[n] =
        (inner + (j + i / SPOKES) * step + (random() - 0.5) * step * 0.25) *
        below
    }
  }

  segmentCount = 0
  for (let j = 0; j < RINGS; j += 1) {
    for (let i = 0; i < SPOKES; i += 1) {
      if (i < SPOKES - 1) {
        segA[segmentCount] = nodeIndex(i, j)
        segB[segmentCount] = nodeIndex(i + 1, j)
        segmentCount += 1
      } else if (j < RINGS - 1) {
        segA[segmentCount] = nodeIndex(i, j)
        segB[segmentCount] = nodeIndex(0, j + 1)
        segmentCount += 1
      }
    }
  }

  dropCount = 0
  for (let s = 0; s < segmentCount && dropCount < MAX_DROPS; s += 1) {
    const beads = 1 + Math.floor(random() * 3)
    for (let b = 0; b < beads && dropCount < MAX_DROPS; b += 1) {
      dropSeg[dropCount] = s
      dropT[dropCount] = (b + 0.2 + random() * 0.6) / beads
      // Mostly fine beads, with the occasional fat drop.
      dropSize[dropCount] =
        random() < 0.12 ? 3 + random() * 2 : 1 + random() * 1.6
      dropPhase[dropCount] = random() * TWO_PI
      dropFellAt[dropCount] = -100
      dropCount += 1
    }
  }

  dispX.fill(0)
  dispY.fill(0)
  velX.fill(0)
  velY.fill(0)
  fallActive.fill(0)
}

function layoutWeb(): void {
  centerX = width * 0.5
  centerY = height * 0.46
  radius = Math.min(width, height) * 0.42
  for (let n = 0; n < NODES; n += 1) {
    const r = (baseFrac[n] ?? 0) * radius
    const a = baseAngle[n] ?? 0
    baseX[n] = centerX + Math.cos(a) * r
    baseY[n] = centerY + Math.sin(a) * r
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
  pointerX = point ? point.x : -1
  pointerY = point ? point.y : -1
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastPluckTs < PLUCK_COOLDOWN_MS) return
  lastPluckTs = now
  pluckX = point.x
  pluckY = point.y
  pendingPluck = true
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
  layoutWeb()
}

function dropPosition(d: number): { x: number; y: number } {
  const s = dropSeg[d] ?? 0
  const a = segA[s] ?? 0
  const b = segB[s] ?? 0
  const ax = posX[a] ?? 0
  const ay = posY[a] ?? 0
  const bx = posX[b] ?? 0
  const by = posY[b] ?? 0
  const t = dropT[d] ?? 0
  // The wet thread sags into a shallow curve under the weight of its dew.
  const sag = Math.hypot(bx - ax, by - ay) * 0.08
  const mt = 1 - t
  const cx = (ax + bx) / 2
  const cy = (ay + by) / 2 + sag
  return {
    x: mt * mt * ax + 2 * mt * t * cx + t * t * bx,
    y: mt * mt * ay + 2 * mt * t * cy + t * t * by,
  }
}

function spawnFalling(x: number, y: number, r: number): void {
  const k = fallCursor
  fallCursor = (fallCursor + 1) % MAX_FALLING
  fallX[k] = x
  fallY[k] = y
  fallVy[k] = 0
  fallR[k] = r
  fallActive[k] = 1
}

function dropGrowth(d: number): number {
  const since = clock - (dropFellAt[d] ?? -100)
  if (since < 1) return 0
  return Math.min(1, (since - 1) / REGROW_SECONDS)
}

function applyPluck(): void {
  pendingPluck = false
  pluckStart = clock
  const u = unit()
  const reach = 190 * Math.max(0.7, u)
  for (let n = 0; n < NODES; n += 1) {
    const dx = (posX[n] ?? 0) - pluckX
    const dy = (posY[n] ?? 0) - pluckY
    const d = Math.hypot(dx, dy)
    if (d > reach) continue
    const f = (1 - d / reach) * 260 * Math.max(0.7, u)
    velX[n] = (velX[n] ?? 0) + (dx / (d || 1)) * f
    velY[n] = (velY[n] ?? 0) + (dy / (d || 1)) * f
  }
  const shake = 85 * Math.max(0.7, u)
  for (let d = 0; d < dropCount; d += 1) {
    if (dropGrowth(d) < 0.6) continue
    const p = dropPosition(d)
    const dist = Math.hypot(p.x - pluckX, p.y - pluckY)
    if (dist > shake || random() > 0.75 - (dist / shake) * 0.4) continue
    spawnFalling(p.x, p.y, (dropSize[d] ?? 1) * Math.max(0.7, u))
    dropFellAt[d] = clock
  }
}

function ambientDrip(): void {
  // Every few seconds the heaviest bead somewhere lets go on its own.
  while (clock >= nextDrip) {
    nextDrip += 2.5 + random() * 3.5
    for (let tries = 0; tries < 12; tries += 1) {
      const d = Math.floor(random() * dropCount)
      if ((dropSize[d] ?? 0) < 2.6 || dropGrowth(d) < 1) continue
      const p = dropPosition(d)
      spawnFalling(p.x, p.y, (dropSize[d] ?? 1) * Math.max(0.7, unit()))
      dropFellAt[d] = clock
      break
    }
  }
}

function stepPhysics(dt: number): void {
  const u = Math.max(0.7, unit())
  const k = 16
  const coupling = 38
  const damping = 2.2
  const reach = 90 * u
  for (let n = 0; n < NODES; n += 1) {
    const i = n % SPOKES
    const j = (n - i) / SPOKES
    const left = nodeIndex((i + SPOKES - 1) % SPOKES, j)
    const right = nodeIndex((i + 1) % SPOKES, j)
    const inward = j > 0 ? n - SPOKES : n
    const outward = j < RINGS - 1 ? n + SPOKES : n
    const dx = dispX[n] ?? 0
    const dy = dispY[n] ?? 0
    const avgX =
      ((dispX[left] ?? 0) +
        (dispX[right] ?? 0) +
        (dispX[inward] ?? 0) +
        (dispX[outward] ?? 0)) /
      4
    const avgY =
      ((dispY[left] ?? 0) +
        (dispY[right] ?? 0) +
        (dispY[inward] ?? 0) +
        (dispY[outward] ?? 0)) /
      4
    const frac = baseFrac[n] ?? 0
    // A slow breeze that wanders across the web; outer threads move most.
    const bx = baseX[n] ?? 0
    const by = baseY[n] ?? 0
    const gust =
      Math.sin(clock * 0.6 + bx * 0.004) * 0.6 +
      Math.sin(clock * 1.7 + by * 0.01) * 0.25
    let fx =
      -k * dx +
      coupling * (avgX - dx) -
      damping * (velX[n] ?? 0) +
      gust * 34 * u * frac
    let fy =
      -k * dy +
      coupling * (avgY - dy) -
      damping * (velY[n] ?? 0) +
      Math.sin(clock * 0.9 + bx * 0.006) * 12 * u * frac
    if (pointerX >= 0) {
      const px = bx + dx - pointerX
      const py = by + dy - pointerY
      const d = Math.hypot(px, py)
      if (d < reach) {
        const push = (1 - d / reach) * 520 * u
        fx += (px / (d || 1)) * push
        fy += (py / (d || 1)) * push
      }
    }
    velX[n] = (velX[n] ?? 0) + fx * dt
    velY[n] = (velY[n] ?? 0) + fy * dt
  }
  for (let n = 0; n < NODES; n += 1) {
    dispX[n] = (dispX[n] ?? 0) + (velX[n] ?? 0) * dt
    dispY[n] = (dispY[n] ?? 0) + (velY[n] ?? 0) * dt
  }
}

function updatePositions(): void {
  for (let n = 0; n < NODES; n += 1) {
    posX[n] = (baseX[n] ?? 0) + (dispX[n] ?? 0)
    posY[n] = (baseY[n] ?? 0) + (dispY[n] ?? 0)
  }
}

function stepFalling(dt: number): void {
  const g = 900 * Math.max(0.7, unit())
  for (let k = 0; k < MAX_FALLING; k += 1) {
    if (!fallActive[k]) continue
    fallVy[k] = (fallVy[k] ?? 0) + g * dt
    fallY[k] = (fallY[k] ?? 0) + (fallVy[k] ?? 0) * dt
    if ((fallY[k] ?? 0) > height + 20) fallActive[k] = 0
  }
}

function drawBackground(): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#2a3552')
  sky.addColorStop(0.45, '#8c6a74')
  sky.addColorStop(0.72, '#c99272')
  sky.addColorStop(1, '#2f3b2a')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // The low sun, just rising behind the grass on the left.
  const sunX = width * 0.18
  const sunY = height * 0.7
  const sun = context.createRadialGradient(
    sunX,
    sunY,
    0,
    sunX,
    sunY,
    Math.max(width, height) * 0.6,
  )
  sun.addColorStop(0, 'rgba(255, 214, 150, 0.55)')
  sun.addColorStop(0.25, 'rgba(255, 180, 120, 0.18)')
  sun.addColorStop(1, 'rgba(255, 180, 120, 0)')
  context.fillStyle = sun
  context.fillRect(0, 0, width, height)

  // Out-of-focus dew on the meadow behind, as soft bokeh discs.
  const count = width < 600 ? 14 : 26
  for (let k = 0; k < count; k += 1) {
    const x = hash(k * 2.3) * width + Math.sin(clock * 0.1 + k) * 6
    const y = height * (0.35 + hash(k * 4.1) * 0.65)
    const r = (10 + hash(k * 6.7) * 30) * Math.max(0.7, unit())
    const warm = hash(k * 8.9) < 0.6
    context.fillStyle = warm
      ? `rgba(255, 210, 160, ${0.05 + hash(k * 9.7) * 0.07})`
      : `rgba(170, 210, 150, ${0.04 + hash(k * 9.7) * 0.05})`
    context.beginPath()
    context.arc(x, y, r, 0, TWO_PI)
    context.fill()
  }
}

function drawGrass(): void {
  if (!context) return
  const u = Math.max(0.7, unit())
  const blades = width < 600 ? 40 : 90
  context.strokeStyle = 'rgba(28, 38, 24, 0.85)'
  context.lineCap = 'round'
  for (let k = 0; k < blades; k += 1) {
    const x = hash(k * 1.9) * width
    const h = (60 + hash(k * 3.7) * 140) * u
    const lean =
      (hash(k * 5.3) - 0.5) * 40 * u + Math.sin(clock * 0.7 + x * 0.01) * 6 * u
    context.lineWidth = (1.5 + hash(k * 7.1) * 2.5) * u
    context.beginPath()
    context.moveTo(x, height + 4)
    context.quadraticCurveTo(
      x + lean * 0.3,
      height - h * 0.6,
      x + lean,
      height - h,
    )
    context.stroke()
  }
}

function drawThreads(): void {
  if (!context) return
  const u = Math.max(0.7, unit())
  context.lineCap = 'round'
  context.lineJoin = 'round'

  // Frame and anchor lines run off toward the grass stems and the frame.
  context.strokeStyle = 'rgba(240, 232, 220, 0.22)'
  context.lineWidth = 0.9 * u
  context.beginPath()
  for (let i = 0; i < SPOKES; i += 3) {
    const n = nodeIndex(i, RINGS - 1)
    const a = baseAngle[n] ?? 0
    context.moveTo(posX[n] ?? 0, posY[n] ?? 0)
    context.lineTo(
      centerX + Math.cos(a) * radius * 2.4,
      centerY + Math.sin(a) * radius * 2.4,
    )
  }
  context.stroke()

  // Dry radial spokes, from the hub out to the last ring.
  context.strokeStyle = 'rgba(245, 238, 228, 0.3)'
  context.lineWidth = 0.8 * u
  context.beginPath()
  for (let i = 0; i < SPOKES; i += 1) {
    context.moveTo(centerX, centerY)
    for (let j = 0; j < RINGS; j += 1) {
      const n = nodeIndex(i, j)
      context.lineTo(posX[n] ?? 0, posY[n] ?? 0)
    }
  }
  context.stroke()

  // The tight, irregular hub mesh.
  context.beginPath()
  for (let h = 1; h <= 4; h += 1) {
    const r = radius * 0.035 * h
    for (let i = 0; i <= SPOKES; i += 1) {
      const a = ((i % SPOKES) / SPOKES) * TWO_PI
      const rr = r * (1 + Math.sin(i * 2.7 + h) * 0.12)
      const x = centerX + Math.cos(a) * rr
      const y = centerY + Math.sin(a) * rr
      if (i === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
  }
  context.stroke()

  // The sticky capture spiral, sagging a little under its dew.
  context.strokeStyle = 'rgba(250, 240, 225, 0.38)'
  context.lineWidth = 0.7 * u
  context.beginPath()
  for (let s = 0; s < segmentCount; s += 1) {
    const a = segA[s] ?? 0
    const b = segB[s] ?? 0
    const ax = posX[a] ?? 0
    const ay = posY[a] ?? 0
    const bx = posX[b] ?? 0
    const by = posY[b] ?? 0
    const sag = Math.hypot(bx - ax, by - ay) * 0.08
    context.moveTo(ax, ay)
    context.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag, bx, by)
  }
  context.stroke()
}

function drawDrops(): void {
  if (!context) return
  const u = Math.max(0.7, unit())
  const body = new Path2D()
  const rim = new Path2D()
  const shine = new Path2D()
  const glints: number[] = []
  for (let d = 0; d < dropCount; d += 1) {
    const grow = dropGrowth(d)
    if (grow <= 0.05) continue
    const p = dropPosition(d)
    const r = (dropSize[d] ?? 1) * u * grow
    body.moveTo(p.x + r, p.y)
    body.arc(p.x, p.y, r, 0, TWO_PI)
    if (r > 1.6) {
      // Light enters at the top-left and focuses on the lower-right rim.
      rim.moveTo(p.x + r * Math.cos(-0.2), p.y + r * Math.sin(-0.2))
      rim.arc(p.x, p.y, r * 0.8, -0.2, 1.9)
    }
    const hr = Math.max(0.5, r * 0.32)
    shine.moveTo(p.x - r * 0.35 + hr, p.y - r * 0.35)
    shine.arc(p.x - r * 0.35, p.y - r * 0.35, hr, 0, TWO_PI)
    const s = Math.sin(clock * 0.8 + (dropPhase[d] ?? 0) + p.x * 0.02)
    if (s > 0.995 && r > 1.2 && glints.length < 60) glints.push(p.x, p.y, r)
  }
  context.fillStyle = 'rgba(205, 222, 240, 0.32)'
  context.fill(body)
  context.strokeStyle = 'rgba(255, 196, 130, 0.7)'
  context.lineWidth = 0.9 * u
  context.stroke(rim)
  context.fillStyle = 'rgba(255, 252, 240, 0.9)'
  context.fill(shine)

  // A handful of beads catch the sun at just the right angle and flare.
  context.strokeStyle = 'rgba(255, 245, 220, 0.85)'
  context.lineWidth = 0.8 * u
  context.beginPath()
  for (let g = 0; g < glints.length; g += 3) {
    const x = (glints[g] ?? 0) - (glints[g + 2] ?? 0) * 0.35
    const y = (glints[g + 1] ?? 0) - (glints[g + 2] ?? 0) * 0.35
    const len = (glints[g + 2] ?? 0) * 3.5
    context.moveTo(x - len, y)
    context.lineTo(x + len, y)
    context.moveTo(x, y - len)
    context.lineTo(x, y + len)
  }
  context.stroke()
}

function drawFalling(): void {
  if (!context) return
  context.fillStyle = 'rgba(215, 230, 245, 0.6)'
  context.beginPath()
  for (let k = 0; k < MAX_FALLING; k += 1) {
    if (!fallActive[k]) continue
    const x = fallX[k] ?? 0
    const y = fallY[k] ?? 0
    const r = fallR[k] ?? 1
    const stretch = 1 + Math.min(3, (fallVy[k] ?? 0) / 300)
    context.moveTo(x + r, y)
    context.ellipse(x, y, r, r * stretch, 0, 0, TWO_PI)
  }
  context.fill()
}

function drawSpider(): void {
  if (!context) return
  const u = Math.max(0.7, unit())
  // She sits head-down at the hub and flinches when the web is plucked.
  const since = clock - pluckStart
  const flinch =
    since >= 0 && since < 0.6 ? Math.sin(since * 30) * (0.6 - since) * 4 : 0
  const x = centerX + flinch * u
  const y = centerY + Math.sin(clock * 0.9) * 0.6 * u
  context.strokeStyle = 'rgba(30, 22, 20, 0.9)'
  context.lineWidth = 1.1 * u
  context.beginPath()
  for (let leg = 0; leg < 8; leg += 1) {
    const side = leg < 4 ? -1 : 1
    const k = leg % 4
    const a = (k - 1.5) * 0.45
    const reach = (14 - Math.abs(k - 1.5) * 2) * u
    const kneeX = x + side * Math.cos(a) * reach * 0.6
    const kneeY = y + Math.sin(a) * reach * 0.6 - 4 * u
    context.moveTo(x, y)
    context.lineTo(kneeX, kneeY)
    context.lineTo(
      x + side * Math.cos(a) * reach,
      y + Math.sin(a) * reach * 1.3 + 2 * u,
    )
  }
  context.stroke()
  context.fillStyle = 'rgba(38, 26, 22, 0.95)'
  context.beginPath()
  context.ellipse(x, y - 3 * u, 3.2 * u, 3.6 * u, 0, 0, TWO_PI)
  context.fill()
  context.fillStyle = 'rgba(70, 48, 34, 0.95)'
  context.beginPath()
  context.ellipse(x, y + 5 * u, 5.4 * u, 7 * u, 0, 0, TWO_PI)
  context.fill()
  // The pale cross on her abdomen.
  context.strokeStyle = 'rgba(230, 210, 180, 0.6)'
  context.lineWidth = 0.8 * u
  context.beginPath()
  context.moveTo(x, y + 1 * u)
  context.lineTo(x, y + 9 * u)
  context.moveTo(x - 2.5 * u, y + 4 * u)
  context.lineTo(x + 2.5 * u, y + 4 * u)
  context.stroke()
}

function drawFrame(): void {
  if (!context) return
  updatePositions()
  drawBackground()
  drawGrass()
  drawThreads()
  drawDrops()
  drawFalling()
  drawSpider()

  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.35,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(10, 8, 18, 0.55)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  const steps = Math.max(1, Math.ceil(dt * 120))
  const h = dt / steps
  for (let s = 0; s < steps; s += 1) {
    clock += h
    stepPhysics(h)
  }
  updatePositions()
  if (pendingPluck) applyPluck()
  ambientDrip()
  stepFalling(dt)
  drawFrame()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function startLive(): void {
  buildWeb()
  layoutWeb()
  clock = 0
  nextDrip = 2
  pluckStart = -100
  pendingPluck = false
}

function drawStill(): void {
  // A deterministic, settled web with every bead in place.
  seed = 7
  pointerX = -1
  pointerY = -1
  buildWeb()
  layoutWeb()
  clock = 2
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
    startLive()
    resizeCanvas()
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
.dewdrop-orb-web {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
