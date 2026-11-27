<template>
  <canvas ref="canvasRef" class="sea-glass-swash" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const TWO_PI = Math.PI * 2
const COLUMN_PX = 6
const MAX_COLUMNS = 640
const MAX_WAVES = 6
const MAX_GLASS = 160
const MAX_FOAM = 700
const MAX_PRINTS = 48
const CLICK_COOLDOWN_MS = 600
const UPRUSH_SHARE = 0.32

// A late-afternoon beach seen from above. Waves arrive in sets and each one
// races up the sand as a lacy swash front, slows, then drains back as
// backwash. The front is the running maximum of every active wave's runup
// profile, so a fresh wave overtakes a draining one exactly as it does on a
// real shore. Frosted sea-glass pebbles in the swash are carried by the
// front's own velocity, tumble, and settle when the water leaves them; foam
// lace is shed as the front retreats and pops in place. Wet sand darkens
// behind the high-water line and dries slowly. Walking the pointer across
// dry sand leaves footprints that the next swash erases; a rate-limited click
// calls a bigger wave that surges up the beach around the click.

interface Wave {
  start: number
  period: number
  amp: number
  focusX: number
  focusAmp: number
  slant: number
}

const GLASS_COLORS = [
  [118, 196, 156],
  [86, 170, 140],
  [150, 214, 200],
  [96, 150, 210],
  [226, 238, 232],
  [196, 150, 82],
  [170, 210, 120],
] as const

const front = new Float32Array(MAX_COLUMNS)
const frontVel = new Float32Array(MAX_COLUMNS)
const wetLine = new Float32Array(MAX_COLUMNS)

const gx = new Float32Array(MAX_GLASS)
const gy = new Float32Array(MAX_GLASS)
const gvx = new Float32Array(MAX_GLASS)
const gvy = new Float32Array(MAX_GLASS)
const gang = new Float32Array(MAX_GLASS)
const gspin = new Float32Array(MAX_GLASS)
const gsize = new Float32Array(MAX_GLASS)
const gcolor = new Uint8Array(MAX_GLASS)
const gshape = new Float32Array(MAX_GLASS * 6)

const fx = new Float32Array(MAX_FOAM)
const fy = new Float32Array(MAX_FOAM)
const fr = new Float32Array(MAX_FOAM)
const flife = new Float32Array(MAX_FOAM)

const px = new Float32Array(MAX_PRINTS)
const py = new Float32Array(MAX_PRINTS)
const pang = new Float32Array(MAX_PRINTS)
const pside = new Int8Array(MAX_PRINTS)
const palpha = new Float32Array(MAX_PRINTS)

const waves: Wave[] = []

let columns = 1
let glassCount = 0
let foamCursor = 0
let printCursor = 0
let printSide = 1
let lastPrintX = -1e4
let lastPrintY = -1e4
let nextWaveAt = 0
let setCounter = 0

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let lastClickTs = 0
let pendingClickX = -1
let seed = 1

let seaY = 0
let reach = 1

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

function layoutShore(): void {
  seaY = height * (width > height ? 0.3 : 0.26)
  reach = (height - seaY) * 0.62
  columns = Math.min(MAX_COLUMNS, Math.ceil(width / COLUMN_PX) + 2)
}

function columnOf(x: number): number {
  return Math.max(0, Math.min(columns - 1, Math.round(x / COLUMN_PX)))
}

function frontAt(x: number): number {
  return front[columnOf(x)] ?? seaY
}

function velAt(x: number): number {
  return frontVel[columnOf(x)] ?? 0
}

function runupShape(u: number): number {
  if (u <= 0 || u >= 1) return 0
  if (u < UPRUSH_SHARE) {
    const s = u / UPRUSH_SHARE
    return Math.sin((s * Math.PI) / 2)
  }
  const s = (u - UPRUSH_SHARE) / (1 - UPRUSH_SHARE)
  return Math.cos((s * Math.PI) / 2) ** 1.4
}

function spawnWave(t: number, focusX = -1, focusAmp = 0): void {
  if (waves.length >= MAX_WAVES) waves.shift()
  setCounter += 1
  const inSet = setCounter % 5
  const big = inSet === 2 || inSet === 3
  waves.push({
    start: t,
    period: 6.5 + random() * 2.5 + focusAmp * 1.5,
    amp: (big ? 0.62 : 0.38) + random() * 0.2,
    focusX,
    focusAmp,
    slant: (random() - 0.5) * 1.6,
  })
}

function scheduleWaves(t: number): void {
  if (t < nextWaveAt) return
  spawnWave(t)
  nextWaveAt = t + 4.2 + random() * 2.6
}

function updateFront(t: number, dt: number): void {
  for (let i = 0; i < columns; i += 1) {
    const x = i * COLUMN_PX
    const xn = x / Math.max(1, width)
    let best = 0
    for (const wave of waves) {
      const delay = wave.slant * (xn - 0.5)
      const u = (t - wave.start - delay) / wave.period
      let amp = wave.amp
      if (wave.focusX >= 0) {
        const d = (x - wave.focusX) / (Math.max(width, height) * 0.2)
        amp += wave.focusAmp * Math.exp(-d * d)
      }
      const lobe =
        1 +
        Math.sin(xn * 9.1 + wave.start * 1.7) * 0.07 +
        Math.sin(xn * 23 + wave.start) * 0.03
      const r = runupShape(u) * amp * lobe
      if (r > best) best = r
    }
    const lace =
      Math.sin(x * 0.09 + t * 2.1) * 1.4 + Math.sin(x * 0.031 - t * 0.7) * 2.2
    const target = seaY + best * reach + lace * unit()
    const prev = front[i] ?? seaY
    front[i] = target
    frontVel[i] = dt > 0 ? (target - prev) / dt : 0
    const dried = (wetLine[i] ?? seaY) - dt * reach * 0.012
    wetLine[i] = Math.max(target, dried, seaY)
  }
  for (let w = waves.length - 1; w >= 0; w -= 1) {
    const wave = waves[w]
    if (wave && t - wave.start > wave.period + 1.5) waves.splice(w, 1)
  }
}

function seedGlass(): void {
  const area = width * (height - seaY)
  glassCount = Math.min(MAX_GLASS, Math.max(40, Math.round(area / 7000)))
  const s = unit()
  for (let i = 0; i < glassCount; i += 1) {
    gx[i] = random() * width
    gy[i] = seaY + (0.05 + random() * 0.75) * reach
    gvx[i] = 0
    gvy[i] = 0
    gang[i] = random() * TWO_PI
    gspin[i] = 0
    gsize[i] = (4 + random() * 7) * Math.max(0.7, s)
    gcolor[i] = Math.floor(random() * GLASS_COLORS.length)
    for (let k = 0; k < 6; k += 1) gshape[i * 6 + k] = 0.7 + random() * 0.45
  }
}

function stepGlass(dt: number): void {
  const u = unit()
  for (let i = 0; i < glassCount; i += 1) {
    const x = gx[i] ?? 0
    const y = gy[i] ?? seaY
    const f = frontAt(x)
    const submerged = y < f - (gsize[i] ?? 4) * 0.3
    let vx = gvx[i] ?? 0
    let vy = gvy[i] ?? 0
    if (submerged) {
      const depth = Math.min(1, (f - y) / (reach * 0.25))
      const flow = velAt(x)
      const carry = flow > 0 ? 0.9 : 0.45
      const pull = 2.6 * (0.35 + depth * 0.65)
      vy += (flow * carry - vy) * Math.min(1, pull * dt)
      vy -= 14 * u * dt
      vx += (Math.sin(y * 0.05 + clock * 1.3 + i) * 10 * u - vx) * dt * 1.2
      gspin[i] = (gspin[i] ?? 0) * 0.98 + vy * 0.0009 + vx * 0.0006
    } else {
      const friction = Math.exp(-dt * 9)
      vx *= friction
      vy *= friction
      gspin[i] = (gspin[i] ?? 0) * friction
    }
    let nx = x + vx * dt
    let ny = y + vy * dt
    if (nx < -10) nx += width + 20
    if (nx > width + 10) nx -= width + 20
    const floor = seaY + (gsize[i] ?? 4)
    if (ny < floor) {
      ny = floor
      vy = Math.abs(vy) * 0.2
    }
    const ceiling = height - (gsize[i] ?? 4)
    if (ny > ceiling) {
      ny = ceiling
      vy = 0
    }
    gx[i] = nx
    gy[i] = ny
    gvx[i] = vx
    gvy[i] = vy
    gang[i] = (gang[i] ?? 0) + (gspin[i] ?? 0) * dt * 60
  }
}

function shedFoam(dt: number): void {
  const u = unit()
  for (let i = 0; i < columns; i += 1) {
    const v = frontVel[i] ?? 0
    const f = front[i] ?? seaY
    if (f - seaY < reach * 0.04) continue
    const chance = v < 0 ? 0.5 * dt * 8 : 0.12 * dt * 8
    if (random() > chance) continue
    const k = foamCursor
    foamCursor = (foamCursor + 1) % MAX_FOAM
    fx[k] = i * COLUMN_PX + (random() - 0.5) * COLUMN_PX
    fy[k] = f + (random() - 0.3) * 6 * u
    fr[k] = (0.8 + random() * 2.4) * Math.max(0.7, u)
    flife[k] = 1
  }
  for (let k = 0; k < MAX_FOAM; k += 1) {
    const life = flife[k] ?? 0
    if (life <= 0) continue
    const y = fy[k] ?? 0
    const f = frontAt(fx[k] ?? 0)
    const rate = y < f - 4 ? 0.9 : 0.32
    flife[k] = life - dt * rate
  }
}

function stepPrints(dt: number): void {
  for (let k = 0; k < MAX_PRINTS; k += 1) {
    const a = palpha[k] ?? 0
    if (a <= 0) continue
    const covered = (py[k] ?? 0) < frontAt(px[k] ?? 0)
    palpha[k] = a - dt * (covered ? 1.6 : 0.008)
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
  if (!point) return
  if (point.y < frontAt(point.x) + 6) return
  const stride = 40 * unit()
  const dx = point.x - lastPrintX
  const dy = point.y - lastPrintY
  if (dx * dx + dy * dy < stride * stride) return
  const heading = Math.atan2(dy, dx)
  const k = printCursor
  printCursor = (printCursor + 1) % MAX_PRINTS
  printSide = -printSide
  const offset = 9 * unit() * printSide
  px[k] = point.x + Math.cos(heading + Math.PI / 2) * offset
  py[k] = point.y + Math.sin(heading + Math.PI / 2) * offset
  pang[k] = heading
  pside[k] = printSide
  palpha[k] = 1
  lastPrintX = point.x
  lastPrintY = point.y
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastClickTs < CLICK_COOLDOWN_MS) return
  lastClickTs = now
  pendingClickX = point.x
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
  layoutShore()
  if (
    glassCount === 0 ||
    Math.abs(oldW - width) > 40 ||
    Math.abs(oldH - height) > 40
  ) {
    seedGlass()
    front.fill(seaY)
    wetLine.fill(seaY)
  }
}

function drawSea(): void {
  if (!context) return
  const sea = context.createLinearGradient(0, 0, 0, seaY)
  sea.addColorStop(0, '#0e4a5e')
  sea.addColorStop(0.55, '#1f7a86')
  sea.addColorStop(1, '#58b3ad')
  context.fillStyle = sea
  context.fillRect(0, 0, width, seaY + 1)
  const u = unit()
  context.lineCap = 'round'
  for (let band = 0; band < 9; band += 1) {
    const phase = (clock * 0.09 + band / 9) % 1
    const y = seaY * (0.05 + phase * 0.95)
    context.strokeStyle = `rgba(220, 244, 240, ${0.05 + phase * 0.18})`
    context.lineWidth = (1 + phase * 2.4) * u
    context.beginPath()
    for (let x = -10; x <= width + 10; x += 14) {
      const yy = y + Math.sin(x * 0.012 + band * 2.3 + clock * 0.4) * 5 * u
      if (x === -10) context.moveTo(x, yy)
      else context.lineTo(x, yy)
    }
    context.stroke()
  }
  const glint = context.createLinearGradient(width * 0.55, 0, width * 0.9, 0)
  glint.addColorStop(0, 'rgba(255, 236, 190, 0)')
  glint.addColorStop(0.5, 'rgba(255, 236, 190, 0.14)')
  glint.addColorStop(1, 'rgba(255, 236, 190, 0)')
  context.fillStyle = glint
  context.fillRect(0, 0, width, seaY)
}

function drawSand(): void {
  if (!context) return
  const sand = context.createLinearGradient(0, seaY, 0, height)
  sand.addColorStop(0, '#c9a979')
  sand.addColorStop(0.5, '#e2c896')
  sand.addColorStop(1, '#efdcb0')
  context.fillStyle = sand
  context.fillRect(0, seaY, width, height - seaY)

  context.fillStyle = 'rgba(120, 88, 52, 0.32)'
  context.beginPath()
  context.moveTo(0, seaY)
  for (let i = 0; i < columns; i += 1) {
    context.lineTo(i * COLUMN_PX, wetLine[i] ?? seaY)
  }
  context.lineTo(width, seaY)
  context.closePath()
  context.fill()

  context.strokeStyle = 'rgba(110, 80, 50, 0.22)'
  context.lineWidth = 1.2 * unit()
  context.beginPath()
  for (let i = 0; i < columns; i += 1) {
    const y = (wetLine[i] ?? seaY) + 2
    if (i === 0) context.moveTo(0, y)
    else context.lineTo(i * COLUMN_PX, y)
  }
  context.stroke()
}

function drawPrints(): void {
  if (!context) return
  const u = unit() * 1.7
  for (let k = 0; k < MAX_PRINTS; k += 1) {
    const a = palpha[k] ?? 0
    if (a <= 0) continue
    context.save()
    context.translate(px[k] ?? 0, py[k] ?? 0)
    context.rotate((pang[k] ?? 0) + Math.PI / 2)
    context.fillStyle = `rgba(120, 86, 50, ${0.3 * a})`
    context.beginPath()
    context.ellipse(0, -3 * u, 3.2 * u, 5 * u, 0, 0, TWO_PI)
    context.fill()
    context.beginPath()
    context.ellipse(0, 4.5 * u, 2.6 * u, 3 * u, 0, 0, TWO_PI)
    context.fill()
    const toe = (pside[k] ?? 1) * 0.6 * u
    for (let t = 0; t < 4; t += 1) {
      context.beginPath()
      context.arc(
        toe + (t - 1.5) * 1.7 * u,
        -9 * u + Math.abs(t - 1) * 0.6 * u,
        0.9 * u,
        0,
        TWO_PI,
      )
      context.fill()
    }
    context.restore()
  }
}

function drawSwash(): void {
  if (!context) return
  const u = unit()
  const water = context.createLinearGradient(0, seaY, 0, seaY + reach)
  water.addColorStop(0, 'rgba(88, 179, 173, 1)')
  water.addColorStop(0.5, 'rgba(140, 206, 196, 0.6)')
  water.addColorStop(1, 'rgba(196, 232, 222, 0.38)')
  context.fillStyle = water
  context.beginPath()
  context.moveTo(0, seaY - 2)
  for (let i = 0; i < columns; i += 1) {
    context.lineTo(i * COLUMN_PX, front[i] ?? seaY)
  }
  context.lineTo(width, seaY - 2)
  context.closePath()
  context.fill()

  context.strokeStyle = 'rgba(255, 255, 255, 0.82)'
  context.lineWidth = 2.6 * u
  context.lineJoin = 'round'
  context.beginPath()
  for (let i = 0; i < columns; i += 1) {
    const y = front[i] ?? seaY
    if (i === 0) context.moveTo(0, y)
    else context.lineTo(i * COLUMN_PX, y)
  }
  context.stroke()
  context.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  context.lineWidth = 6 * u
  context.stroke()
}

function drawFoam(): void {
  if (!context) return
  for (let k = 0; k < MAX_FOAM; k += 1) {
    const life = flife[k] ?? 0
    if (life <= 0) continue
    context.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.75, life * 0.8)})`
    context.lineWidth = 0.9
    context.beginPath()
    context.arc(
      fx[k] ?? 0,
      fy[k] ?? 0,
      (fr[k] ?? 1) * (1.1 - life * 0.2),
      0,
      TWO_PI,
    )
    context.stroke()
  }
}

function drawGlass(): void {
  if (!context) return
  for (let i = 0; i < glassCount; i += 1) {
    const x = gx[i] ?? 0
    const y = gy[i] ?? 0
    const size = gsize[i] ?? 4
    const rgb = GLASS_COLORS[gcolor[i] ?? 0] ?? GLASS_COLORS[0]
    const wet = y < frontAt(x)
    context.save()
    context.translate(x, y)
    context.rotate(gang[i] ?? 0)
    context.fillStyle = 'rgba(70, 50, 30, 0.22)'
    context.beginPath()
    context.ellipse(size * 0.25, size * 0.3, size, size * 0.8, 0, 0, TWO_PI)
    context.fill()
    context.beginPath()
    for (let k = 0; k < 6; k += 1) {
      const a = (k / 6) * TWO_PI
      const r = size * (gshape[i * 6 + k] ?? 1)
      const cx = Math.cos(a) * r
      const cy = Math.sin(a) * r * 0.78
      if (k === 0) context.moveTo(cx, cy)
      else context.lineTo(cx, cy)
    }
    context.closePath()
    const alpha = wet ? 0.92 : 0.72
    context.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
    context.fill()
    context.strokeStyle = wet
      ? 'rgba(255, 255, 255, 0.55)'
      : 'rgba(255, 255, 255, 0.28)'
    context.lineWidth = 0.8
    context.stroke()
    context.fillStyle = wet
      ? 'rgba(255, 255, 255, 0.7)'
      : 'rgba(255, 255, 255, 0.35)'
    context.beginPath()
    context.ellipse(
      -size * 0.3,
      -size * 0.25,
      size * 0.32,
      size * 0.16,
      -0.6,
      0,
      TWO_PI,
    )
    context.fill()
    context.restore()
  }
}

function drawLight(): void {
  if (!context) return
  const warm = context.createLinearGradient(width, 0, 0, height)
  warm.addColorStop(0, 'rgba(255, 196, 120, 0.16)')
  warm.addColorStop(1, 'rgba(255, 196, 120, 0)')
  context.fillStyle = warm
  context.fillRect(0, 0, width, height)
  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.3,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.78,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(30, 20, 10, 0.4)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

function drawFrame(): void {
  if (!context) return
  drawSea()
  drawSand()
  drawPrints()
  drawGlass()
  drawSwash()
  drawFoam()
  drawLight()
}

function step(dt: number): void {
  clock += dt
  scheduleWaves(clock)
  updateFront(clock, dt)
  stepGlass(dt)
  shedFoam(dt)
  stepPrints(dt)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.05, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  if (pendingClickX >= 0) {
    spawnWave(clock, pendingClickX, 0.32)
    pendingClickX = -1
  }
  const steps = Math.max(1, Math.ceil(dt * 60))
  for (let s = 0; s < steps; s += 1) step(dt / steps)
  drawFrame()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function resetShore(): void {
  layoutShore()
  seedGlass()
  waves.length = 0
  flife.fill(0)
  palpha.fill(0)
  front.fill(seaY)
  wetLine.fill(seaY)
  clock = 0
  nextWaveAt = 0
  setCounter = 0
  pendingClickX = -1
}

function drawStill(): void {
  seed = 41
  resetShore()
  for (let s = 0; s < 900; s += 1) step(1 / 60)
  drawFrame()
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
    resetShore()
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
    resetShore()
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
  glassCount = 0
})
</script>

<style scoped>
.sea-glass-swash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
