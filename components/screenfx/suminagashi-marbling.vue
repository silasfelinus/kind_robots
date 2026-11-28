<template>
  <canvas ref="canvasRef" class="suminagashi-marbling" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const TWO_PI = Math.PI * 2
const MAX_RINGS = 140
const MAX_DROPS = 8
const RING_SEED_POINTS = 48
const VIEW_MARGIN = 60
const CLICK_COOLDOWN_MS = 500
const POINT_BUDGET = 12000
const FLOAT_SECONDS = 72
const LOWER_SECONDS = 2.6
const SOAK_SECONDS = 1.4
const LIFT_SECONDS = 3.6

// Suminagashi, "floating ink", seen from above. A patient artist touches an
// ink brush and a clear-water brush to the same spot on a still tray, again
// and again, so each new drop spreads into a disc and pushes every earlier
// ring outward. The push is the exact area-preserving drop map
// |P' - C|^2 = |P - C|^2 + r^2, applied in small increments while a drop
// blooms, so rings nest, crowd and bend around neighbouring centres the way
// they do on real water. A slow divergence-free current (the curl of a
// drifting stream function) sways the whole pattern; now and then the
// artist drags a bamboo stylus through it, combing the rings into feathered
// tongues. When the tray is full a sheet of washi paper settles on the
// water, soaks, and lifts away carrying the print, leaving clear water for
// the next one. Moving the pointer drags the stylus; a rate-limited click
// drops a little ink-clear-ink sequence of rings where it lands.

type Phase = 'float' | 'lower' | 'soak' | 'lift'

interface Ring {
  xs: number[]
  ys: number[]
  fill: string
  edge: string | null
}

interface Drop {
  cx: number
  cy: number
  total: number
  applied: number
  age: number
  duration: number
}

interface Brush {
  cx: number
  cy: number
  drift: number
  heading: number
}

interface StylusStroke {
  ax: number
  ay: number
  bx: number
  by: number
  bend: number
  age: number
  duration: number
  lastX: number
  lastY: number
}

const INKS = [
  { fill: 'rgb(40, 38, 48)', edge: 'rgba(16, 14, 22, 0.55)', weight: 6 },
  { fill: 'rgb(42, 62, 104)', edge: 'rgba(18, 30, 64, 0.5)', weight: 3 },
  { fill: 'rgb(104, 102, 114)', edge: 'rgba(50, 48, 60, 0.45)', weight: 3 },
  { fill: 'rgb(176, 64, 46)', edge: 'rgba(110, 30, 20, 0.45)', weight: 1 },
] as const

const WATER = 'rgb(236, 231, 218)'

const rings: Ring[] = []
const drops: Drop[] = []
const brushes: Brush[] = []
const pendingClicks: { x: number; y: number; left: number; next: number }[] = []

let context: CanvasRenderingContext2D | null = null
let fiberCanvas: HTMLCanvasElement | null = null
let printCanvas: HTMLCanvasElement | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let ratio = 1
let reducedMotion = false
let lastClickTs = 0
let seed = 1

let phase: Phase = 'float'
let phaseClock = 0
let nextDropAt = 0
let dropParity = 0
let cycleInk = 0
let nextStrokeAt = 0
let stroke: StylusStroke | null = null
let pointerX = -1
let pointerY = -1
let pointerPrevX = -1
let pointerPrevY = -1
let pointerSeenAt = -1e4
let cullCountdown = 0
let flowPhase = 0
let coarseness = 1

function random(): number {
  seed = (seed + 0x6d2b79f5) | 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function unit(): number {
  return Math.min(width, height) / 700
}

function pickInk(): number {
  let total = 0
  for (const ink of INKS) total += ink.weight
  let r = random() * total
  for (let i = 0; i < INKS.length; i += 1) {
    r -= INKS[i]?.weight ?? 0
    if (r <= 0) return i
  }
  return 0
}

function inView(x: number, y: number, margin: number): boolean {
  return x > -margin && y > -margin && x < width + margin && y < height + margin
}

// ---------------------------------------------------------------- transforms

function applyDrop(cx: number, cy: number, r2: number): void {
  for (const ring of rings) {
    const xs = ring.xs
    const ys = ring.ys
    for (let i = 0; i < xs.length; i += 1) {
      const dx = (xs[i] ?? 0) - cx
      const dy = (ys[i] ?? 0) - cy
      const d2 = dx * dx + dy * dy
      if (d2 < 1e-6) continue
      const s = Math.sqrt(1 + r2 / d2)
      xs[i] = cx + dx * s
      ys[i] = cy + dy * s
    }
  }
}

function applyStylus(
  sx: number,
  sy: number,
  mx: number,
  my: number,
  reach: number,
): void {
  const inv = 1 / (reach * reach)
  const cut = reach * 3
  for (const ring of rings) {
    const xs = ring.xs
    const ys = ring.ys
    for (let i = 0; i < xs.length; i += 1) {
      const dx = (xs[i] ?? 0) - sx
      const dy = (ys[i] ?? 0) - sy
      if (dx > cut || dx < -cut || dy > cut || dy < -cut) continue
      const w = Math.exp(-(dx * dx + dy * dy) * inv)
      xs[i] = (xs[i] ?? 0) + mx * w
      ys[i] = (ys[i] ?? 0) + my * w
    }
  }
}

// Velocity is the curl of psi = sum A sin(k.p + phase), so the current never
// compresses or tears the ink, it only shears and swirls it.
const FLOW_TERMS = [
  { kx: 0.0042, ky: 0.0031, w: 0.11, a: 1 },
  { kx: -0.0026, ky: 0.0051, w: -0.07, a: 0.8 },
  { kx: 0.0068, ky: -0.0018, w: 0.05, a: 0.45 },
] as const

function applyFlow(dt: number, strength: number): void {
  const u = Math.max(0.6, unit())
  const scale = (strength * u) / 0.005
  for (const ring of rings) {
    const xs = ring.xs
    const ys = ring.ys
    for (let i = 0; i < xs.length; i += 1) {
      const x = (xs[i] ?? 0) / u
      const y = (ys[i] ?? 0) / u
      let vx = 0
      let vy = 0
      for (const term of FLOW_TERMS) {
        const c = Math.cos(term.kx * x + term.ky * y + flowPhase * term.w * 9)
        vx += term.a * c * term.ky
        vy -= term.a * c * term.kx
      }
      xs[i] = (xs[i] ?? 0) + vx * scale * dt
      ys[i] = (ys[i] ?? 0) + vy * scale * dt
    }
  }
}

function refineRing(ring: Ring): void {
  const xs = ring.xs
  const ys = ring.ys
  const n = xs.length
  if (n < 3) return
  const u = Math.max(0.7, unit()) * Math.min(2.5, coarseness)
  const maxSeg = 5 * u
  const maxSeg2 = maxSeg * maxSeg
  const minNear = 1.6 * u
  const minFar = 9 * u
  const outX: number[] = []
  const outY: number[] = []
  let lastX = xs[0] ?? 0
  let lastY = ys[0] ?? 0
  outX.push(lastX)
  outY.push(lastY)
  for (let i = 1; i <= n; i += 1) {
    const x = xs[i % n] ?? 0
    const y = ys[i % n] ?? 0
    const dx = x - lastX
    const dy = y - lastY
    const d2 = dx * dx + dy * dy
    const midX = (x + lastX) / 2
    const midY = (y + lastY) / 2
    const near = inView(midX, midY, VIEW_MARGIN)
    if (near && d2 > maxSeg2) {
      const parts = Math.min(8, Math.ceil(Math.sqrt(d2) / maxSeg))
      for (let p = 1; p < parts; p += 1) {
        outX.push(lastX + (dx * p) / parts)
        outY.push(lastY + (dy * p) / parts)
      }
    } else {
      const min = near ? minNear : minFar
      if (d2 < min * min && i < n) continue
    }
    if (i === n) break
    outX.push(x)
    outY.push(y)
    lastX = x
    lastY = y
  }
  if (outX.length >= 3) {
    ring.xs = outX
    ring.ys = outY
  }
}

function ringContains(ring: Ring, px: number, py: number): boolean {
  const xs = ring.xs
  const ys = ring.ys
  let inside = false
  for (let i = 0, j = xs.length - 1; i < xs.length; j = i, i += 1) {
    const xi = xs[i] ?? 0
    const yi = ys[i] ?? 0
    const xj = xs[j] ?? 0
    const yj = ys[j] ?? 0
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// Rings that drifted completely off the tray, and every ring hidden beneath
// a newer ring that now covers the whole tray, can never be seen again.
function cullRings(): void {
  let coverIndex = -1
  for (let k = rings.length - 1; k >= 0; k -= 1) {
    const ring = rings[k]
    if (!ring) continue
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    let anyInside = false
    for (let i = 0; i < ring.xs.length; i += 1) {
      const x = ring.xs[i] ?? 0
      const y = ring.ys[i] ?? 0
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      if (!anyInside && inView(x, y, 2)) anyInside = true
    }
    if (anyInside) continue
    const coversView = minX < 0 && minY < 0 && maxX > width && maxY > height
    if (coversView && ringContains(ring, width / 2, height / 2)) {
      coverIndex = k
      break
    }
    const overlaps = maxX > 0 && maxY > 0 && minX < width && minY < height
    if (!overlaps) rings.splice(k, 1)
  }
  if (coverIndex > 0) rings.splice(0, coverIndex)
  while (rings.length > MAX_RINGS) rings.shift()
}

// ---------------------------------------------------------------- the artist

function startDrop(cx: number, cy: number, radius: number, ink: number): void {
  if (drops.length >= MAX_DROPS) {
    const oldest = drops.shift()
    if (oldest) applyDrop(oldest.cx, oldest.cy, oldest.total - oldest.applied)
  }
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < RING_SEED_POINTS; i += 1) {
    const a = (i / RING_SEED_POINTS) * TWO_PI
    xs.push(cx + Math.cos(a) * 0.6)
    ys.push(cy + Math.sin(a) * 0.6)
  }
  const style = ink >= 0 ? INKS[ink] : null
  rings.push({
    xs,
    ys,
    fill: style ? style.fill : WATER,
    edge: style ? style.edge : null,
  })
  drops.push({
    cx,
    cy,
    total: radius * radius,
    applied: 0,
    age: 0,
    duration: 0.8 + random() * 0.5,
  })
}

function stepDrops(dt: number): void {
  for (let d = drops.length - 1; d >= 0; d -= 1) {
    const drop = drops[d]
    if (!drop) continue
    drop.age += dt
    const t = Math.min(1, drop.age / drop.duration)
    const eased = 1 - (1 - t) * (1 - t) * (1 - t)
    const want = drop.total * eased
    const delta = want - drop.applied
    if (delta > 0) applyDrop(drop.cx, drop.cy, delta)
    drop.applied = want
    if (t >= 1) drops.splice(d, 1)
  }
}

function placeBrushes(): void {
  brushes.length = 0
  const count = width * height > 500000 ? 2 + (random() < 0.5 ? 1 : 0) : 2
  for (let b = 0; b < count; b += 1) {
    brushes.push({
      cx: width * (0.15 + ((b + random()) / count) * 0.7),
      cy: height * (0.2 + random() * 0.6),
      drift: 0,
      heading: random() * TWO_PI,
    })
  }
  cycleInk = pickInk()
}

function scheduleArtist(): void {
  if (phase !== 'float' || clock < nextDropAt) return
  if (brushes.length === 0) placeBrushes()
  const brush = brushes[Math.floor(random() * brushes.length)]
  if (!brush) return
  const u = unit()
  dropParity += 1
  const ink = dropParity % 2 === 1 ? cycleInk : -1
  if (dropParity % 2 === 1 && random() < 0.18) cycleInk = pickInk()
  const radius = (ink >= 0 ? 26 + random() * 18 : 18 + random() * 12) * u
  const jitter = 2.5 * u
  startDrop(
    brush.cx + (random() - 0.5) * jitter,
    brush.cy + (random() - 0.5) * jitter,
    radius,
    ink,
  )
  brush.drift += 1
  if (brush.drift > 14 && random() < 0.12) {
    brush.heading += (random() - 0.5) * 2
    const hop = (70 + random() * 120) * u
    brush.cx = Math.min(
      width * 0.88,
      Math.max(width * 0.12, brush.cx + Math.cos(brush.heading) * hop),
    )
    brush.cy = Math.min(
      height * 0.88,
      Math.max(height * 0.12, brush.cy + Math.sin(brush.heading) * hop),
    )
    brush.drift = 0
  }
  nextDropAt = clock + 0.75 + random() * 0.6
}

function scheduleStroke(): void {
  if (phase !== 'float' || stroke || clock < nextStrokeAt) return
  if (rings.length < 24) {
    nextStrokeAt = clock + 4
    return
  }
  const vertical = random() < 0.5
  const across = 0.2 + random() * 0.6
  const flip = random() < 0.5
  const ax = vertical ? width * across : flip ? width * 1.05 : -width * 0.05
  const bx = vertical ? width * (across + (random() - 0.5) * 0.2) : width - ax
  const ay = vertical
    ? flip
      ? height * 1.05
      : -height * 0.05
    : height * across
  const by = vertical ? height - ay : height * (across + (random() - 0.5) * 0.2)
  stroke = {
    ax,
    ay,
    bx,
    by,
    bend: (random() - 0.5) * 0.5,
    age: 0,
    duration: 5 + random() * 3,
    lastX: ax,
    lastY: ay,
  }
  nextStrokeAt = clock + 16 + random() * 14
}

function stylusPoint(s: StylusStroke, t: number): { x: number; y: number } {
  const e = t * t * (3 - 2 * t)
  const mx = s.bx - s.ax
  const my = s.by - s.ay
  const bow = Math.sin(e * Math.PI) * s.bend
  return {
    x: s.ax + mx * e - my * bow + Math.sin(e * 9) * 6 * unit(),
    y: s.ay + my * e + mx * bow,
  }
}

function stepStroke(dt: number): void {
  if (!stroke) return
  stroke.age += dt
  const t = Math.min(1, stroke.age / stroke.duration)
  const p = stylusPoint(stroke, t)
  applyStylus(
    p.x,
    p.y,
    (p.x - stroke.lastX) * 0.9,
    (p.y - stroke.lastY) * 0.9,
    11 * Math.max(0.7, unit()),
  )
  stroke.lastX = p.x
  stroke.lastY = p.y
  if (t >= 1) stroke = null
}

function stepPointer(): void {
  if (pointerX < 0 || pointerPrevX < 0) return
  const mx = pointerX - pointerPrevX
  const my = pointerY - pointerPrevY
  pointerPrevX = pointerX
  pointerPrevY = pointerY
  if (phase !== 'float') return
  const len = Math.hypot(mx, my)
  if (len < 0.3) return
  const cap = 40 * Math.max(0.7, unit())
  const k = len > cap ? cap / len : 1
  applyStylus(
    pointerX,
    pointerY,
    mx * k * 0.85,
    my * k * 0.85,
    14 * Math.max(0.7, unit()),
  )
}

function stepClicks(dt: number): void {
  for (let c = pendingClicks.length - 1; c >= 0; c -= 1) {
    const click = pendingClicks[c]
    if (!click) continue
    click.next -= dt
    if (click.next > 0) continue
    const ink = click.left % 2 === 1 ? pickInk() : -1
    startDrop(click.x, click.y, (ink >= 0 ? 20 : 14) * unit(), ink)
    click.left -= 1
    click.next = 0.32
    if (click.left <= 0) pendingClicks.splice(c, 1)
  }
}

function setPhase(next: Phase): void {
  phase = next
  phaseClock = 0
}

function capturePrint(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  if (!printCanvas) printCanvas = document.createElement('canvas')
  printCanvas.width = canvas.width
  printCanvas.height = canvas.height
  const pc = printCanvas.getContext('2d')
  if (!pc) return
  pc.setTransform(1, 0, 0, 1, 0, 0)
  pc.fillStyle = 'rgb(246, 241, 228)'
  pc.fillRect(0, 0, printCanvas.width, printCanvas.height)
  pc.setTransform(ratio, 0, 0, ratio, 0, 0)
  drawInk(pc, true)
  if (fiberCanvas) {
    pc.setTransform(1, 0, 0, 1, 0, 0)
    pc.globalAlpha = 0.9
    pc.drawImage(fiberCanvas, 0, 0)
    pc.globalAlpha = 1
  }
}

function stepPhase(dt: number): void {
  phaseClock += dt
  if (phase === 'float' && phaseClock > FLOAT_SECONDS && drops.length === 0) {
    stroke = null
    setPhase('lower')
  } else if (phase === 'lower' && phaseClock > LOWER_SECONDS) {
    setPhase('soak')
  } else if (phase === 'soak' && phaseClock > SOAK_SECONDS) {
    capturePrint()
    rings.length = 0
    drops.length = 0
    pendingClicks.length = 0
    brushes.length = 0
    dropParity = 0
    setPhase('lift')
  } else if (phase === 'lift' && phaseClock > LIFT_SECONDS) {
    setPhase('float')
    nextDropAt = clock + 0.4
    nextStrokeAt = clock + 18
  }
}

// ------------------------------------------------------------------ drawing

function buildFibers(): void {
  const w = Math.max(1, Math.round(width * ratio))
  const h = Math.max(1, Math.round(height * ratio))
  if (!fiberCanvas) fiberCanvas = document.createElement('canvas')
  fiberCanvas.width = w
  fiberCanvas.height = h
  const fc = fiberCanvas.getContext('2d')
  if (!fc) return
  fc.clearRect(0, 0, w, h)
  const count = Math.round((w * h) / 2600)
  const saved = seed
  seed = 977
  fc.lineCap = 'round'
  for (let i = 0; i < count; i += 1) {
    const x = random() * w
    const y = random() * h
    const a = random() * TWO_PI
    const len = (6 + random() * 22) * ratio
    const bend = (random() - 0.5) * len * 0.6
    fc.strokeStyle =
      random() < 0.5
        ? `rgba(255, 252, 240, ${0.18 + random() * 0.2})`
        : `rgba(150, 132, 104, ${0.05 + random() * 0.07})`
    fc.lineWidth = (0.4 + random() * 0.7) * ratio
    fc.beginPath()
    fc.moveTo(x, y)
    fc.quadraticCurveTo(
      x + Math.cos(a) * len * 0.5 - Math.sin(a) * bend,
      y + Math.sin(a) * len * 0.5 + Math.cos(a) * bend,
      x + Math.cos(a) * len,
      y + Math.sin(a) * len,
    )
    fc.stroke()
  }
  seed = saved
}

function traceRing(ctx: CanvasRenderingContext2D, ring: Ring): void {
  const xs = ring.xs
  const ys = ring.ys
  ctx.beginPath()
  ctx.moveTo(xs[0] ?? 0, ys[0] ?? 0)
  for (let i = 1; i < xs.length; i += 1) ctx.lineTo(xs[i] ?? 0, ys[i] ?? 0)
  ctx.closePath()
}

function drawInk(ctx: CanvasRenderingContext2D, onPaper: boolean): void {
  const lineW = Math.max(0.6, unit() * 0.9)
  for (const ring of rings) {
    traceRing(ctx, ring)
    ctx.fillStyle =
      onPaper && ring.fill === WATER ? 'rgb(246, 241, 228)' : ring.fill
    ctx.fill()
    if (ring.edge) {
      ctx.strokeStyle = ring.edge
      ctx.lineWidth = lineW
      ctx.stroke()
    }
  }
}

function drawWater(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = WATER
  ctx.fillRect(0, 0, width, height)
}

function drawLight(ctx: CanvasRenderingContext2D): void {
  const sweep = Math.sin(clock * 0.05) * 0.5 + 0.5
  const glow = ctx.createLinearGradient(
    width * (0.1 + sweep * 0.3),
    0,
    width * (0.6 + sweep * 0.3),
    height,
  )
  glow.addColorStop(0, 'rgba(255, 255, 250, 0)')
  glow.addColorStop(0.45, 'rgba(255, 255, 250, 0.1)')
  glow.addColorStop(0.55, 'rgba(255, 255, 250, 0.14)')
  glow.addColorStop(1, 'rgba(255, 255, 250, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)
  const rim = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.35,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75,
  )
  rim.addColorStop(0, 'rgba(60, 44, 24, 0)')
  rim.addColorStop(1, 'rgba(60, 44, 24, 0.32)')
  ctx.fillStyle = rim
  ctx.fillRect(0, 0, width, height)
}

function drawStylus(ctx: CanvasRenderingContext2D): void {
  if (!stroke) return
  const t = Math.min(1, stroke.age / stroke.duration)
  const p = stylusPoint(stroke, t)
  const u = Math.max(0.7, unit())
  const ang = Math.atan2(stroke.by - stroke.ay, stroke.bx - stroke.ax)
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(ang - 2.2)
  ctx.fillStyle = 'rgba(40, 30, 20, 0.16)'
  ctx.fillRect(4 * u, -1.5 * u, 160 * u, 5 * u)
  ctx.restore()
  ctx.beginPath()
  ctx.arc(p.x, p.y, 4 * u, 0, TWO_PI)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1.2 * u
  ctx.stroke()
}

function drawPaper(ctx: CanvasRenderingContext2D): void {
  if (phase === 'lower' || phase === 'soak') {
    const t = phase === 'lower' ? Math.min(1, phaseClock / LOWER_SECONDS) : 1
    const e = t * t * (3 - 2 * t)
    const edge = width * 1.1 * e
    const soak = phase === 'soak' ? Math.min(1, phaseClock / SOAK_SECONDS) : 0
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, edge, height)
    ctx.clip()
    ctx.fillStyle = `rgba(248, 244, 232, ${0.78 - soak * 0.3})`
    ctx.fillRect(0, 0, width, height)
    if (fiberCanvas) {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(fiberCanvas, 0, 0)
      ctx.restore()
    }
    ctx.restore()
    if (e < 1) {
      const shadow = ctx.createLinearGradient(edge, 0, edge + 24 * unit(), 0)
      shadow.addColorStop(0, 'rgba(50, 36, 20, 0.22)')
      shadow.addColorStop(1, 'rgba(50, 36, 20, 0)')
      ctx.fillStyle = shadow
      ctx.fillRect(edge, 0, 24 * unit(), height)
    }
  } else if (phase === 'lift' && printCanvas) {
    const t = Math.min(1, phaseClock / LIFT_SECONDS)
    const e = t * t
    ctx.save()
    ctx.globalAlpha = 1 - Math.max(0, (t - 0.55) / 0.45)
    ctx.translate(width / 2, height / 2 - e * height * 0.35)
    ctx.rotate(-0.06 * e)
    const s = 1 - e * 0.18
    ctx.scale(s, s)
    ctx.fillStyle = `rgba(40, 28, 14, ${0.22 * e})`
    ctx.fillRect(-width / 2 + 10, -height / 2 + 16 * e + 6, width, height)
    ctx.drawImage(printCanvas, -width / 2, -height / 2, width, height)
    ctx.restore()
  }
}

function drawFrame(): void {
  if (!context) return
  drawWater(context)
  drawInk(context, false)
  drawStylus(context)
  drawLight(context)
  drawPaper(context)
}

// ------------------------------------------------------------------ the loop

function step(dt: number): void {
  clock += dt
  flowPhase += dt
  stepPhase(dt)
  scheduleArtist()
  scheduleStroke()
  stepClicks(dt)
  stepDrops(dt)
  stepStroke(dt)
  if (phase === 'float' || phase === 'lower') applyFlow(dt, 1)
  let total = 0
  for (const ring of rings) {
    refineRing(ring)
    total += ring.xs.length
  }
  coarseness = Math.max(1, total / POINT_BUDGET)
  cullCountdown -= 1
  if (cullCountdown <= 0) {
    cullRings()
    cullCountdown = 30
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.05, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  if (timestamp - pointerSeenAt < 200) stepPointer()
  const steps = Math.max(1, Math.ceil(dt * 60))
  for (let s = 0; s < steps; s += 1) step(dt / steps)
  drawFrame()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function resetTray(): void {
  rings.length = 0
  drops.length = 0
  brushes.length = 0
  pendingClicks.length = 0
  stroke = null
  clock = 0
  flowPhase = random() * 400
  dropParity = 0
  nextDropAt = 0.2
  nextStrokeAt = 20
  cullCountdown = 0
  setPhase('float')
}

function drawStill(): void {
  seed = 23
  resetTray()
  phaseClock = -1e6
  for (let s = 0; s < 60 * 25; s += 1) step(1 / 60)
  while (drops.length > 0) step(1 / 60)
  drawFrame()
}

// ----------------------------------------------------------------- plumbing

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
  if (!point) {
    pointerX = -1
    pointerPrevX = -1
    return
  }
  const now = performance.now()
  if (pointerPrevX < 0 || now - pointerSeenAt > 200) {
    pointerPrevX = point.x
    pointerPrevY = point.y
  }
  pointerX = point.x
  pointerY = point.y
  pointerSeenAt = now
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastClickTs < CLICK_COOLDOWN_MS) return
  lastClickTs = now
  if (phase !== 'float' || pendingClicks.length > 2) return
  pendingClicks.push({ x: point.x, y: point.y, left: 3, next: 0 })
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas || !context) return
  const rect = canvas.getBoundingClientRect()
  const oldW = width
  const oldH = height
  width = Math.max(1, rect.width)
  height = Math.max(1, rect.height)
  ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  buildFibers()
  if (Math.abs(oldW - width) > 40 || Math.abs(oldH - height) > 40) {
    brushes.length = 0
  }
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  if (reducedMotion) {
    if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    drawStill()
  } else if (animationFrameId === null) {
    lastFrameTs = 0
    seed = Math.floor(Math.random() * 1e9)
    resetTray()
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
    resetTray()
    animationFrameId = window.requestAnimationFrame(renderFrame)
  }
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  animationFrameId = null
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionChange)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)
  context = null
  fiberCanvas = null
  printCanvas = null
  rings.length = 0
  drops.length = 0
  brushes.length = 0
  pendingClicks.length = 0
  stroke = null
})
</script>

<style scoped>
.suminagashi-marbling {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
