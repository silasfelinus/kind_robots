<template>
  <canvas ref="canvasRef" class="night-train-window" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const BASE_SPEED = 0.05
const BOOST_SPEED = 0.22
const BOOST_DECAY_PER_SEC = 0.5
const CLICK_COOLDOWN_MS = 1500
const FOG_RADIUS = 110
const FOG_FADE_PER_SEC = 0.18
const MAX_FOG_PUFFS = 24
const PUFF_SPACING = 18
const POLE_SPACING = 0.34
const TWO_PI = Math.PI * 2
const REDUCED_SCROLL = 0.35

interface Layer {
  speed: number
  color: string
  baseline: number
  amplitude: number
  seed: number
  town: boolean
}

interface Puff {
  x: number
  y: number
  alpha: number
}

// Far to near; each layer scrolls at its own parallax speed.
const LAYERS: readonly Layer[] = [
  {
    speed: 0.15,
    color: '#1b2a4a',
    baseline: 0.58,
    amplitude: 0.12,
    seed: 3,
    town: false,
  },
  {
    speed: 0.3,
    color: '#142038',
    baseline: 0.68,
    amplitude: 0.09,
    seed: 7,
    town: true,
  },
  {
    speed: 0.6,
    color: '#0d1628',
    baseline: 0.78,
    amplitude: 0.06,
    seed: 11,
    town: false,
  },
]

const STARS: readonly [number, number, number][] = Array.from(
  { length: 60 },
  (_, i) => [
    fract(Math.sin(i * 91.3) * 437.5),
    fract(Math.sin(i * 17.7 + 2) * 951.1) * 0.5,
    0.5 + fract(Math.sin(i * 5.3) * 123.4) * 1.2,
  ],
)

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let scroll = 0
let boost = 0
let reducedMotion = false
let lastClickTs = 0
let lastPuffX = -1000
let lastPuffY = -1000
const puffs: Puff[] = []

function fract(value: number): number {
  return value - Math.floor(value)
}

function hash(n: number): number {
  return fract(Math.sin(n * 127.1) * 43758.5453)
}

// Smooth repeating terrain height in 0..1 over a unit loop.
function terrain(layer: Layer, u: number): number {
  const a = Math.sin(u * TWO_PI * 2 + layer.seed)
  const b = Math.sin(u * TWO_PI * 5 + layer.seed * 1.7) * 0.5
  const c = Math.sin(u * TWO_PI * 11 + layer.seed * 2.3) * 0.2
  return (a + b + c) / 1.7
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
  if (Math.hypot(point.x - lastPuffX, point.y - lastPuffY) < PUFF_SPACING)
    return
  lastPuffX = point.x
  lastPuffY = point.y
  puffs.push({ x: point.x, y: point.y, alpha: 1 })
  if (puffs.length > MAX_FOG_PUFFS) puffs.shift()
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastClickTs < CLICK_COOLDOWN_MS) return
  lastClickTs = now
  boost = 1
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

function drawLayer(layer: Layer, index: number): void {
  if (!context) return
  const loop = width * 1.6
  const offset = (scroll * layer.speed * loop) % loop
  const step = 6
  context.fillStyle = layer.color
  context.beginPath()
  context.moveTo(0, height)
  for (let x = 0; x <= width + step; x += step) {
    const u = ((((x + offset) % loop) + loop) % loop) / loop
    const y =
      height * layer.baseline - terrain(layer, u) * height * layer.amplitude
    context.lineTo(x, y)
  }
  context.lineTo(width + step, height)
  context.closePath()
  context.fill()

  if (!layer.town) return
  // Lit village windows ride the same parallax offset as their layer.
  const cell = 46
  const first = Math.floor(offset / cell)
  const count = Math.ceil(width / cell) + 2
  for (let i = 0; i < count; i += 1) {
    const slot = (first + i) % Math.round(loop / cell)
    const n = hash(slot + index * 31)
    if (n < 0.45) continue
    const x = i * cell - (offset % cell)
    const u = ((((x + offset) % loop) + loop) % loop) / loop
    const ground =
      height * layer.baseline - terrain(layer, u) * height * layer.amplitude
    const houseW = 16 + n * 14
    const houseH = 14 + hash(slot * 3) * 18
    context.fillStyle = '#0a1120'
    context.fillRect(x, ground - houseH, houseW, houseH + 2)
    if (hash(slot * 7) > 0.35) {
      context.fillStyle = `rgba(255, 207, 120, ${0.55 + hash(slot * 5) * 0.4})`
      context.fillRect(x + 4, ground - houseH + 5, 4, 5)
      if (houseW > 24)
        context.fillRect(x + houseW - 9, ground - houseH + 5, 4, 5)
    }
  }
}

function drawPoles(): void {
  if (!context) return
  const spacing = width * POLE_SPACING
  const offset = (scroll * 1.6 * width * 1.6) % spacing
  const wireTop = height * 0.5
  const wireDip = height * 0.05
  context.strokeStyle = '#05090f'
  context.lineWidth = 3
  for (let x = -offset; x < width + spacing; x += spacing) {
    context.beginPath()
    context.moveTo(x, height * 0.9)
    context.lineTo(x, wireTop - 10)
    context.stroke()
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(x - 14, wireTop)
    context.lineTo(x + 14, wireTop)
    context.stroke()
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(x, wireTop)
    context.quadraticCurveTo(
      x + spacing / 2,
      wireTop + wireDip * 2,
      x + spacing,
      wireTop,
    )
    context.stroke()
    context.lineWidth = 3
  }
}

function drawFrame(timestamp: number): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#050a1c')
  sky.addColorStop(0.65, '#1c2d57')
  sky.addColorStop(1, '#3a3b66')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  for (const [sx, sy, size] of STARS) {
    const twinkle = reducedMotion
      ? 0.8
      : 0.55 + 0.45 * Math.sin(timestamp / 700 + sx * 40)
    context.fillStyle = `rgba(235, 240, 255, ${twinkle})`
    context.fillRect(sx * width, sy * height, size, size)
  }

  // The moon follows the train, so it barely drifts.
  const moonX = width * 0.8 - ((scroll * 0.02 * width) % (width * 0.1))
  context.fillStyle = 'rgba(250, 245, 215, 0.92)'
  context.beginPath()
  context.arc(moonX, height * 0.2, Math.max(14, width * 0.025), 0, TWO_PI)
  context.fill()

  LAYERS.forEach((layer, index) => drawLayer(layer, index))
  drawPoles()

  // Window frame and glass: dark border, soft reflection, interior glow.
  const frame = Math.max(14, Math.min(width, height) * 0.04)
  context.fillStyle = 'rgba(255, 255, 255, 0.04)'
  context.beginPath()
  context.moveTo(width * 0.1, 0)
  context.lineTo(width * 0.32, 0)
  context.lineTo(width * 0.18, height)
  context.lineTo(0, height)
  context.closePath()
  context.fill()

  for (const puff of puffs) {
    const g = context.createRadialGradient(
      puff.x,
      puff.y,
      0,
      puff.x,
      puff.y,
      FOG_RADIUS,
    )
    g.addColorStop(0, `rgba(220, 230, 245, ${0.28 * puff.alpha})`)
    g.addColorStop(1, 'rgba(220, 230, 245, 0)')
    context.fillStyle = g
    context.fillRect(
      puff.x - FOG_RADIUS,
      puff.y - FOG_RADIUS,
      FOG_RADIUS * 2,
      FOG_RADIUS * 2,
    )
  }

  context.fillStyle = '#120d0b'
  context.fillRect(0, 0, width, frame)
  context.fillRect(0, height - frame * 1.6, width, frame * 1.6)
  context.fillRect(0, 0, frame, height)
  context.fillRect(width - frame, 0, frame, height)
  context.fillStyle = 'rgba(255, 190, 110, 0.07)'
  context.fillRect(frame, frame, width - frame * 2, height - frame * 2.6)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed)) / 1000

  if (!reducedMotion) {
    boost = Math.max(0, boost - BOOST_DECAY_PER_SEC * delta)
    scroll += (BASE_SPEED + (BOOST_SPEED - BASE_SPEED) * boost) * delta
    for (const puff of puffs) puff.alpha -= FOG_FADE_PER_SEC * delta
    while (puffs.length && (puffs[0]?.alpha ?? 0) <= 0) puffs.shift()
  }
  drawFrame(timestamp)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  if (reducedMotion) {
    scroll = REDUCED_SCROLL
    boost = 0
    puffs.length = 0
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  context = canvas.getContext('2d')
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  if (reducedMotion) scroll = REDUCED_SCROLL
  motionQuery.addEventListener('change', handleMotionChange)

  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionChange)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)
  puffs.length = 0
  context = null
})
</script>

<style scoped>
.night-train-window {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
