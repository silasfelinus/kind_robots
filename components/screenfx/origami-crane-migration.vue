<template>
  <canvas ref="canvasRef" class="origami-crane-migration" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const LOOP_SECONDS = 50
const CRANES = 9
const FLOCK_START_X = 0.16
const FLOCK_TRAVEL_X = 1.1
const BOB_CYCLES = 11
const FLAP_CYCLES = 17
const SCATTER_COOLDOWN_MS = 3000
const SCATTER_DECAY_PER_SEC = 0.4
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let animationStartTs: number | null = null
let width = 1
let height = 1
let reducedMotion = false
let scatter = 0
let lastScatterTs = 0
let pointerX = -1
let pointerY = -1

function fract(value: number): number {
  return value - Math.floor(value)
}

function hash(n: number): number {
  return fract(Math.sin(n * 127.1) * 43758.5453)
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
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastScatterTs < SCATTER_COOLDOWN_MS) return
  lastScatterTs = now
  scatter = 1
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

// One folded-paper crane seen from above: body diamond, two wing triangles
// whose spread follows `flap` (0 folded .. 1 open), and a pointed neck.
function drawCrane(size: number, flap: number, shade: number): void {
  if (!context) return
  const spread = size * (0.25 + 0.95 * flap)
  context.fillStyle = `hsl(${shade}, 70%, 92%)`
  context.beginPath()
  context.moveTo(0, -size * 1.1)
  context.lineTo(size * 0.22, 0)
  context.lineTo(0, size * 0.9)
  context.lineTo(-size * 0.22, 0)
  context.closePath()
  context.fill()
  context.fillStyle = `hsl(${shade}, 60%, 80%)`
  context.beginPath()
  context.moveTo(size * 0.1, -size * 0.2)
  context.lineTo(spread, size * 0.25 - flap * size * 0.3)
  context.lineTo(size * 0.12, size * 0.35)
  context.closePath()
  context.fill()
  context.fillStyle = `hsl(${shade}, 55%, 70%)`
  context.beginPath()
  context.moveTo(-size * 0.1, -size * 0.2)
  context.lineTo(-spread, size * 0.25 - flap * size * 0.3)
  context.lineTo(-size * 0.12, size * 0.35)
  context.closePath()
  context.fill()
}

// The flock crosses the screen a whole number of times per loop in a V; each
// crane's position is a pure function of time, so the loop repeats exactly.
function drawFlock(seconds: number): void {
  if (!context) return
  const phase = fract(seconds / LOOP_SECONDS)
  const lead = FLOCK_START_X + FLOCK_TRAVEL_X * phase
  const size = Math.min(width, height) * 0.035
  for (let i = 0; i < CRANES * 2; i += 1) {
    const crane = i % CRANES
    const wrap = i >= CRANES ? -FLOCK_TRAVEL_X : 0
    const rank = Math.ceil(crane / 2)
    const side = crane === 0 ? 0 : crane % 2 === 1 ? -1 : 1
    const ox = -rank * 0.045
    const oy = side * rank * 0.04
    const bob = Math.sin(TWO_PI * BOB_CYCLES * phase + crane * 0.9) * 0.008
    const away = scatter * (hash(crane + 7) - 0.5) * 0.3
    let x = width * (lead + wrap + ox)
    let y = height * (0.42 + oy + bob + away)
    if (pointerX >= 0) {
      const dx = x - pointerX
      const dy = y - pointerY
      const d = Math.hypot(dx, dy)
      const range = width * 0.15
      if (d < range && d > 0) {
        const push = (1 - d / range) * size * 2
        x += (dx / d) * push
        y += (dy / d) * push
      }
    }
    const flap =
      0.5 + 0.5 * Math.sin(TWO_PI * FLAP_CYCLES * phase + crane * 0.5)
    const shade = 8 + Math.round(40 * hash(crane + 31))
    context.save()
    context.translate(x, y)
    context.rotate(Math.PI / 2 + side * 0.05)
    context.globalAlpha = 0.95
    drawCrane(size * (1 - rank * 0.04), flap, shade)
    context.restore()
    // Soft shadow on the water far below.
    context.fillStyle = 'rgba(20, 30, 60, 0.12)'
    context.beginPath()
    context.ellipse(x, height * 0.9, size * 1.2, size * 0.25, 0, 0, TWO_PI)
    context.fill()
  }
}

function drawScene(seconds: number): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#f6c9a8')
  sky.addColorStop(0.55, '#f9e3c7')
  sky.addColorStop(1, '#a9c4d6')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // Low paper sun.
  context.fillStyle = 'rgba(232, 96, 72, 0.55)'
  context.beginPath()
  context.arc(
    width * 0.72,
    height * 0.3,
    Math.min(width, height) * 0.1,
    0,
    TWO_PI,
  )
  context.fill()

  // Layered paper hills.
  const layers = ['#c9a98f', '#a58c82', '#7f7083']
  for (let l = 0; l < layers.length; l += 1) {
    context.fillStyle = layers[l] ?? '#7f7083'
    context.beginPath()
    context.moveTo(0, height)
    for (let i = 0; i <= 24; i += 1) {
      const x = (i / 24) * width
      const y =
        height * (0.7 + l * 0.07) + Math.sin(i * 0.6 + l * 2.1) * height * 0.03
      context.lineTo(x, y)
    }
    context.lineTo(width, height)
    context.closePath()
    context.fill()
  }

  drawFlock(seconds)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  scatter = Math.max(0, scatter - SCATTER_DECAY_PER_SEC * dt)
  if (animationStartTs === null) animationStartTs = timestamp
  drawScene((timestamp - animationStartTs) / 1000)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  scatter = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) drawScene(15)
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
    if (reducedMotion) drawScene(15)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(15)
  else {
    drawScene(0)
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
.origami-crane-migration {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
