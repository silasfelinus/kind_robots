<template>
  <canvas ref="canvasRef" class="maple-creek-drift" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const SHOWER_COOLDOWN_MS = 3000
const SHOWER_DURATION = 6 // seconds a click-launched leaf shower lasts
const SHOWER_LEAVES = 14
const TWO_PI = Math.PI * 2
const LEAF_COLORS = ['#e8572a', '#f2a23a', '#c9302c', '#f6c945', '#b5541c']

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let showerStart = -100
let showerX = 0
let lastShowerTs = 0
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
  if (now - lastShowerTs < SHOWER_COOLDOWN_MS) return
  lastShowerTs = now
  showerStart = clock
  showerX = point.x
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

// An autumn creek winds down through a maple wood. Leaves let go of the
// overhanging canopy, tumble down, land on the water and ride the current
// downstream past mossy stones. Every leaf follows a closed-form life cycle
// (fall, then float), so nothing accumulates per frame. Hover stirs an eddy
// that swirls nearby floating leaves around the pointer; a rate-limited click
// shakes the branch above it and drops a short shower of extra leaves.

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

// Creek centreline: enters top-right, winds down to bottom-left.
// s runs 0 (upstream) .. 1 (downstream).
function creekPoint(s: number): { x: number; y: number } {
  const narrow = width < 600
  const y = height * (0.42 + s * 0.62)
  const x =
    width *
    (0.62 -
      s * 0.3 +
      Math.sin(s * 5.2 + 0.6) * (narrow ? 0.14 : 0.12) +
      Math.sin(s * 11.3) * 0.02)
  return { x, y }
}

function creekHalfWidth(s: number): number {
  const base = Math.min(width, height) * (width < 600 ? 0.12 : 0.09)
  return base * (0.55 + s * 0.85)
}

function drawBackdrop(): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#f7d9a8')
  sky.addColorStop(0.35, '#e9b679')
  sky.addColorStop(1, '#6d4a2c')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // Distant trunks in warm haze.
  const trunkCount = Math.ceil(width / 70)
  for (let i = 0; i < trunkCount; i += 1) {
    const x = (i + hash(i * 3.3) * 0.7) * 70
    const w = 6 + hash(i * 4.1) * 10
    context.fillStyle = `rgba(74, 48, 32, ${0.25 + hash(i * 5.7) * 0.25})`
    context.fillRect(x, 0, w, height * 0.55)
  }

  // Forest floor.
  const floor = context.createLinearGradient(0, height * 0.38, 0, height)
  floor.addColorStop(0, '#a8662e')
  floor.addColorStop(1, '#5a3a1f')
  context.fillStyle = floor
  context.fillRect(0, height * 0.38, width, height * 0.62)

  // Fallen leaf litter on the banks (static speckle).
  const litter = width < 600 ? 90 : 180
  for (let i = 0; i < litter; i += 1) {
    const x = hash(i * 1.7) * width
    const y = height * (0.4 + hash(i * 2.9) * 0.6)
    context.fillStyle = LEAF_COLORS[i % LEAF_COLORS.length]
    context.globalAlpha = 0.35 + hash(i * 6.1) * 0.3
    context.beginPath()
    context.ellipse(
      x,
      y,
      3 + hash(i) * 3,
      1.5 + hash(i * 8.8) * 1.5,
      hash(i * 9.9) * TWO_PI,
      0,
      TWO_PI,
    )
    context.fill()
  }
  context.globalAlpha = 1
}

function drawCreek(): void {
  if (!context) return
  const steps = 48
  context.beginPath()
  for (let i = 0; i <= steps; i += 1) {
    const s = i / steps
    const p = creekPoint(s)
    const hw = creekHalfWidth(s)
    if (i === 0) context.moveTo(p.x - hw, p.y)
    else context.lineTo(p.x - hw, p.y)
  }
  for (let i = steps; i >= 0; i -= 1) {
    const s = i / steps
    const p = creekPoint(s)
    context.lineTo(p.x + creekHalfWidth(s), p.y)
  }
  context.closePath()
  const water = context.createLinearGradient(0, height * 0.4, 0, height)
  water.addColorStop(0, '#5f8f8a')
  water.addColorStop(1, '#2f5c62')
  context.fillStyle = water
  context.fill()
  context.strokeStyle = 'rgba(40, 28, 16, 0.55)'
  context.lineWidth = 3
  context.stroke()

  // Drifting current glints.
  context.strokeStyle = 'rgba(230, 245, 240, 0.35)'
  context.lineWidth = 1.2
  for (let i = 0; i < 26; i += 1) {
    const s = (hash(i * 4.4) + clock * 0.03) % 1
    const p = creekPoint(s)
    const off = (hash(i * 7.3) - 0.5) * creekHalfWidth(s) * 1.4
    const len = 8 + s * 14
    context.beginPath()
    context.moveTo(p.x + off - len * 0.5, p.y)
    context.quadraticCurveTo(p.x + off, p.y - 2, p.x + off + len * 0.5, p.y)
    context.stroke()
  }

  // Mossy stones in the stream.
  for (let i = 0; i < 6; i += 1) {
    const s = 0.12 + i * 0.15
    const p = creekPoint(s)
    const side = i % 2 === 0 ? -0.55 : 0.5
    const x = p.x + side * creekHalfWidth(s)
    const r = creekHalfWidth(s) * 0.22
    context.fillStyle = 'rgba(230, 245, 240, 0.4)'
    context.beginPath()
    context.ellipse(x, p.y + r * 0.4, r * 1.4, r * 0.55, 0, 0, TWO_PI)
    context.fill()
    context.fillStyle = '#6f6a5e'
    context.beginPath()
    context.ellipse(x, p.y, r, r * 0.65, 0, 0, TWO_PI)
    context.fill()
    context.fillStyle = '#6f8f3a'
    context.beginPath()
    context.ellipse(
      x - r * 0.2,
      p.y - r * 0.35,
      r * 0.6,
      r * 0.25,
      0,
      0,
      TWO_PI,
    )
    context.fill()
  }
}

function drawCanopy(): void {
  if (!context) return
  // Overhanging branches across the top.
  context.strokeStyle = '#3e2716'
  context.lineCap = 'round'
  for (let b = 0; b < 3; b += 1) {
    const y0 = height * (0.05 + b * 0.07)
    const fromLeft = b % 2 === 0
    context.lineWidth =
      Math.max(4, Math.min(width, height) * 0.018) * (1 - b * 0.2)
    context.beginPath()
    context.moveTo(fromLeft ? -10 : width + 10, y0)
    context.quadraticCurveTo(
      width * 0.5,
      y0 + height * 0.08 + Math.sin(clock * 0.4 + b) * 3,
      fromLeft ? width * 0.85 : width * 0.15,
      y0 + height * 0.03,
    )
    context.stroke()
  }
  // Leaf clusters.
  const clusters = width < 600 ? 40 : 80
  for (let i = 0; i < clusters; i += 1) {
    const x = hash(i * 2.2) * width
    const y = hash(i * 3.6) * height * 0.24
    const sway = Math.sin(clock * 0.9 + i) * 2
    context.fillStyle = LEAF_COLORS[i % LEAF_COLORS.length]
    context.globalAlpha = 0.85
    drawLeafShape(x + sway, y, 7 + hash(i * 5.5) * 7, hash(i * 7.1) * TWO_PI)
  }
  context.globalAlpha = 1
}

// A simple five-point maple leaf centred at (x, y).
function drawLeafShape(
  x: number,
  y: number,
  size: number,
  angle: number,
): void {
  if (!context) return
  context.save()
  context.translate(x, y)
  context.rotate(angle)
  context.beginPath()
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * TWO_PI - Math.PI / 2
    const r = i % 2 === 0 ? size : size * 0.45
    const px = Math.cos(a) * r
    const py = Math.sin(a) * r
    if (i === 0) context.moveTo(px, py)
    else context.lineTo(px, py)
  }
  context.closePath()
  context.fill()
  context.strokeStyle = 'rgba(60, 30, 10, 0.5)'
  context.lineWidth = 0.8
  context.beginPath()
  context.moveTo(0, size * 0.2)
  context.lineTo(0, size * 0.9)
  context.stroke()
  context.restore()
}

type LeafState = { x: number; y: number; angle: number; floating: boolean }

// Closed-form life cycle for a leaf: falls from the canopy to a landing point
// on the creek, then floats downstream until it leaves the screen.
function leafState(
  seed: number,
  age: number,
  dropX: number | null,
): LeafState | null {
  const fallTime = 3 + hash(seed * 2.7) * 2.5
  const landS = 0.05 + hash(seed * 3.9) * 0.45
  const land = creekPoint(landS)
  const lateral = (hash(seed * 5.1) - 0.5) * 1.2 * creekHalfWidth(landS)
  const startX = dropX ?? land.x + (hash(seed * 6.3) - 0.5) * width * 0.25
  const startY = height * (0.04 + hash(seed * 8.2) * 0.18)
  const spin = (hash(seed * 9.4) - 0.5) * 4
  if (age < fallTime) {
    const f = age / fallTime
    const ease = f * f * (3 - 2 * f)
    const flutter =
      Math.sin(age * (2.4 + hash(seed) * 1.4) + seed) *
      (18 + hash(seed * 1.3) * 20) *
      (1 - f)
    return {
      x: startX + (land.x + lateral - startX) * ease + flutter,
      y: startY + (land.y - startY) * f,
      angle: seed + age * spin + Math.sin(age * 3) * 0.6,
      floating: false,
    }
  }
  const floatAge = age - fallTime
  const speed = 0.035 + hash(seed * 4.6) * 0.03
  const s = landS + floatAge * speed
  if (s > 1.08) return null
  const p = creekPoint(Math.min(s, 1.08))
  const wobble = Math.sin(floatAge * 1.3 + seed) * creekHalfWidth(s) * 0.15
  return {
    x: p.x + lateral * (1 - Math.min(1, floatAge * 0.05)) + wobble,
    y: p.y + Math.sin(floatAge * 2 + seed) * 1.5,
    angle: seed + fallTime * spin + floatAge * spin * 0.15,
    floating: true,
  }
}

// Pointer eddy: swirl floating leaves within a radius around the pointer.
function applyEddy(state: LeafState, size: number): LeafState {
  if (pointerX < 0 || !state.floating) return state
  const dx = state.x - pointerX
  const dy = state.y - pointerY
  const radius = size * 7
  const d = Math.hypot(dx, dy)
  if (d > radius || d < 1) return state
  const pull = 1 - d / radius
  const turn = pull * 1.4 + clock * pull * 0.8
  const cos = Math.cos(turn)
  const sin = Math.sin(turn)
  const nd = d * (1 - pull * 0.25)
  return {
    x: pointerX + ((dx * cos - dy * sin) / d) * nd,
    y: pointerY + ((dx * sin + dy * cos) / d) * nd * 0.6,
    angle: state.angle + turn,
    floating: true,
  }
}

function drawLeaf(state: LeafState, size: number, colorIndex: number): void {
  if (!context) return
  if (state.floating) {
    context.fillStyle = 'rgba(20, 40, 44, 0.3)'
    context.beginPath()
    context.ellipse(
      state.x + 2,
      state.y + 3,
      size * 0.9,
      size * 0.4,
      0,
      0,
      TWO_PI,
    )
    context.fill()
  }
  context.fillStyle = LEAF_COLORS[colorIndex % LEAF_COLORS.length]
  drawLeafShape(state.x, state.y, size, state.angle)
}

function drawScene(): void {
  if (!context) return
  drawBackdrop()
  drawCreek()

  const narrow = width < 600
  const count = narrow ? 14 : 24
  const size = Math.max(6, Math.min(width, height) * (narrow ? 0.022 : 0.018))
  const cycle = 26

  const leaves: { state: LeafState; k: number }[] = []
  for (let k = 0; k < count; k += 1) {
    const offset = hash(k * 11.7) * cycle
    const t = clock + offset
    const generation = Math.floor(t / cycle)
    const age = t - generation * cycle
    const seed = k * 13.1 + generation * 3.7
    const state = leafState(seed, age, null)
    if (state) leaves.push({ state: applyEddy(state, size), k })
  }

  const showerAge = clock - showerStart
  if (showerAge >= 0 && showerAge < SHOWER_DURATION + 20) {
    for (let j = 0; j < SHOWER_LEAVES; j += 1) {
      const delay = (j / SHOWER_LEAVES) * SHOWER_DURATION * 0.6
      const age = showerAge - delay
      if (age < 0) continue
      const seed = 500 + j * 7.9 + showerStart
      const dropX = showerX + (hash(seed) - 0.5) * size * 12
      const state = leafState(seed, age, dropX)
      if (state) leaves.push({ state: applyEddy(state, size), k: j + 3 })
    }
  }

  // Floating leaves under falling ones.
  for (const l of leaves) if (l.state.floating) drawLeaf(l.state, size, l.k)
  for (const l of leaves)
    if (!l.state.floating) drawLeaf(l.state, size * 1.1, l.k)
  drawCanopy()

  // Warm light shafts through the canopy.
  context.save()
  context.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 3; i += 1) {
    const x = width * (0.2 + i * 0.3) + Math.sin(clock * 0.15 + i) * 20
    const shaft = context.createLinearGradient(x, 0, x - width * 0.12, height)
    shaft.addColorStop(0, 'rgba(255, 220, 150, 0.12)')
    shaft.addColorStop(1, 'rgba(255, 220, 150, 0)')
    context.fillStyle = shaft
    context.beginPath()
    context.moveTo(x - 20, 0)
    context.lineTo(x + 30, 0)
    context.lineTo(x - width * 0.08, height)
    context.lineTo(x - width * 0.2, height)
    context.closePath()
    context.fill()
  }
  context.restore()
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
  clock = 14
  showerStart = -100
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
.maple-creek-drift {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
